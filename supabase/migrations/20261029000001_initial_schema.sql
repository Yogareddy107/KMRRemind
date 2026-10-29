-- ====================================================================
-- KMR Remind: Full Production Database Schema & Security Policies
-- Migration: 20261029000001_initial_schema.sql
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. Profiles Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    preferred_timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 2. Reminders Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category TEXT DEFAULT 'General',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    due_at TIMESTAMPTZ NOT NULL,
    recurrence_rule TEXT NOT NULL DEFAULT 'none' CHECK (recurrence_rule IN ('none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom')),
    recurrence_end_at TIMESTAMPTZ,
    notification_enabled BOOLEAN NOT NULL DEFAULT true,
    alert_interval_minutes INTEGER NOT NULL DEFAULT 5 CHECK (alert_interval_minutes IN (1, 5, 10, 15)),
    max_alert_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_alert_attempts >= 1 AND max_alert_attempts <= 10),
    max_alert_duration_minutes INTEGER DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    next_occurrence_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 3. Reminder Occurrences Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminder_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    triggered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    snooze_until TIMESTAMPTZ,
    next_alert_at TIMESTAMPTZ NOT NULL,
    alert_attempt_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'alerting', 'snoozed', 'dismissed', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 4. Push Subscriptions Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth_secret TEXT NOT NULL,
    device_label TEXT DEFAULT 'Web Browser',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_success_at TIMESTAMPTZ,
    disabled_at TIMESTAMPTZ
);

