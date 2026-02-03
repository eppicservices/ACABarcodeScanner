import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendBalanceEmail, type BalanceEmailData, type StudentBalance } from '@/lib/email'
import { generateSecureToken, getTokenExpiryDate, getPortalUrl } from '@/lib/parent-portal'
import {
  checkSchoolCalendarStatus,
  checkEmailScheduleStatus,
  canSendToParent,
} from '@/lib/school-calendar'
import type { Student, SchoolLevel } from '@prisma/client'

interface ParentWithStudents {
  id: string
  name: string
  email: string
  isActive: boolean
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
 * Called by external cron service (Vercel Cron, Docker cron, etc.)
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

    // Fail closed if the secret is missing or empty to avoid unauthenticated triggering
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get app settings using Prisma
    const appSettings = await prisma.appSettings.findFirst()

    if (!appSettings) {
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
    }

    // Check if notifications are enabled
    if (!appSettings.notificationsEnabled) {
      return NextResponse.json({
        success: true,
        message: 'Notifications are disabled',
        sent: 0,
        skipped: 0
      })
    }

    // Check if email is configured
    if (appSettings.emailProvider === 'none') {
      return NextResponse.json({
        success: true,
        message: 'Email provider not configured',
        sent: 0,
        skipped: 0
      })
    }

    // Check if auto-send is enabled
    if (!appSettings.autoSendEnabled) {
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
    const elementaryThreshold = appSettings.elementaryLowLunchThreshold ?? 5
    const highschoolThreshold = appSettings.highschoolLowLunchThreshold ?? 3
    const minDaysBetweenEmails = appSettings.minDaysBetweenEmails ?? 3

    // Get all active parents with their students
    const parentsData = await prisma.parent.findMany({
      where: { isActive: true },
      include: { students: true }
    })

    const parents: ParentWithStudents[] = parentsData.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      isActive: p.isActive,
      students: p.students
    }))

    const results: SendResult[] = []
    let sentCount = 0
    let skippedCount = 0

    for (const parent of parents) {
      // Filter to active regular students only (skip unlimited types)
      const activeStudents = (parent.students || []).filter(s =>
        s.isActive && s.studentType === 'regular'
      )

      if (activeStudents.length === 0) {
        skippedCount++
        results.push({
          parentId: parent.id,
          parentEmail: parent.email,
          success: false,
          reason: 'No active regular students'
        })
        continue
      }

      // Check which students have low balances
      const lowBalanceStudents = activeStudents.filter(student => {
        const threshold = student.schoolLevel === 'elementary'
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
      const expiresAt = getTokenExpiryDate(appSettings.parentTokenExpiryDays ?? 7)

      try {
        // Delete any existing tokens for this parent and create new one
        await prisma.parentAccessToken.deleteMany({
          where: { parentId: parent.id }
        })

        await prisma.parentAccessToken.create({
          data: {
            parentId: parent.id,
            token,
            expiresAt,
            createdBy: null // Cron job, no user
          }
        })
      } catch (tokenError) {
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
        schoolLevel: student.schoolLevel as SchoolLevel
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
          // Log the notification for each student
          await prisma.notificationLog.createMany({
            data: lowBalanceStudents.map(student => ({
              studentId: student.id,
              parentId: parent.id,
              notificationType: 'low_balance',
              balanceAtNotification: student.balance
            }))
          })

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
