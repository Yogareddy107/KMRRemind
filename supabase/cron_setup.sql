-- ====================================================================
-- KMR Remind: Supabase pg_cron Scheduling Setup
-- Runs the process-reminders Edge Function every minute
-- ====================================================================

-- 1. Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Store your Supabase Project URL and Anon/Service Key in Vault or use directly:
-- Schedule cron job to run every 1 minute
SELECT cron.schedule(
    'kmr-remind-scheduler-minutely',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := 'https://wpnyljzdaonygldqhlvs.supabase.co/functions/v1/process-reminders',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnlsanpkYW9ueWdsZHFobHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMzMyNzQsImV4cCI6MjEwODgwOTI3NH0.XICNbwVK4Xs6nWl4L11FhQMDjfvpkssFB8XtIj-XoYY'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    ) AS request_id;
    $$
);

-- Query to check scheduled cron jobs:
-- SELECT * FROM cron.job;
-- Query to check cron run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

