export type SchoolLevel = 'elementary' | 'high_school'
export type ActiveFilter = 'all' | 'active' | 'inactive'
export type AdminRole = 'admin' | 'super_admin'
export type TransactionType = 'payment' | 'adjustment' | 'refund' | 'lunch_used' | 'lunch_card'
export type EmailProvider = 'none' | 'gmail' | 'sendgrid' | 'smtp'
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
export type AutoSendSchedule = 'daily' | 'weekly' | 'weekdays'
export type MealSource = 'calendar' | 'manual'

export interface Parent {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  is_active: boolean
  created_at: string
}

export interface Student {
  id: string
  parent_id: string
  name: string
  barcode: string
  balance: number // Number of lunches remaining (not dollars)
  school_level: SchoolLevel
  is_active: boolean
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
  invited_by: string | null
  created_at: string
}

export interface AdminInvitation {
  id: string
  email: string
  invited_by: string
  token: string
  expires_at: string
  used_at: string | null
  created_at: string
}

export interface AppSettings {
  id: number
  // Lunch pricing
  elementary_lunch_price: number
  highschool_lunch_price: number
  highschool_lunch_card_price: number
  highschool_lunch_card_lunches: number
  second_meal_price: number
  // Negative balance limits
  elementary_negative_limit: number
  highschool_negative_limit: number
  // Low balance notification thresholds (in lunch counts)
  elementary_low_lunch_threshold: number
  highschool_low_lunch_threshold: number
  // Notification settings
  notifications_enabled: boolean
  zero_balance_alerts: boolean
  weekly_summary_enabled: boolean
  notification_frequency: 'immediate' | 'daily'
  // Email scheduling settings
  email_allowed_days: DayOfWeek[]
  email_window_start: string  // HH:MM format, e.g., "08:00"
  email_window_end: string    // HH:MM format, e.g., "18:00"
  email_timezone: string      // IANA timezone, e.g., "America/New_York"
  min_days_between_emails: number  // Minimum days between emails to same parent
  auto_send_enabled: boolean
  auto_send_schedule: AutoSendSchedule
  auto_send_time: string      // HH:MM format for when to send batch emails
  // Scanner settings
  scanner_sound_enabled: boolean
  scanner_auto_deduct: boolean
  show_student_photo: boolean
  // School info
  school_name: string
  school_year: string
  contact_email: string | null
  // Email settings
  email_provider: EmailProvider
  email_from_address: string | null
  email_from_name: string | null
  gmail_user: string | null
  gmail_app_password: string | null
  sendgrid_api_key: string | null
  smtp_host: string | null
  smtp_port: number | null
  smtp_user: string | null
  smtp_password: string | null
  smtp_secure: boolean
  // Metadata
  updated_at: string
  updated_by: string | null
  // Calendar settings
  calendar_url: string | null
  calendar_enabled: boolean
  // School calendar settings (for email control)
  school_calendar_enabled: boolean
  fall_semester_start: string | null
  fall_semester_end: string | null
  spring_semester_start: string | null
  spring_semester_end: string | null
  // Branding settings
  school_logo_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  // Timing settings
  scan_display_duration: number
  scanner_buffer_timeout: number
  parent_token_expiry_days: number
  // Feature flags
  parent_portal_enabled: boolean
  manual_entry_enabled: boolean
  // Security settings
  password_min_length: number
  settings_cache_minutes: number
}

export interface BalanceTransaction {
  id: string
  student_id: string
  // Lunch tracking
  lunches_change: number
  previous_lunches: number
  new_lunches: number
  // Payment tracking
  amount_paid: number | null
  lunches_added: number | null
  // Metadata
  transaction_type: TransactionType
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface NotificationLog {
  id: string
  student_id: string
  parent_id: string
  notification_type: string
  balance_at_notification: number
  sent_at: string
}

export interface DailyMeal {
  id: string
  meal_date: string
  meal_name: string
  source: MealSource
  calendar_event_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface EmailBlackoutPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  description: string | null
  created_at: string
  created_by: string | null
}


export interface ParentAccessToken {
  id: string
  parent_id: string
  token: string
  expires_at: string
  last_used_at: string | null
  created_at: string
  created_by: string | null
}

export type PendingPaymentStatus = 'pending' | 'completed' | 'cancelled' | 'expired'

export interface StudentPaymentItem {
  student_id: string
  student_name: string
  amount: number
  lunches_to_add: number
  is_lunch_card: boolean
}

export interface PendingPayment {
  id: string
  parent_id: string
  student_payments: StudentPaymentItem[]
  total_amount: number
  status: PendingPaymentStatus
  created_at: string
  completed_at: string | null
  completed_by: string | null
  notes: string | null
}

// Extended types with joins
export interface ParentWithStudents extends Parent {
  students: Student[]
}

// Note: The Supabase Database interface has been removed.
// Use Prisma types from @prisma/client instead for database operations.
