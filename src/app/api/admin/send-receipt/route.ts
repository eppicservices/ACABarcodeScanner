import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/nextauth-config'
import prisma from '@/lib/prisma'
import { sendReceiptEmail, type ReceiptData, type ReceiptItem } from '@/lib/email'

interface RequestItem {
  student_name: string
  amount: number
  lunches: number
  is_lunch_card: boolean
  new_balance: number
}

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

    const { parent_id, payment_method, items, total } = await request.json()

    if (!parent_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get parent info
    const parent = await prisma.parent.findUnique({
      where: { id: parent_id },
      select: { id: true, name: true, email: true },
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Get app settings
    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
    })

    if (!settings) {
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
    }

    // Check if email is configured
    if (settings.emailProvider === 'none') {
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
    const result = await sendReceiptEmail(settings, receiptData)

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
