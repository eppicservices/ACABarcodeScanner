/**
 * Supabase Database Adapter
 * Wraps existing Supabase functionality for the adapter pattern
 */

import { createClient } from '@supabase/supabase-js'
import type { Database, AppSettings, Student, Parent, BalanceTransaction, SchoolLevel, TransactionType } from '@/types/database'
import type {
  DatabaseAdapter,
  LunchSettings,
  ConsumeLunchResult,
  AddLunchesResult,
  ParentWithStudents,
  TransactionInput
} from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Settings cache
let settingsCache: { data: AppSettings | null; timestamp: number } = { data: null, timestamp: 0 }
const DEFAULT_CACHE_MINUTES = 5

function getSettingsCacheTTL(): number {
  const minutes = settingsCache.data?.settings_cache_minutes ?? DEFAULT_CACHE_MINUTES
  return minutes * 60 * 1000
}

export const adapter: DatabaseAdapter = {
  // ================== Settings ==================
  async getSettings(): Promise<LunchSettings | null> {
    const now = Date.now()

    if (settingsCache.data && (now - settingsCache.timestamp) < getSettingsCacheTTL()) {
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

    if (error || !data) return null

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
  },

  async getFullSettings(): Promise<AppSettings | null> {
    const now = Date.now()

    if (settingsCache.data && (now - settingsCache.timestamp) < getSettingsCacheTTL()) {
      return settingsCache.data
    }

    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error || !data) return null

    const settings = data as unknown as AppSettings
    settingsCache = { data: settings, timestamp: now }
    return settings
  },

  async updateSettings(updateData: Partial<AppSettings>, updatedBy?: string): Promise<AppSettings> {
    const { data, error } = await supabase
      .from('app_settings')
      .update({ ...updateData, updated_by: updatedBy } as never)
      .eq('id', 1)
      .select()
      .single()

    if (error) throw new Error(error.message)
    settingsCache = { data: data as unknown as AppSettings, timestamp: Date.now() }
    return data as unknown as AppSettings
  },

  invalidateSettingsCache(): void {
    settingsCache = { data: null, timestamp: 0 }
  },

  // ================== Students ==================
  async getStudentByBarcode(barcode: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('barcode', barcode)
      .single()

    if (error || !data) return null
    return data as Student
  },

  async getStudentById(id: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as Student
  },

  async getStudents(filters?: { isActive?: boolean; parentId?: string }): Promise<Student[]> {
    let query = supabase.from('students').select('*')

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }
    if (filters?.parentId) {
      query = query.eq('parent_id', filters.parentId)
    }

    const { data, error } = await query.order('name')
    if (error) throw new Error(error.message)
    return (data || []) as Student[]
  },

  async createStudent(studentData): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .insert({
        name: studentData.name,
        barcode: studentData.barcode,
        parent_id: studentData.parentId,
        school_level: studentData.schoolLevel,
        balance: studentData.balance ?? 0
      } as never)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Student
  },

  async updateStudent(id: string, updateData: Partial<Student>): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Student
  },

  async updateStudentBalance(id: string, balance: number): Promise<void> {
    const { error } = await supabase
      .from('students')
      .update({ balance } as never)
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async updateStudentsStatus(ids: string[], isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('students')
      .update({ is_active: isActive } as never)
      .in('id', ids)

    if (error) throw new Error(error.message)
  },

  // ================== Parents ==================
  async getParentById(id: string): Promise<Parent | null> {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as Parent
  },

  async getParentByEmail(email: string): Promise<Parent | null> {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) return null
    return data as Parent
  },

  async getParentWithStudents(id: string): Promise<ParentWithStudents | null> {
    const { data, error } = await supabase
      .from('parents')
      .select('*, students(*)')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as unknown as ParentWithStudents
  },

  async getParents(filters?: { isActive?: boolean }): Promise<Parent[]> {
    let query = supabase.from('parents').select('*')

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    const { data, error } = await query.order('name')
    if (error) throw new Error(error.message)
    return (data || []) as Parent[]
  },

  async getParentsWithStudents(filters?: { isActive?: boolean }): Promise<ParentWithStudents[]> {
    let query = supabase.from('parents').select('*, students(*)')

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    const { data, error } = await query.order('name')
    if (error) throw new Error(error.message)
    return (data || []) as unknown as ParentWithStudents[]
  },

  async createParent(parentData): Promise<Parent> {
    const { data, error } = await supabase
      .from('parents')
      .insert({
        name: parentData.name,
        email: parentData.email,
        phone: parentData.phone,
        address: parentData.address
      } as never)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Parent
  },

  async updateParent(id: string, updateData: Partial<Parent>): Promise<Parent> {
    const { data, error } = await supabase
      .from('parents')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Parent
  },

  async updateParentsStatus(ids: string[], isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('parents')
      .update({ is_active: isActive } as never)
      .in('id', ids)

    if (error) throw new Error(error.message)
  },

  // ================== Transactions ==================
  async createTransaction(txData: TransactionInput): Promise<BalanceTransaction> {
    const { data, error } = await supabase
      .from('balance_transactions')
      .insert({
        student_id: txData.studentId,
        lunches_change: txData.lunchesChange,
        previous_lunches: txData.previousLunches,
        new_lunches: txData.newLunches,
        amount_paid: txData.amountPaid,
        lunches_added: txData.lunchesAdded,
        transaction_type: txData.transactionType,
        notes: txData.notes,
        created_by: txData.createdBy
      } as never)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as BalanceTransaction
  },

  async getTransactions(filters?: { studentId?: string; limit?: number; offset?: number }): Promise<BalanceTransaction[]> {
    let query = supabase.from('balance_transactions').select('*')

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId)
    }

    query = query.order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data || []) as unknown as BalanceTransaction[]
  },

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<BalanceTransaction[]> {
    const { data, error } = await supabase
      .from('balance_transactions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data || []) as unknown as BalanceTransaction[]
  },

  // ================== Business Logic ==================
  async consumeLunch(studentId: string, schoolLevel: SchoolLevel, currentBalance: number): Promise<ConsumeLunchResult> {
    const settings = await this.getSettings()

    if (!settings) {
      return { success: false, error: 'database_error', message: 'Could not load settings' }
    }

    const negativeLimit = schoolLevel === 'elementary'
      ? settings.elementary_negative_limit
      : settings.highschool_negative_limit

    const newBalance = currentBalance - 1

    if (newBalance < negativeLimit) {
      const limitMessage = negativeLimit === 0
        ? 'No negative balance allowed for high school students'
        : `Cannot go below ${negativeLimit} lunches for elementary students`
      return { success: false, error: 'insufficient_balance', message: limitMessage }
    }

    await this.updateStudentBalance(studentId, newBalance)
    await this.createTransaction({
      studentId,
      lunchesChange: -1,
      previousLunches: currentBalance,
      newLunches: newBalance,
      transactionType: 'lunch_used',
      notes: 'Lunch check-in'
    })

    return { success: true, newBalance }
  },

  async addLunchesFromPayment(
    studentId: string,
    schoolLevel: SchoolLevel,
    currentBalance: number,
    amountPaid: number,
    isLunchCard = false,
    createdBy?: string
  ): Promise<AddLunchesResult> {
    const settings = await this.getSettings()

    if (!settings) {
      return { success: false, lunchesAdded: 0, newBalance: currentBalance, error: 'Could not load settings' }
    }

    let lunchesAdded: number

    if (isLunchCard && schoolLevel === 'high_school') {
      lunchesAdded = settings.highschool_lunch_card_lunches
    } else {
      const pricePerLunch = schoolLevel === 'elementary'
        ? settings.elementary_lunch_price
        : settings.highschool_lunch_price
      lunchesAdded = Math.floor(amountPaid / pricePerLunch)
    }

    if (lunchesAdded <= 0) {
      return { success: false, lunchesAdded: 0, newBalance: currentBalance, error: 'Payment amount too low' }
    }

    const newBalance = currentBalance + lunchesAdded

    await this.updateStudentBalance(studentId, newBalance)
    await this.createTransaction({
      studentId,
      lunchesChange: lunchesAdded,
      previousLunches: currentBalance,
      newLunches: newBalance,
      amountPaid,
      lunchesAdded,
      transactionType: isLunchCard ? 'lunch_card' : 'payment',
      notes: isLunchCard ? 'Lunch card purchase' : `Payment of $${amountPaid.toFixed(2)}`,
      createdBy
    })

    return { success: true, lunchesAdded, newBalance }
  },

  // ================== Parent Access Tokens ==================
  async getTokenByValue(token: string) {
    const { data, error } = await supabase
      .from('parent_access_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) return null
    return data as unknown as import('./types').ParentAccessToken
  },

  async createToken(tokenData) {
    const { data, error } = await supabase
      .from('parent_access_tokens')
      .insert({
        parent_id: tokenData.parentId,
        token: tokenData.token,
        expires_at: tokenData.expiresAt.toISOString(),
        created_by: tokenData.createdBy
      } as never)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as import('./types').ParentAccessToken
  },

  async deleteTokensForParent(parentId: string) {
    await supabase
      .from('parent_access_tokens')
      .delete()
      .eq('parent_id', parentId)
  },

  async updateTokenLastUsed(id: string) {
    await supabase
      .from('parent_access_tokens')
      .update({ last_used_at: new Date().toISOString() } as never)
      .eq('id', id)
  },

  // ================== Notification Log ==================
  async createNotificationLog(logData) {
    const { data, error } = await supabase
      .from('notification_log')
      .insert({
        student_id: logData.studentId,
        parent_id: logData.parentId,
        notification_type: logData.notificationType,
        balance_at_notification: logData.balanceAtNotification
      } as never)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as import('./types').NotificationLog
  },

  async getLastNotificationForParent(parentId: string, notificationType: string) {
    const { data, error } = await supabase
      .from('notification_log')
      .select('*')
      .eq('parent_id', parentId)
      .eq('notification_type', notificationType)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null
    return data as unknown as import('./types').NotificationLog
  },

  // ================== Daily Meals ==================
  async getMealByDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('daily_meals')
      .select('*')
      .eq('meal_date', dateStr)
      .single()

    if (error || !data) return null
    return data as unknown as import('./types').DailyMeal
  },

  async getMealsByDateRange(startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('daily_meals')
      .select('*')
      .gte('meal_date', startDate.toISOString().split('T')[0])
      .lte('meal_date', endDate.toISOString().split('T')[0])
      .order('meal_date')

    if (error) throw new Error(error.message)
    return (data || []) as unknown as import('./types').DailyMeal[]
  },

  async upsertMeal(mealData) {
    const dateStr = mealData.mealDate.toISOString().split('T')[0]

    // Check if meal exists
    const existing = await this.getMealByDate(mealData.mealDate)

    if (existing) {
      const { data, error } = await supabase
        .from('daily_meals')
        .update({
          meal_name: mealData.mealName,
          source: mealData.source || 'manual',
          calendar_event_id: mealData.calendarEventId,
          updated_by: mealData.updatedBy
        } as never)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as unknown as import('./types').DailyMeal
    } else {
      const { data, error } = await supabase
        .from('daily_meals')
        .insert({
          meal_date: dateStr,
          meal_name: mealData.mealName,
          source: mealData.source || 'manual',
          calendar_event_id: mealData.calendarEventId,
          updated_by: mealData.updatedBy
        } as never)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as unknown as import('./types').DailyMeal
    }
  },

  // ================== Blackout Periods ==================
  async getBlackoutPeriods() {
    const { data, error } = await supabase
      .from('email_blackout_periods')
      .select('*')
      .order('start_date')

    if (error) throw new Error(error.message)
    return (data || []) as unknown as import('./types').EmailBlackoutPeriod[]
  },

  async createBlackoutPeriod(periodData) {
    const { data, error } = await supabase
      .from('email_blackout_periods')
      .insert({
        name: periodData.name,
        start_date: periodData.startDate.toISOString().split('T')[0],
        end_date: periodData.endDate.toISOString().split('T')[0],
        description: periodData.description,
        created_by: periodData.createdBy
      } as never)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as import('./types').EmailBlackoutPeriod
  },

  async updateBlackoutPeriod(id: string, updateData) {
    const { data, error } = await supabase
      .from('email_blackout_periods')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as import('./types').EmailBlackoutPeriod
  },

  async deleteBlackoutPeriod(id: string) {
    const { error } = await supabase
      .from('email_blackout_periods')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  // ================== Pending Payments ==================
  async getPendingPayments(filters) {
    let query = supabase.from('pending_payments').select('*')

    if (filters?.parentId) {
      query = query.eq('parent_id', filters.parentId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []) as unknown as import('./types').PendingPayment[]
  },

  async createPendingPayment(paymentData) {
    const { data, error } = await supabase
      .from('pending_payments')
      .insert({
        parent_id: paymentData.parentId,
        student_payments: paymentData.studentPayments,
        total_amount: paymentData.totalAmount,
        notes: paymentData.notes
      } as never)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as import('./types').PendingPayment
  },

  async updatePendingPayment(id: string, updateData) {
    const { data, error } = await supabase
      .from('pending_payments')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as import('./types').PendingPayment
  },

  // ================== Admin Users ==================
  async getAdminByEmail(email: string) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) return null
    return data as unknown as import('./types').AdminUser
  },

  async getAdminById(id: string) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as unknown as import('./types').AdminUser
  },

  async createAdmin(adminData) {
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        email: adminData.email,
        role: adminData.role || 'admin',
        invited_by: adminData.invitedBy
      } as never)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as import('./types').AdminUser
  },

  async getAdminCount() {
    const { count, error } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })

    if (error) throw new Error(error.message)
    return count || 0
  }
}

export default adapter
