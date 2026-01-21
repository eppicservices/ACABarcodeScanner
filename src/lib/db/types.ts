import type {
  Parent,
  Student,
  AdminUser,
  AppSettings,
  BalanceTransaction,
  NotificationLog,
  DailyMeal,
  ParentAccessToken,
  PendingPayment,
  EmailBlackoutPeriod,
  SchoolLevel,
  TransactionType,
  PendingPaymentStatus,
  StudentPaymentItem
} from '@/types/database'

// Re-export types for convenience
export type {
  Parent,
  Student,
  AdminUser,
  AppSettings,
  BalanceTransaction,
  NotificationLog,
  DailyMeal,
  ParentAccessToken,
  PendingPayment,
  EmailBlackoutPeriod,
  SchoolLevel,
  TransactionType,
  PendingPaymentStatus,
  StudentPaymentItem
}

export interface ParentWithStudents extends Parent {
  students: Student[]
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

export interface AddLunchesResult {
  success: boolean
  lunchesAdded: number
  newBalance: number
  error?: string
}

export interface TransactionInput {
  studentId: string
  lunchesChange: number
  previousLunches: number
  newLunches: number
  amountPaid?: number | null
  lunchesAdded?: number | null
  transactionType: TransactionType
  notes?: string | null
  createdBy?: string | null
}

export interface DatabaseAdapter {
  // Settings
  getSettings(): Promise<LunchSettings | null>
  getFullSettings(): Promise<AppSettings | null>
  updateSettings(data: Partial<AppSettings>, updatedBy?: string): Promise<AppSettings>
  invalidateSettingsCache(): void

  // Students
  getStudentByBarcode(barcode: string): Promise<Student | null>
  getStudentById(id: string): Promise<Student | null>
  getStudents(filters?: { isActive?: boolean; parentId?: string }): Promise<Student[]>
  createStudent(data: { name: string; barcode: string; parentId: string; schoolLevel: SchoolLevel; balance?: number }): Promise<Student>
  updateStudent(id: string, data: Partial<Student>): Promise<Student>
  updateStudentBalance(id: string, balance: number): Promise<void>
  updateStudentsStatus(ids: string[], isActive: boolean): Promise<void>

  // Parents
  getParentById(id: string): Promise<Parent | null>
  getParentByEmail(email: string): Promise<Parent | null>
  getParentWithStudents(id: string): Promise<ParentWithStudents | null>
  getParents(filters?: { isActive?: boolean }): Promise<Parent[]>
  getParentsWithStudents(filters?: { isActive?: boolean }): Promise<ParentWithStudents[]>
  createParent(data: { name: string; email: string; phone?: string; address?: string }): Promise<Parent>
  updateParent(id: string, data: Partial<Parent>): Promise<Parent>
  updateParentsStatus(ids: string[], isActive: boolean): Promise<void>

  // Transactions
  createTransaction(data: TransactionInput): Promise<BalanceTransaction>
  getTransactions(filters?: { studentId?: string; limit?: number; offset?: number }): Promise<BalanceTransaction[]>
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<BalanceTransaction[]>

  // Business Logic
  consumeLunch(studentId: string, schoolLevel: SchoolLevel, currentBalance: number): Promise<ConsumeLunchResult>
  addLunchesFromPayment(
    studentId: string,
    schoolLevel: SchoolLevel,
    currentBalance: number,
    amountPaid: number,
    isLunchCard?: boolean,
    createdBy?: string
  ): Promise<AddLunchesResult>

  // Parent Access Tokens
  getTokenByValue(token: string): Promise<ParentAccessToken | null>
  createToken(data: { parentId: string; token: string; expiresAt: Date; createdBy?: string }): Promise<ParentAccessToken>
  deleteTokensForParent(parentId: string): Promise<void>
  updateTokenLastUsed(id: string): Promise<void>

  // Notification Log
  createNotificationLog(data: { studentId: string; parentId: string; notificationType: string; balanceAtNotification: number }): Promise<NotificationLog>
  getLastNotificationForParent(parentId: string, notificationType: string): Promise<NotificationLog | null>

  // Daily Meals
  getMealByDate(date: Date): Promise<DailyMeal | null>
  getMealsByDateRange(startDate: Date, endDate: Date): Promise<DailyMeal[]>
  upsertMeal(data: { mealDate: Date; mealName: string; source?: 'calendar' | 'manual'; calendarEventId?: string; updatedBy?: string }): Promise<DailyMeal>

  // Blackout Periods
  getBlackoutPeriods(): Promise<EmailBlackoutPeriod[]>
  createBlackoutPeriod(data: { name: string; startDate: Date; endDate: Date; description?: string; createdBy?: string }): Promise<EmailBlackoutPeriod>
  updateBlackoutPeriod(id: string, data: Partial<EmailBlackoutPeriod>): Promise<EmailBlackoutPeriod>
  deleteBlackoutPeriod(id: string): Promise<void>

  // Pending Payments
  getPendingPayments(filters?: { parentId?: string; status?: PendingPaymentStatus }): Promise<PendingPayment[]>
  createPendingPayment(data: { parentId: string; studentPayments: StudentPaymentItem[]; totalAmount: number; notes?: string }): Promise<PendingPayment>
  updatePendingPayment(id: string, data: Partial<PendingPayment>): Promise<PendingPayment>

  // Admin Users (for NextAuth)
  getAdminByEmail(email: string): Promise<AdminUser | null>
  getAdminById(id: string): Promise<AdminUser | null>
  createAdmin(data: { email: string; password?: string; role?: 'admin' | 'super_admin'; invitedBy?: string }): Promise<AdminUser>
  getAdminCount(): Promise<number>
}
