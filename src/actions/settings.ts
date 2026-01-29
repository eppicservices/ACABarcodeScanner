'use server'

import prisma from '@/lib/prisma'
import type { AppSettings, EmailProvider, DayOfWeek, AutoSendSchedule } from '@prisma/client'

// Settings cache for server-side caching
let settingsCache: { data: AppSettings | null; timestamp: number } = { data: null, timestamp: 0 }
const DEFAULT_CACHE_MINUTES = 5

function getSettingsCacheTTL(): number {
  const minutes = settingsCache.data?.settingsCacheMinutes ?? DEFAULT_CACHE_MINUTES
  return minutes * 60 * 1000
}

// Helper to serialize Prisma objects for client components (converts Decimal to number, Date to string)
function serializeForClient<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  // Check for Decimal by looking for toNumber method (more reliable than instanceof)
  if (typeof obj === 'object' && obj !== null && 'toNumber' in obj && typeof (obj as { toNumber: unknown }).toNumber === 'function') {
    return (obj as { toNumber: () => number }).toNumber() as T
  }
  if (obj instanceof Date) return obj.toISOString() as T
  if (Array.isArray(obj)) return obj.map(serializeForClient) as T
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeForClient(value)
    }
    return result as T
  }
  return obj
}

// Serialized settings type (Decimal -> number, Date -> string)
export type SerializedAppSettings = Omit<AppSettings,
  'elementaryLunchPrice' | 'highschoolLunchPrice' | 'highschoolLunchCardPrice' | 'secondMealPrice' |
  'fallSemesterStart' | 'fallSemesterEnd' | 'springSemesterStart' | 'springSemesterEnd' | 'updatedAt'
> & {
  elementaryLunchPrice: number
  highschoolLunchPrice: number
  highschoolLunchCardPrice: number
  secondMealPrice: number
  fallSemesterStart: string | null
  fallSemesterEnd: string | null
  springSemesterStart: string | null
  springSemesterEnd: string | null
  updatedAt: string
}

// Get full app settings (raw Prisma type - use for server-only code)
export async function getSettings(): Promise<AppSettings | null> {
  const now = Date.now()

  if (settingsCache.data && now - settingsCache.timestamp < getSettingsCacheTTL()) {
    return settingsCache.data
  }

  const settings = await prisma.appSettings.findUnique({
    where: { id: 1 },
  })

  if (settings) {
    settingsCache = { data: settings, timestamp: now }
  }

  return settings
}

// Get settings serialized for client components (converts Decimal to number)
export async function getSettingsForClient(): Promise<SerializedAppSettings | null> {
  const settings = await getSettings()
  if (!settings) return null
  return serializeForClient(settings) as unknown as SerializedAppSettings
}

// Get lunch-related settings only (for scanner)
export async function getLunchSettings() {
  const settings = await getSettings()
  if (!settings) return null

  return {
    elementaryLunchPrice: Number(settings.elementaryLunchPrice),
    highschoolLunchPrice: Number(settings.highschoolLunchPrice),
    highschoolLunchCardPrice: Number(settings.highschoolLunchCardPrice),
    highschoolLunchCardLunches: settings.highschoolLunchCardLunches,
    elementaryNegativeLimit: settings.elementaryNegativeLimit,
    highschoolNegativeLimit: settings.highschoolNegativeLimit,
    secondMealPrice: Number(settings.secondMealPrice),
  }
}

// Get scanner settings
export async function getScannerSettings() {
  const settings = await getSettings()
  if (!settings) return null

  return {
    scannerSoundEnabled: settings.scannerSoundEnabled,
    scannerAutoDeduct: settings.scannerAutoDeduct,
    showStudentPhoto: settings.showStudentPhoto,
    scanDisplayDuration: settings.scanDisplayDuration,
    scannerBufferTimeout: settings.scannerBufferTimeout,
  }
}

// Get email settings
export async function getEmailSettings() {
  const settings = await getSettings()
  if (!settings) return null

  return {
    emailProvider: settings.emailProvider,
    emailFromAddress: settings.emailFromAddress,
    emailFromName: settings.emailFromName,
    gmailUser: settings.gmailUser,
    // Note: Don't return passwords in plain text
    gmailAppPasswordSet: !!settings.gmailAppPassword,
    sendgridApiKeySet: !!settings.sendgridApiKey,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPasswordSet: !!settings.smtpPassword,
    smtpSecure: settings.smtpSecure,
  }
}

// Get notification settings
export async function getNotificationSettings() {
  const settings = await getSettings()
  if (!settings) return null

  return {
    notificationsEnabled: settings.notificationsEnabled,
    zeroBalanceAlerts: settings.zeroBalanceAlerts,
    weeklySummaryEnabled: settings.weeklySummaryEnabled,
    notificationFrequency: settings.notificationFrequency,
    emailAllowedDays: settings.emailAllowedDays,
    emailWindowStart: settings.emailWindowStart,
    emailWindowEnd: settings.emailWindowEnd,
    emailTimezone: settings.emailTimezone,
    minDaysBetweenEmails: settings.minDaysBetweenEmails,
    autoSendEnabled: settings.autoSendEnabled,
    autoSendSchedule: settings.autoSendSchedule,
    autoSendTime: settings.autoSendTime,
    elementaryLowLunchThreshold: settings.elementaryLowLunchThreshold,
    highschoolLowLunchThreshold: settings.highschoolLowLunchThreshold,
  }
}

// Get school info settings
export async function getSchoolSettings() {
  const settings = await getSettings()
  if (!settings) return null

  return {
    schoolName: settings.schoolName,
    schoolYear: settings.schoolYear,
    contactEmail: settings.contactEmail,
    schoolLogoUrl: settings.schoolLogoUrl,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    accentColor: settings.accentColor,
  }
}

