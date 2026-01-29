'use server'

import prisma from '@/lib/prisma'
import type { TransactionType, SchoolLevel, PendingPaymentStatus } from '@prisma/client'

export interface TransactionWithStudent {
  id: string
  studentId: string
  lunchesChange: number
  previousLunches: number
  newLunches: number
  amountPaid: number | null
  lunchesAdded: number | null
  transactionType: TransactionType
  notes: string | null
  createdBy: string | null
  createdAt: Date
  student: {
    id: string
    name: string
    barcode: string
    schoolLevel: SchoolLevel
    parent: {
      id: string
      name: string
    }
  }
}

export interface TransactionFilters {
  studentId?: string
  transactionType?: TransactionType | 'all'
  startDate?: Date
  endDate?: Date
  search?: string
  limit?: number
  offset?: number
}

// Get a single transaction by ID
export async function getTransactionById(id: string): Promise<TransactionWithStudent | null> {
  const transaction = await prisma.balanceTransaction.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          barcode: true,
          schoolLevel: true,
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!transaction) return null

  return {
    ...transaction,
    amountPaid: transaction.amountPaid ? Number(transaction.amountPaid) : null,
  }
}

// Get transactions with optional filters
export async function getTransactions(filters?: TransactionFilters): Promise<TransactionWithStudent[]> {
  const where: Record<string, unknown> = {}

  if (filters?.studentId) {
    where.studentId = filters.studentId
  }

  if (filters?.transactionType && filters.transactionType !== 'all') {
    where.transactionType = filters.transactionType
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      (where.createdAt as Record<string, unknown>).gte = filters.startDate
    }
    if (filters.endDate) {
      (where.createdAt as Record<string, unknown>).lte = filters.endDate
    }
  }

  const transactions = await prisma.balanceTransaction.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          barcode: true,
          schoolLevel: true,
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit,
    skip: filters?.offset,
  })

  // Apply search filter (student name or parent name)
  let result = transactions
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    result = transactions.filter(
      (tx) =>
        tx.student.name.toLowerCase().includes(searchLower) ||
        tx.student.parent.name.toLowerCase().includes(searchLower) ||
        tx.student.barcode.toLowerCase().includes(searchLower)
    )
  }

  // Convert Decimal to number for amountPaid
  return result.map((tx) => ({
    ...tx,
    amountPaid: tx.amountPaid ? Number(tx.amountPaid) : null,
  }))
}

// Get transaction count for pagination
export async function getTransactionCount(filters?: TransactionFilters): Promise<number> {
  const where: Record<string, unknown> = {}

  if (filters?.studentId) {
    where.studentId = filters.studentId
  }

  if (filters?.transactionType && filters.transactionType !== 'all') {
    where.transactionType = filters.transactionType
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      (where.createdAt as Record<string, unknown>).gte = filters.startDate
    }
    if (filters.endDate) {
      (where.createdAt as Record<string, unknown>).lte = filters.endDate
    }
  }

  return prisma.balanceTransaction.count({ where })
}

// Create a new transaction
export async function createTransaction(data: {
  studentId: string
  lunchesChange: number
  previousLunches: number
  newLunches: number
  amountPaid?: number
  lunchesAdded?: number
  transactionType: TransactionType
  notes?: string
  createdBy?: string
}) {
  return prisma.balanceTransaction.create({
    data: {
      studentId: data.studentId,
      lunchesChange: data.lunchesChange,
      previousLunches: data.previousLunches,
      newLunches: data.newLunches,
      amountPaid: data.amountPaid,
      lunchesAdded: data.lunchesAdded,
      transactionType: data.transactionType,
      notes: data.notes,
      createdBy: data.createdBy,
    },
  })
}

// Get transactions by date range (for reports)
export async function getTransactionsByDateRange(startDate: Date, endDate: Date) {
  const transactions = await prisma.balanceTransaction.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          barcode: true,
          schoolLevel: true,
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return transactions.map((tx) => ({
    ...tx,
    amountPaid: tx.amountPaid ? Number(tx.amountPaid) : null,
  }))
}

