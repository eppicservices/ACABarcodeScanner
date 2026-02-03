import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendTestEmail } from '@/lib/email'
import { requireAdmin } from '@/lib/auth/require-admin'

export async function POST(request: NextRequest) {
  try {
    // Verify admin is authenticated with proper role
    const adminResult = await requireAdmin()
    if (!adminResult.authorized) {
      return adminResult.response
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get app settings with email configuration
    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
    })

    if (!settings) {
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
    }

    if (settings.emailProvider === 'none') {
      return NextResponse.json({ error: 'Email provider not configured' }, { status: 400 })
    }

    const result = await sendTestEmail(settings, email)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send test email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
