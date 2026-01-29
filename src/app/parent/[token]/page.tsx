'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { AppSettings, Parent, Student } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader2 } from 'lucide-react'

type ParentWithStudents = Parent & { students: Student[] }

interface StudentPaymentItem {
  studentId: string
  studentName: string
  amount: number
  lunchesToAdd: number
  isLunchCard: boolean
}
import { getDaysUntilExpiry, calculateLunches } from '@/lib/parent-portal'

interface StudentAmount {
  studentId: string
  amount: string
  isLunchCard: boolean
}

export default function ParentPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parent, setParent] = useState<ParentWithStudents | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<StudentAmount[]>([])
  const [submitting, setSubmitting] = useState(false)

  const validateToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/parent-portal/validate/${token}`)
      const data = await res.json()

      if (!data.valid) {
        setError(data.error || 'Invalid link')
        setLoading(false)
        return
      }

      if (data.settings?.parentPortalEnabled === false) {
        setError('The parent portal is currently disabled. Please contact the school for assistance.')
        setLoading(false)
        return
      }

      setParent(data.parent)
      setSettings(data.settings)
      setExpiresAt(data.expiresAt)

      setAmounts(data.parent.students.map((s: Student) => ({
        studentId: s.id,
        amount: '',
        isLunchCard: false
      })))

      setLoading(false)
    } catch {
      setError('Failed to load. Please try again.')
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    validateToken()
  }, [validateToken])

  function updateAmount(studentId: string, value: string, isLunchCard: boolean = false) {
    setAmounts(prev => prev.map(a =>
      a.studentId === studentId
        ? { ...a, amount: value, isLunchCard }
        : a
    ))
  }

  function addQuickAmount(studentId: string, addValue: number) {
    setAmounts(prev => prev.map(a => {
      if (a.studentId !== studentId) return a
      const current = parseFloat(a.amount) || 0
      return { ...a, amount: (current + addValue).toFixed(2), isLunchCard: false }
    }))
  }

  function setLunchCard(studentId: string) {
    if (!settings) return
    setAmounts(prev => prev.map(a =>
      a.studentId === studentId
        ? { ...a, amount: Number(settings.highschoolLunchCardPrice).toFixed(2), isLunchCard: true }
        : a
    ))
  }

  function getStudentAmount(studentId: string): StudentAmount {
    return amounts.find(a => a.studentId === studentId) || { studentId: studentId, amount: '', isLunchCard: false }
  }

  function getTotal(): number {
    return amounts.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
  }

  function getMinimumPayment(student: Student): number {
    if (!settings || student.balance >= 0) return 0
    const pricePerLunch = student.schoolLevel === 'elementary'
      ? Number(settings.elementaryLunchPrice)
      : Number(settings.highschoolLunchPrice)
    return Math.abs(student.balance) * pricePerLunch
  }

  function hasUnmetMinimums(): boolean {
    if (!parent || !settings) return false
    return parent.students.some(student => {
      if (student.balance >= 0) return false
      const studentAmount = getStudentAmount(student.id)
      const amount = parseFloat(studentAmount.amount) || 0
      const minimum = getMinimumPayment(student)
      return amount > 0 && amount < minimum
    })
  }

  function getPaymentItems(): StudentPaymentItem[] {
    if (!settings || !parent) return []

    return amounts
      .filter(a => parseFloat(a.amount) > 0)
      .map(a => {
        const student = parent.students.find(s => s.id === a.studentId)!
        const amount = parseFloat(a.amount)
        const lunches = calculateLunches(amount, student.schoolLevel, settings, a.isLunchCard)
        return {
          studentId: a.studentId,
          studentName: student.name,
          amount,
          lunchesToAdd: lunches,
          isLunchCard: a.isLunchCard
        }
      })
  }

  async function handlePayNow() {
    const total = getTotal()
    if (total <= 0) return

    setSubmitting(true)

    try {
      const res = await fetch('/api/parent-portal/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          student_payments: getPaymentItems(),
          total_amount: total
        })
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.error || 'Failed to process payment')
        setSubmitting(false)
        return
      }

      const paymentUrl = new URL('https://your-payment-form.com/pay')
      paymentUrl.searchParams.set('amount', total.toFixed(2))
      paymentUrl.searchParams.set('payment_id', data.payment_id)
      paymentUrl.searchParams.set('parent_id', parent!.id)

      window.location.href = paymentUrl.toString()
    } catch {
      alert('Failed to process. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 max-[480px]:p-4 max-[360px]:p-3">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#2e8bc0]" />
          <p className="text-slate-500">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 max-[480px]:p-4 max-[360px]:p-3">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <div className="text-red-500 mb-2">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h1 className="text-slate-800 text-xl font-semibold m-0">Link Unavailable</h1>
          <p className="text-slate-500 m-0 mb-6">{error}</p>
          <Button asChild>
            <Link href="/parent/request-link">Request New Link</Link>
          </Button>
        </div>
      </div>
    )
  }

  const daysLeft = expiresAt ? getDaysUntilExpiry(expiresAt) : 0
  const total = getTotal()
  const paymentItems = getPaymentItems()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 max-[480px]:p-4 max-[360px]:p-3 sm:max-w-[600px] sm:mx-auto sm:py-10">
      {/* Header */}
      <header className="bg-[#002c5f] p-6 max-[480px]:p-[18px_16px] flex items-center justify-center rounded-xl shadow-sm mb-6 max-[480px]:mb-4">
        <Image
          src="https://www.aldersgatechristian.com/wp-content/uploads/2017/12/ACA-Logo_Horizontal_White_small.png"
          alt="Aldersgate Christian Academy"
          width={200}
          height={50}
          className="h-11 max-[480px]:h-9 w-auto"
          priority
        />
      </header>

      {/* Welcome Card */}
      <Card className="mb-6 max-[480px]:mb-4">
        <CardContent className="p-5 max-[480px]:p-4">
          <h2 className="text-lg max-[480px]:text-base font-semibold text-[#002c5f] m-0 mb-1">
            Welcome, {parent?.name}!
          </h2>
          <p className="text-slate-500 text-sm max-[480px]:text-[13px] m-0">
            View your children&apos;s lunch balances and add funds below.
          </p>
        </CardContent>
      </Card>

      {/* Students */}
      <div className="flex flex-col gap-4 max-[480px]:gap-3 mb-6 max-[480px]:mb-4 sm:gap-5">
        {parent?.students.map(student => {
          const studentAmount = getStudentAmount(student.id)
          const amount = parseFloat(studentAmount.amount) || 0
          const lunches = amount > 0 && settings
            ? calculateLunches(amount, student.schoolLevel, settings, studentAmount.isLunchCard)
            : 0
          const pricePerLunch = settings
            ? (student.schoolLevel === 'elementary'
                ? Number(settings.elementaryLunchPrice)
                : Number(settings.highschoolLunchPrice))
            : 0
          const newBalance = student.balance + lunches
          const minimumPayment = getMinimumPayment(student)
          const meetsMinimum = student.balance >= 0 || amount === 0 || amount >= minimumPayment

          return (
            <Card key={student.id} className="max-[480px]:p-4 sm:p-6">
              <CardContent className="p-5 max-[480px]:p-0 sm:p-0">
                {/* Student Header */}
                <div className="flex items-center gap-3 max-[480px]:gap-2.5 mb-4 max-[480px]:mb-3.5">
                  <div className="w-12 h-12 max-[480px]:w-[42px] max-[480px]:h-[42px] max-[360px]:w-[38px] max-[360px]:h-[38px] bg-gradient-to-br from-[#002c5f] to-[#1e4a7a] text-white rounded-xl flex items-center justify-center text-xl max-[480px]:text-lg max-[360px]:text-base font-semibold">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base max-[480px]:text-[15px] max-[360px]:text-sm font-semibold text-slate-800 m-0">
                      {student.name}
                    </h3>
                    <span className="text-[13px] max-[480px]:text-xs text-slate-500">
                      {student.schoolLevel === 'elementary' ? 'Elementary' : 'High School'}
                    </span>
                  </div>
                </div>

                {/* Balance Display */}
                <div className="bg-slate-50 rounded-lg p-4 max-[480px]:p-3.5 max-[480px]:px-4 mb-4 max-[480px]:mb-3.5">
                  <div className="flex items-center gap-2 py-2 max-[480px]:py-1.5">
                    <span className="text-sm max-[480px]:text-[13px] text-slate-600 whitespace-nowrap">Current balance</span>
                    <span className="flex-1 border-b-2 border-dotted border-slate-300 min-w-5 mx-1" />
                    <span className={`text-sm max-[480px]:text-[13px] font-semibold whitespace-nowrap ${
                      student.balance <= 0 ? 'text-red-500' : student.balance <= 3 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {student.balance} {student.balance === 1 ? 'lunch' : 'lunches'}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      student.balance <= 0 ? 'bg-red-500' : student.balance <= 3 ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                  </div>

                  {lunches > 0 && (
                    <>
                      <div className="flex items-center gap-2 py-2 max-[480px]:py-1.5 opacity-80">
                        <span className="text-sm max-[480px]:text-[13px] text-slate-600 whitespace-nowrap">Adding</span>
                        <span className="flex-1 border-b-2 border-dotted border-slate-300 min-w-5 mx-1" />
                        <span className="text-sm max-[480px]:text-[13px] font-semibold text-[#2e8bc0] whitespace-nowrap">
                          +{lunches} {lunches === 1 ? 'lunch' : 'lunches'}
                        </span>
                        {studentAmount.isLunchCard && (
                          <Badge variant="default" className="text-[11px] px-2 py-0.5 ml-2">Card</Badge>
                        )}
                      </div>

                      <div className="h-px bg-slate-200 my-1" />

                      <div className="flex items-center gap-2 py-2 max-[480px]:py-1.5 font-semibold">
                        <span className="text-sm max-[480px]:text-[13px] text-slate-600 whitespace-nowrap">New balance</span>
                        <span className="flex-1 border-b-2 border-dotted border-slate-300 min-w-5 mx-1" />
                        <span className={`text-sm max-[480px]:text-[13px] font-semibold whitespace-nowrap ${
                          newBalance <= 0 ? 'text-red-500' : newBalance <= 3 ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {newBalance} {newBalance === 1 ? 'lunch' : 'lunches'}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          newBalance <= 0 ? 'bg-red-500' : newBalance <= 3 ? 'bg-red-500' : 'bg-green-500'
                        }`} />
                      </div>

                      <div className="text-right text-[13px] max-[480px]:text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
                        ${amount.toFixed(2)} &middot; ${pricePerLunch.toFixed(2)}/lunch
                      </div>
                    </>
                  )}

                  {lunches === 0 && (
                    <div className="text-[13px] max-[480px]:text-xs text-slate-400 mt-2">
                      ${pricePerLunch.toFixed(2)} per lunch
                    </div>
                  )}
                </div>

                {/* Minimum Notice */}
                {student.balance < 0 && (
                  <div className="bg-amber-50 border border-amber-300 text-amber-800 px-3.5 py-2.5 max-[480px]:px-3 max-[480px]:py-2 rounded-lg mb-4 max-[480px]:mb-3.5 text-[13px] max-[480px]:text-xs text-center">
                    Minimum ${minimumPayment.toFixed(2)} required to clear balance
                  </div>
                )}

                {/* Add Funds */}
                <div className="border-t border-slate-200 pt-4 max-[480px]:pt-3.5">
                  <Label className="text-[13px] max-[480px]:text-xs font-semibold text-slate-600 mb-2 block">
                    Add Funds
                  </Label>
                  <div className="relative mb-3 max-[480px]:mb-2.5">
                    <span className="absolute left-3.5 max-[480px]:left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base max-[480px]:text-[15px]">$</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={studentAmount.amount}
                      onChange={e => updateAmount(student.id, e.target.value)}
                      min="0"
                      step="0.01"
                      className={`pl-8 max-[480px]:pl-7 h-12 max-[480px]:h-11 text-lg max-[480px]:text-base ${!meetsMinimum ? 'border-red-300 bg-red-50' : ''}`}
                    />
                  </div>
                  {!meetsMinimum && (
                    <span className="block text-red-600 text-xs mb-3 -mt-1.5">
                      Must be at least ${minimumPayment.toFixed(2)} to cover negative balance
                    </span>
                  )}

                  <div className="flex flex-wrap gap-2 max-[480px]:gap-1.5 max-[360px]:gap-1.5 mb-3 max-[480px]:mb-2.5">
                    <Button variant="outline" type="button" onClick={() => addQuickAmount(student.id, 20)} className="px-4 max-[480px]:px-3 max-[360px]:px-2.5 h-9 max-[480px]:h-8 text-sm max-[480px]:text-[13px] max-[360px]:text-xs">
                      +$20
                    </Button>
                    <Button variant="outline" type="button" onClick={() => addQuickAmount(student.id, 50)} className="px-4 max-[480px]:px-3 max-[360px]:px-2.5 h-9 max-[480px]:h-8 text-sm max-[480px]:text-[13px] max-[360px]:text-xs">
                      +$50
                    </Button>
                    <Button variant="outline" type="button" onClick={() => addQuickAmount(student.id, 100)} className="px-4 max-[480px]:px-3 max-[360px]:px-2.5 h-9 max-[480px]:h-8 text-sm max-[480px]:text-[13px] max-[360px]:text-xs">
                      +$100
                    </Button>
                    {student.schoolLevel === 'high_school' && settings && (
                      <Button
                        variant={studentAmount.isLunchCard ? 'default' : 'outline'}
                        type="button"
                        onClick={() => setLunchCard(student.id)}
                        className={`px-3 max-[480px]:px-2.5 h-9 max-[480px]:h-8 text-sm max-[480px]:text-xs max-[360px]:text-[11px] ${
                          studentAmount.isLunchCard
                            ? 'bg-amber-400 hover:bg-amber-500 border-amber-500'
                            : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        Lunch Card ${Number(settings.highschoolLunchCardPrice)}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Payment Summary */}
      {total > 0 && (
        <Card className="mb-6 max-[480px]:mb-4 shadow-lg sticky bottom-6 max-[480px]:bottom-4">
          <CardContent className="p-5 max-[480px]:p-4">
            <h3 className="text-base max-[480px]:text-[15px] font-semibold text-slate-800 m-0 mb-4 max-[480px]:mb-3.5">
              Payment Summary
            </h3>
            <div className="border-b border-slate-200 pb-3 mb-3">
              {paymentItems.map(item => (
                <div key={item.studentId} className="flex justify-between text-sm max-[480px]:text-[13px] text-slate-600 py-1">
                  <span>{item.studentName}</span>
                  <span>
                    ${item.amount.toFixed(2)} ({item.lunchesToAdd} {item.lunchesToAdd === 1 ? 'lunch' : 'lunches'})
                    {item.isLunchCard && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 ml-1.5">Card</Badge>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-lg max-[480px]:text-base font-bold text-slate-800 mb-4 max-[480px]:mb-3.5">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button
              onClick={handlePayNow}
              disabled={submitting || hasUnmetMinimums()}
              className="w-full h-14 max-[480px]:h-12 text-base max-[480px]:text-[15px] font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay Now - $${total.toFixed(2)}`
              )}
            </Button>
            {hasUnmetMinimums() && (
              <p className="text-red-600 text-[13px] text-center mt-3 m-0">
                Please meet minimum payment requirements above
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <footer className="text-center py-6 max-[480px]:py-4">
        <p className="text-[13px] max-[480px]:text-xs text-slate-500 m-0 mb-2">
          This link expires in <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong>
        </p>
        <Link href="/parent/request-link" className="text-sm max-[480px]:text-[13px] text-[#2e8bc0] hover:underline">
          Request a new link
        </Link>
      </footer>
    </div>
  )
}