// Get student transactions (for student detail page)
export async function getStudentTransactions(studentId: string, limit = 50) {
  const transactions = await prisma.balanceTransaction.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return transactions.map((tx) => ({
    ...tx,
    amountPaid: tx.amountPaid ? Number(tx.amountPaid) : null,
  }))
}

// Consume lunch - deduct one lunch from student balance
export async function consumeLunch(studentId: string): Promise<{
  success: boolean
  newBalance?: number
  error?: string
  message?: string
}> {
  // Get student and settings in parallel
  const [student, settings] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.appSettings.findUnique({ where: { id: 1 } }),
  ])

  if (!student) {
    return { success: false, error: 'not_found', message: 'Student not found' }
  }

  if (!settings) {
    return { success: false, error: 'database_error', message: 'Could not load settings' }
  }

  const negativeLimit =
    student.schoolLevel === 'elementary'
      ? settings.elementaryNegativeLimit
      : settings.highschoolNegativeLimit

  const newBalance = student.balance - 1

  if (newBalance < negativeLimit) {
    const limitMessage =
      negativeLimit === 0
        ? 'No negative balance allowed for high school students'
        : `Cannot go below ${negativeLimit} lunches for elementary students`
    return { success: false, error: 'insufficient_balance', message: limitMessage }
  }

  // Update balance and create transaction in a single transaction
  await prisma.$transaction([
    prisma.student.update({
      where: { id: studentId },
      data: { balance: newBalance },
    }),
    prisma.balanceTransaction.create({
      data: {
        studentId,
        lunchesChange: -1,
        previousLunches: student.balance,
        newLunches: newBalance,
        transactionType: 'lunch_used',
        notes: 'Lunch check-in',
      },
    }),
  ])

  return { success: true, newBalance }
}

// Add lunches from payment
export async function addLunchesFromPayment(
  studentId: string,
  amountPaid: number,
  isLunchCard = false,
  createdBy?: string
): Promise<{
  success: boolean
  lunchesAdded: number
  newBalance: number
  error?: string
}> {
  // Get student and settings in parallel
  const [student, settings] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.appSettings.findUnique({ where: { id: 1 } }),
  ])

  if (!student) {
    return { success: false, lunchesAdded: 0, newBalance: 0, error: 'Student not found' }
  }

  if (!settings) {
    return { success: false, lunchesAdded: 0, newBalance: student.balance, error: 'Could not load settings' }
  }

  let lunchesAdded: number

  if (isLunchCard && student.schoolLevel === 'high_school') {
    lunchesAdded = settings.highschoolLunchCardLunches
  } else {
    const pricePerLunch =
      student.schoolLevel === 'elementary'
        ? Number(settings.elementaryLunchPrice)
        : Number(settings.highschoolLunchPrice)
    lunchesAdded = Math.floor(amountPaid / pricePerLunch)
  }

  if (lunchesAdded <= 0) {
    return { success: false, lunchesAdded: 0, newBalance: student.balance, error: 'Payment amount too low' }
  }

  const newBalance = student.balance + lunchesAdded

  // Update balance and create transaction in a single transaction
  await prisma.$transaction([
    prisma.student.update({
      where: { id: studentId },
      data: { balance: newBalance },
    }),
    prisma.balanceTransaction.create({
      data: {
        studentId,
        lunchesChange: lunchesAdded,
        previousLunches: student.balance,
        newLunches: newBalance,
        amountPaid,
        lunchesAdded,
        transactionType: isLunchCard ? 'lunch_card' : 'payment',
        notes: isLunchCard ? 'Lunch card purchase' : `Payment of $${amountPaid.toFixed(2)}`,
        createdBy,
      },
    }),
  ])

  return { success: true, lunchesAdded, newBalance }
}

