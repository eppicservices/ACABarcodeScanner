interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  retryAfterMs: number
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private windowMs: number
  private maxAttempts: number

  constructor(windowMs: number, maxAttempts: number) {
    this.windowMs = windowMs
    this.maxAttempts = maxAttempts
  }

  check(key: string): RateLimitResult {
    const now = Date.now()
    const entry = this.store.get(key)

    // Clean up expired entry
    if (entry && now >= entry.resetAt) {
      this.store.delete(key)
    }

    const current = this.store.get(key)

    if (!current) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs })
      return { allowed: true, remainingAttempts: this.maxAttempts - 1, retryAfterMs: 0 }
    }

    if (current.count >= this.maxAttempts) {
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterMs: current.resetAt - now,
      }
    }

    current.count++
    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - current.count,
      retryAfterMs: 0,
    }
  }
}

// Pre-configured instances
export const loginLimiter = new RateLimiter(15 * 60 * 1000, 5)       // 5 attempts per 15 min
export const signupLimiter = new RateLimiter(60 * 60 * 1000, 3)      // 3 attempts per 60 min
export const tokenValidateLimiter = new RateLimiter(15 * 60 * 1000, 20) // 20 attempts per 15 min
export const paymentLimiter = new RateLimiter(15 * 60 * 1000, 10)     // 10 attempts per 15 min
export const portalLinkLimiter = new RateLimiter(5 * 60 * 1000, 1)    // 1 attempt per 5 min

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
