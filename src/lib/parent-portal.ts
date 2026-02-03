// Settings type that works with both Prisma Decimal and serialized number types
// Decimal has a toNumber method, so we check for that or just a plain number
type DecimalLike = { toNumber: () => number } | number
type LunchSettings = {
  elementaryLunchPrice: DecimalLike
  highschoolLunchPrice: DecimalLike
  highschoolLunchCardPrice: DecimalLike
  highschoolLunchCardLunches: number
}

export type SanitizedStudentPayment = {
  studentId: string
  studentName: string
  amount: number
  lunchesToAdd: number
  isLunchCard: boolean
}

export type PaymentStudentInfo = {
  id: string
  name: string
  schoolLevel: 'elementary' | 'high_school'
}

export type PaymentInput = {
  student_id: string
  amount: number
  is_lunch_card?: boolean
}

// Generate a cryptographically secure token
export function generateSecureToken(length: number = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => chars[byte % chars.length]).join('')
}

// Calculate expiry date (default 7 days from now, configurable via settings)
export function getTokenExpiryDate(expiryDays: number = 7): string {
  const date = new Date()
  date.setDate(date.getDate() + expiryDays)
  return date.toISOString()
}

// Check if a token is expired
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

// Get days until token expires
export function getDaysUntilExpiry(expiresAt: string): number {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

// Generate the portal URL for a token
export function getPortalUrl(token: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/parent/${token}`
}

// Calculate lunches from payment amount
export function calculateLunches(
  amount: number,
  schoolLevel: 'elementary' | 'high_school',
  settings: LunchSettings,
  isLunchCard: boolean = false
): number {
  if (isLunchCard && schoolLevel === 'high_school') {
    // Lunch card gives fixed number of lunches
    const cardsCount = Math.floor(amount / Number(settings.highschoolLunchCardPrice))
    return cardsCount * settings.highschoolLunchCardLunches
  }

  const pricePerLunch = schoolLevel === 'elementary'
    ? Number(settings.elementaryLunchPrice)
    : Number(settings.highschoolLunchPrice)

  return Math.floor(amount / pricePerLunch)
}

/**
 * Validate and sanitize parent-submitted payments by:
 * - ensuring students belong to the parent (passed in by caller)
 * - computing lunches server-side using pricing rules
 * - rejecting payments that result in zero lunches
 */
export function sanitizeParentPayments(
  rawPayments: PaymentInput[],
  students: PaymentStudentInfo[],
  settings: LunchSettings
): { payments: SanitizedStudentPayment[]; totalAmount: number } {
  const payments: SanitizedStudentPayment[] = rawPayments.map((sp) => {
    const student = students.find((s) => s.id === sp.student_id)
    if (!student) {
      throw new Error('Invalid student selection')
    }

    const lunchesToAdd = calculateLunches(
      Number(sp.amount),
      student.schoolLevel,
      settings,
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

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  return { payments, totalAmount }
}
