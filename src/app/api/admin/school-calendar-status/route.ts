import { NextResponse } from 'next/server'
import { checkSchoolCalendarStatus } from '@/lib/school-calendar'
import { requireAdmin } from '@/lib/auth/require-admin'

// GET - Check current school calendar status
export async function GET() {
  try {
    // Verify admin is authenticated with proper role
    const adminResult = await requireAdmin()
    if (!adminResult.authorized) {
      return adminResult.response
    }

    // Get school calendar status for today
    const status = await checkSchoolCalendarStatus(new Date())

    return NextResponse.json({ status })
  } catch (error) {
    console.error('Error checking school calendar status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
