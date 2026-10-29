export type Priority = 'low' | 'medium' | 'high';
export type ReminderStatus = 'active' | 'paused' | 'completed' | 'archived';
export type RecurrenceRule = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';
export type OccurrenceStatus = 'pending' | 'processing' | 'alerting' | 'snoozed' | 'dismissed' | 'completed' | 'failed';
export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retry';

export interface Profile {
  id: string;
  display_name: string | null;
  preferred_timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: Priority;
  category: string;
  timezone: string;
  due_at: string; // ISO UTC string
  recurrence_rule: RecurrenceRule;
  recurrence_end_at: string | null;
  notification_enabled: boolean;
  alert_interval_minutes: number;
  max_alert_attempts: number;
  max_alert_duration_minutes: number | null;
  status: ReminderStatus;
  next_occurrence_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReminderOccurrence {
  id: string;
  reminder_id: string;
  user_id: string;
  scheduled_at: string;
  triggered_at: string | null;
  completed_at: string | null;
  dismissed_at: string | null;
  snooze_until: string | null;
  next_alert_at: string;
  alert_attempt_count: number;
  status: OccurrenceStatus;
  created_at: string;
  updated_at: string;
  // Joined reminder for UI convenience
  reminder?: Reminder;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_secret: string;
  device_label: string | null;
  created_at: string;
  last_success_at: string | null;
  disabled_at: string | null;
}

export interface NotificationDelivery {
  id: string;
  occurrence_id: string;
  subscription_id: string | null;
  idempotency_key: string;
  scheduled_at: string;
  attempted_at: string;
  delivered_or_accepted_at: string | null;
  status: DeliveryStatus;
  attempt_count: number;
  last_error_code: string | null;
  next_retry_at: string | null;
  created_at: string;
}

export interface AdminSystemStats {
  metrics: {
    total_users: number;
    total_reminders: number;
    active_reminders: number;
    total_occurrences: number;
    pending_alerts: number;
    completed_tasks: number;
    active_subscriptions: number;
    total_deliveries: number;
  };
  users: Array<{
    id: string;
    email: string;
    display_name?: string;
    timezone?: string;
    created_at: string;
    last_sign_in_at?: string;
    reminder_count: number;
    subscription_count: number;
  }>;
  reminders: Array<Reminder>;
  deliveries: Array<NotificationDelivery>;
  system_status: string;
  server_time: string;
}

