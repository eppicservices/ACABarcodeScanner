import type { AppSettings } from '@prisma/client'

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
  settings: AppSettings,
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
