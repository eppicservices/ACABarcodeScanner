-- Add calendar settings to app_settings
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS calendar_url TEXT,
ADD COLUMN IF NOT EXISTS calendar_enabled BOOLEAN DEFAULT FALSE;

-- Create daily_meals table to store meal info per day
CREATE TABLE daily_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_date DATE UNIQUE NOT NULL,
  meal_name TEXT NOT NULL,
  source TEXT DEFAULT 'manual', -- 'calendar' or 'manual'
  calendar_event_id TEXT, -- Store calendar event ID for reference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Create index for fast date lookups
CREATE INDEX idx_daily_meals_date ON daily_meals(meal_date);

-- Enable Row Level Security
ALTER TABLE daily_meals ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (admin controlled)
CREATE POLICY "Allow all operations on daily_meals" ON daily_meals FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_meals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_daily_meals_updated_at
  BEFORE UPDATE ON daily_meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_meals_updated_at();
