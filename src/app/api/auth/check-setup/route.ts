import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const adminCount = await prisma.adminUser.count()
    const settings = await prisma.appSettings.findFirst()

    return NextResponse.json({
      hasAdmins: adminCount > 0,
      passwordMinLength: settings?.passwordMinLength ?? 6
    })
  } catch (error) {
    console.error('Check setup error:', error)
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    )
  }
}
