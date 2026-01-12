import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export interface StudentRecord {
  id: string
  name: string
  barcode: string
  balance: number
  school_level: 'elementary' | 'high_school'
}

export async function lookupStudentByBarcode(barcode: string): Promise<StudentRecord | null> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, barcode, balance, school_level')
    .eq('barcode', barcode)
    .single()

  if (error || !data) {
    return null
  }

  return data as StudentRecord
}
