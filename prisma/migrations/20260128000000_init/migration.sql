-- CreateEnum
CREATE TYPE "school_level" AS ENUM ('elementary', 'high_school');


-- CreateEnum
CREATE TYPE "admin_role" AS ENUM ('admin', 'super_admin');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('payment', 'adjustment', 'refund', 'lunch_used', 'lunch_card');

-- CreateEnum
CREATE TYPE "email_provider" AS ENUM ('none', 'gmail', 'sendgrid', 'smtp');

-- CreateEnum
CREATE TYPE "day_of_week" AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');

-- CreateEnum
CREATE TYPE "auto_send_schedule" AS ENUM ('daily', 'weekly', 'weekdays');

-- CreateEnum
CREATE TYPE "meal_source" AS ENUM ('calendar', 'manual');

-- CreateEnum
CREATE TYPE "pending_payment_status" AS ENUM ('pending', 'completed', 'cancelled', 'expired');

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "school_level" "school_level" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "admin_role" NOT NULL DEFAULT 'admin',
    "invited_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "elementary_lunch_price" DECIMAL(10,2) NOT NULL DEFAULT 3.50,
    "highschool_lunch_price" DECIMAL(10,2) NOT NULL DEFAULT 4.00,
    "highschool_lunch_card_price" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    "highschool_lunch_card_lunches" INTEGER NOT NULL DEFAULT 15,
    "second_meal_price" DECIMAL(10,2) NOT NULL DEFAULT 4.50,
    "elementary_negative_limit" INTEGER NOT NULL DEFAULT -5,
    "highschool_negative_limit" INTEGER NOT NULL DEFAULT -3,
    "elementary_low_lunch_threshold" INTEGER NOT NULL DEFAULT 5,
    "highschool_low_lunch_threshold" INTEGER NOT NULL DEFAULT 3,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "zero_balance_alerts" BOOLEAN NOT NULL DEFAULT true,
    "weekly_summary_enabled" BOOLEAN NOT NULL DEFAULT false,
    "notification_frequency" TEXT NOT NULL DEFAULT 'daily',
    "email_allowed_days" "day_of_week"[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::"day_of_week"[],
    "email_window_start" TEXT NOT NULL DEFAULT '08:00',
    "email_window_end" TEXT NOT NULL DEFAULT '18:00',
    "email_timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "min_days_between_emails" INTEGER NOT NULL DEFAULT 3,
    "auto_send_enabled" BOOLEAN NOT NULL DEFAULT false,
    "auto_send_schedule" "auto_send_schedule" NOT NULL DEFAULT 'weekdays',
    "auto_send_time" TEXT NOT NULL DEFAULT '07:00',
    "scanner_sound_enabled" BOOLEAN NOT NULL DEFAULT true,
    "scanner_auto_deduct" BOOLEAN NOT NULL DEFAULT true,
    "show_student_photo" BOOLEAN NOT NULL DEFAULT false,
    "school_name" TEXT NOT NULL DEFAULT 'School Name',
    "school_year" TEXT NOT NULL DEFAULT '2024-2025',
    "contact_email" TEXT,
    "email_provider" "email_provider" NOT NULL DEFAULT 'none',
    "email_from_address" TEXT,
    "email_from_name" TEXT,
    "gmail_user" TEXT,
    "gmail_app_password" TEXT,
    "sendgrid_api_key" TEXT,
    "smtp_host" TEXT,
    "smtp_port" INTEGER,
    "smtp_user" TEXT,
    "smtp_password" TEXT,
    "smtp_secure" BOOLEAN NOT NULL DEFAULT true,
    "calendar_url" TEXT,
    "calendar_enabled" BOOLEAN NOT NULL DEFAULT false,
    "school_calendar_enabled" BOOLEAN NOT NULL DEFAULT false,
    "fall_semester_start" DATE,
    "fall_semester_end" DATE,
    "spring_semester_start" DATE,
    "spring_semester_end" DATE,
    "school_logo_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#1e40af',
    "secondary_color" TEXT NOT NULL DEFAULT '#3b82f6',
    "accent_color" TEXT NOT NULL DEFAULT '#60a5fa',
    "scan_display_duration" INTEGER NOT NULL DEFAULT 3000,
    "scanner_buffer_timeout" INTEGER NOT NULL DEFAULT 100,
    "parent_token_expiry_days" INTEGER NOT NULL DEFAULT 7,
    "parent_portal_enabled" BOOLEAN NOT NULL DEFAULT true,
    "manual_entry_enabled" BOOLEAN NOT NULL DEFAULT true,
    "password_min_length" INTEGER NOT NULL DEFAULT 8,
    "settings_cache_minutes" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_transactions" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "lunches_change" INTEGER NOT NULL,
    "previous_lunches" INTEGER NOT NULL,
    "new_lunches" INTEGER NOT NULL,
    "amount_paid" DECIMAL(10,2),
    "lunches_added" INTEGER,
    "transaction_type" "transaction_type" NOT NULL,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "balance_at_notification" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_meals" (
    "id" TEXT NOT NULL,
    "meal_date" DATE NOT NULL,
    "meal_name" TEXT NOT NULL,
    "source" "meal_source" NOT NULL DEFAULT 'manual',
    "calendar_event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "daily_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_blackout_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "email_blackout_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_access_tokens" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "parent_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_payments" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "student_payments" JSONB NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "pending_payment_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "notes" TEXT,

    CONSTRAINT "pending_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parents_email_key" ON "parents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_barcode_key" ON "students"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invitations_token_key" ON "admin_invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "daily_meals_meal_date_key" ON "daily_meals"("meal_date");

-- CreateIndex
CREATE UNIQUE INDEX "parent_access_tokens_token_key" ON "parent_access_tokens"("token");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_access_tokens" ADD CONSTRAINT "parent_access_tokens_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

