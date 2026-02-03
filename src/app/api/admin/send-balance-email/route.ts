import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendBalanceEmail, type BalanceEmailData, type StudentBalance } from '@/lib/email'
import { generateSecureToken, getTokenExpiryDate, getPortalUrl } from '@/lib/parent-portal'
import { checkSchoolCalendarStatus, checkEmailScheduleStatus } from '@/lib/school-calendar'
import { requireAdmin } from '@/lib/auth/require-admin'

export async function POST(request: NextRequest) {
  try {
    // Verify admin is authenticated with proper role
    const adminResult = await requireAdmin()
    if (!adminResult.authorized) {
      return adminResult.response
    }

    const { parent_id, force } = await request.json()

    if (!parent_id) {
      return NextResponse.json({ error: 'parent_id is required' }, { status: 400 })
    }

    // Get parent info with students
    const parent = await prisma.parent.findUnique({
      where: { id: parent_id },
      include: {
        students: true,
      },
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Check if parent is active
    if (!parent.isActive) {
      return NextResponse.json({ error: 'Cannot send email to inactive parent' }, { status: 400 })
    }

    // Filter to only active students
    const activeStudents = parent.students.filter(s => s.isActive)

    if (activeStudents.length === 0) {
      return NextResponse.json({ error: 'Parent has no active students' }, { status: 400 })
    }

    // Get app settings
    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
    })

    if (!settings) {
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
    }

    // Check if email is configured
    if (settings.emailProvider === 'none') {
      return NextResponse.json({
        success: false,
        error: 'Email is not configured. Please configure email settings first.'
      }, { status: 400 })
    }

    // Check school calendar - should we send emails today?
    const calendarStatus = await checkSchoolCalendarStatus(new Date())
    if (!calendarStatus.canSendEmail && !force) {
      return NextResponse.json({
        success: false,
        error: `Emails paused: ${calendarStatus.reason}`,
        calendarStatus,
        hint: 'Use force: true to override'
      }, { status: 400 })
    }

    // Check email schedule - is this an allowed time?
    const scheduleStatus = await checkEmailScheduleStatus(new Date())
    if (!scheduleStatus.canSendNow && !force) {
      return NextResponse.json({
        success: false,
        error: `Outside email window: ${scheduleStatus.reason}`,
        scheduleStatus,
        hint: 'Use force: true to override'
      }, { status: 400 })
    }

    // Generate a portal token for this parent
    const token = generateSecureToken()
    const expiresAt = getTokenExpiryDate(settings.parentTokenExpiryDays ?? 7)

    // Delete any existing tokens for this parent
    await prisma.parentAccessToken.deleteMany({
      where: { parentId: parent_id },
    })

    // Insert new token
    await prisma.parentAccessToken.create({
      data: {
        parentId: parent_id,
        token,
        expiresAt: new Date(expiresAt),
      },
    })

    const portalUrl = getPortalUrl(token)

    // Build student balance data (only active students)
    const studentBalances: StudentBalance[] = activeStudents.map(student => ({
      name: student.name,
      balance: student.balance,
      schoolLevel: student.schoolLevel
    }))

    // Build email data
    const emailData: BalanceEmailData = {
      parentName: parent.name,
      parentEmail: parent.email,
      students: studentBalances,
      portalUrl
    }

    // Send email
    const result = await sendBalanceEmail(settings, emailData)

    if (!result.success) {
      console.error('Failed to send balance email:', result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Balance email sent to ${parent.email}`
    })
  } catch (error) {
    console.error('Error sending balance email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
