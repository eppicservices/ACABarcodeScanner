export type SchoolLevel = 'elementary' | 'high_school'

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

// Student with parent info joined
export interface StudentWithParent extends Student {
  parent: Parent
}

// Parent with their children
export interface ParentWithStudents extends Parent {
  students: Student[]
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      parents: {
        Row: Parent
        Insert: Omit<Parent, 'id' | 'created_at'>
        Update: Partial<Omit<Parent, 'id' | 'created_at'>>
      }
      students: {
        Row: Student
        Insert: Omit<Student, 'id' | 'created_at'>
        Update: Partial<Omit<Student, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      school_level: SchoolLevel
    }
  }
}
