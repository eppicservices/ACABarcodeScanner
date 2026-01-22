import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/nextauth-config'
import prisma from '@/lib/prisma'
import { generateSecureToken, getTokenExpiryDate, getPortalUrl } from '@/lib/parent-portal'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated admin using NextAuth
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

    const { parent_id } = await request.json()

    if (!parent_id) {
      return NextResponse.json({ error: 'parent_id is required' }, { status: 400 })
    }

    // Verify parent exists
    const parent = await prisma.parent.findUnique({
      where: { id: parent_id },
      select: { id: true, name: true, email: true },
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Get app settings for token expiry
    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
      select: { parentTokenExpiryDays: true },
    })

    // Generate new token
    const token = generateSecureToken()
    const expiresAt = getTokenExpiryDate(settings?.parentTokenExpiryDays ?? 7)

    // Delete any existing tokens for this parent
    await prisma.parentAccessToken.deleteMany({
      where: { parentId: parent_id },
    })

    // Insert new token
    await prisma.parentAccessToken.create({
      data: {
        parentId: parent_id,
        token,
        expiresAt: new Date(expiresAt),
      },
    })

    const portalUrl = getPortalUrl(token)

    return NextResponse.json({
      success: true,
      token,
      portalUrl,
      expiresAt,
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email
      }
    })
  } catch (error) {
    console.error('Error generating token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
