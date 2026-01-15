import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendBalanceEmail, type BalanceEmailData, type StudentBalance } from '@/lib/email'
import { generateSecureToken, getTokenExpiryDate, getPortalUrl } from '@/lib/parent-portal'
import { checkSchoolCalendarStatus, checkEmailScheduleStatus } from '@/lib/school-calendar'
import type { AppSettings, Student } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { parent_id, force } = await request.json()

    if (!parent_id) {
      return NextResponse.json({ error: 'parent_id is required' }, { status: 400 })
    }

    // Get parent info with students
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id, name, email, is_active, students(*)')
      .eq('id', parent_id)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Check if parent is active
    if (!parent.is_active) {
      return NextResponse.json({ error: 'Cannot send email to inactive parent' }, { status: 400 })
    }

    // Filter to only active students
    const activeStudents = (parent.students || []).filter((s: Student) => s.is_active)

    if (activeStudents.length === 0) {
      return NextResponse.json({ error: 'Parent has no active students' }, { status: 400 })
    }

    // Get app settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
    }

    // Check if email is configured
    if (settings.email_provider === 'none') {
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
    const expiresAt = getTokenExpiryDate(settings.parent_token_expiry_days ?? 7)

    // Delete any existing tokens for this parent
    await supabase
      .from('parent_access_tokens')
      .delete()
      .eq('parent_id', parent_id)

    // Insert new token
    const { error: tokenError } = await supabase
      .from('parent_access_tokens')
      .insert({
        parent_id,
        token,
        expires_at: expiresAt,
        created_by: user.id
      })

    if (tokenError) {
      console.error('Failed to generate portal token:', tokenError)
      return NextResponse.json({ error: 'Failed to generate portal link' }, { status: 500 })
    }

    const portalUrl = getPortalUrl(token)

    // Build student balance data (only active students)
    const studentBalances: StudentBalance[] = activeStudents.map((student: Student) => ({
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
    const result = await sendBalanceEmail(settings as AppSettings, emailData)

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
