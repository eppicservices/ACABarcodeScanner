import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isTokenExpired } from '@/lib/parent-portal'

interface StudentPaymentItem {
  student_id: string
  amount: number
  lunches: number
  is_lunch_card: boolean
}

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

    // Verify all student_ids belong to this parent
    const studentIds = student_payments.map((sp: StudentPaymentItem) => sp.student_id)
    const students = await prisma.student.findMany({
      where: {
        parentId: tokenData.parentId,
        id: { in: studentIds },
      },
      select: { id: true },
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json({
        error: 'Invalid student selection'
      }, { status: 400 })
    }

    // Create pending payment
    const payment = await prisma.pendingPayment.create({
      data: {
        parentId: tokenData.parentId,
        studentPayments: student_payments,
        totalAmount: total_amount,
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      total_amount
    })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
