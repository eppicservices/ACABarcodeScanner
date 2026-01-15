import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSchoolCalendarStatus } from '@/lib/school-calendar'

// GET - Check current school calendar status
export async function GET() {
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

    // Get school calendar status for today
    const status = await checkSchoolCalendarStatus(new Date())

    return NextResponse.json({ status })
  } catch (error) {
    console.error('Error checking school calendar status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
