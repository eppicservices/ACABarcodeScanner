import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateSecureToken, getTokenExpiryDate, getPortalUrl } from '@/lib/parent-portal'
import { sendPortalLinkEmail } from '@/lib/email'
import { portalLinkLimiter } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limiting by email
    const { allowed, retryAfterMs } = portalLinkLimiter.check(normalizedEmail)
    if (!allowed) {
      const waitMinutes = Math.ceil(retryAfterMs / 60000)
      return NextResponse.json({
        error: `Please wait ${waitMinutes} minute(s) before requesting another link`
      }, { status: 429 })
    }

    // Find parent by email
    const parent = await prisma.parent.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, isActive: true },
    })

    // Always return success to prevent email enumeration
    // Even if parent not found or inactive, show the same message
    if (!parent) {
      console.log(`Parent not found for email: ${normalizedEmail}`)
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a link has been sent.'
      })
    }

    // If parent is inactive, don't generate token but return same message
    if (!parent.isActive) {
      console.log(`Inactive parent requested link: ${normalizedEmail}`)
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a link has been sent.'
      })
    }

    // Get app settings for token expiry and email
    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
    })

    const tokenExpiryDays = settings?.parentTokenExpiryDays ?? 7

    // Generate new token
    const token = generateSecureToken()
    const expiresAt = getTokenExpiryDate(tokenExpiryDays)

    // Delete any existing tokens for this parent
    await prisma.parentAccessToken.deleteMany({
      where: { parentId: parent.id },
    })

    // Insert new token
    await prisma.parentAccessToken.create({
      data: {
        parentId: parent.id,
        token,
        expiresAt: new Date(expiresAt),
      },
    })

    const portalUrl = getPortalUrl(token)

    // Send email with portal link
    if (settings) {
      const emailResult = await sendPortalLinkEmail(settings, {
        parentName: parent.name,
        parentEmail: parent.email,
        portalUrl,
        expiresAt: new Date(expiresAt)
      })

      if (!emailResult.success) {
        console.error('Failed to send portal link email:', emailResult.error)
        // Still return success - token was created, email just failed
      }
    }

    // Log for debugging
    console.log(`Portal link generated for ${parent.name} (${parent.email})`)

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a link has been sent.'
    })
  } catch (error) {
    console.error('Error requesting link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
