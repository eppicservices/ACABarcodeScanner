export type SchoolLevel = 'elementary' | 'high_school'
export type ActiveFilter = 'all' | 'active' | 'inactive'
export type AdminRole = 'admin' | 'super_admin'
export type TransactionType = 'payment' | 'adjustment' | 'refund' | 'lunch_used' | 'lunch_card'
export type EmailProvider = 'none' | 'gmail' | 'sendgrid' | 'smtp'
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

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      parents: {
        Row: Parent
        Insert: {
          name: string
          email: string
          phone?: string | null
          address?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          is_active?: boolean
        }
      }
      students: {
        Row: Student
        Insert: {
          name: string
          barcode: string
          parent_id: string
          school_level: SchoolLevel
          balance?: number
          is_active?: boolean
        }
        Update: {
          name?: string
          barcode?: string
          parent_id?: string
          school_level?: SchoolLevel
          balance?: number
          is_active?: boolean
        }
      }
      admin_users: {
        Row: AdminUser
        Insert: {
          id: string
          email: string
          role?: AdminRole
          invited_by?: string | null
        }
        Update: {
          role?: AdminRole
        }
      }
      admin_invitations: {
        Row: AdminInvitation
        Insert: {
          email: string
          invited_by: string
          token: string
          expires_at: string
        }
        Update: {
          used_at?: string | null
        }
      }
      app_settings: {
        Row: AppSettings
        Insert: never
        Update: {
          elementary_lunch_price?: number
          highschool_lunch_price?: number
          highschool_lunch_card_price?: number
          highschool_lunch_card_lunches?: number
          second_meal_price?: number
          elementary_negative_limit?: number
          highschool_negative_limit?: number
          elementary_low_lunch_threshold?: number
          highschool_low_lunch_threshold?: number
          notifications_enabled?: boolean
          zero_balance_alerts?: boolean
          weekly_summary_enabled?: boolean
          notification_frequency?: 'immediate' | 'daily'
          scanner_sound_enabled?: boolean
          scanner_auto_deduct?: boolean
          show_student_photo?: boolean
          school_name?: string
          school_year?: string
          contact_email?: string | null
          email_provider?: EmailProvider
          email_from_address?: string | null
          email_from_name?: string | null
          gmail_user?: string | null
          gmail_app_password?: string | null
          sendgrid_api_key?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          smtp_password?: string | null
          smtp_secure?: boolean
          updated_at?: string
          updated_by?: string | null
          calendar_url?: string | null
          calendar_enabled?: boolean
          school_calendar_enabled?: boolean
          fall_semester_start?: string | null
          fall_semester_end?: string | null
          spring_semester_start?: string | null
          spring_semester_end?: string | null
          // Branding settings
          school_logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          // Timing settings
          scan_display_duration?: number
          scanner_buffer_timeout?: number
          parent_token_expiry_days?: number
          // Feature flags
          parent_portal_enabled?: boolean
          manual_entry_enabled?: boolean
          // Security settings
          password_min_length?: number
          settings_cache_minutes?: number
        }
      }
      daily_meals: {
        Row: DailyMeal
        Insert: {
          meal_date: string
          meal_name: string
          source?: MealSource
          calendar_event_id?: string | null
          updated_by?: string | null
        }
        Update: {
          meal_name?: string
          source?: MealSource
          calendar_event_id?: string | null
          updated_by?: string | null
        }
      }
      balance_transactions: {
        Row: BalanceTransaction
        Insert: {
          student_id: string
          lunches_change: number
          previous_lunches: number
          new_lunches: number
          amount_paid?: number | null
          lunches_added?: number | null
          transaction_type: TransactionType
          notes?: string | null
          created_by?: string | null
        }
        Update: never
      }
      notification_log: {
        Row: NotificationLog
        Insert: {
          student_id: string
          parent_id: string
          notification_type: string
          balance_at_notification: number
        }
        Update: never
      }
      parent_access_tokens: {
        Row: ParentAccessToken
        Insert: {
          parent_id: string
          token: string
          expires_at: string
          created_by?: string | null
        }
        Update: {
          last_used_at?: string | null
        }
      }
      pending_payments: {
        Row: PendingPayment
        Insert: {
          parent_id: string
          student_payments: StudentPaymentItem[]
          total_amount: number
          status?: PendingPaymentStatus
          notes?: string | null
        }
        Update: {
          status?: PendingPaymentStatus
          completed_at?: string | null
          completed_by?: string | null
          notes?: string | null
        }
      }
      email_blackout_periods: {
        Row: EmailBlackoutPeriod
        Insert: {
          name: string
          start_date: string
          end_date: string
          description?: string | null
          created_by?: string | null
        }
        Update: {
          name?: string
          start_date?: string
          end_date?: string
          description?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      school_level: SchoolLevel
    }
  }
}
