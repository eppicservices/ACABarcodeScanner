-- ============================================
-- ACA Barcode Scanner - Database Schema
-- Self-hosted Supabase initialization
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Custom Types
-- ============================================

CREATE TYPE school_level AS ENUM ('elementary', 'high_school');
CREATE TYPE admin_role AS ENUM ('admin', 'super_admin');
CREATE TYPE transaction_type AS ENUM ('payment', 'adjustment', 'refund', 'lunch_used', 'lunch_card');
CREATE TYPE email_provider AS ENUM ('none', 'gmail', 'sendgrid', 'smtp');
CREATE TYPE day_of_week AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
CREATE TYPE auto_send_schedule AS ENUM ('daily', 'weekly', 'weekdays');
CREATE TYPE meal_source AS ENUM ('calendar', 'manual');
CREATE TYPE pending_payment_status AS ENUM ('pending', 'completed', 'cancelled', 'expired');

-- ============================================
-- Tables
-- ============================================

-- Parents table
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    barcode TEXT NOT NULL UNIQUE,
    balance INTEGER NOT NULL DEFAULT 0,
    school_level school_level NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role admin_role NOT NULL DEFAULT 'admin',
    invited_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin invitations table
CREATE TABLE admin_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES admin_users(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App settings table (singleton)
CREATE TABLE app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    -- Lunch pricing
    elementary_lunch_price DECIMAL(10,2) NOT NULL DEFAULT 3.50,
    highschool_lunch_price DECIMAL(10,2) NOT NULL DEFAULT 4.00,
    highschool_lunch_card_price DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    highschool_lunch_card_lunches INTEGER NOT NULL DEFAULT 15,
    second_meal_price DECIMAL(10,2) NOT NULL DEFAULT 4.50,
    -- Negative balance limits
    elementary_negative_limit INTEGER NOT NULL DEFAULT -5,
    highschool_negative_limit INTEGER NOT NULL DEFAULT -3,
    -- Low balance notification thresholds
    elementary_low_lunch_threshold INTEGER NOT NULL DEFAULT 5,
    highschool_low_lunch_threshold INTEGER NOT NULL DEFAULT 3,
    -- Notification settings
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    zero_balance_alerts BOOLEAN NOT NULL DEFAULT true,
    weekly_summary_enabled BOOLEAN NOT NULL DEFAULT false,
    notification_frequency TEXT NOT NULL DEFAULT 'daily',
    -- Email scheduling settings
    email_allowed_days day_of_week[] NOT NULL DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::day_of_week[],
    email_window_start TEXT NOT NULL DEFAULT '08:00',
    email_window_end TEXT NOT NULL DEFAULT '18:00',
    email_timezone TEXT NOT NULL DEFAULT 'America/New_York',
    min_days_between_emails INTEGER NOT NULL DEFAULT 3,
    auto_send_enabled BOOLEAN NOT NULL DEFAULT false,
    auto_send_schedule auto_send_schedule NOT NULL DEFAULT 'weekdays',
    auto_send_time TEXT NOT NULL DEFAULT '07:00',
    -- Scanner settings
    scanner_sound_enabled BOOLEAN NOT NULL DEFAULT true,
    scanner_auto_deduct BOOLEAN NOT NULL DEFAULT true,
    show_student_photo BOOLEAN NOT NULL DEFAULT false,
    -- School info
    school_name TEXT NOT NULL DEFAULT 'School Name',
    school_year TEXT NOT NULL DEFAULT '2024-2025',
    contact_email TEXT,
    -- Email settings
    email_provider email_provider NOT NULL DEFAULT 'none',
    email_from_address TEXT,
    email_from_name TEXT,
    gmail_user TEXT,
    gmail_app_password TEXT,
    sendgrid_api_key TEXT,
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_user TEXT,
    smtp_password TEXT,
    smtp_secure BOOLEAN NOT NULL DEFAULT true,
    -- Metadata
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,
    -- Calendar settings
    calendar_url TEXT,
    calendar_enabled BOOLEAN NOT NULL DEFAULT false,
    -- School calendar settings
    school_calendar_enabled BOOLEAN NOT NULL DEFAULT false,
    fall_semester_start DATE,
    fall_semester_end DATE,
    spring_semester_start DATE,
    spring_semester_end DATE,
    -- Branding settings
    school_logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#1e40af',
    secondary_color TEXT NOT NULL DEFAULT '#3b82f6',
    accent_color TEXT NOT NULL DEFAULT '#60a5fa',
    -- Timing settings
    scan_display_duration INTEGER NOT NULL DEFAULT 3000,
    scanner_buffer_timeout INTEGER NOT NULL DEFAULT 100,
    parent_token_expiry_days INTEGER NOT NULL DEFAULT 7,
    -- Feature flags
    parent_portal_enabled BOOLEAN NOT NULL DEFAULT true,
    manual_entry_enabled BOOLEAN NOT NULL DEFAULT true,
    -- Security settings
    password_min_length INTEGER NOT NULL DEFAULT 8,
    settings_cache_minutes INTEGER NOT NULL DEFAULT 5
);

