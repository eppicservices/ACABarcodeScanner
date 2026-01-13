import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendReceiptEmail, type ReceiptData, type ReceiptItem } from '@/lib/email'
import type { AppSettings } from '@/types/database'

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
    const supabase = await createClient()

    // Verify admin is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { parent_id, student_payments, total_amount, payment_method, notes } = await request.json()
    const paymentMethodLabel = getPaymentMethodLabel(payment_method || 'cash')

    if (!parent_id || !student_payments || student_payments.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get parent info for email
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id, name, email')
      .eq('id', parent_id)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Get app settings for email
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
    }

    const receiptItems: ReceiptItem[] = []

    // Process each student payment
    for (const sp of student_payments as StudentPaymentItem[]) {
      // Verify student belongs to parent
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, balance, parent_id')
        .eq('id', sp.student_id)
        .eq('parent_id', parent_id)
        .single()

      if (studentError || !student) {
        return NextResponse.json({ error: `Student ${sp.student_name} not found or does not belong to this parent` }, { status: 400 })
      }

      const previousBalance = student.balance
      const newBalance = previousBalance + sp.lunches_to_add

      // Update student balance
      const { error: updateError } = await supabase
        .from('students')
        .update({ balance: newBalance })
        .eq('id', sp.student_id)

      if (updateError) {
        console.error('Error updating student balance:', updateError)
        return NextResponse.json({ error: 'Failed to update student balance' }, { status: 500 })
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('balance_transactions')
        .insert({
          student_id: sp.student_id,
          lunches_change: sp.lunches_to_add,
          previous_lunches: previousBalance,
          new_lunches: newBalance,
          amount_paid: sp.amount,
          lunches_added: sp.lunches_to_add,
          transaction_type: sp.is_lunch_card ? 'lunch_card' : 'payment',
          notes: notes ? `${paymentMethodLabel} payment - ${notes}` : `${paymentMethodLabel} payment`,
          created_by: user.id
        })

      if (transactionError) {
        console.error('Error creating transaction:', transactionError)
      }

      // Add to receipt items
      receiptItems.push({
        studentName: sp.student_name,
        amount: sp.amount,
        lunches: sp.lunches_to_add,
        isLunchCard: sp.is_lunch_card,
        newBalance: newBalance
      })
    }

    // Send receipt email
    if (settings.email_provider !== 'none') {
      const receiptData: ReceiptData = {
        parentName: parent.name,
        parentEmail: parent.email,
        paymentMethod: paymentMethodLabel,
        items: receiptItems,
        total: total_amount,
        date: new Date()
      }

      const emailResult = await sendReceiptEmail(settings as AppSettings, receiptData)
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
