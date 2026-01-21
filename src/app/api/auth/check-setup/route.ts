import { NextResponse } from 'next/server'
import { getAuthAdapter } from '@/lib/auth'
import { getAdapter } from '@/lib/db'

export async function GET() {
  try {
    const auth = await getAuthAdapter()
    const db = await getAdapter()

    const adminCount = await auth.getAdminCount()
    const settings = await db.getFullSettings()

    return NextResponse.json({
      hasAdmins: adminCount > 0,
      passwordMinLength: settings?.password_min_length ?? 6
    })
  } catch (error) {
    console.error('Check setup error:', error)
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    )
  }
}
