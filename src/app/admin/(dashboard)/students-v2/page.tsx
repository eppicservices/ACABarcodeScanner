'use client'

/**
 * Redesign pilot for the Students page.
 *
 * Same data and same route group as /admin/students, rebuilt on the house
 * design system (eppic-tool-design) with the ACA palette carrying the roles
 * that system gives to blue. Open both and compare.
 *
 * Deliberate differences from /admin/students, each one a house rule:
 *   - the page states its conclusion in words before showing the table
 *   - sorted worst-first, not alphabetically; search is how you look someone up
 *   - the counts are the filters, and there is an All tile to get back
 *   - balance carries a word, not only a colour
 *   - one primary action, in gold, with a navy label
 *   - borders instead of shadows, weight 500 instead of 700/900
 */

import '@/app/tokens-v2.css'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, X } from 'lucide-react'
import {
  getStudentsWithParents,
  type StudentWithParent,
} from '@/actions/students'
import { getLowBalanceThresholds } from '@/actions/settings'
import {
  getBalanceState,
  getLowBalanceThreshold,
  type BalanceState,
  type LowBalanceThresholds,
} from '@/lib/balance'

type Tile = 'all' | 'out' | 'low' | 'ok' | 'unlimited'

const STATE_WORD: Record<BalanceState, string> = {
  negative: 'Out of lunches',
  low: 'Running low',
  ok: 'OK',
}
const STATE_DOT: Record<BalanceState, string> = {
  negative: 'v2-dot-red',
  low: 'v2-dot-amber',
  ok: 'v2-dot-green',
}
// "OK" is deliberately near-black, not green. Green on every healthy row is
// decoration, and it makes the two rows that matter harder to pick out.
const STATE_TEXT: Record<BalanceState, string> = {
  negative: 'var(--v2-red-text)',
  low: 'var(--v2-amber-text)',
  ok: 'var(--v2-text)',
}

