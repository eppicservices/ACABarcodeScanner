'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getParentsWithStudents, type ParentWithStudents } from '@/actions/parents'
import { getSettingsForClient, type SerializedAppSettings } from '@/actions/settings'
import { calculateLunches } from '@/lib/parent-portal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DollarSign,
  Search,
  Users,
  User,
  CheckCircle,
  XCircle,
  CreditCard,
  Loader2,
} from 'lucide-react'
import type { SchoolLevel } from '@prisma/client'

interface StudentAmount {
  studentId: string
  amount: string
  isLunchCard: boolean
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'zeffy', label: 'Zeffy' },
  { value: 'other', label: 'Other' },
]

function AddPaymentContent() {
  const searchParams = useSearchParams()
  const preselectedParentId = searchParams.get('parent')

  const [parents, setParents] = useState<ParentWithStudents[]>([])
  const [selectedParent, setSelectedParent] = useState<ParentWithStudents | null>(null)
  const [settings, setSettings] = useState<SerializedAppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [amounts, setAmounts] = useState<StudentAmount[]>([])
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSelectParent = useCallback((parent: ParentWithStudents) => {
    setSelectedParent(parent)
    const activeStudents = parent.students.filter(s => s.isActive)
    setAmounts(activeStudents.map(s => ({
      studentId: s.id,
      amount: '',
      isLunchCard: false
    })))
    setMessage(null)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [parentsData, settingsData] = await Promise.all([
        getParentsWithStudents(),
        getSettingsForClient()
      ])

      setParents(parentsData)
      setSelectedParent(prev => {
        if (prev) {
          const updatedParent = parentsData.find((p) => p.id === prev.id)
          if (updatedParent) {
            return updatedParent
          }
        }
        return prev
      })

      if (settingsData) {
        setSettings(settingsData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (preselectedParentId && parents.length > 0 && !selectedParent) {
      const parent = parents.find(p => p.id === preselectedParentId)
      if (parent) {
        handleSelectParent(parent)
      }
    }
  }, [preselectedParentId, parents, selectedParent, handleSelectParent])

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

  function getPaymentItems() {
    if (!selectedParent || !settings) return []

    return amounts
      .filter(a => parseFloat(a.amount) > 0)
      .map(a => {
        const student = selectedParent.students.find(s => s.id === a.studentId)!
        const amount = parseFloat(a.amount)
        const lunches = calculateLunches(amount, student.schoolLevel as 'elementary' | 'high_school', settings, a.isLunchCard)
        return {
          studentId: a.studentId,
          studentName: student.name,
          amount,
          lunchesToAdd: lunches,
          isLunchCard: a.isLunchCard,
          newBalance: student.balance + lunches
        }
      })
  }

  async function handleSubmit() {
    if (!selectedParent || getTotal() === 0) return

    setSubmitting(true)
    setMessage(null)

    try {
      const paymentItems = getPaymentItems().map(item => ({
        student_id: item.studentId,
        student_name: item.studentName,
        amount: item.amount,
        lunches_to_add: item.lunchesToAdd,
        is_lunch_card: item.isLunchCard,
        new_balance: item.newBalance
      }))

      const res = await fetch('/api/admin/cash-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: selectedParent.id,
          student_payments: paymentItems,
          total_amount: getTotal(),
          payment_method: paymentMethod,
          notes: notes || null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to process payment' })
        setSubmitting(false)
        return
      }

      setMessage({ type: 'success', text: 'Payment recorded successfully! Receipt email sent to parent.' })

      setAmounts(selectedParent.students.filter(s => s.isActive).map(s => ({
        studentId: s.id,
        amount: '',
        isLunchCard: false
      })))
      setNotes('')
      setPaymentMethod('cash')

      fetchData()
    } catch {
      setMessage({ type: 'error', text: 'Failed to process payment. Please try again.' })
    }

    setSubmitting(false)
  }

  const filteredParents = parents.filter(p =>
    p.isActive &&
    p.students.some(s => s.isActive) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const total = getTotal()
  const paymentItems = getPaymentItems()

  if (loading) {
    return (
      <div className="max-w-[1200px]">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-[14px]" />
          <div>
            <Skeleton className="h-7 w-40 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid md:grid-cols-[320px_1fr] gap-6">
          <Card>
            <CardContent className="p-5 space-y-4">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px]">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-[14px] flex items-center justify-center text-green-600 shadow-sm">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[26px] font-semibold text-[var(--aca-navy)] tracking-tight m-0">
              Add Payment
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Record payments received from parents
            </p>
          </div>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={`mb-5 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-[320px_1fr] gap-6">
        {/* Parent Selector */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <h2 className="text-base font-semibold text-gray-700 m-0">Select Parent</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col gap-2 max-h-[500px] md:max-h-[500px] max-[900px]:max-h-[200px] overflow-y-auto">
              {filteredParents.map(parent => (
                <button
                  key={parent.id}
                  className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    selectedParent?.id === parent.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelectParent(parent)}
                >
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-semibold flex-shrink-0">
                    {parent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold text-gray-700 text-sm">{parent.name}</span>
                    <span className="text-xs text-gray-500 truncate">{parent.email}</span>
                    <span className="text-[11px] text-gray-400 mt-0.5">
                      {parent.students.filter(s => s.isActive).length} student{parent.students.filter(s => s.isActive).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="min-h-[400px]">
          <CardContent className="p-6">
            {!selectedParent ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 gap-4">
                <Users className="h-12 w-12" />
                <p className="text-[15px]">Select a parent to enter payment</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
                  <h2 className="text-lg font-semibold text-[var(--aca-navy)] m-0">
                    Payment for {selectedParent.name}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedParent(null)}>
                    Change Parent
                  </Button>
                </div>

                <div className="flex flex-col gap-5">
                  {selectedParent.students.filter(s => s.isActive).map(student => {
                    const studentAmount = getStudentAmount(student.id)
                    const amount = parseFloat(studentAmount.amount) || 0
                    const lunches = amount > 0 && settings
                      ? calculateLunches(amount, student.schoolLevel as 'elementary' | 'high_school', settings, studentAmount.isLunchCard)
                      : 0
                    const pricePerLunch = settings
                      ? (student.schoolLevel === 'elementary'
                          ? Number(settings.elementaryLunchPrice)
                          : Number(settings.highschoolLunchPrice))
                      : 0
                    const newBalance = student.balance + lunches

                    return (
                      <div key={student.id} className="bg-gray-50 rounded-lg p-5">
                        {/* Student Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[var(--aca-navy)] to-[#1e4a7a] text-white rounded-xl flex items-center justify-center text-xl font-semibold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-700 text-base m-0">{student.name}</h3>
                            <span className="text-[13px] text-gray-500">
                              {student.schoolLevel === 'elementary' ? 'Elementary' : 'High School'} • ${pricePerLunch.toFixed(2)}/lunch
                            </span>
                          </div>
                        </div>

                        {/* Balance Display */}
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <div className="flex items-center py-1.5">
                            <span className="text-[13px] text-gray-600 flex-shrink-0">Current balance</span>
                            <span className="flex-1 border-b-2 border-dotted border-gray-200 mx-3 min-w-5" />
                            <span className={`text-sm font-semibold flex-shrink-0 ${student.balance <= 0 ? 'text-red-600' : 'text-gray-700'}`}>
                              {student.balance} lunches
                            </span>
                            <span className={`w-2 h-2 rounded-full ml-2 flex-shrink-0 ${student.balance <= 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                          </div>
                          {lunches > 0 && (
                            <>
                              <div className="flex items-center py-1.5 opacity-80">
                                <span className="text-[13px] text-gray-600 flex-shrink-0">Adding</span>
                                <span className="flex-1 border-b-2 border-dotted border-gray-200 mx-3 min-w-5" />
                                <span className="text-sm font-semibold text-green-600 flex-shrink-0">+{lunches} lunches</span>
                              </div>
                              <div className="h-px bg-gray-200 my-2" />
                              <div className="flex items-center py-1.5">
                                <span className="text-[13px] text-gray-600 flex-shrink-0">New balance</span>
                                <span className="flex-1 border-b-2 border-dotted border-gray-200 mx-3 min-w-5" />
                                <span className="text-[15px] font-semibold text-gray-700 flex-shrink-0">{newBalance} lunches</span>
                                <span className="w-2 h-2 rounded-full bg-green-500 ml-2 flex-shrink-0" />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Amount Input */}
                        <div>
                          <Label className="text-[13px] mb-2">Amount</Label>
                          <div className="flex items-center bg-white border-2 border-gray-200 rounded-lg overflow-hidden mb-3 focus-within:border-[var(--aca-teal)]">
                            <span className="pl-3.5 text-gray-400 font-medium">$</span>
                            <input
                              type="number"
                              className="flex-1 border-none py-3 px-2 text-lg font-semibold outline-none w-full"
                              placeholder="0.00"
                              value={studentAmount.amount}
                              onChange={e => updateAmount(student.id, e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => addQuickAmount(student.id, 20)}>+$20</Button>
                            <Button variant="outline" size="sm" onClick={() => addQuickAmount(student.id, 50)}>+$50</Button>
                            <Button variant="outline" size="sm" onClick={() => addQuickAmount(student.id, 100)}>+$100</Button>
                            {student.schoolLevel === 'high_school' && settings && (
                              <Button
                                variant={studentAmount.isLunchCard ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setLunchCard(student.id)}
                                className={studentAmount.isLunchCard
                                  ? 'bg-[var(--aca-gold)] hover:bg-[var(--aca-gold-dark)] text-white'
                                  : 'bg-[var(--aca-gold-subtle)] border-[var(--aca-gold)] text-[var(--aca-gold-dark)] hover:bg-[var(--aca-gold)] hover:text-white'
                                }
                              >
                                <CreditCard className="h-3.5 w-3.5 mr-1" />
                                Lunch Card ${Number(settings.highschoolLunchCardPrice)}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Payment Summary */}
                {total > 0 && (
                  <div className="bg-gray-50 rounded-lg p-5 mt-6">
                    <h3 className="text-[15px] font-semibold text-gray-700 mb-4 m-0">Payment Summary</h3>
                    <div className="flex flex-col gap-2 mb-4">
                      {paymentItems.map(item => (
                        <div key={item.studentId} className="flex justify-between text-sm text-gray-600">
                          <span>{item.studentName}</span>
                          <span>
                            ${item.amount.toFixed(2)} ({item.lunchesToAdd} {item.lunchesToAdd === 1 ? 'lunch' : 'lunches'})
                            {item.isLunchCard && (
                              <Badge variant="default" className="ml-1.5 bg-[var(--aca-gold-subtle)] text-[var(--aca-gold-dark)] text-[10px] px-1.5 py-0">
                                Card
                              </Badge>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-4 border-t border-gray-200 font-bold text-base text-gray-700">
                      <span>Total Payment</span>
                      <span>${total.toFixed(2)}</span>
                    </div>

                    {/* Payment Method */}
                    <div className="mt-4">
                      <Label className="text-[13px] mb-2">Payment Method</Label>
                      <div className="flex flex-wrap gap-2">
                        {PAYMENT_METHODS.map(method => (
                          <Button
                            key={method.value}
                            type="button"
                            variant={paymentMethod === method.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPaymentMethod(method.value)}
                            className={paymentMethod === method.value ? 'bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-100' : ''}
                          >
                            {method.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-4">
                      <Label htmlFor="notes" className="text-[13px] mb-1.5">Notes (optional)</Label>
                      <Input
                        id="notes"
                        type="text"
                        placeholder="e.g., Check #1234, Receipt #567"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      className="w-full mt-5"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Record Payment - $${total.toFixed(2)}`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AddPaymentPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1200px]">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-[14px]" />
          <div>
            <Skeleton className="h-7 w-40 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid md:grid-cols-[320px_1fr] gap-6">
          <Card>
            <CardContent className="p-5 space-y-4">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <AddPaymentContent />
    </Suspense>
  )
}
