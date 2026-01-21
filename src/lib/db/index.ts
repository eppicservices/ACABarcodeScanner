import type { DatabaseAdapter } from './types'

// Determine which database provider to use
const provider = process.env.DATABASE_PROVIDER || 'supabase'

// Lazy-load the appropriate adapter
let _adapter: DatabaseAdapter | null = null

export async function getAdapter(): Promise<DatabaseAdapter> {
  if (_adapter) return _adapter

  if (provider === 'prisma') {
    const module = await import('./prisma-adapter')
    _adapter = module.adapter
  } else {
    const module = await import('./supabase-adapter')
    _adapter = module.adapter
  }

  return _adapter
}

// Export a proxy that lazily loads the adapter
// This allows the adapter to be used synchronously after first access
export const db: DatabaseAdapter = new Proxy({} as DatabaseAdapter, {
  get(_target, prop: keyof DatabaseAdapter) {
    return async (...args: unknown[]) => {
      const adapter = await getAdapter()
      const method = adapter[prop]
      if (typeof method === 'function') {
        return (method as (...args: unknown[]) => unknown).apply(adapter, args)
      }
      return method
    }
  }
})

// Re-export types for convenience
export type {
  DatabaseAdapter,
  LunchSettings,
  ConsumeLunchResult,
  AddLunchesResult,
  TransactionInput,
  ParentWithStudents
} from './types'

// Re-export all database types
export type {
  Parent,
  Student,
  AdminUser,
  AppSettings,
  BalanceTransaction,
  NotificationLog,
  DailyMeal,
  ParentAccessToken,
  PendingPayment,
  EmailBlackoutPeriod,
  SchoolLevel,
  TransactionType,
  PendingPaymentStatus,
  StudentPaymentItem
} from './types'
