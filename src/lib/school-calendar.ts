import { createClient } from '@supabase/supabase-js'
import type { EmailBlackoutPeriod } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

export interface SchoolCalendarStatus {
  canSendEmail: boolean
  reason: string
  isWithinSemester: boolean
  isBlackoutPeriod: boolean
  currentBlackout?: EmailBlackoutPeriod
  nextSchoolDay?: string
}

interface SchoolCalendarSettings {
  school_calendar_enabled: boolean
  fall_semester_start: string | null
  fall_semester_end: string | null
  spring_semester_start: string | null
  spring_semester_end: string | null
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
  if (settings.fall_semester_start && settings.fall_semester_end) {
    const fallStart = new Date(settings.fall_semester_start)
    const fallEnd = new Date(settings.fall_semester_end)
    if (checkDate >= fallStart && checkDate <= fallEnd) {
      return true
    }
  }

  // Check spring semester
  if (settings.spring_semester_start && settings.spring_semester_end) {
    const springStart = new Date(settings.spring_semester_start)
    const springEnd = new Date(settings.spring_semester_end)
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
    const startDate = new Date(period.start_date)
    const endDate = new Date(period.end_date)
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
  const supabase = getServiceClient()

  // Fetch app settings
  const { data, error: settingsError } = await supabase
    .from('app_settings')
    .select('school_calendar_enabled, fall_semester_start, fall_semester_end, spring_semester_start, spring_semester_end')
    .eq('id', 1)
    .single()

  const settings = data as SchoolCalendarSettings | null

  if (settingsError || !settings) {
    // If we can't fetch settings, allow emails (fail open)
    return {
      canSendEmail: true,
      reason: 'Could not fetch school calendar settings',
      isWithinSemester: true,
      isBlackoutPeriod: false
    }
  }

  // If school calendar is not enabled, always allow emails
  if (!settings.school_calendar_enabled) {
    return {
      canSendEmail: true,
      reason: 'School calendar control is disabled',
      isWithinSemester: true,
      isBlackoutPeriod: false
    }
  }

  // Check if we have semester dates configured
  const hasSemesterDates = (settings.fall_semester_start && settings.fall_semester_end) ||
    (settings.spring_semester_start && settings.spring_semester_end)

  if (!hasSemesterDates) {
    return {
      canSendEmail: true,
      reason: 'No semester dates configured',
      isWithinSemester: true,
      isBlackoutPeriod: false
    }
  }

  // Fetch blackout periods
  const { data: blackoutData, error: blackoutError } = await supabase
    .from('email_blackout_periods')
    .select('*')
    .order('start_date', { ascending: true })

  if (blackoutError) {
    console.error('Error fetching blackout periods:', blackoutError)
  }

  const periods = (blackoutData || []) as EmailBlackoutPeriod[]

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
