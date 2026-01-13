import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isTokenExpired } from '@/lib/parent-portal'
import type { StudentPaymentItem } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { token, student_payments, total_amount } = await request.json()

    if (!token || !student_payments || !total_amount) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('parent_access_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({
        error: 'Invalid or expired link'
      }, { status: 401 })
    }

    if (isTokenExpired(tokenData.expires_at)) {
      return NextResponse.json({
        error: 'This link has expired'
      }, { status: 410 })
    }

    // Verify all student_ids belong to this parent
    const studentIds = student_payments.map((sp: StudentPaymentItem) => sp.student_id)
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .eq('parent_id', tokenData.parent_id)
      .in('id', studentIds)

    if (studentsError || !students || students.length !== studentIds.length) {
      return NextResponse.json({
        error: 'Invalid student selection'
      }, { status: 400 })
    }

    // Create pending payment
    const { data: payment, error: paymentError } = await supabase
      .from('pending_payments')
      .insert({
        parent_id: tokenData.parent_id,
        student_payments,
        total_amount,
        status: 'pending'
      })
      .select()
      .single()

    if (paymentError || !payment) {
      console.error('Error creating payment:', paymentError)
      return NextResponse.json({
        error: 'Failed to create payment record'
      }, { status: 500 })
    }

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
