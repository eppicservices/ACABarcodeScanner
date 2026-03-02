import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isTokenExpired } from '@/lib/parent-portal'
import { tokenValidateLimiter, getClientIp } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const ip = getClientIp(request)
    const { allowed, retryAfterMs } = tokenValidateLimiter.check(ip)
    if (!allowed) {
      return NextResponse.json(
        { valid: false, error: `Too many requests. Try again in ${Math.ceil(retryAfterMs / 60000)} minute(s).` },
        { status: 429 }
      )
    }

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

    // Get settings for pricing - only return safe public settings
    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
      select: {
        // Pricing - needed for payment calculations
        elementaryLunchPrice: true,
        highschoolLunchPrice: true,
        highschoolLunchCardPrice: true,
        highschoolLunchCardLunches: true,
        secondMealPrice: true,
        // School info - for display
        schoolName: true,
        schoolYear: true,
        schoolLogoUrl: true,
        // Branding - for theming
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        // Feature flags - for UI display
        parentPortalEnabled: true,
      },
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
