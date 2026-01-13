import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTestEmail } from '@/lib/email'
import type { AppSettings } from '@/types/database'

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

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get app settings with email configuration
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
    }

    if (settings.email_provider === 'none') {
      return NextResponse.json({ error: 'Email provider not configured' }, { status: 400 })
    }

    const result = await sendTestEmail(settings as AppSettings, email)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send test email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