// Get calendar settings
export async function getCalendarSettings() {
  const settings = await getSettings()
  if (!settings) return null

  return {
    calendarUrl: settings.calendarUrl,
    calendarEnabled: settings.calendarEnabled,
    schoolCalendarEnabled: settings.schoolCalendarEnabled,
    fallSemesterStart: settings.fallSemesterStart,
    fallSemesterEnd: settings.fallSemesterEnd,
    springSemesterStart: settings.springSemesterStart,
    springSemesterEnd: settings.springSemesterEnd,
  }
}

// Update settings
export async function updateSettings(
  data: Partial<{
    // Lunch pricing
    elementaryLunchPrice: number
    highschoolLunchPrice: number
    highschoolLunchCardPrice: number
    highschoolLunchCardLunches: number
    secondMealPrice: number
    // Negative limits
    elementaryNegativeLimit: number
    highschoolNegativeLimit: number
    // Low balance thresholds
    elementaryLowLunchThreshold: number
    highschoolLowLunchThreshold: number
    // Notifications
    notificationsEnabled: boolean
    zeroBalanceAlerts: boolean
    weeklySummaryEnabled: boolean
    notificationFrequency: string
    // Email scheduling
    emailAllowedDays: DayOfWeek[]
    emailWindowStart: string
    emailWindowEnd: string
    emailTimezone: string
    minDaysBetweenEmails: number
    autoSendEnabled: boolean
    autoSendSchedule: AutoSendSchedule
    autoSendTime: string
    // Scanner
    scannerSoundEnabled: boolean
    scannerAutoDeduct: boolean
    showStudentPhoto: boolean
    scanDisplayDuration: number
    scannerBufferTimeout: number
    // School info
    schoolName: string
    schoolYear: string
    contactEmail: string | null
    // Email provider
    emailProvider: EmailProvider
    emailFromAddress: string | null
    emailFromName: string | null
    gmailUser: string | null
    gmailAppPassword: string | null
    sendgridApiKey: string | null
    smtpHost: string | null
    smtpPort: number | null
    smtpUser: string | null
    smtpPassword: string | null
    smtpSecure: boolean
    // Calendar
    calendarUrl: string | null
    calendarEnabled: boolean
    schoolCalendarEnabled: boolean
    fallSemesterStart: Date | null
    fallSemesterEnd: Date | null
    springSemesterStart: Date | null
    springSemesterEnd: Date | null
    // Branding
    schoolLogoUrl: string | null
    primaryColor: string
    secondaryColor: string
    accentColor: string
    // Feature flags
    parentPortalEnabled: boolean
    manualEntryEnabled: boolean
    // Parent portal
    parentTokenExpiryDays: number
    // Security
    passwordMinLength: number
    settingsCacheMinutes: number
  }>,
  updatedBy?: string
): Promise<AppSettings> {
  const settings = await prisma.appSettings.update({
    where: { id: 1 },
    data: {
      ...data,
      updatedBy,
    },
  })

  // Invalidate cache
  settingsCache = { data: settings, timestamp: Date.now() }

  return settings
}

// Invalidate settings cache (call after external updates)
export async function invalidateSettingsCache(): Promise<void> {
  settingsCache = { data: null, timestamp: 0 }
}

// Initialize settings if they don't exist (for first run)
export async function initializeSettings(): Promise<AppSettings> {
  const existing = await prisma.appSettings.findUnique({
    where: { id: 1 },
  })

  if (existing) {
    return existing
  }

  return prisma.appSettings.create({
    data: {
      id: 1,
    },
  })
}

// Get public settings (safe to expose to unauthenticated clients like the scanner page)
// This replaces the Supabase public_settings view
export async function getPublicSettings() {
  const settings = await getSettings()
  if (!settings) return null

  return {
    // School info
    schoolName: settings.schoolName,
    schoolYear: settings.schoolYear,
    schoolLogoUrl: settings.schoolLogoUrl,
    // Branding
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    accentColor: settings.accentColor,
    // Scanner settings
    scannerSoundEnabled: settings.scannerSoundEnabled,
    showStudentPhoto: settings.showStudentPhoto,
    scanDisplayDuration: settings.scanDisplayDuration,
    scannerBufferTimeout: settings.scannerBufferTimeout,
    // Feature flags
    parentPortalEnabled: settings.parentPortalEnabled,
    manualEntryEnabled: settings.manualEntryEnabled,
  }
}

// Type for public settings (exported for client components)
export type PublicSettings = NonNullable<Awaited<ReturnType<typeof getPublicSettings>>>

// Update calendar settings specifically
export async function updateCalendarSettings(data: {
  schoolCalendarEnabled: boolean
  fallSemesterStart: string | null
  fallSemesterEnd: string | null
  springSemesterStart: string | null
  springSemesterEnd: string | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.appSettings.update({
      where: { id: 1 },
      data: {
        schoolCalendarEnabled: data.schoolCalendarEnabled,
        fallSemesterStart: data.fallSemesterStart ? new Date(data.fallSemesterStart) : null,
        fallSemesterEnd: data.fallSemesterEnd ? new Date(data.fallSemesterEnd) : null,
        springSemesterStart: data.springSemesterStart ? new Date(data.springSemesterStart) : null,
        springSemesterEnd: data.springSemesterEnd ? new Date(data.springSemesterEnd) : null,
      },
    })

    // Invalidate cache
    settingsCache = { data: null, timestamp: 0 }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings'
    return { success: false, error: message }
  }
}
