import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database, AppSettings } from '@/types/database'

// Lazy initialization to avoid build-time errors during static generation
let supabaseInstance: SupabaseClient<Database> | null = null

function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

// For backwards compatibility, export a getter
export const supabase = {
  from: (...args: Parameters<SupabaseClient<Database>['from']>) => getSupabase().from(...args),
  auth: {
    getUser: () => getSupabase().auth.getUser(),
    signInWithPassword: (...args: Parameters<SupabaseClient<Database>['auth']['signInWithPassword']>) =>
      getSupabase().auth.signInWithPassword(...args),
    signUp: (...args: Parameters<SupabaseClient<Database>['auth']['signUp']>) =>
      getSupabase().auth.signUp(...args),
    signOut: () => getSupabase().auth.signOut(),
  },
}

export interface StudentRecord {
  id: string
  name: string
  barcode: string
  balance: number // Number of lunches remaining
  school_level: 'elementary' | 'high_school'
}

export interface LunchSettings {
  elementary_lunch_price: number
  highschool_lunch_price: number
  highschool_lunch_card_price: number
  highschool_lunch_card_lunches: number
  elementary_negative_limit: number
  highschool_negative_limit: number
}

export interface ConsumeLunchResult {
  success: boolean
  newBalance?: number
  error?: 'not_found' | 'insufficient_balance' | 'already_used' | 'database_error'
  message?: string
}

// Get app settings (cached for 5 minutes)
let settingsCache: { data: AppSettings | null; timestamp: number } = { data: null, timestamp: 0 }
const SETTINGS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getSettings(): Promise<LunchSettings | null> {
  const now = Date.now()

  if (settingsCache.data && (now - settingsCache.timestamp) < SETTINGS_CACHE_TTL) {
    return {
      elementary_lunch_price: settingsCache.data.elementary_lunch_price,
      highschool_lunch_price: settingsCache.data.highschool_lunch_price,
      highschool_lunch_card_price: settingsCache.data.highschool_lunch_card_price,
      highschool_lunch_card_lunches: settingsCache.data.highschool_lunch_card_lunches,
      elementary_negative_limit: settingsCache.data.elementary_negative_limit,
      highschool_negative_limit: settingsCache.data.highschool_negative_limit,
    }
  }

  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) {
    return null
  }

  // Cast to any to access new columns that may not be in the type yet
  const settings = data as unknown as AppSettings
  settingsCache = { data: settings, timestamp: now }

  return {
    elementary_lunch_price: settings.elementary_lunch_price ?? 4,
    highschool_lunch_price: settings.highschool_lunch_price ?? 6,
    highschool_lunch_card_price: settings.highschool_lunch_card_price ?? 50,
    highschool_lunch_card_lunches: settings.highschool_lunch_card_lunches ?? 10,
    elementary_negative_limit: settings.elementary_negative_limit ?? -5,
    highschool_negative_limit: settings.highschool_negative_limit ?? 0,
  }
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

// Use a lunch for a student (decrement balance by 1)
export async function consumeLunch(studentId: string, schoolLevel: 'elementary' | 'high_school', currentBalance: number): Promise<ConsumeLunchResult> {
  const settings = await getSettings()

  if (!settings) {
    return { success: false, error: 'database_error', message: 'Could not load settings' }
  }

  // Check negative balance limit
  const negativeLimit = schoolLevel === 'elementary'
    ? settings.elementary_negative_limit
    : settings.highschool_negative_limit

  const newBalance = currentBalance - 1

  if (newBalance < negativeLimit) {
    const limitMessage = negativeLimit === 0
      ? 'No negative balance allowed for high school students'
      : `Cannot go below ${negativeLimit} lunches for elementary students`
    return {
      success: false,
      error: 'insufficient_balance',
      message: limitMessage
    }
  }

  // Update the student's balance
  const { error: updateError } = await supabase
    .from('students')
    .update({ balance: newBalance } as never)
    .eq('id', studentId)

  if (updateError) {
    return { success: false, error: 'database_error', message: 'Failed to update balance' }
  }

  // Log the transaction
  await supabase
    .from('balance_transactions')
    .insert({
      student_id: studentId,
      lunches_change: -1,
      previous_lunches: currentBalance,
      new_lunches: newBalance,
      transaction_type: 'lunch_used',
      notes: 'Lunch check-in',
    } as never)

  return { success: true, newBalance }
}

// Add lunches from a payment
export async function addLunchesFromPayment(
  studentId: string,
  schoolLevel: 'elementary' | 'high_school',
  currentBalance: number,
  amountPaid: number,
  isLunchCard: boolean = false
): Promise<{ success: boolean; lunchesAdded: number; newBalance: number; error?: string }> {
  const settings = await getSettings()

  if (!settings) {
    return { success: false, lunchesAdded: 0, newBalance: currentBalance, error: 'Could not load settings' }
  }

  let lunchesAdded: number

  if (isLunchCard && schoolLevel === 'high_school') {
    // High school lunch card: fixed 10 lunches for $50
    lunchesAdded = settings.highschool_lunch_card_lunches
  } else {
    // Regular payment: calculate based on price per lunch
    const pricePerLunch = schoolLevel === 'elementary'
      ? settings.elementary_lunch_price
      : settings.highschool_lunch_price
    lunchesAdded = Math.floor(amountPaid / pricePerLunch)
  }

  if (lunchesAdded <= 0) {
    return { success: false, lunchesAdded: 0, newBalance: currentBalance, error: 'Payment amount too low' }
  }

  const newBalance = currentBalance + lunchesAdded

  // Update the student's balance
  const { error: updateError } = await supabase
    .from('students')
    .update({ balance: newBalance } as never)
    .eq('id', studentId)

  if (updateError) {
    return { success: false, lunchesAdded: 0, newBalance: currentBalance, error: 'Failed to update balance' }
  }

  // Log the transaction
  await supabase
    .from('balance_transactions')
    .insert({
      student_id: studentId,
      lunches_change: lunchesAdded,
      previous_lunches: currentBalance,
      new_lunches: newBalance,
      amount_paid: amountPaid,
      lunches_added: lunchesAdded,
      transaction_type: isLunchCard ? 'lunch_card' : 'payment',
      notes: isLunchCard ? 'Lunch card purchase' : `Payment of $${amountPaid.toFixed(2)}`,
    } as never)

  return { success: true, lunchesAdded, newBalance }
}