export default function StudentsV2Page() {
  const [students, setStudents] = useState<StudentWithParent[]>([])
  const [thresholds, setThresholds] = useState<LowBalanceThresholds | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tile, setTile] = useState<Tile>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const [rows, t] = await Promise.all([
      getStudentsWithParents({ status: 'active', sortField: 'balance', sortDirection: 'asc' }),
      getLowBalanceThresholds(),
    ])
    setStudents(rows)
    setThresholds(t)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const rows = useMemo(
    () =>
      students.map(s => ({
        ...s,
        unlimited: s.studentType !== 'regular',
        state: getBalanceState(s.balance, s.schoolLevel, thresholds),
      })),
    [students, thresholds]
  )

  const counts = useMemo(
    () => ({
      all: rows.length,
      out: rows.filter(r => !r.unlimited && r.state === 'negative').length,
      low: rows.filter(r => !r.unlimited && r.state === 'low').length,
      ok: rows.filter(r => !r.unlimited && r.state === 'ok').length,
      unlimited: rows.filter(r => r.unlimited).length,
    }),
    [rows]
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows
      .filter(r => {
        if (tile === 'unlimited') return r.unlimited
        if (tile === 'out') return !r.unlimited && r.state === 'negative'
        if (tile === 'low') return !r.unlimited && r.state === 'low'
        if (tile === 'ok') return !r.unlimited && r.state === 'ok'
        return true
      })
      .filter(
        r =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.barcode.toLowerCase().includes(q) ||
          r.parent.name.toLowerCase().includes(q)
      )
      // Worst first. Unlimited students have no balance to worry about, so they sink.
      .sort((a, b) => {
        if (a.unlimited !== b.unlimited) return a.unlimited ? 1 : -1
        if (a.balance !== b.balance) return a.balance - b.balance
        return a.name.localeCompare(b.name)
      })
  }, [rows, tile, search])

  const needsAttention = counts.out + counts.low

  // The one sentence someone should be able to read and then leave.
  const headline = loading
    ? 'Loading students'
    : needsAttention === 0
      ? `All ${counts.all} active students have lunches left.`
      : `${needsAttention} of ${counts.all} active students need a payment` +
        (counts.out > 0 ? `, ${counts.out} of them already out.` : '.')

  return (
    <div className="aca-v2" style={{ width: '100%', maxWidth: 1200, padding: '4px 0 48px' }}>
      {/* Page header: title, the answer, then the one primary action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 className="v2-title">Students</h1>
          <p
            className="v2-caption"
            style={{ margin: '4px 0 0', color: needsAttention > 0 ? 'var(--v2-text)' : 'var(--v2-text-2)' }}
          >
            {headline}
          </p>
        </div>
        <Link href="/admin/students/new" className="v2-btn v2-btn-primary">
          <Plus size={16} aria-hidden />
          Add student
        </Link>
      </div>

      {/* Counts are the filters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {([
          ['all', 'All active', counts.all, 'var(--v2-text)'],
          ['out', 'Out of lunches', counts.out, 'var(--v2-red-text)'],
          ['low', 'Running low', counts.low, 'var(--v2-amber-text)'],
          ['ok', 'OK', counts.ok, 'var(--v2-text)'],
          ['unlimited', 'Unlimited', counts.unlimited, 'var(--v2-text)'],
        ] as const).map(([key, label, n, color]) => (
          <button
            key={key}
            type="button"
            className="v2-tile"
            aria-pressed={tile === key}
            onClick={() => setTile(key as Tile)}
          >
            <span className="v2-tile-num" style={{ color: n > 0 ? color : 'var(--v2-text-3)' }}>
              {loading ? '—' : n}
            </span>
            <span className="v2-tile-label" style={{ display: 'block' }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Search: the way you look one person up */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 420 }}>
        <Search
          size={16}
          aria-hidden
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--v2-text-3)',
          }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, barcode or parent"
          aria-label="Search students by name, barcode or parent"
          style={{
            width: '100%',
            minHeight: 36,
            padding: '8px 32px 8px 36px',
            font: '400 14px/20px var(--v2-sans)',
            color: 'var(--v2-text)',
            background: 'var(--v2-surface)',
            border: '1px solid var(--v2-border)',
            borderRadius: 'var(--v2-r-chip)',
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 0,
              cursor: 'pointer',
              color: 'var(--v2-text-3)',
              lineHeight: 0,
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="v2-card" style={{ overflow: 'hidden' }}>
        <table className="v2-table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Student</th>
              <th>Status</th>
              <th className="v2-num">Balance</th>
              <th>Level</th>
              <th>Parent</th>
              <th className="v2-num">Barcode</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ color: 'var(--v2-text-2)', padding: 24 }}>
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              visible.map(s => (
                <tr key={s.id}>
                  <td data-label="Student">
                    <Link
                      href={`/admin/students/${s.id}`}
                      style={{ color: 'var(--v2-link)', fontWeight: 500, textDecoration: 'none' }}
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td data-label="Status">
                    {s.unlimited ? (
                      <span className="v2-chip">Unlimited plan</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span className={`v2-dot ${STATE_DOT[s.state]}`} aria-hidden />
                        <span style={{ color: STATE_TEXT[s.state] }}>{STATE_WORD[s.state]}</span>
                      </span>
                    )}
                  </td>
                  <td
                    data-label="Balance"
                    className="v2-num"
                    style={{ color: s.unlimited ? 'var(--v2-text-3)' : STATE_TEXT[s.state] }}
                  >
                    {s.unlimited ? '—' : s.balance}
                  </td>
                  <td data-label="Level" style={{ color: 'var(--v2-text-2)' }}>
                    {s.schoolLevel === 'elementary' ? 'Elementary' : 'High school'}
                  </td>
                  <td data-label="Parent" style={{ color: 'var(--v2-text-2)' }}>
                    {s.parent.name}
                  </td>
                  <td data-label="Barcode" className="v2-num" style={{ color: 'var(--v2-text-2)' }}>
                    {s.barcode}
                  </td>
                </tr>
              ))}

            {/* An empty state that says what to do next */}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 24 }}>
                  <p style={{ margin: 0 }}>
                    No students match {search ? `"${search}"` : 'this filter'}.
                  </p>
                  <p className="v2-caption" style={{ margin: '4px 0 12px' }}>
                    {counts.all} active students in total.
                  </p>
                  <button
                    type="button"
                    className="v2-btn"
                    onClick={() => {
                      setSearch('')
                      setTile('all')
                    }}
                  >
                    Show all students
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* The thing that is true of every row, said once instead of 300 times */}
      <p className="v2-caption" style={{ margin: '12px 2px 0' }}>
        Running low means at or below {getLowBalanceThreshold('elementary', thresholds)} lunches for
        elementary and {getLowBalanceThreshold('high_school', thresholds)} for high school, the same
        thresholds that decide who gets a balance email. Change them in{' '}
        <Link href="/admin/settings">Settings</Link>.
      </p>
    </div>
  )
}
