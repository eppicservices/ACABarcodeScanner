import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendReceiptEmail, type ReceiptData, type ReceiptItem } from '@/lib/email'
import type { AppSettings } from '@/types/database'

interface RequestItem {
  student_name: string
  amount: number
  lunches: number
  is_lunch_card: boolean
  new_balance: number
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

    const { parent_id, payment_method, items, total } = await request.json()

    if (!parent_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get parent info
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id, name, email')
      .eq('id', parent_id)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Get app settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
    }

    // Check if email is configured
    if (settings.email_provider === 'none') {
      return NextResponse.json({ success: true, message: 'Email not configured, skipping receipt' })
    }

    // Build receipt items
    const receiptItems: ReceiptItem[] = (items as RequestItem[]).map(item => ({
      studentName: item.student_name,
      amount: item.amount,
      lunches: item.lunches,
      isLunchCard: item.is_lunch_card,
      newBalance: item.new_balance
    }))

    // Build receipt data
    const receiptData: ReceiptData = {
      parentName: parent.name,
      parentEmail: parent.email,
      paymentMethod: payment_method === 'cash' ? 'Cash' : 'Online',
      items: receiptItems,
      total: total,
      date: new Date()
    }

    // Send email
    const result = await sendReceiptEmail(settings as AppSettings, receiptData)

    if (!result.success) {
      console.error('Failed to send receipt email:', result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending receipt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
