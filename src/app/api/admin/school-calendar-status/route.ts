import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/nextauth-config'
import prisma from '@/lib/prisma'
import { checkSchoolCalendarStatus } from '@/lib/school-calendar'

// GET - Check current school calendar status
export async function GET() {
  try {
    // Verify admin is authenticated using NextAuth
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an admin
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    })

    if (!adminUser) {
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
