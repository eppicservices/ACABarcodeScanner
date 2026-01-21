/**
 * Prisma Database Adapter
 * Implements DatabaseAdapter interface using Prisma ORM
 * Used for Docker self-hosted deployments
 */

import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { AppSettings, SchoolLevel } from '@/types/database'
import type {
  DatabaseAdapter,
  LunchSettings,
  ConsumeLunchResult,
  AddLunchesResult,
  ParentWithStudents,
  TransactionInput,
  Student,
  Parent,
  BalanceTransaction,
  NotificationLog,
  DailyMeal,
  ParentAccessToken,
  PendingPayment,
  EmailBlackoutPeriod,
  AdminUser,
  PendingPaymentStatus,
  StudentPaymentItem
} from './types'

// Settings cache
let settingsCache: { data: AppSettings | null; timestamp: number } = { data: null, timestamp: 0 }
const DEFAULT_CACHE_MINUTES = 5

function getSettingsCacheTTL(): number {
  const minutes = settingsCache.data?.settings_cache_minutes ?? DEFAULT_CACHE_MINUTES
  return minutes * 60 * 1000
}

// Helper to convert Prisma model to app types
function mapPrismaStudent(s: Awaited<ReturnType<typeof prisma.student.findUnique>>): Student | null {
  if (!s) return null
  return {
    id: s.id,
    parent_id: s.parentId,
    name: s.name,
    barcode: s.barcode,
    balance: s.balance,
    school_level: s.schoolLevel as SchoolLevel,
    is_active: s.isActive,
    created_at: s.createdAt.toISOString()
  }
}

function mapPrismaParent(p: Awaited<ReturnType<typeof prisma.parent.findUnique>>): Parent | null {
  if (!p) return null
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    address: p.address,
    is_active: p.isActive,
    created_at: p.createdAt.toISOString()
  }
}

