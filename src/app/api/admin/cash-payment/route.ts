import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendReceiptEmail, type ReceiptData, type ReceiptItem } from '@/lib/email'
import { requireAdmin } from '@/lib/auth/require-admin'

interface StudentPaymentItem {
  student_id: string
  student_name: string
  amount: number
  lunches_to_add: number
  is_lunch_card: boolean
  new_balance: number
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Cash',
    check: 'Check',
    cashapp: 'Cash App',
    zeffy: 'Zeffy',
    other: 'Other'
  }
  return labels[method] || method
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin is authenticated with proper role
    const adminResult = await requireAdmin()
    if (!adminResult.authorized) {
      return adminResult.response
    }

    const { parent_id, student_payments, total_amount, payment_method, notes } = await request.json()
    const paymentMethodLabel = getPaymentMethodLabel(payment_method || 'cash')

    if (!parent_id || !student_payments || student_payments.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get parent info for email
    const parent = await prisma.parent.findUnique({
      where: { id: parent_id },
      select: { id: true, name: true, email: true },
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Get app settings for email
    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
    })

    if (!settings) {
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
    }

    const receiptItems: ReceiptItem[] = []

    // Process each student payment atomically to keep balances and logs in sync
    await prisma.$transaction(async (tx) => {
      for (const sp of student_payments as StudentPaymentItem[]) {
        // Verify student belongs to parent
        const student = await tx.student.findFirst({
          where: {
            id: sp.student_id,
            parentId: parent_id,
          },
          select: { id: true, balance: true, parentId: true },
        })

        if (!student) {
          throw new Error(`Student ${sp.student_name} not found or does not belong to this parent`)
        }

        const previousBalance = student.balance
        const newBalance = previousBalance + sp.lunches_to_add

        // Update student balance
        await tx.student.update({
          where: { id: sp.student_id },
          data: { balance: newBalance },
        })

        // Create transaction record
        await tx.balanceTransaction.create({
          data: {
            studentId: sp.student_id,
            lunchesChange: sp.lunches_to_add,
            previousLunches: previousBalance,
            newLunches: newBalance,
            amountPaid: sp.amount,
            lunchesAdded: sp.lunches_to_add,
            transactionType: sp.is_lunch_card ? 'lunch_card' : 'payment',
            notes: notes ? `${paymentMethodLabel} payment - ${notes}` : `${paymentMethodLabel} payment`,
          },
        })

        // Add to receipt items
        receiptItems.push({
          studentName: sp.student_name,
          amount: sp.amount,
          lunches: sp.lunches_to_add,
          isLunchCard: sp.is_lunch_card,
          newBalance: newBalance
        })
      }
    })

    // Send receipt email
    if (settings.emailProvider !== 'none') {
      const receiptData: ReceiptData = {
        parentName: parent.name,
        parentEmail: parent.email,
        paymentMethod: paymentMethodLabel,
        items: receiptItems,
        total: total_amount,
        date: new Date()
      }

      const emailResult = await sendReceiptEmail(settings, receiptData)
      if (!emailResult.success) {
        console.error('Failed to send receipt email:', emailResult.error)
        // Don't fail the request if email fails, just log it
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully'
    })
  } catch (error) {
    console.error('Error processing cash payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
