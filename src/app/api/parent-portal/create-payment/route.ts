import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isTokenExpired, sanitizeParentPayments } from '@/lib/parent-portal'
import { paymentLimiter } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const { token, student_payments, total_amount } = await request.json()

    // Rate limit by token to prevent payment spam
    if (token) {
      const { allowed, retryAfterMs } = paymentLimiter.check(token)
      if (!allowed) {
        return NextResponse.json(
          { error: `Too many payment attempts. Try again in ${Math.ceil(retryAfterMs / 60000)} minute(s).` },
          { status: 429 }
        )
      }
    }

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
    const { payments: sanitizedPayments, totalAmount: recalculatedTotal } = sanitizeParentPayments(
      student_payments,
      students.map(s => ({ id: s.id, name: s.name, schoolLevel: s.schoolLevel })),
      {
        elementaryLunchPrice: settings.elementaryLunchPrice,
        highschoolLunchPrice: settings.highschoolLunchPrice,
        highschoolLunchCardPrice: settings.highschoolLunchCardPrice,
        highschoolLunchCardLunches: settings.highschoolLunchCardLunches,
      }
    )

    // Log if client-provided total differs from server calculation (possible tampering or rounding differences)
    if (typeof total_amount === 'number' && Math.abs(total_amount - recalculatedTotal) > 0.01) {
      console.warn(`Parent portal payment total mismatch: client=${total_amount} server=${recalculatedTotal}`)
    }

    // Create pending payment with sanitized data
    const payment = await prisma.pendingPayment.create({
      data: {
        parentId: tokenData.parentId,
        studentPayments: sanitizedPayments,
        totalAmount: recalculatedTotal,
        status: 'pending',
      },
    })

    logAudit({
      action: 'payment.create',
      actor: `parent:${tokenData.parentId}`,
      targetId: payment.id,
      details: { totalAmount: recalculatedTotal, studentCount: sanitizedPayments.length },
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
