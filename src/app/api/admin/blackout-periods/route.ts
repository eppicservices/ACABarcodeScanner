import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/nextauth-config'
import prisma from '@/lib/prisma'

// GET - List all blackout periods
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

    // Fetch all blackout periods
    const periods = await prisma.emailBlackoutPeriod.findMany({
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json({ periods })
  } catch (error) {
    console.error('Error fetching blackout periods:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new blackout period
export async function POST(request: NextRequest) {
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

    const { name, start_date, end_date, description } = await request.json()

    // Validate required fields
    if (!name || !start_date || !end_date) {
      return NextResponse.json({ error: 'name, start_date, and end_date are required' }, { status: 400 })
    }

    // Validate dates
    const start = new Date(start_date)
    const end = new Date(end_date)
    if (end < start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Create blackout period
    const period = await prisma.emailBlackoutPeriod.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        description: description || null,
      },
    })

    return NextResponse.json({ success: true, period })
  } catch (error) {
    console.error('Error creating blackout period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a blackout period
export async function DELETE(request: NextRequest) {
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

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.emailBlackoutPeriod.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blackout period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update a blackout period
export async function PATCH(request: NextRequest) {
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

    const { id, name, start_date, end_date, description } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (start_date !== undefined) updates.startDate = new Date(start_date)
    if (end_date !== undefined) updates.endDate = new Date(end_date)
    if (description !== undefined) updates.description = description

    // Validate dates if both are provided
    if (start_date && end_date) {
      const start = new Date(start_date)
      const end = new Date(end_date)
      if (end < start) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
      }
    }

    const period = await prisma.emailBlackoutPeriod.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ success: true, period })
  } catch (error) {
    console.error('Error updating blackout period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
