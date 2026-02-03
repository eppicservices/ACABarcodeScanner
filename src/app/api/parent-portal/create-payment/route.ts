import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateLunches, isTokenExpired } from '@/lib/parent-portal'

export async function POST(request: NextRequest) {
  try {
    const { token, student_payments, total_amount } = await request.json()

    if (!token || !student_payments || !total_amount) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Validate token
    const tokenData = await prisma.parentAccessToken.findUnique({
      where: { token },
    })

    if (!tokenData) {
      return NextResponse.json({
        error: 'Invalid or expired link'
      }, { status: 401 })
    }

    if (isTokenExpired(tokenData.expiresAt.toISOString())) {
      return NextResponse.json({
        error: 'This link has expired'
      }, { status: 410 })
    }

    // Load pricing/settings for server-side calculation
    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
      select: {
        elementaryLunchPrice: true,
        highschoolLunchPrice: true,
        highschoolLunchCardPrice: true,
        highschoolLunchCardLunches: true,
      },
    })

    if (!settings) {
      return NextResponse.json({ error: 'Settings not configured' }, { status: 500 })
    }

    // Verify all student_ids belong to this parent and fetch their data
    const studentIds = student_payments.map((sp: { student_id: string }) => sp.student_id)
    const students = await prisma.student.findMany({
      where: {
        parentId: tokenData.parentId,
        id: { in: studentIds },
      },
      select: { id: true, name: true, schoolLevel: true },
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json({
        error: 'Invalid student selection'
      }, { status: 400 })
    }

    // Build sanitized payments: compute lunches server-side to prevent tampering
    const sanitizedPayments = student_payments.map((sp: {
      student_id: string
      amount: number
      is_lunch_card: boolean
    }) => {
      const student = students.find(s => s.id === sp.student_id)!
      const lunchesToAdd = calculateLunches(
        Number(sp.amount),
        student.schoolLevel,
        {
          elementaryLunchPrice: settings.elementaryLunchPrice,
          highschoolLunchPrice: settings.highschoolLunchPrice,
          highschoolLunchCardPrice: settings.highschoolLunchCardPrice,
          highschoolLunchCardLunches: settings.highschoolLunchCardLunches,
        },
        sp.is_lunch_card || false
      )

      if (lunchesToAdd <= 0) {
        throw new Error(`Payment amount too low for ${student.name}`)
      }

      return {
        studentId: student.id,
        studentName: student.name,
        amount: Number(sp.amount),
        lunchesToAdd,
        isLunchCard: sp.is_lunch_card || false,
      }
    })

    const recalculatedTotal = sanitizedPayments.reduce((sum, sp) => sum + sp.amount, 0)

    // Create pending payment with sanitized data
    const payment = await prisma.pendingPayment.create({
      data: {
        parentId: tokenData.parentId,
        studentPayments: sanitizedPayments,
        totalAmount: recalculatedTotal,
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      total_amount: recalculatedTotal,
      student_payments: sanitizedPayments,
    })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
