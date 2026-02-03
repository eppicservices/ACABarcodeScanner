import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeParentPayments } from '../src/lib/parent-portal'

const settings = {
  elementaryLunchPrice: 3.5,
  highschoolLunchPrice: 4.0,
  highschoolLunchCardPrice: 50.0,
  highschoolLunchCardLunches: 15,
}

const students = [
  { id: 's1', name: 'Ellie', schoolLevel: 'elementary' as const },
  { id: 's2', name: 'Hank', schoolLevel: 'high_school' as const },
]

test('sanitizes valid payments and returns computed totals', () => {
  const { payments, totalAmount } = sanitizeParentPayments(
    [
      { student_id: 's1', amount: 7, is_lunch_card: false },
      { student_id: 's2', amount: 50, is_lunch_card: true },
    ],
    students,
    settings
  )

  assert.equal(payments.length, 2)
  assert.equal(payments[0].lunchesToAdd, 2) // 7 / 3.5
  assert.equal(payments[1].lunchesToAdd, 15) // lunch card\n  assert.equal(totalAmount, 57)
})

test('rejects payments that compute to zero lunches', () => {
  assert.throws(() =>
    sanitizeParentPayments(
      [{ student_id: 's1', amount: 1, is_lunch_card: false }],
      students,
      settings
    )
  )
})

test('rejects payments for students not in list', () => {
  assert.throws(() =>
    sanitizeParentPayments(
      [{ student_id: 'nope', amount: 10, is_lunch_card: false }],
      students,
      settings
    )
  )
})
