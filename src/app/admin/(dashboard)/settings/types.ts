import type { DayOfWeek, AutoSendSchedule, EmailProvider } from '@/types/database'

export type TabId =
  | 'pricing'
  | 'notifications'
  | 'email'
  | 'scanner'
  | 'school'
  | 'calendar'
  | 'branding'
  | 'advanced'
  | 'admins'
  | 'payments'
  | 'import'
  | 'data'

export type PreviewTemplate = 'balance' | 'receipt' | 'portal' | 'weekly' | 'welcome' | null

export interface Message {
  type: 'success' | 'error'
  text: string
}

export interface SettingsFormData {
  // Pricing
  elementary_lunch_price: string
  highschool_lunch_price: string
  highschool_lunch_card_price: string
  highschool_lunch_card_lunches: string
  second_meal_price: string
  // Negative limits
  elementary_negative_limit: string
  highschool_negative_limit: string
  // Notifications
  elementary_low_lunch_threshold: string
  highschool_low_lunch_threshold: string
  notifications_enabled: boolean
  zero_balance_alerts: boolean
  weekly_summary_enabled: boolean
  notification_frequency: 'immediate' | 'daily'
  // Email scheduling
  email_allowed_days: DayOfWeek[]
  email_window_start: string
  email_window_end: string
  email_timezone: string
  min_days_between_emails: string
  auto_send_enabled: boolean
  auto_send_schedule: AutoSendSchedule
  auto_send_time: string
  // Scanner
  scanner_sound_enabled: boolean
  scanner_auto_deduct: boolean
  show_student_photo: boolean
  // School
  school_name: string
  school_year: string
  contact_email: string
  // Email
  email_provider: EmailProvider
  email_from_address: string
  email_from_name: string
  gmail_user: string
  gmail_app_password: string
  sendgrid_api_key: string
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_password: string
  smtp_secure: boolean
  // Branding
  school_logo_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
  // Timing
  scan_display_duration: string
  scanner_buffer_timeout: string
  parent_token_expiry_days: string
  // Feature flags
  parent_portal_enabled: boolean
  manual_entry_enabled: boolean
  // Security settings
  password_min_length: string
  settings_cache_minutes: string
}

export const defaultFormData: SettingsFormData = {
  // Pricing
  elementary_lunch_price: '4.00',
  highschool_lunch_price: '6.00',
  highschool_lunch_card_price: '50.00',
  highschool_lunch_card_lunches: '10',
  second_meal_price: '4.50',
  // Negative limits
  elementary_negative_limit: '-5',
  highschool_negative_limit: '0',
  // Notifications
  elementary_low_lunch_threshold: '5',
  highschool_low_lunch_threshold: '3',
  notifications_enabled: true,
  zero_balance_alerts: true,
  weekly_summary_enabled: false,
  notification_frequency: 'immediate',
  // Email scheduling
  email_allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  email_window_start: '08:00',
  email_window_end: '18:00',
  email_timezone: 'America/New_York',
  min_days_between_emails: '3',
  auto_send_enabled: false,
  auto_send_schedule: 'weekdays',
  auto_send_time: '09:00',
  // Scanner
  scanner_sound_enabled: true,
  scanner_auto_deduct: true,
  show_student_photo: false,
  // School
  school_name: 'Aldersgate Christian Academy',
  school_year: '2025-2026',
  contact_email: '',
  // Email
  email_provider: 'none',
  email_from_address: '',
  email_from_name: '',
  gmail_user: '',
  gmail_app_password: '',
  sendgrid_api_key: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_password: '',
  smtp_secure: true,
  // Branding
  school_logo_url: '',
  primary_color: '#002c5f',
  secondary_color: '#ffc82e',
  accent_color: '#00b1c1',
  // Timing
  scan_display_duration: '3000',
  scanner_buffer_timeout: '100',
  parent_token_expiry_days: '7',
  // Feature flags
  parent_portal_enabled: true,
  manual_entry_enabled: true,
  // Security settings
  password_min_length: '6',
  settings_cache_minutes: '5',
}
