import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdapter } from '@/lib/auth'
import { signupLimiter, getClientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { allowed, retryAfterMs } = signupLimiter.check(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many signup attempts. Try again in ${Math.ceil(retryAfterMs / 60000)} minute(s).` },
        { status: 429 }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const auth = await getAuthAdapter()

    // Check if there are existing admins
    const adminCount = await auth.getAdminCount()

    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Admin already exists. Please contact an existing admin for an invitation.' },
        { status: 403 }
      )
    }

    // Create the first admin as super_admin
    const result = await auth.createUser(email, password, 'super_admin')

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create account' },
        { status: 400 }
      )
    }

    logAudit({
      action: 'admin.first_signup',
      actor: email,
      targetId: result.user?.id,
      ipAddress: ip,
    })

    return NextResponse.json({
      success: true,
      user: result.user
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