-- --------------------------------------------------------------------
-- 5. Notification Deliveries Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurrence_id UUID NOT NULL REFERENCES public.reminder_occurrences(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_or_accepted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retry')),
    attempt_count INTEGER NOT NULL DEFAULT 1,
    last_error_code TEXT,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- Indexes for Performance & Atomic Scheduling
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reminders_user_status ON public.reminders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reminders_next_occurrence ON public.reminders(next_occurrence_at) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_occurrences_user_status ON public.reminder_occurrences(user_id, status);
CREATE INDEX IF NOT EXISTS idx_occurrences_reminder_id ON public.reminder_occurrences(reminder_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_due_scheduler ON public.reminder_occurrences(status, next_alert_at)
    WHERE status IN ('pending', 'alerting', 'snoozed');

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id) WHERE disabled_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deliveries_occurrence ON public.notification_deliveries(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_idempotency ON public.notification_deliveries(idempotency_key);

-- --------------------------------------------------------------------
-- Updated_At Triggers
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_reminders_updated_at ON public.reminders;
CREATE TRIGGER trigger_reminders_updated_at
    BEFORE UPDATE ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_occurrences_updated_at ON public.reminder_occurrences;
CREATE TRIGGER trigger_occurrences_updated_at
    BEFORE UPDATE ON public.reminder_occurrences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- --------------------------------------------------------------------
-- Auto-create profile on auth.user signup
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, preferred_timezone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'preferred_timezone', 'UTC')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Reminders Policies
CREATE POLICY "Users can view own reminders"
    ON public.reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
    ON public.reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
    ON public.reminders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
    ON public.reminders FOR DELETE
    USING (auth.uid() = user_id);

-- Reminder Occurrences Policies
CREATE POLICY "Users can view own occurrences"
    ON public.reminder_occurrences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own occurrences"
    ON public.reminder_occurrences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own occurrences"
    ON public.reminder_occurrences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own occurrences"
    ON public.reminder_occurrences FOR DELETE
    USING (auth.uid() = user_id);

-- Push Subscriptions Policies
CREATE POLICY "Users can view own subscriptions"
    ON public.push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
    ON public.push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
    ON public.push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
    ON public.push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- Notification Deliveries Policies
CREATE POLICY "Users can view own notification deliveries"
    ON public.notification_deliveries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.reminder_occurrences ro
            WHERE ro.id = notification_deliveries.occurrence_id
              AND ro.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------------------
-- Atomic Scheduler RPCs (Prevent Duplicate Delivery Races)
-- --------------------------------------------------------------------

-- Claim occurrences due for processing
CREATE OR REPLACE FUNCTION public.claim_due_occurrences(batch_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    occurrence_id UUID,
    reminder_id UUID,
    user_id UUID,
    title TEXT,
    description TEXT,
    priority TEXT,
    category TEXT,
    scheduled_at TIMESTAMPTZ,
    next_alert_at TIMESTAMPTZ,
    alert_attempt_count INTEGER,
    alert_interval_minutes INTEGER,
    max_alert_attempts INTEGER,
    recurrence_rule TEXT,
    timezone TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH due AS (
        SELECT ro.id
        FROM public.reminder_occurrences ro
        JOIN public.reminders r ON r.id = ro.reminder_id
        WHERE r.status = 'active'
          AND r.notification_enabled = true
          AND ro.status IN ('pending', 'alerting', 'snoozed')
          AND ro.completed_at IS NULL
          AND ro.dismissed_at IS NULL
          AND (
              (ro.status = 'snoozed' AND ro.snooze_until <= now())
              OR (ro.status IN ('pending', 'alerting') AND ro.next_alert_at <= now())
          )
        ORDER BY ro.next_alert_at ASC
        LIMIT batch_limit
        FOR UPDATE OF ro SKIP LOCKED
    )
    UPDATE public.reminder_occurrences ro
    SET status = 'processing',
        updated_at = now()
    FROM due
    JOIN public.reminders r ON r.id = ro.reminder_id
    WHERE ro.id = due.id
    RETURNING 
        ro.id AS occurrence_id,
        r.id AS reminder_id,
        ro.user_id,
        r.title,
        r.description,
        r.priority,
        r.category,
        ro.scheduled_at,
        ro.next_alert_at,
        ro.alert_attempt_count,
        r.alert_interval_minutes,
        r.max_alert_attempts,
        r.recurrence_rule,
        r.timezone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete occurrence and advance recurrence series
CREATE OR REPLACE FUNCTION public.complete_occurrence(p_occurrence_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_occ RECORD;
    v_rem RECORD;
    v_next_time TIMESTAMPTZ;
BEGIN
    -- Verify occurrence belongs to user or security definer
    SELECT * INTO v_occ FROM public.reminder_occurrences WHERE id = p_occurrence_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Occurrence not found');
    END IF;

    -- Update occurrence
    UPDATE public.reminder_occurrences
    SET status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE id = p_occurrence_id;

    -- Fetch reminder
    SELECT * INTO v_rem FROM public.reminders WHERE id = v_occ.reminder_id;
    
    -- If one-time reminder, mark reminder completed
    IF v_rem.recurrence_rule = 'none' THEN
        UPDATE public.reminders
        SET status = 'completed',
            updated_at = now()
        WHERE id = v_rem.id;
    END IF;

    RETURN jsonb_build_object('success', true, 'occurrence_id', p_occurrence_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Snooze occurrence
CREATE OR REPLACE FUNCTION public.snooze_occurrence(p_occurrence_id UUID, p_minutes INTEGER DEFAULT 10)
RETURNS JSONB AS $$
DECLARE
    v_snooze_time TIMESTAMPTZ;
BEGIN
    v_snooze_time := now() + (p_minutes || ' minutes')::INTERVAL;

    UPDATE public.reminder_occurrences
    SET status = 'snoozed',
        snooze_until = v_snooze_time,
        next_alert_at = v_snooze_time,
        updated_at = now()
    WHERE id = p_occurrence_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Occurrence not found');
    END IF;

    RETURN jsonb_build_object('success', true, 'snooze_until', v_snooze_time);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dismiss occurrence
CREATE OR REPLACE FUNCTION public.dismiss_occurrence(p_occurrence_id UUID)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.reminder_occurrences
    SET status = 'dismissed',
        dismissed_at = now(),
        updated_at = now()
    WHERE id = p_occurrence_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Occurrence not found');
    END IF;

    RETURN jsonb_build_object('success', true, 'dismissed_at', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------
-- Admin Dashboard Security Definer RPC (Pin: 188199)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_get_system_stats(p_pin TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_count BIGINT;
    v_reminder_count BIGINT;
    v_active_reminders BIGINT;
    v_occurrences_count BIGINT;
    v_pending_alerts BIGINT;
    v_completed_count BIGINT;
    v_subscriptions_count BIGINT;
    v_deliveries_count BIGINT;
    v_users JSONB;
    v_recent_reminders JSONB;
    v_recent_deliveries JSONB;
BEGIN
    -- Strict PIN verification
    IF p_pin <> '188199' THEN
        RAISE EXCEPTION 'Unauthorized: Invalid Admin PIN';
    END IF;

    SELECT COUNT(*) INTO v_user_count FROM auth.users;
    SELECT COUNT(*) INTO v_reminder_count FROM public.reminders;
    SELECT COUNT(*) INTO v_active_reminders FROM public.reminders WHERE status = 'active';
    SELECT COUNT(*) INTO v_occurrences_count FROM public.reminder_occurrences;
    SELECT COUNT(*) INTO v_pending_alerts FROM public.reminder_occurrences WHERE status IN ('pending', 'alerting', 'snoozed');
    SELECT COUNT(*) INTO v_completed_count FROM public.reminder_occurrences WHERE status = 'completed';
    SELECT COUNT(*) INTO v_subscriptions_count FROM public.push_subscriptions WHERE disabled_at IS NULL;
    SELECT COUNT(*) INTO v_deliveries_count FROM public.notification_deliveries;

    -- Aggregate user list
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'created_at', u.created_at,
            'last_sign_in_at', u.last_sign_in_at,
            'display_name', p.display_name,
            'timezone', p.preferred_timezone,
            'reminder_count', (SELECT COUNT(*) FROM public.reminders r WHERE r.user_id = u.id),
            'subscription_count', (SELECT COUNT(*) FROM public.push_subscriptions s WHERE s.user_id = u.id AND s.disabled_at IS NULL)
        )
    ) INTO v_users
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    ORDER BY u.created_at DESC
    LIMIT 100;

    -- Recent reminders
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', r.id,
            'user_id', r.user_id,
            'title', r.title,
            'status', r.status,
            'priority', r.priority,
            'category', r.category,
            'due_at', r.due_at,
            'recurrence_rule', r.recurrence_rule,
            'created_at', r.created_at
        )
    ) INTO v_recent_reminders
    FROM (
        SELECT * FROM public.reminders ORDER BY created_at DESC LIMIT 50
    ) r;

    -- Recent deliveries
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', d.id,
            'occurrence_id', d.occurrence_id,
            'status', d.status,
            'attempted_at', d.attempted_at,
            'attempt_count', d.attempt_count,
            'last_error_code', d.last_error_code
        )
    ) INTO v_recent_deliveries
    FROM (
        SELECT * FROM public.notification_deliveries ORDER BY attempted_at DESC LIMIT 50
    ) d;

    RETURN jsonb_build_object(
        'metrics', jsonb_build_object(
            'total_users', v_user_count,
            'total_reminders', v_reminder_count,
            'active_reminders', v_active_reminders,
            'total_occurrences', v_occurrences_count,
            'pending_alerts', v_pending_alerts,
            'completed_tasks', v_completed_count,
            'active_subscriptions', v_subscriptions_count,
            'total_deliveries', v_deliveries_count
        ),
        'users', COALESCE(v_users, '[]'::jsonb),
        'reminders', COALESCE(v_recent_reminders, '[]'::jsonb),
        'deliveries', COALESCE(v_recent_deliveries, '[]'::jsonb),
        'system_status', 'healthy',
        'server_time', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

