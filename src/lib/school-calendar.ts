import prisma from '@/lib/prisma'
import type { EmailBlackoutPeriod, DayOfWeek, AutoSendSchedule } from '@prisma/client'

export interface SchoolCalendarStatus {
  canSendEmail: boolean
  reason: string
  isWithinSemester: boolean
  isBlackoutPeriod: boolean
  currentBlackout?: EmailBlackoutPeriod
  nextSchoolDay?: string
}

export interface EmailScheduleStatus {
  canSendNow: boolean
  reason: string
  isAllowedDay: boolean
  isWithinTimeWindow: boolean
  currentTimeInTimezone: string
  nextAllowedTime?: string
}

export interface EmailScheduleSettings {
  emailAllowedDays: DayOfWeek[]
  emailWindowStart: string
  emailWindowEnd: string
  emailTimezone: string
  minDaysBetweenEmails: number
  autoSendEnabled: boolean
  autoSendSchedule: AutoSendSchedule
  autoSendTime: string
}

interface SchoolCalendarSettings {
  schoolCalendarEnabled: boolean
  fallSemesterStart: Date | null
  fallSemesterEnd: Date | null
  springSemesterStart: Date | null
  springSemesterEnd: Date | null
}

/**
 * Check if a date falls within either semester
 */
function isDateInSemester(
  date: Date,
  settings: SchoolCalendarSettings
): boolean {
  const checkDate = new Date(date.toISOString().split('T')[0])

  // Check fall semester
  if (settings.fallSemesterStart && settings.fallSemesterEnd) {
    const fallStart = new Date(settings.fallSemesterStart)
    const fallEnd = new Date(settings.fallSemesterEnd)
    if (checkDate >= fallStart && checkDate <= fallEnd) {
      return true
    }
  }

  // Check spring semester
  if (settings.springSemesterStart && settings.springSemesterEnd) {
    const springStart = new Date(settings.springSemesterStart)
    const springEnd = new Date(settings.springSemesterEnd)
    if (checkDate >= springStart && checkDate <= springEnd) {
      return true
    }
  }

  return false
}

/**
 * Check if a date falls within any blackout period
 */
function isDateInBlackout(
  date: Date,
  blackoutPeriods: EmailBlackoutPeriod[]
): EmailBlackoutPeriod | null {
  const checkDate = new Date(date.toISOString().split('T')[0])

  for (const period of blackoutPeriods) {
    const startDate = new Date(period.startDate)
    const endDate = new Date(period.endDate)
    if (checkDate >= startDate && checkDate <= endDate) {
      return period
    }
  }

  return null
}

/**
 * Find the next school day (within semester and not in blackout)
 */
function findNextSchoolDay(
  fromDate: Date,
  settings: SchoolCalendarSettings,
  blackoutPeriods: EmailBlackoutPeriod[],
  maxDaysToSearch: number = 90
): string | undefined {
  const currentDate = new Date(fromDate)

  for (let i = 0; i < maxDaysToSearch; i++) {
    currentDate.setDate(currentDate.getDate() + 1)

    // Skip weekends
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue
    }

    // Check if in semester and not in blackout
    if (isDateInSemester(currentDate, settings) && !isDateInBlackout(currentDate, blackoutPeriods)) {
      return currentDate.toISOString().split('T')[0]
    }
  }

  return undefined
}

/**
 * Main function to check if emails should be sent on a given date
 * Returns detailed status about the school calendar state
 */
