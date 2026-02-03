import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateLunches } from '../src/lib/parent-portal'

const settings = {
  elementaryLunchPrice: 3.5,
  highschoolLunchPrice: 4.0,
  highschoolLunchCardPrice: 50.0,
  highschoolLunchCardLunches: 15,
}

test('elementary lunches are floored from amount', () => {
  const lunches = calculateLunches(10, 'elementary', settings, false)
  assert.equal(lunches, 2) // 10 / 3.5 = 2.85 → 2
})

test('high school lunches are floored from amount', () => {
  const lunches = calculateLunches(10, 'high_school', settings, false)
  assert.equal(lunches, 2) // 10 / 4 = 2.5 → 2
})

test('high school lunch card grants fixed lunches per card', () => {
  const lunches = calculateLunches(50, 'high_school', settings, true)
  assert.equal(lunches, 15)
})

test('multiple lunch cards scale linearly', () => {
  const lunches = calculateLunches(120, 'high_school', settings, true)
  assert.equal(lunches, 30) // floor(120/50)=2 cards => 30 lunches
})

test('amount too low yields zero lunches', () => {
  const lunches = calculateLunches(1, 'elementary', settings, false)
  assert.equal(lunches, 0)
})
