/**
 * Email module type definitions
 */

export interface ReceiptItem {
  studentName: string
  amount: number
  lunches: number
  isLunchCard: boolean
  newBalance: number
}

export interface ReceiptData {
  parentName: string
  parentEmail: string
  paymentMethod: string
  items: ReceiptItem[]
  total: number
  date: Date
}

export interface StudentBalance {
  name: string
  balance: number
  schoolLevel: 'elementary' | 'high_school'
}

export interface BalanceEmailData {
  parentName: string
  parentEmail: string
  students: StudentBalance[]
  portalUrl: string
}

export interface PortalLinkEmailData {
  parentName: string
  parentEmail: string
  portalUrl: string
  expiresAt: Date
}

export interface WeeklySummaryStudent {
  name: string
  schoolLevel: 'elementary' | 'high_school'
  currentBalance: number
  lunchesUsed: number
  lunchesAdded: number
}

export interface WeeklySummaryEmailData {
  parentName: string
  parentEmail: string
  students: WeeklySummaryStudent[]
  weekStart: Date
  weekEnd: Date
  portalUrl: string
}

export interface WelcomeEmailData {
  parentName: string
  parentEmail: string
  students: { name: string; schoolLevel: 'elementary' | 'high_school' }[]
  portalUrl: string
}