export async function checkSchoolCalendarStatus(
  date: Date = new Date()
): Promise<SchoolCalendarStatus> {
  // Fetch app settings using Prisma
  const settings = await prisma.appSettings.findUnique({
    where: { id: 1 },
    select: {
      schoolCalendarEnabled: true,
      fallSemesterStart: true,
      fallSemesterEnd: true,
      springSemesterStart: true,
      springSemesterEnd: true,
    },
  })

  if (!settings) {
    // If we can't fetch settings, allow emails (fail open)
    return {
      canSendEmail: true,
      reason: 'Could not fetch school calendar settings',
      isWithinSemester: true,
      isBlackoutPeriod: false
    }
  }

  // If school calendar is not enabled, always allow emails
  if (!settings.schoolCalendarEnabled) {
    return {
      canSendEmail: true,
      reason: 'School calendar control is disabled',
      isWithinSemester: true,
      isBlackoutPeriod: false
    }
  }

  // Check if we have semester dates configured
  const hasSemesterDates = (settings.fallSemesterStart && settings.fallSemesterEnd) ||
    (settings.springSemesterStart && settings.springSemesterEnd)

  if (!hasSemesterDates) {
    return {
      canSendEmail: true,
      reason: 'No semester dates configured',
      isWithinSemester: true,
      isBlackoutPeriod: false
    }
  }

  // Fetch blackout periods using Prisma
  const periods = await prisma.emailBlackoutPeriod.findMany({
    orderBy: { startDate: 'asc' },
  })

  // Check if date is within a semester
  const isWithinSemester = isDateInSemester(date, settings)

  // Check if date is in a blackout period
  const currentBlackout = isDateInBlackout(date, periods)
  const isBlackoutPeriod = currentBlackout !== null

  // Determine if we can send emails
  const canSendEmail = isWithinSemester && !isBlackoutPeriod

  // Build reason message
  let reason: string
  if (!isWithinSemester) {
    reason = 'Date is outside of semester dates'
  } else if (isBlackoutPeriod && currentBlackout) {
    reason = `Currently in blackout period: ${currentBlackout.name}`
  } else {
    reason = 'School is in session'
  }

  // Find next school day if we can't send today
  let nextSchoolDay: string | undefined
  if (!canSendEmail) {
    nextSchoolDay = findNextSchoolDay(date, settings, periods)
  }

  return {
    canSendEmail,
    reason,
    isWithinSemester,
    isBlackoutPeriod,
    currentBlackout: currentBlackout || undefined,
    nextSchoolDay
  }
}

/**
 * Simple boolean check for email eligibility
 * Use this for quick checks in email sending endpoints
 */
export async function canSendEmailToday(): Promise<boolean> {
  const status = await checkSchoolCalendarStatus(new Date())
  return status.canSendEmail
}

/**
 * Convert a day number (0-6) to DayOfWeek
 */
function dayNumberToName(dayNum: number): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[dayNum]
}

/**
 * Get the current time in a specific timezone
 */
function getTimeInTimezone(date: Date, timezone: string): { hours: number; minutes: number; dayOfWeek: DayOfWeek; formatted: string } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'long'
    })
    const parts = formatter.formatToParts(date)
    const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
    const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
    const weekday = (parts.find(p => p.type === 'weekday')?.value || 'monday').toLowerCase() as DayOfWeek
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    return { hours, minutes, dayOfWeek: weekday, formatted }
  } catch {
    // Fallback to server time if timezone is invalid
    return {
      hours: date.getHours(),
      minutes: date.getMinutes(),
      dayOfWeek: dayNumberToName(date.getDay()),
      formatted: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  }
}

/**
 * Parse a time string (HH:MM) into hours and minutes
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return { hours: hours || 0, minutes: minutes || 0 }
}

/**
 * Check if current time is within the allowed window
 */
function isWithinTimeWindow(
  currentHours: number,
  currentMinutes: number,
  windowStart: string,
  windowEnd: string
): boolean {
  const start = parseTime(windowStart)
  const end = parseTime(windowEnd)

  const currentTotalMinutes = currentHours * 60 + currentMinutes
  const startTotalMinutes = start.hours * 60 + start.minutes
  const endTotalMinutes = end.hours * 60 + end.minutes

  return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes
}

/**
 * Check if emails can be sent based on schedule settings
 */