// Get transaction stats
export async function getTransactionStats(): Promise<{
  totalLunchesAdded: number
  totalLunchesUsed: number
  paymentCount: number
  adjustmentCount: number
  usedCount: number
}> {
  const transactions = await prisma.balanceTransaction.findMany({
    select: {
      transactionType: true,
      lunchesChange: true,
    },
  })

  const totalLunchesAdded = transactions
    .filter((tx) => tx.lunchesChange > 0)
    .reduce((sum, tx) => sum + tx.lunchesChange, 0)

  const totalLunchesUsed = transactions
    .filter((tx) => tx.transactionType === 'lunch_used')
    .reduce((sum, tx) => sum + Math.abs(tx.lunchesChange), 0)

  const paymentCount = transactions.filter(
    (tx) => tx.transactionType === 'payment' || tx.transactionType === 'lunch_card'
  ).length

  const adjustmentCount = transactions.filter((tx) => tx.transactionType === 'adjustment').length

  const usedCount = transactions.filter((tx) => tx.transactionType === 'lunch_used').length

  return {
    totalLunchesAdded,
    totalLunchesUsed,
    paymentCount,
    adjustmentCount,
    usedCount,
  }
}

// Manual balance adjustment
export async function adjustBalance(
  studentId: string,
  adjustment: number,
  notes: string,
  createdBy?: string
): Promise<{
  success: boolean
  newBalance: number
  error?: string
}> {
  const student = await prisma.student.findUnique({ where: { id: studentId } })

  if (!student) {
    return { success: false, newBalance: 0, error: 'Student not found' }
  }

  const newBalance = student.balance + adjustment

  await prisma.$transaction([
    prisma.student.update({
      where: { id: studentId },
      data: { balance: newBalance },
    }),
    prisma.balanceTransaction.create({
      data: {
        studentId,
        lunchesChange: adjustment,
        previousLunches: student.balance,
        newLunches: newBalance,
        transactionType: 'adjustment',
        notes,
        createdBy,
      },
    }),
  ])

  return { success: true, newBalance }
}

// ================== Pending Payments ==================

export interface PendingPaymentWithParent {
  id: string
  parentId: string
  studentPayments: unknown
  totalAmount: number
  status: PendingPaymentStatus
  createdAt: Date
  completedAt: Date | null
  completedBy: string | null
  notes: string | null
  parentName?: string
}

