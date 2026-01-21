import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdapter } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
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