-- Insert default app settings
INSERT INTO app_settings (id) VALUES (1);

-- Daily meals table
CREATE TABLE daily_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_date DATE NOT NULL UNIQUE,
    meal_name TEXT NOT NULL,
    source meal_source NOT NULL DEFAULT 'manual',
    calendar_event_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);

-- Balance transactions table
CREATE TABLE balance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lunches_change INTEGER NOT NULL,
    previous_lunches INTEGER NOT NULL,
    new_lunches INTEGER NOT NULL,
    amount_paid DECIMAL(10,2),
    lunches_added INTEGER,
    transaction_type transaction_type NOT NULL,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification log table
CREATE TABLE notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    balance_at_notification INTEGER NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parent access tokens table
CREATE TABLE parent_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID
);

-- Pending payments table
CREATE TABLE pending_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_payments JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status pending_payment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    notes TEXT
);

-- Email blackout periods table
CREATE TABLE email_blackout_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_barcode ON students(barcode);
CREATE INDEX idx_students_is_active ON students(is_active);
CREATE INDEX idx_balance_transactions_student_id ON balance_transactions(student_id);
CREATE INDEX idx_balance_transactions_created_at ON balance_transactions(created_at);
CREATE INDEX idx_notification_log_parent_id ON notification_log(parent_id);
CREATE INDEX idx_notification_log_sent_at ON notification_log(sent_at);
CREATE INDEX idx_parent_access_tokens_token ON parent_access_tokens(token);
CREATE INDEX idx_parent_access_tokens_parent_id ON parent_access_tokens(parent_id);
CREATE INDEX idx_daily_meals_meal_date ON daily_meals(meal_date);
CREATE INDEX idx_pending_payments_parent_id ON pending_payments(parent_id);
CREATE INDEX idx_pending_payments_status ON pending_payments(status);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_blackout_periods ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything (service role bypasses RLS)
-- These policies allow authenticated admin users to access data

-- Parents policies
CREATE POLICY "Admin full access to parents" ON parents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

-- Students policies
CREATE POLICY "Admin full access to students" ON students
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

-- Admin users policies
CREATE POLICY "Admin can view admin_users" ON admin_users
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admin can manage admin_users" ON admin_users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Admin invitations policies
CREATE POLICY "Admin can view invitations" ON admin_invitations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

CREATE POLICY "Admin can create invitations" ON admin_invitations
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

-- App settings policies
CREATE POLICY "Anyone can view app_settings" ON app_settings
    FOR SELECT USING (true);

CREATE POLICY "Admin can update app_settings" ON app_settings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

-- Daily meals policies
CREATE POLICY "Anyone can view daily_meals" ON daily_meals
    FOR SELECT USING (true);

CREATE POLICY "Admin full access to daily_meals" ON daily_meals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

-- Balance transactions policies
CREATE POLICY "Admin full access to balance_transactions" ON balance_transactions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

-- Notification log policies
CREATE POLICY "Admin full access to notification_log" ON notification_log
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

-- Parent access tokens policies
CREATE POLICY "Admin full access to parent_access_tokens" ON parent_access_tokens
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

-- Pending payments policies
CREATE POLICY "Admin full access to pending_payments" ON pending_payments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

-- Email blackout periods policies
CREATE POLICY "Anyone can view email_blackout_periods" ON email_blackout_periods
    FOR SELECT USING (true);

CREATE POLICY "Admin full access to email_blackout_periods" ON email_blackout_periods
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

-- ============================================
-- Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_meals_updated_at
    BEFORE UPDATE ON daily_meals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Service Role Setup (for Supabase)
-- ============================================

-- Grant necessary permissions to authenticator role
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE parents;
ALTER PUBLICATION supabase_realtime ADD TABLE balance_transactions;