function mapPrismaSettings(s: Awaited<ReturnType<typeof prisma.appSettings.findUnique>>): AppSettings | null {
  if (!s) return null
  return {
    id: s.id,
    elementary_lunch_price: Number(s.elementaryLunchPrice),
    highschool_lunch_price: Number(s.highschoolLunchPrice),
    highschool_lunch_card_price: Number(s.highschoolLunchCardPrice),
    highschool_lunch_card_lunches: s.highschoolLunchCardLunches,
    second_meal_price: Number(s.secondMealPrice),
    elementary_negative_limit: s.elementaryNegativeLimit,
    highschool_negative_limit: s.highschoolNegativeLimit,
    elementary_low_lunch_threshold: s.elementaryLowLunchThreshold,
    highschool_low_lunch_threshold: s.highschoolLowLunchThreshold,
    notifications_enabled: s.notificationsEnabled,
    zero_balance_alerts: s.zeroBalanceAlerts,
    weekly_summary_enabled: s.weeklySummaryEnabled,
    notification_frequency: s.notificationFrequency as 'immediate' | 'daily',
    email_allowed_days: s.emailAllowedDays as AppSettings['email_allowed_days'],
    email_window_start: s.emailWindowStart,
    email_window_end: s.emailWindowEnd,
    email_timezone: s.emailTimezone,
    min_days_between_emails: s.minDaysBetweenEmails,
    auto_send_enabled: s.autoSendEnabled,
    auto_send_schedule: s.autoSendSchedule as AppSettings['auto_send_schedule'],
    auto_send_time: s.autoSendTime,
    scanner_sound_enabled: s.scannerSoundEnabled,
    scanner_auto_deduct: s.scannerAutoDeduct,
    show_student_photo: s.showStudentPhoto,
    school_name: s.schoolName,
    school_year: s.schoolYear,
    contact_email: s.contactEmail,
    email_provider: s.emailProvider as AppSettings['email_provider'],
    email_from_address: s.emailFromAddress,
    email_from_name: s.emailFromName,
    gmail_user: s.gmailUser,
    gmail_app_password: s.gmailAppPassword,
    sendgrid_api_key: s.sendgridApiKey,
    smtp_host: s.smtpHost,
    smtp_port: s.smtpPort,
    smtp_user: s.smtpUser,
    smtp_password: s.smtpPassword,
    smtp_secure: s.smtpSecure,
    updated_at: s.updatedAt.toISOString(),
    updated_by: s.updatedBy,
    calendar_url: s.calendarUrl,
    calendar_enabled: s.calendarEnabled,
    school_calendar_enabled: s.schoolCalendarEnabled,
    fall_semester_start: s.fallSemesterStart?.toISOString().split('T')[0] || null,
    fall_semester_end: s.fallSemesterEnd?.toISOString().split('T')[0] || null,
    spring_semester_start: s.springSemesterStart?.toISOString().split('T')[0] || null,
    spring_semester_end: s.springSemesterEnd?.toISOString().split('T')[0] || null,
    school_logo_url: s.schoolLogoUrl,
    primary_color: s.primaryColor,
    secondary_color: s.secondaryColor,
    accent_color: s.accentColor,
    scan_display_duration: s.scanDisplayDuration,
    scanner_buffer_timeout: s.scannerBufferTimeout,
    parent_token_expiry_days: s.parentTokenExpiryDays,
    parent_portal_enabled: s.parentPortalEnabled,
    manual_entry_enabled: s.manualEntryEnabled,
    password_min_length: s.passwordMinLength,
    settings_cache_minutes: s.settingsCacheMinutes
  }
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

    const data = await prisma.appSettings.findUnique({ where: { id: 1 } })
    if (!data) return null

    const settings = mapPrismaSettings(data)!
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

    const data = await prisma.appSettings.findUnique({ where: { id: 1 } })
    if (!data) return null

    const settings = mapPrismaSettings(data)!
    settingsCache = { data: settings, timestamp: now }
    return settings
  },

  async updateSettings(updateData: Partial<AppSettings>, updatedBy?: string): Promise<AppSettings> {
    const data = await prisma.appSettings.update({
      where: { id: 1 },
      data: {
        elementaryLunchPrice: updateData.elementary_lunch_price,
        highschoolLunchPrice: updateData.highschool_lunch_price,
        highschoolLunchCardPrice: updateData.highschool_lunch_card_price,
        highschoolLunchCardLunches: updateData.highschool_lunch_card_lunches,
        secondMealPrice: updateData.second_meal_price,
        elementaryNegativeLimit: updateData.elementary_negative_limit,
        highschoolNegativeLimit: updateData.highschool_negative_limit,
        elementaryLowLunchThreshold: updateData.elementary_low_lunch_threshold,
        highschoolLowLunchThreshold: updateData.highschool_low_lunch_threshold,
        notificationsEnabled: updateData.notifications_enabled,
        zeroBalanceAlerts: updateData.zero_balance_alerts,
        weeklySummaryEnabled: updateData.weekly_summary_enabled,
        notificationFrequency: updateData.notification_frequency,
        emailAllowedDays: updateData.email_allowed_days,
        emailWindowStart: updateData.email_window_start,
        emailWindowEnd: updateData.email_window_end,
        emailTimezone: updateData.email_timezone,
        minDaysBetweenEmails: updateData.min_days_between_emails,
        autoSendEnabled: updateData.auto_send_enabled,
        autoSendSchedule: updateData.auto_send_schedule,
        autoSendTime: updateData.auto_send_time,
        scannerSoundEnabled: updateData.scanner_sound_enabled,
        scannerAutoDeduct: updateData.scanner_auto_deduct,
        showStudentPhoto: updateData.show_student_photo,
        schoolName: updateData.school_name,
        schoolYear: updateData.school_year,
        contactEmail: updateData.contact_email,
        emailProvider: updateData.email_provider,
        emailFromAddress: updateData.email_from_address,
        emailFromName: updateData.email_from_name,
        gmailUser: updateData.gmail_user,
        gmailAppPassword: updateData.gmail_app_password,
        sendgridApiKey: updateData.sendgrid_api_key,
        smtpHost: updateData.smtp_host,
        smtpPort: updateData.smtp_port,
        smtpUser: updateData.smtp_user,
        smtpPassword: updateData.smtp_password,
        smtpSecure: updateData.smtp_secure,
        calendarUrl: updateData.calendar_url,
        calendarEnabled: updateData.calendar_enabled,
        schoolCalendarEnabled: updateData.school_calendar_enabled,
        fallSemesterStart: updateData.fall_semester_start ? new Date(updateData.fall_semester_start) : undefined,
        fallSemesterEnd: updateData.fall_semester_end ? new Date(updateData.fall_semester_end) : undefined,
        springSemesterStart: updateData.spring_semester_start ? new Date(updateData.spring_semester_start) : undefined,
        springSemesterEnd: updateData.spring_semester_end ? new Date(updateData.spring_semester_end) : undefined,
        schoolLogoUrl: updateData.school_logo_url,
        primaryColor: updateData.primary_color,
        secondaryColor: updateData.secondary_color,
        accentColor: updateData.accent_color,
        scanDisplayDuration: updateData.scan_display_duration,
        scannerBufferTimeout: updateData.scanner_buffer_timeout,
        parentTokenExpiryDays: updateData.parent_token_expiry_days,
        parentPortalEnabled: updateData.parent_portal_enabled,
        manualEntryEnabled: updateData.manual_entry_enabled,
        passwordMinLength: updateData.password_min_length,
        settingsCacheMinutes: updateData.settings_cache_minutes,
        updatedBy
      }
    })

    const settings = mapPrismaSettings(data)!
    settingsCache = { data: settings, timestamp: Date.now() }
    return settings
  },

  invalidateSettingsCache(): void {
    settingsCache = { data: null, timestamp: 0 }
  },

  // ================== Students ==================
  async getStudentByBarcode(barcode: string): Promise<Student | null> {
    const data = await prisma.student.findUnique({ where: { barcode } })
    return mapPrismaStudent(data)
  },

  async getStudentById(id: string): Promise<Student | null> {
    const data = await prisma.student.findUnique({ where: { id } })
    return mapPrismaStudent(data)
  },

  async getStudents(filters?: { isActive?: boolean; parentId?: string }): Promise<Student[]> {
    const data = await prisma.student.findMany({
      where: {
        isActive: filters?.isActive,
        parentId: filters?.parentId
      },
      orderBy: { name: 'asc' }
    })
    return data.map(s => mapPrismaStudent(s)!)
  },

  async createStudent(studentData): Promise<Student> {
    const data = await prisma.student.create({
      data: {
        name: studentData.name,
        barcode: studentData.barcode,
        parentId: studentData.parentId,
        schoolLevel: studentData.schoolLevel,
        balance: studentData.balance ?? 0
      }
    })
    return mapPrismaStudent(data)!
  },

  async updateStudent(id: string, updateData: Partial<Student>): Promise<Student> {
    const data = await prisma.student.update({
      where: { id },
      data: {
        name: updateData.name,
        barcode: updateData.barcode,
        parentId: updateData.parent_id,
        schoolLevel: updateData.school_level,
        balance: updateData.balance,
        isActive: updateData.is_active
      }
    })
    return mapPrismaStudent(data)!
  },

  async updateStudentBalance(id: string, balance: number): Promise<void> {
    await prisma.student.update({
      where: { id },
      data: { balance }
    })
  },

  async updateStudentsStatus(ids: string[], isActive: boolean): Promise<void> {
    await prisma.student.updateMany({
      where: { id: { in: ids } },
      data: { isActive }
    })
  },

  // ================== Parents ==================
  async getParentById(id: string): Promise<Parent | null> {
    const data = await prisma.parent.findUnique({ where: { id } })
    return mapPrismaParent(data)
  },

  async getParentByEmail(email: string): Promise<Parent | null> {
    const data = await prisma.parent.findUnique({ where: { email } })
    return mapPrismaParent(data)
  },

  async getParentWithStudents(id: string): Promise<ParentWithStudents | null> {
    const data = await prisma.parent.findUnique({
      where: { id },
      include: { students: true }
    })
    if (!data) return null

    const parent = mapPrismaParent(data)!
    return {
      ...parent,
      students: data.students.map(s => mapPrismaStudent(s)!)
    }
  },

  async getParents(filters?: { isActive?: boolean }): Promise<Parent[]> {
    const data = await prisma.parent.findMany({
      where: { isActive: filters?.isActive },
      orderBy: { name: 'asc' }
    })
    return data.map(p => mapPrismaParent(p)!)
  },

  async getParentsWithStudents(filters?: { isActive?: boolean }): Promise<ParentWithStudents[]> {
    const data = await prisma.parent.findMany({
      where: { isActive: filters?.isActive },
      include: { students: true },
      orderBy: { name: 'asc' }
    })

    return data.map(p => {
      const parent = mapPrismaParent(p)!
      return {
        ...parent,
        students: p.students.map(s => mapPrismaStudent(s)!)
      }
    })
  },

  async createParent(parentData): Promise<Parent> {
    const data = await prisma.parent.create({
      data: {
        name: parentData.name,
        email: parentData.email,
        phone: parentData.phone,
        address: parentData.address
      }
    })
    return mapPrismaParent(data)!
  },

  async updateParent(id: string, updateData: Partial<Parent>): Promise<Parent> {
    const data = await prisma.parent.update({
      where: { id },
      data: {
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        address: updateData.address,
        isActive: updateData.is_active
      }
    })
    return mapPrismaParent(data)!
  },

  async updateParentsStatus(ids: string[], isActive: boolean): Promise<void> {
    await prisma.parent.updateMany({
      where: { id: { in: ids } },
      data: { isActive }
    })
  },

  // ================== Transactions ==================
  async createTransaction(txData: TransactionInput): Promise<BalanceTransaction> {
    const data = await prisma.balanceTransaction.create({
      data: {
        studentId: txData.studentId,
        lunchesChange: txData.lunchesChange,
        previousLunches: txData.previousLunches,
        newLunches: txData.newLunches,
        amountPaid: txData.amountPaid,
        lunchesAdded: txData.lunchesAdded,
        transactionType: txData.transactionType,
        notes: txData.notes,
        createdBy: txData.createdBy
      }
    })

    return {
      id: data.id,
      student_id: data.studentId,
      lunches_change: data.lunchesChange,
      previous_lunches: data.previousLunches,
      new_lunches: data.newLunches,
      amount_paid: data.amountPaid ? Number(data.amountPaid) : null,
      lunches_added: data.lunchesAdded,
      transaction_type: data.transactionType as BalanceTransaction['transaction_type'],
      notes: data.notes,
      created_by: data.createdBy,
      created_at: data.createdAt.toISOString()
    }
  },

  async getTransactions(filters?: { studentId?: string; limit?: number; offset?: number }): Promise<BalanceTransaction[]> {
    const data = await prisma.balanceTransaction.findMany({
      where: { studentId: filters?.studentId },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit,
      skip: filters?.offset
    })

    return data.map(d => ({
      id: d.id,
      student_id: d.studentId,
      lunches_change: d.lunchesChange,
      previous_lunches: d.previousLunches,
      new_lunches: d.newLunches,
      amount_paid: d.amountPaid ? Number(d.amountPaid) : null,
      lunches_added: d.lunchesAdded,
      transaction_type: d.transactionType as BalanceTransaction['transaction_type'],
      notes: d.notes,
      created_by: d.createdBy,
      created_at: d.createdAt.toISOString()
    }))
  },

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<BalanceTransaction[]> {
    const data = await prisma.balanceTransaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return data.map(d => ({
      id: d.id,
      student_id: d.studentId,
      lunches_change: d.lunchesChange,
      previous_lunches: d.previousLunches,
      new_lunches: d.newLunches,
      amount_paid: d.amountPaid ? Number(d.amountPaid) : null,
      lunches_added: d.lunchesAdded,
      transaction_type: d.transactionType as BalanceTransaction['transaction_type'],
      notes: d.notes,
      created_by: d.createdBy,
      created_at: d.createdAt.toISOString()
    }))
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

    // Use transaction for atomic update
    await prisma.$transaction([
      prisma.student.update({
        where: { id: studentId },
        data: { balance: newBalance }
      }),
      prisma.balanceTransaction.create({
        data: {
          studentId,
          lunchesChange: -1,
          previousLunches: currentBalance,
          newLunches: newBalance,
          transactionType: 'lunch_used',
          notes: 'Lunch check-in'
        }
      })
    ])

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

    // Use transaction for atomic update
    await prisma.$transaction([
      prisma.student.update({
        where: { id: studentId },
        data: { balance: newBalance }
      }),
      prisma.balanceTransaction.create({
        data: {
          studentId,
          lunchesChange: lunchesAdded,
          previousLunches: currentBalance,
          newLunches: newBalance,
          amountPaid,
          lunchesAdded,
          transactionType: isLunchCard ? 'lunch_card' : 'payment',
          notes: isLunchCard ? 'Lunch card purchase' : `Payment of $${amountPaid.toFixed(2)}`,
          createdBy
        }
      })
    ])

    return { success: true, lunchesAdded, newBalance }
  },

  // ================== Parent Access Tokens ==================
  async getTokenByValue(token: string): Promise<ParentAccessToken | null> {
    const data = await prisma.parentAccessToken.findUnique({ where: { token } })
    if (!data) return null

    return {
      id: data.id,
      parent_id: data.parentId,
      token: data.token,
      expires_at: data.expiresAt.toISOString(),
      last_used_at: data.lastUsedAt?.toISOString() || null,
      created_at: data.createdAt.toISOString(),
      created_by: data.createdBy
    }
  },

  async createToken(tokenData): Promise<ParentAccessToken> {
    const data = await prisma.parentAccessToken.create({
      data: {
        parentId: tokenData.parentId,
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        createdBy: tokenData.createdBy
      }
    })

    return {
      id: data.id,
      parent_id: data.parentId,
      token: data.token,
      expires_at: data.expiresAt.toISOString(),
      last_used_at: data.lastUsedAt?.toISOString() || null,
      created_at: data.createdAt.toISOString(),
      created_by: data.createdBy
    }
  },

  async deleteTokensForParent(parentId: string): Promise<void> {
    await prisma.parentAccessToken.deleteMany({ where: { parentId } })
  },

  async updateTokenLastUsed(id: string): Promise<void> {
    await prisma.parentAccessToken.update({
      where: { id },
      data: { lastUsedAt: new Date() }
    })
  },

  // ================== Notification Log ==================
  async createNotificationLog(logData): Promise<NotificationLog> {
    const data = await prisma.notificationLog.create({
      data: {
        studentId: logData.studentId,
        parentId: logData.parentId,
        notificationType: logData.notificationType,
        balanceAtNotification: logData.balanceAtNotification
      }
    })

    return {
      id: data.id,
      student_id: data.studentId,
      parent_id: data.parentId,
      notification_type: data.notificationType,
      balance_at_notification: data.balanceAtNotification,
      sent_at: data.sentAt.toISOString()
    }
  },

  async getLastNotificationForParent(parentId: string, notificationType: string): Promise<NotificationLog | null> {
    const data = await prisma.notificationLog.findFirst({
      where: { parentId, notificationType },
      orderBy: { sentAt: 'desc' }
    })

    if (!data) return null

    return {
      id: data.id,
      student_id: data.studentId,
      parent_id: data.parentId,
      notification_type: data.notificationType,
      balance_at_notification: data.balanceAtNotification,
      sent_at: data.sentAt.toISOString()
    }
  },

  // ================== Daily Meals ==================
  async getMealByDate(date: Date): Promise<DailyMeal | null> {
    const data = await prisma.dailyMeal.findUnique({
      where: { mealDate: date }
    })

    if (!data) return null

    return {
      id: data.id,
      meal_date: data.mealDate.toISOString().split('T')[0],
      meal_name: data.mealName,
      source: data.source as 'calendar' | 'manual',
      calendar_event_id: data.calendarEventId,
      created_at: data.createdAt.toISOString(),
      updated_at: data.updatedAt.toISOString(),
      updated_by: data.updatedBy
    }
  },

  async getMealsByDateRange(startDate: Date, endDate: Date): Promise<DailyMeal[]> {
    const data = await prisma.dailyMeal.findMany({
      where: {
        mealDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { mealDate: 'asc' }
    })

    return data.map(d => ({
      id: d.id,
      meal_date: d.mealDate.toISOString().split('T')[0],
      meal_name: d.mealName,
      source: d.source as 'calendar' | 'manual',
      calendar_event_id: d.calendarEventId,
      created_at: d.createdAt.toISOString(),
      updated_at: d.updatedAt.toISOString(),
      updated_by: d.updatedBy
    }))
  },

  async upsertMeal(mealData): Promise<DailyMeal> {
    const data = await prisma.dailyMeal.upsert({
      where: { mealDate: mealData.mealDate },
      create: {
        mealDate: mealData.mealDate,
        mealName: mealData.mealName,
        source: mealData.source || 'manual',
        calendarEventId: mealData.calendarEventId,
        updatedBy: mealData.updatedBy
      },
      update: {
        mealName: mealData.mealName,
        source: mealData.source || 'manual',
        calendarEventId: mealData.calendarEventId,
        updatedBy: mealData.updatedBy
      }
    })

    return {
      id: data.id,
      meal_date: data.mealDate.toISOString().split('T')[0],
      meal_name: data.mealName,
      source: data.source as 'calendar' | 'manual',
      calendar_event_id: data.calendarEventId,
      created_at: data.createdAt.toISOString(),
      updated_at: data.updatedAt.toISOString(),
      updated_by: data.updatedBy
    }
  },

  // ================== Blackout Periods ==================
  async getBlackoutPeriods(): Promise<EmailBlackoutPeriod[]> {
    const data = await prisma.emailBlackoutPeriod.findMany({
      orderBy: { startDate: 'asc' }
    })

    return data.map(d => ({
      id: d.id,
      name: d.name,
      start_date: d.startDate.toISOString().split('T')[0],
      end_date: d.endDate.toISOString().split('T')[0],
      description: d.description,
      created_at: d.createdAt.toISOString(),
      created_by: d.createdBy
    }))
  },

  async createBlackoutPeriod(periodData): Promise<EmailBlackoutPeriod> {
    const data = await prisma.emailBlackoutPeriod.create({
      data: {
        name: periodData.name,
        startDate: periodData.startDate,
        endDate: periodData.endDate,
        description: periodData.description,
        createdBy: periodData.createdBy
      }
    })

    return {
      id: data.id,
      name: data.name,
      start_date: data.startDate.toISOString().split('T')[0],
      end_date: data.endDate.toISOString().split('T')[0],
      description: data.description,
      created_at: data.createdAt.toISOString(),
      created_by: data.createdBy
    }
  },

  async updateBlackoutPeriod(id: string, updateData): Promise<EmailBlackoutPeriod> {
    const data = await prisma.emailBlackoutPeriod.update({
      where: { id },
      data: {
        name: updateData.name,
        startDate: updateData.start_date ? new Date(updateData.start_date) : undefined,
        endDate: updateData.end_date ? new Date(updateData.end_date) : undefined,
        description: updateData.description
      }
    })

    return {
      id: data.id,
      name: data.name,
      start_date: data.startDate.toISOString().split('T')[0],
      end_date: data.endDate.toISOString().split('T')[0],
      description: data.description,
      created_at: data.createdAt.toISOString(),
      created_by: data.createdBy
    }
  },

  async deleteBlackoutPeriod(id: string): Promise<void> {
    await prisma.emailBlackoutPeriod.delete({ where: { id } })
  },

  // ================== Pending Payments ==================
  async getPendingPayments(filters): Promise<PendingPayment[]> {
    const data = await prisma.pendingPayment.findMany({
      where: {
        parentId: filters?.parentId,
        status: filters?.status
      },
      orderBy: { createdAt: 'desc' }
    })

    return data.map(d => ({
      id: d.id,
      parent_id: d.parentId,
      student_payments: d.studentPayments as unknown as StudentPaymentItem[],
      total_amount: Number(d.totalAmount),
      status: d.status as PendingPaymentStatus,
      created_at: d.createdAt.toISOString(),
      completed_at: d.completedAt?.toISOString() || null,
      completed_by: d.completedBy,
      notes: d.notes
    }))
  },

  async createPendingPayment(paymentData): Promise<PendingPayment> {
    const data = await prisma.pendingPayment.create({
      data: {
        parentId: paymentData.parentId,
        studentPayments: paymentData.studentPayments as unknown as Prisma.InputJsonValue,
        totalAmount: paymentData.totalAmount,
        notes: paymentData.notes
      }
    })

    return {
      id: data.id,
      parent_id: data.parentId,
      student_payments: data.studentPayments as unknown as StudentPaymentItem[],
      total_amount: Number(data.totalAmount),
      status: data.status as PendingPaymentStatus,
      created_at: data.createdAt.toISOString(),
      completed_at: data.completedAt?.toISOString() || null,
      completed_by: data.completedBy,
      notes: data.notes
    }
  },

  async updatePendingPayment(id: string, updateData): Promise<PendingPayment> {
    const data = await prisma.pendingPayment.update({
      where: { id },
      data: {
        status: updateData.status,
        completedAt: updateData.completed_at ? new Date(updateData.completed_at) : undefined,
        completedBy: updateData.completed_by,
        notes: updateData.notes
      }
    })

    return {
      id: data.id,
      parent_id: data.parentId,
      student_payments: data.studentPayments as unknown as StudentPaymentItem[],
      total_amount: Number(data.totalAmount),
      status: data.status as PendingPaymentStatus,
      created_at: data.createdAt.toISOString(),
      completed_at: data.completedAt?.toISOString() || null,
      completed_by: data.completedBy,
      notes: data.notes
    }
  },

  // ================== Admin Users ==================
  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    const data = await prisma.adminUser.findUnique({ where: { email } })
    if (!data) return null

    return {
      id: data.id,
      email: data.email,
      role: data.role as AdminUser['role'],
      invited_by: data.invitedBy,
      created_at: data.createdAt.toISOString()
    }
  },

  async getAdminById(id: string): Promise<AdminUser | null> {
    const data = await prisma.adminUser.findUnique({ where: { id } })
    if (!data) return null

    return {
      id: data.id,
      email: data.email,
      role: data.role as AdminUser['role'],
      invited_by: data.invitedBy,
      created_at: data.createdAt.toISOString()
    }
  },

  async createAdmin(adminData): Promise<AdminUser> {
    const data = await prisma.adminUser.create({
      data: {
        email: adminData.email,
        password: adminData.password,
        role: adminData.role || 'admin',
        invitedBy: adminData.invitedBy
      }
    })

    return {
      id: data.id,
      email: data.email,
      role: data.role as AdminUser['role'],
      invited_by: data.invitedBy,
      created_at: data.createdAt.toISOString()
    }
  },

  async getAdminCount(): Promise<number> {
    return await prisma.adminUser.count()
  }
}

export default adapter
