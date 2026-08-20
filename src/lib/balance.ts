import type { SchoolLevel } from '@prisma/client'

/**
 * Single source of truth for what "low balance" means.
 *
 * The low-balance cron (src/app/api/cron/send-low-balance-emails/route.ts) decides
 * who gets emailed using the per-level thresholds an admin sets in Settings. Every
 * other surface that colours or labels a balance must use these same numbers, or
 * the red on the screen stops meaning "this student's parent is being emailed".
 *
 * Defaults mirror the Prisma defaults on AppSettings.
 */
export const DEFAULT_ELEMENTARY_LOW_THRESHOLD = 5
export const DEFAULT_HIGHSCHOOL_LOW_THRESHOLD = 3

export type BalanceState = 'negative' | 'low' | 'ok'

/** The subset of AppSettings this module needs; keeps callers from passing the whole row. */
export interface LowBalanceThresholds {
  elementaryLowLunchThreshold?: number | null
  highschoolLowLunchThreshold?: number | null
}

export function getLowBalanceThreshold(
  schoolLevel: SchoolLevel,
  thresholds?: LowBalanceThresholds | null
): number {
  if (schoolLevel === 'elementary') {
    return thresholds?.elementaryLowLunchThreshold ?? DEFAULT_ELEMENTARY_LOW_THRESHOLD
  }
  return thresholds?.highschoolLowLunchThreshold ?? DEFAULT_HIGHSCHOOL_LOW_THRESHOLD
}

export function getBalanceState(
  balance: number,
  schoolLevel: SchoolLevel,
  thresholds?: LowBalanceThresholds | null
): BalanceState {
  if (balance <= 0) return 'negative'
  if (balance <= getLowBalanceThreshold(schoolLevel, thresholds)) return 'low'
  return 'ok'
}

/** Text colour token per state. Distinct colours — 'low' must not read as 'negative'. */
export const BALANCE_STATE_TEXT_CLASS: Record<BalanceState, string> = {
  negative: 'text-[var(--error-text)]',
  low: 'text-[var(--warning-text)]',
  ok: 'text-[var(--success-text)]',
}

/** Dot/fill colour token per state, for the parent portal indicators. */
export const BALANCE_STATE_DOT_CLASS: Record<BalanceState, string> = {
  negative: 'bg-[var(--error)]',
  low: 'bg-[var(--warning)]',
  ok: 'bg-[var(--success)]',
}

export const BALANCE_STATE_LABEL: Record<BalanceState, string> = {
  negative: 'out of lunches',
  low: 'low balance',
  ok: 'balance ok',
}

/**
 * Words for the state, so colour is never the only channel carrying it.
 * Used as aria-label/title on the bare number.
 */
export function getBalanceDescription(
  balance: number,
  schoolLevel: SchoolLevel,
  thresholds?: LowBalanceThresholds | null
): string {
  const state = getBalanceState(balance, schoolLevel, thresholds)
  const lunches = `${balance} ${Math.abs(balance) === 1 ? 'lunch' : 'lunches'}`
  return `${lunches} remaining, ${BALANCE_STATE_LABEL[state]}`
}
