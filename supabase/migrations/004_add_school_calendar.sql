-- Add school calendar settings to app_settings for semester dates
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS school_calendar_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fall_semester_start DATE,
ADD COLUMN IF NOT EXISTS fall_semester_end DATE,
ADD COLUMN IF NOT EXISTS spring_semester_start DATE,
ADD COLUMN IF NOT EXISTS spring_semester_end DATE;

-- Create email_blackout_periods table for breaks within semesters
CREATE TABLE email_blackout_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Create index for fast date range lookups
CREATE INDEX idx_blackout_periods_dates ON email_blackout_periods(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE email_blackout_periods ENABLE ROW LEVEL SECURITY;

-- Allow all operations (admin controlled)
CREATE POLICY "Allow all operations on email_blackout_periods" ON email_blackout_periods FOR ALL USING (true);

-- Add comment explaining the feature
COMMENT ON COLUMN app_settings.school_calendar_enabled IS 'When enabled, emails will only be sent during active semester periods and outside of blackout dates';
COMMENT ON TABLE email_blackout_periods IS 'Defines periods (breaks, holidays) when emails should not be sent';
