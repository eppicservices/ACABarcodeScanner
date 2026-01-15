-- Add branding, timing, and feature flag settings to app_settings

-- Branding settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS school_logo_url TEXT;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#002c5f';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#ffc82e';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#00b1c1';

-- Timing settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS scan_display_duration INTEGER DEFAULT 3000;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS scanner_buffer_timeout INTEGER DEFAULT 100;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS parent_token_expiry_days INTEGER DEFAULT 7;

-- Feature flags
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS parent_portal_enabled BOOLEAN DEFAULT true;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS manual_entry_enabled BOOLEAN DEFAULT true;

-- Security settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS password_min_length INTEGER DEFAULT 6;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS settings_cache_minutes INTEGER DEFAULT 5;

-- Update existing row with defaults
UPDATE app_settings SET
  primary_color = COALESCE(primary_color, '#002c5f'),
  secondary_color = COALESCE(secondary_color, '#ffc82e'),
  accent_color = COALESCE(accent_color, '#00b1c1'),
  scan_display_duration = COALESCE(scan_display_duration, 3000),
  scanner_buffer_timeout = COALESCE(scanner_buffer_timeout, 100),
  parent_token_expiry_days = COALESCE(parent_token_expiry_days, 7),
  parent_portal_enabled = COALESCE(parent_portal_enabled, true),
  manual_entry_enabled = COALESCE(manual_entry_enabled, true),
  password_min_length = COALESCE(password_min_length, 6),
  settings_cache_minutes = COALESCE(settings_cache_minutes, 5)
WHERE id = 1;