// Get pending payments with optional status filter
export async function getPendingPayments(status?: PendingPaymentStatus): Promise<PendingPaymentWithParent[]> {
  const where: Record<string, unknown> = {}
  if (status) {
    where.status = status
  }

  const payments = await prisma.pendingPayment.findMany({
    where,
    include: {
      parent: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return payments.map((p) => ({
    id: p.id,
    parentId: p.parentId,
    studentPayments: p.studentPayments,
    totalAmount: Number(p.totalAmount),
    status: p.status,
    createdAt: p.createdAt,
    completedAt: p.completedAt,
    completedBy: p.completedBy,
    notes: p.notes,
    parentName: p.parent.name,
  }))
}

// Get pending payment by ID
export async function getPendingPaymentById(id: string): Promise<PendingPaymentWithParent | null> {
  const payment = await prisma.pendingPayment.findUnique({
    where: { id },
    include: {
      parent: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!payment) return null

  return {
    id: payment.id,
    parentId: payment.parentId,
    studentPayments: payment.studentPayments,
    totalAmount: Number(payment.totalAmount),
    status: payment.status,
    createdAt: payment.createdAt,
    completedAt: payment.completedAt,
    completedBy: payment.completedBy,
    notes: payment.notes,
    parentName: payment.parent.name,
  }
}

// Create pending payment
export async function createPendingPayment(data: {
  parentId: string
  studentPayments: unknown
  totalAmount: number
  notes?: string
}): Promise<PendingPaymentWithParent> {
  const payment = await prisma.pendingPayment.create({
    data: {
      parentId: data.parentId,
      studentPayments: data.studentPayments as never,
      totalAmount: data.totalAmount,
      notes: data.notes,
    },
    include: {
      parent: {
        select: {
          name: true,
        },
      },
    },
  })

  return {
    id: payment.id,
    parentId: payment.parentId,
    studentPayments: payment.studentPayments,
    totalAmount: Number(payment.totalAmount),
    status: payment.status,
    createdAt: payment.createdAt,
    completedAt: payment.completedAt,
    completedBy: payment.completedBy,
    notes: payment.notes,
    parentName: payment.parent.name,
  }
}

// Update pending payment status
export async function updatePendingPaymentStatus(
  id: string,
  status: PendingPaymentStatus,
  completedBy?: string
): Promise<PendingPaymentWithParent> {
  const payment = await prisma.pendingPayment.update({
    where: { id },
    data: {
      status,
      completedAt: status === 'completed' ? new Date() : null,
      completedBy: status === 'completed' ? completedBy : null,
    },
    include: {
      parent: {
        select: {
          name: true,
        },
      },
    },
  })

  return {
    id: payment.id,
    parentId: payment.parentId,
    studentPayments: payment.studentPayments,
    totalAmount: Number(payment.totalAmount),
    status: payment.status,
    createdAt: payment.createdAt,
    completedAt: payment.completedAt,
    completedBy: payment.completedBy,
    notes: payment.notes,
    parentName: payment.parent.name,
  }
}

// Delete pending payment
export async function deletePendingPayment(id: string): Promise<void> {
  await prisma.pendingPayment.delete({
    where: { id },
  })
}

// Get transactions for CSV export
export async function getTransactionsForExport() {
  const transactions = await prisma.balanceTransaction.findMany({
    include: {
      student: {
        select: {
          name: true,
          barcode: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return transactions.map((tx) => ({
    id: tx.id,
    studentName: tx.student.name,
    studentBarcode: tx.student.barcode,
    lunchesChange: tx.lunchesChange,
    previousLunches: tx.previousLunches,
    newLunches: tx.newLunches,
    amountPaid: tx.amountPaid ? Number(tx.amountPaid) : null,
    lunchesAdded: tx.lunchesAdded,
    transactionType: tx.transactionType,
    notes: tx.notes || '',
    createdAt: tx.createdAt.toISOString(),
  }))
}

// Complete a pending payment (process all student payments in a transaction)
export interface StudentPaymentItem {
  studentId: string
  studentName: string
  amount: number
  lunchesToAdd: number
  isLunchCard: boolean
}

export interface PaymentCompletionResult {
  success: boolean
  receiptItems?: Array<{
    studentName: string
    amount: number
    lunches: number
    isLunchCard: boolean
    newBalance: number
  }>
  error?: string
}

export async function completePendingPayment(
  paymentId: string,
  studentPayments: StudentPaymentItem[],
  completedBy?: string
): Promise<PaymentCompletionResult> {
  try {
    const receiptItems: PaymentCompletionResult['receiptItems'] = []

    // Process all student payments in a single transaction
    await prisma.$transaction(async (tx) => {
      for (const sp of studentPayments) {
        // Get current student balance
        const student = await tx.student.findUnique({
          where: { id: sp.studentId },
          select: { balance: true },
        })

        if (!student) {
          throw new Error(`Student ${sp.studentName} not found`)
        }

        const previousBalance = student.balance
        const newBalance = previousBalance + sp.lunchesToAdd

        // Update student balance
        await tx.student.update({
          where: { id: sp.studentId },
          data: { balance: newBalance },
        })

        // Create transaction record
        await tx.balanceTransaction.create({
          data: {
            studentId: sp.studentId,
            lunchesChange: sp.lunchesToAdd,
            previousLunches: previousBalance,
            newLunches: newBalance,
            amountPaid: sp.amount,
            lunchesAdded: sp.lunchesToAdd,
            transactionType: sp.isLunchCard ? 'lunch_card' : 'payment',
            notes: 'Online payment via parent portal',
            createdBy: completedBy,
          },
        })

        // Add to receipt items
        receiptItems.push({
          studentName: sp.studentName,
          amount: sp.amount,
          lunches: sp.lunchesToAdd,
          isLunchCard: sp.isLunchCard,
          newBalance,
        })
      }

      // Mark payment as completed
      await tx.pendingPayment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          completedBy,
        },
      })
    })

    return { success: true, receiptItems }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payment',
    }
  }
}

// Cancel a pending payment
export async function cancelPendingPayment(paymentId: string): Promise<void> {
  await prisma.pendingPayment.update({
    where: { id: paymentId },
    data: { status: 'cancelled' },
  })
}
