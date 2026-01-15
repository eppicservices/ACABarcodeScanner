import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBalanceEmail, type BalanceEmailData, type StudentBalance } from '@/lib/email'
import { generateSecureToken, getTokenExpiryDate, getPortalUrl } from '@/lib/parent-portal'
import {
  checkSchoolCalendarStatus,
  checkEmailScheduleStatus,
  canSendToParent,
  type EmailScheduleSettings
} from '@/lib/school-calendar'
import type { AppSettings, Student } from '@/types/database'

interface ParentWithStudents {
  id: string
  name: string
  email: string
  is_active: boolean
  students: Student[]
}

interface SendResult {
  parentId: string
  parentEmail: string
  success: boolean
  reason: string
  studentsIncluded?: number
}

/**
 * Cron endpoint for automatically sending low balance emails
 * Called by external cron service (Vercel Cron, etc.)
 *
 * Security: Requires CRON_SECRET in Authorization header
 *
 * Usage:
 * POST /api/cron/send-low-balance-emails
 * Authorization: Bearer YOUR_CRON_SECRET
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role key for cron jobs (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get app settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
    }

    const appSettings = settings as AppSettings

    // Check if notifications are enabled
    if (!appSettings.notifications_enabled) {
      return NextResponse.json({
        success: true,
        message: 'Notifications are disabled',
        sent: 0,
        skipped: 0
      })
    }

    // Check if email is configured
    if (appSettings.email_provider === 'none') {
      return NextResponse.json({
        success: true,
        message: 'Email provider not configured',
        sent: 0,
        skipped: 0
      })
    }

    // Check if auto-send is enabled
    if (!appSettings.auto_send_enabled) {
      return NextResponse.json({
        success: true,
        message: 'Auto-send is disabled',
        sent: 0,
        skipped: 0
      })
    }

    // Check school calendar status
    const calendarStatus = await checkSchoolCalendarStatus(new Date())
    if (!calendarStatus.canSendEmail) {
      return NextResponse.json({
        success: true,
        message: `Skipped: ${calendarStatus.reason}`,
        calendarStatus,
        sent: 0,
        skipped: 0
      })
    }

    // Check email schedule status
    const scheduleStatus = await checkEmailScheduleStatus(new Date())
    if (!scheduleStatus.canSendNow) {
      return NextResponse.json({
        success: true,
        message: `Skipped: ${scheduleStatus.reason}`,
        scheduleStatus,
        sent: 0,
        skipped: 0
      })
    }

    // Get thresholds
    const elementaryThreshold = appSettings.elementary_low_lunch_threshold ?? 5
    const highschoolThreshold = appSettings.highschool_low_lunch_threshold ?? 3
    const minDaysBetweenEmails = appSettings.min_days_between_emails ?? 3

    // Get all active parents with their active students who have low balances
    const { data: parentsData, error: parentsError } = await supabase
      .from('parents')
      .select(`
        id,
        name,
        email,
        is_active,
        students (*)
      `)
      .eq('is_active', true)

    if (parentsError) {
      console.error('Error fetching parents:', parentsError)
      return NextResponse.json({ error: 'Failed to fetch parents' }, { status: 500 })
    }

    const parents = (parentsData || []) as ParentWithStudents[]
    const results: SendResult[] = []
    let sentCount = 0
    let skippedCount = 0

    for (const parent of parents) {
      // Filter to active students only
      const activeStudents = (parent.students || []).filter(s => s.is_active)

      if (activeStudents.length === 0) {
        skippedCount++
        results.push({
          parentId: parent.id,
          parentEmail: parent.email,
          success: false,
          reason: 'No active students'
        })
        continue
      }

      // Check which students have low balances
      const lowBalanceStudents = activeStudents.filter(student => {
        const threshold = student.school_level === 'elementary'
          ? elementaryThreshold
          : highschoolThreshold
        return student.balance <= threshold
      })

      if (lowBalanceStudents.length === 0) {
        skippedCount++
        results.push({
          parentId: parent.id,
          parentEmail: parent.email,
          success: false,
          reason: 'No students with low balance'
        })
        continue
      }

      // Check if we can send to this parent (frequency limit)
      const frequencyCheck = await canSendToParent(parent.id, minDaysBetweenEmails)
      if (!frequencyCheck.canSend) {
        skippedCount++
        results.push({
          parentId: parent.id,
          parentEmail: parent.email,
          success: false,
          reason: frequencyCheck.reason
        })
        continue
      }

      // Generate portal token for this parent
      const token = generateSecureToken()
      const expiresAt = getTokenExpiryDate(appSettings.parent_token_expiry_days ?? 7)

      // Delete any existing tokens for this parent
      await supabase
        .from('parent_access_tokens')
        .delete()
        .eq('parent_id', parent.id)

      // Insert new token
      const { error: tokenError } = await supabase
        .from('parent_access_tokens')
        .insert({
          parent_id: parent.id,
          token,
          expires_at: expiresAt,
          created_by: null // Cron job, no user
        })

      if (tokenError) {
        console.error(`Failed to generate token for parent ${parent.id}:`, tokenError)
        skippedCount++
        results.push({
          parentId: parent.id,
          parentEmail: parent.email,
          success: false,
          reason: 'Failed to generate portal token'
        })
        continue
      }

      const portalUrl = getPortalUrl(token)

      // Build student balance data
      const studentBalances: StudentBalance[] = lowBalanceStudents.map(student => ({
        name: student.name,
        balance: student.balance,
        schoolLevel: student.school_level
      }))

      // Build email data
      const emailData: BalanceEmailData = {
        parentName: parent.name,
        parentEmail: parent.email,
        students: studentBalances,
        portalUrl
      }

      // Send email
      try {
        const result = await sendBalanceEmail(appSettings, emailData)

        if (result.success) {
          // Log the notification
          for (const student of lowBalanceStudents) {
            await supabase
              .from('notification_log')
              .insert({
                student_id: student.id,
                parent_id: parent.id,
                notification_type: 'low_balance',
                balance_at_notification: student.balance
              })
          }

          sentCount++
          results.push({
            parentId: parent.id,
            parentEmail: parent.email,
            success: true,
            reason: 'Email sent successfully',
            studentsIncluded: lowBalanceStudents.length
          })
        } else {
          skippedCount++
          results.push({
            parentId: parent.id,
            parentEmail: parent.email,
            success: false,
            reason: result.error || 'Unknown error'
          })
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${parent.email}:`, emailError)
        skippedCount++
        results.push({
          parentId: parent.id,
          parentEmail: parent.email,
          success: false,
          reason: 'Email send exception'
        })
      }
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} emails, skipped ${skippedCount}`,
      sent: sentCount,
      skipped: skippedCount,
      totalParents: parents.length,
      duration: `${duration}ms`,
      executedAt: new Date().toISOString(),
      results: results.slice(0, 50) // Limit results in response
    })
  } catch (error) {
    console.error('Cron: Error sending low balance emails:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also support GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request)
}
