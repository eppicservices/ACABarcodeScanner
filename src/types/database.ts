export type SchoolLevel = 'elementary' | 'high_school'
export type AdminRole = 'admin' | 'super_admin'
export type TransactionType = 'payment' | 'adjustment' | 'refund'

export interface Parent {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  created_at: string
}

export interface Student {
  id: string
  parent_id: string
  name: string
  barcode: string
  balance: number
  school_level: SchoolLevel
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
  elementary_low_balance_threshold: number
  high_school_low_balance_threshold: number
  notifications_enabled: boolean
  updated_at: string
  updated_by: string | null
}

export interface BalanceTransaction {
  id: string
  student_id: string
  amount: number
  previous_balance: number
  new_balance: number
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

// Extended types with joins
export interface StudentWithParent extends Student {
  parent: Parent
}

export interface ParentWithStudents extends Parent {
  students: Student[]
}

export interface BalanceTransactionWithStudent extends BalanceTransaction {
  student: Pick<Student, 'id' | 'name' | 'barcode'>
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
        }
        Update: {
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
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
        }
        Update: {
          name?: string
          barcode?: string
          parent_id?: string
          school_level?: SchoolLevel
          balance?: number
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
          elementary_low_balance_threshold?: number
          high_school_low_balance_threshold?: number
          notifications_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
      }
      balance_transactions: {
        Row: BalanceTransaction
        Insert: {
          student_id: string
          amount: number
          previous_balance: number
          new_balance: number
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      school_level: SchoolLevel
    }
  }
}