export async function checkEmailScheduleStatus(
  date: Date = new Date()
): Promise<EmailScheduleStatus> {
  // Fetch schedule settings using Prisma
  const data = await prisma.appSettings.findUnique({
    where: { id: 1 },
    select: {
      emailAllowedDays: true,
      emailWindowStart: true,
      emailWindowEnd: true,
      emailTimezone: true,
      minDaysBetweenEmails: true,
      autoSendEnabled: true,
      autoSendSchedule: true,
      autoSendTime: true,
    },
  })

  if (!data) {
    // If we can't fetch settings, use defaults (allow)
    return {
      canSendNow: true,
      reason: 'Could not fetch email schedule settings, using defaults',
      isAllowedDay: true,
      isWithinTimeWindow: true,
      currentTimeInTimezone: date.toLocaleTimeString()
    }
  }

  const settings: EmailScheduleSettings = {
    emailAllowedDays: data.emailAllowedDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    emailWindowStart: data.emailWindowStart || '08:00',
    emailWindowEnd: data.emailWindowEnd || '18:00',
    emailTimezone: data.emailTimezone || 'America/New_York',
    minDaysBetweenEmails: data.minDaysBetweenEmails ?? 3,
    autoSendEnabled: data.autoSendEnabled ?? false,
    autoSendSchedule: data.autoSendSchedule || 'weekdays',
    autoSendTime: data.autoSendTime || '09:00'
  }

  // Get current time in the configured timezone
  const currentTime = getTimeInTimezone(date, settings.emailTimezone)

  // Check if today is an allowed day
  const isAllowedDay = settings.emailAllowedDays.includes(currentTime.dayOfWeek)

  // Check if current time is within window
  const isInWindow = isWithinTimeWindow(
    currentTime.hours,
    currentTime.minutes,
    settings.emailWindowStart,
    settings.emailWindowEnd
  )

  const canSendNow = isAllowedDay && isInWindow

  // Build reason message
  let reason: string
  if (!isAllowedDay) {
    reason = `Emails not allowed on ${currentTime.dayOfWeek.charAt(0).toUpperCase() + currentTime.dayOfWeek.slice(1)}`
  } else if (!isInWindow) {
    reason = `Outside email window (${settings.emailWindowStart} - ${settings.emailWindowEnd})`
  } else {
    reason = 'Within scheduled email window'
  }

  return {
    canSendNow,
    reason,
    isAllowedDay,
    isWithinTimeWindow: isInWindow,
    currentTimeInTimezone: currentTime.formatted
  }
}

/**
 * Check if it's time to run the auto-send based on schedule
 */
export function shouldAutoSendNow(
  settings: EmailScheduleSettings,
  currentTime: { hours: number; minutes: number; dayOfWeek: DayOfWeek }
): boolean {
  if (!settings.autoSendEnabled) return false

  const sendTime = parseTime(settings.autoSendTime)

  // Check if current time matches send time (within 5 minute window)
  const currentMinutes = currentTime.hours * 60 + currentTime.minutes
  const sendMinutes = sendTime.hours * 60 + sendTime.minutes
  const isAtSendTime = Math.abs(currentMinutes - sendMinutes) <= 5

  if (!isAtSendTime) return false

  // Check schedule type
  switch (settings.autoSendSchedule) {
    case 'daily':
      return true
    case 'weekdays':
      return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(currentTime.dayOfWeek)
    case 'weekly':
      return currentTime.dayOfWeek === 'monday'
    default:
      return false
  }
}

/**
 * Check if we can send email to a specific parent based on frequency limits
 */
export async function canSendToParent(
  parentId: string,
  minDaysBetweenEmails: number
): Promise<{ canSend: boolean; reason: string; lastSentAt?: string }> {
  // Get the most recent notification for this parent using Prisma
  const lastNotification = await prisma.notificationLog.findFirst({
    where: {
      parentId,
      notificationType: 'low_balance',
    },
    orderBy: { sentAt: 'desc' },
    select: { sentAt: true },
  })

  if (!lastNotification) {
    // No previous notification, can send
    return { canSend: true, reason: 'No previous emails sent to this parent' }
  }

  const lastSentDate = new Date(lastNotification.sentAt)
  const now = new Date()
  const daysSinceLastEmail = Math.floor((now.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceLastEmail < minDaysBetweenEmails) {
    return {
      canSend: false,
      reason: `Last email sent ${daysSinceLastEmail} day(s) ago. Minimum interval is ${minDaysBetweenEmails} days.`,
      lastSentAt: lastNotification.sentAt.toISOString()
    }
  }

  return {
    canSend: true,
    reason: `Last email was ${daysSinceLastEmail} days ago`,
    lastSentAt: lastNotification.sentAt.toISOString()
  }
}

/**
 * Combined check: calendar + schedule status
 */
export async function canSendEmailNow(date: Date = new Date()): Promise<{
  canSend: boolean
  calendarStatus: SchoolCalendarStatus
  scheduleStatus: EmailScheduleStatus
}> {
  const [calendarStatus, scheduleStatus] = await Promise.all([
    checkSchoolCalendarStatus(date),
    checkEmailScheduleStatus(date)
  ])

  return {
    canSend: calendarStatus.canSendEmail && scheduleStatus.canSendNow,
    calendarStatus,
    scheduleStatus
  }
}
