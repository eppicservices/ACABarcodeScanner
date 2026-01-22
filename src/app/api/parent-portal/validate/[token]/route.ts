import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isTokenExpired } from '@/lib/parent-portal'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Look up the token
    const tokenData = await prisma.parentAccessToken.findUnique({
      where: { token },
    })

    if (!tokenData) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired link'
      }, { status: 404 })
    }

    // Check if expired
    if (isTokenExpired(tokenData.expiresAt.toISOString())) {
      return NextResponse.json({
        valid: false,
        error: 'This link has expired. Please request a new one.'
      }, { status: 410 })
    }

    // Get parent with students
    const parent = await prisma.parent.findUnique({
      where: { id: tokenData.parentId },
      include: {
        students: true,
      },
    })

    if (!parent) {
      return NextResponse.json({
        valid: false,
        error: 'Parent account not found'
      }, { status: 404 })
    }

    // Check if parent is active
    if (!parent.isActive) {
      return NextResponse.json({
        valid: false,
        error: 'This account has been deactivated. Please contact the school office.'
      }, { status: 403 })
    }

    // Filter to only include active students
    const activeStudents = parent.students.filter(s => s.isActive)

    // Get settings for pricing
    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
    })

    // Update last_used_at
    await prisma.parentAccessToken.update({
      where: { id: tokenData.id },
      data: { lastUsedAt: new Date() },
    })

    return NextResponse.json({
      valid: true,
      parent: {
        ...parent,
        students: activeStudents,
      },
      expiresAt: tokenData.expiresAt.toISOString(),
      settings
    })
  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json({
      valid: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
