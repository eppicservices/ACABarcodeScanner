-- Add email scheduling settings to app_settings

-- Email scheduling settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS email_allowed_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS email_window_start TEXT DEFAULT '08:00';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS email_window_end TEXT DEFAULT '18:00';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS email_timezone TEXT DEFAULT 'America/New_York';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS min_days_between_emails INTEGER DEFAULT 3;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS auto_send_enabled BOOLEAN DEFAULT false;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS auto_send_schedule TEXT DEFAULT 'weekdays';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS auto_send_time TEXT DEFAULT '09:00';

-- Update existing row with defaults
UPDATE app_settings SET
  email_allowed_days = COALESCE(email_allowed_days, ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
  email_window_start = COALESCE(email_window_start, '08:00'),
  email_window_end = COALESCE(email_window_end, '18:00'),
  email_timezone = COALESCE(email_timezone, 'America/New_York'),
  min_days_between_emails = COALESCE(min_days_between_emails, 3),
  auto_send_enabled = COALESCE(auto_send_enabled, false),
  auto_send_schedule = COALESCE(auto_send_schedule, 'weekdays'),
  auto_send_time = COALESCE(auto_send_time, '09:00')
WHERE id = 1;

-- Add comment for documentation
COMMENT ON COLUMN app_settings.email_allowed_days IS 'Days of the week when emails can be sent (array of: sunday, monday, tuesday, wednesday, thursday, friday, saturday)';
COMMENT ON COLUMN app_settings.email_window_start IS 'Start time for email sending window (HH:MM format)';
COMMENT ON COLUMN app_settings.email_window_end IS 'End time for email sending window (HH:MM format)';
COMMENT ON COLUMN app_settings.email_timezone IS 'Timezone for email scheduling (IANA format, e.g., America/New_York)';
COMMENT ON COLUMN app_settings.min_days_between_emails IS 'Minimum days between sending emails to the same parent';
COMMENT ON COLUMN app_settings.auto_send_enabled IS 'Enable automatic sending of low balance emails';
COMMENT ON COLUMN app_settings.auto_send_schedule IS 'Auto-send schedule: daily, weekdays, or weekly';
COMMENT ON COLUMN app_settings.auto_send_time IS 'Time to send automatic emails (HH:MM format)';
