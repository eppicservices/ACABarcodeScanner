'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getStudentById,
  updateStudent,
  deleteStudent,
} from '@/actions/students'
import { getAllParents } from '@/actions/parents'
import {
  getStudentTransactions,
  addLunchesFromPayment,
  adjustBalance,
} from '@/actions/transactions'
import { getLunchSettings } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { SchoolLevel } from '@prisma/client'

interface Parent {
  id: string
  name: string
  email: string
  phone: string | null
}

interface StudentWithParent {
  id: string
  name: string
  barcode: string
  balance: number
  schoolLevel: SchoolLevel
  isActive: boolean
  parentId: string
  parent: Parent
}

interface BalanceTransaction {
  id: string
  studentId: string
  lunchesChange: number
  previousLunches: number
  newLunches: number
  transactionType: string
  notes: string | null
  createdAt: Date
}

interface LunchSettings {
  elementaryLunchPrice: number
  highschoolLunchPrice: number
  highschoolLunchCardPrice: number
  highschoolLunchCardLunches: number
  elementaryNegativeLimit: number
  highschoolNegativeLimit: number
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [student, setStudent] = useState<StudentWithParent | null>(null)
  const [parents, setParents] = useState<Parent[]>([])
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([])
  const [settings, setSettings] = useState<LunchSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [schoolLevel, setSchoolLevel] = useState<'elementary' | 'high_school'>('elementary')
  const [parentId, setParentId] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Balance update
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState<'payment' | 'lunch_card' | 'adjustment'>('payment')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const router = useRouter()

  const fetchData = useCallback(async () => {
    const [studentData, parentsData, transactionsData, settingsData] = await Promise.all([
      getStudentById(id),
      getAllParents(),
      getStudentTransactions(id, 10),
      getLunchSettings(),
    ])

    if (studentData) {
      const s: StudentWithParent = {
        id: studentData.id,
        name: studentData.name,
        barcode: studentData.barcode,
        balance: studentData.balance,
        schoolLevel: studentData.schoolLevel,
        isActive: studentData.isActive,
        parentId: studentData.parentId,
        parent: studentData.parent,
      }
      setStudent(s)
      setName(s.name)
      setBarcode(s.barcode)
      setSchoolLevel(s.schoolLevel === 'elementary' ? 'elementary' : 'high_school')
      setParentId(s.parentId)
      setIsActive(s.isActive)
    }

    if (parentsData) {
      setParents(parentsData.map(p => ({ ...p, phone: null })))
    }

    if (transactionsData) {
      setTransactions(transactionsData.map(tx => ({
        id: tx.id,
        studentId: tx.studentId,
        lunchesChange: tx.lunchesChange,
        previousLunches: tx.previousLunches,
        newLunches: tx.newLunches,
        transactionType: tx.transactionType,
        notes: tx.notes,
        createdAt: tx.createdAt,
      })))
    }

    setSettings(settingsData || {
      elementaryLunchPrice: 4,
      highschoolLunchPrice: 6,
      highschoolLunchCardPrice: 50,
      highschoolLunchCardLunches: 10,
      elementaryNegativeLimit: -3,
      highschoolNegativeLimit: 0,
    })

    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      await updateStudent(id, {
        name,
        barcode,
        schoolLevel,
        parentId,
        isActive,
      })
      toast.success('Student updated successfully')
      setIsEditing(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student')
    }

    setSaving(false)
  }

  const handleCancelEdit = () => {
    if (student) {
      setName(student.name)
      setBarcode(student.barcode)
      setSchoolLevel(student.schoolLevel === 'elementary' ? 'elementary' : 'high_school')
      setParentId(student.parentId)
      setIsActive(student.isActive)
    }
    setIsEditing(false)
    setError(null)
  }

  async function handleBalanceUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!student || !settings) return

    let amount = parseFloat(paymentAmount)

    if (paymentType === 'lunch_card') {
      amount = settings.highschoolLunchCardPrice
    }

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const result = await addLunchesFromPayment(
      student.id,
      amount,
      paymentType === 'lunch_card'
    )

    if (!result.success) {
      setError(result.error || 'Failed to update balance')
      return
    }

    setShowBalanceModal(false)
    setPaymentAmount('')
    setPaymentNotes('')
    setPaymentType('payment')
    toast.success(`Added ${result.lunchesAdded} lunches (paid $${amount.toFixed(2)})`)
    fetchData()
  }

  async function handleManualAdjustment(e: React.FormEvent) {
    e.preventDefault()
    if (!student) return

    const lunches = parseInt(paymentAmount)
    if (isNaN(lunches) || lunches === 0) {
      setError('Please enter a valid number of lunches')
      return
    }

    const result = await adjustBalance(
      student.id,
      lunches,
      paymentNotes || 'Manual adjustment'
    )

    if (!result.success) {
      setError(result.error || 'Failed to adjust balance')
      return
    }

    setShowBalanceModal(false)
    setPaymentAmount('')
    setPaymentNotes('')
    setPaymentType('payment')
    toast.success(`Balance adjusted by ${lunches > 0 ? '+' : ''}${lunches} lunches`)
    fetchData()
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteStudent(id)
      router.push('/admin/students')
    } catch (err) {
      setError('Failed to delete student: ' + (err instanceof Error ? err.message : 'Unknown error'))
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const calculateLunches = () => {
    if (!settings || !student) return 0
    if (paymentType === 'lunch_card') return settings.highschoolLunchCardLunches
    const amount = parseFloat(paymentAmount) || 0
    const price = student.schoolLevel === 'elementary'
      ? settings.elementaryLunchPrice
      : settings.highschoolLunchPrice
    return Math.floor(amount / price)
  }

  if (loading) {
    return (
      <div className="max-w-[1000px]">
        <div className="mb-7">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <Skeleton className="h-64" />
          <div className="space-y-5">
            <Skeleton className="h-40" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
        <AlertCircle className="h-12 w-12 text-gray-300" />
        <p>Student not found</p>
        <Button variant="outline" asChild>
          <Link href="/admin/students">Back to Students</Link>
        </Button>
      </div>
    )
  }

  const lunchPrice = settings
    ? (student.schoolLevel === 'elementary' ? settings.elementaryLunchPrice : settings.highschoolLunchPrice)
    : 0

  return (
    <div className="max-w-[1000px]">
      {/* Page Header */}
      <div className="mb-7">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-gray-400 text-sm font-medium mb-4 px-3 py-1.5 -ml-3 rounded-lg hover:text-[var(--aca-teal)] hover:bg-[var(--aca-teal-subtle)] transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Students</span>
        </Link>

        <div className="flex items-center gap-4 max-[380px]:flex-col max-[380px]:items-start max-[380px]:gap-2.5">
          <div className="w-14 h-14 max-md:w-12 max-md:h-12 max-[380px]:w-11 max-[380px]:h-11 bg-gradient-to-br from-[var(--aca-teal)] to-[var(--aca-teal-dark)] rounded-2xl max-md:rounded-[14px] flex items-center justify-center text-white font-semibold text-[22px] max-md:text-xl max-[380px]:text-lg shadow-[0_4px_12px_rgba(0,177,193,0.3)]">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-[26px] max-md:text-xl max-[380px]:text-lg font-semibold text-[var(--aca-navy)] tracking-tight m-0">
              {student.name}
            </h1>
            <div className="flex items-center gap-2.5 mt-1.5 max-md:mt-1 flex-wrap">
              <Badge variant={student.schoolLevel === 'elementary' ? 'teal' : 'default'}>
                {student.schoolLevel === 'elementary' ? 'Elementary' : 'High School'}
              </Badge>
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded">
                {student.barcode}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Sidebar - Balance & Transactions (moves to top on mobile) */}
        <div className="lg:order-2 flex flex-col gap-5 max-md:gap-4 order-first lg:order-none">
          {/* Balance Card */}
          <Card className="max-md:flex max-md:flex-row max-md:items-center max-md:justify-between max-md:p-4 max-[380px]:flex-col max-[380px]:text-center max-[380px]:gap-3">
            <CardContent className="p-7 max-md:p-0 max-md:flex-1 text-center max-md:text-left">
              <h3 className="text-[11px] uppercase tracking-[0.08em] text-gray-400 font-semibold mb-4 max-md:hidden">
                Lunch Balance
              </h3>
              <div className={`text-5xl max-md:text-4xl max-[380px]:text-[32px] font-bold leading-none tracking-tight ${
                student.balance <= 0 ? 'text-red-500' : student.balance <= 3 ? 'text-red-500' : 'text-green-600'
              }`}>
                {student.balance}
                <span className="block max-md:inline max-md:ml-1 text-sm font-medium text-gray-400 mt-1 max-md:mt-0">
                  {student.balance === 1 ? 'lunch' : 'lunches'}
                </span>
              </div>
              <p className="text-[13px] text-gray-400 mt-3 max-md:hidden">
                ${lunchPrice.toFixed(2)} per lunch
              </p>
            </CardContent>
            <Button
              onClick={() => setShowBalanceModal(true)}
              className="max-md:flex-shrink-0 max-[380px]:w-full w-[calc(100%-56px)] mx-7 mb-7 max-md:m-0 max-md:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Lunches
            </Button>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardContent className="p-5 max-md:p-4">
              <h3 className="text-[11px] uppercase tracking-[0.08em] text-gray-400 font-semibold mb-4 max-md:mb-3">
                Recent Transactions
              </h3>
              {transactions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-5">No transactions yet</p>
              ) : (
                <ul className="space-y-0">
                  {transactions.map((tx) => (
                    <li key={tx.id} className="flex justify-between items-center py-3 max-md:py-2.5 border-b border-gray-100 last:border-0">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs max-md:text-[11px] font-semibold capitalize ${
                          tx.transactionType === 'payment' || tx.transactionType === 'lunch_card'
                            ? 'text-green-600'
                            : tx.transactionType === 'refund' || tx.transactionType === 'lunch_used'
                            ? 'text-red-500'
                            : 'text-[var(--aca-teal)]'
                        }`}>
                          {tx.transactionType === 'lunch_used' ? 'Used' : tx.transactionType}
                        </span>
                        <span className="text-[11px] max-md:text-[10px] text-gray-400">
                          {new Date(tx.createdAt!).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`font-mono font-semibold text-sm max-md:text-[13px] px-2 py-1 max-md:px-1.5 max-md:py-0.5 rounded ${
                        tx.lunchesChange >= 0
                          ? 'text-green-600 bg-green-50'
                          : 'text-red-500 bg-red-50'
                      }`}>
                        {tx.lunchesChange >= 0 ? '+' : ''}{tx.lunchesChange}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:order-1">
          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isEditing ? (
            <Card>
              <form onSubmit={handleSave}>
                <CardContent className="p-6 max-md:p-4">
                  <h2 className="text-[17px] max-md:text-base font-semibold text-gray-700 mb-6 max-md:mb-5">
                    Edit Student Information
                  </h2>

                  <div className="space-y-5 max-md:space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4 max-md:gap-0">
                      <div className="space-y-2 max-md:mb-4">
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input
                          id="barcode"
                          type="text"
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>School Level</Label>
                        <Select value={schoolLevel} onValueChange={(v) => setSchoolLevel(v as 'elementary' | 'high_school')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="elementary">Elementary</SelectItem>
                            <SelectItem value="high_school">High School</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Parent</Label>
                      <Select value={parentId} onValueChange={setParentId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a parent..." />
                        </SelectTrigger>
                        <SelectContent>
                          {parents.map((parent) => (
                            <SelectItem key={parent.id} value={parent.id}>
                              {parent.name} ({parent.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={isActive ? 'success' : 'outline'}
                          className="flex-1"
                          onClick={() => setIsActive(true)}
                        >
                          Active
                        </Button>
                        <Button
                          type="button"
                          variant={!isActive ? 'secondary' : 'outline'}
                          className="flex-1"
                          onClick={() => setIsActive(false)}
                        >
                          Inactive
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8 max-md:mt-6 pt-6 max-md:pt-4 border-t border-gray-100 max-md:flex-col-reverse">
                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="max-md:w-full">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} className="max-md:w-full">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 max-md:p-4">
                <div className="flex justify-between items-center mb-6 max-md:mb-4 pb-4 max-md:pb-3 border-b border-gray-100 max-md:flex-col max-md:items-start max-md:gap-3">
                  <h2 className="text-[17px] max-md:text-[15px] font-semibold text-gray-700">
                    Student Information
                  </h2>
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="max-md:w-full max-md:justify-center">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-2 max-md:grid-cols-1 gap-6 max-md:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs max-md:text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      Full Name
                    </span>
                    <span className="text-[15px] max-md:text-sm font-medium text-gray-700">
                      {student.name}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs max-md:text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      Barcode
                    </span>
                    <span className="text-[15px] max-md:text-sm font-medium text-gray-700">
                      <code className="bg-gray-100 px-3 max-md:px-2.5 py-1.5 max-md:py-1 rounded text-sm max-md:text-[13px] font-mono text-[var(--aca-teal)]">
                        {student.barcode}
                      </code>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs max-md:text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      School Level
                    </span>
                    <span className="text-[15px] max-md:text-sm font-medium text-gray-700">
                      <Badge variant={student.schoolLevel === 'elementary' ? 'teal' : 'default'}>
                        {student.schoolLevel === 'elementary' ? 'Elementary' : 'High School'}
                      </Badge>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs max-md:text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      Parent
                    </span>
                    <span className="text-[15px] max-md:text-sm font-medium">
                      <Link
                        href={`/admin/parents/${student.parentId}`}
                        className="inline-flex items-center gap-1 text-[var(--aca-teal)] hover:text-[var(--aca-teal-dark)] transition-colors group"
                      >
                        {student.parent.name}
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs max-md:text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      Status
                    </span>
                    <span className="text-[15px] max-md:text-sm font-medium text-gray-700">
                      <Badge variant={student.isActive ? 'success' : 'muted'}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </span>
                  </div>
                </div>

                <div className="mt-8 max-md:mt-5 pt-6 max-md:pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(true)}
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 max-md:w-full max-md:justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Student
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Lunches Modal */}
      <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
        <DialogContent className="max-w-[440px] max-md:max-w-full max-md:rounded-t-[20px] max-md:rounded-b-none">
          <DialogHeader>
            <DialogTitle>Add Lunches</DialogTitle>
          </DialogHeader>

          {!settings ? (
            <>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Unable to load lunch settings. Please try again.</AlertDescription>
              </Alert>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBalanceModal(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-[15px] max-md:text-sm mb-6 max-md:mb-5">
                Current balance: <strong className="text-gray-700">{student.balance} {student.balance === 1 ? 'lunch' : 'lunches'}</strong>
              </p>

              <form onSubmit={paymentType === 'adjustment' ? handleManualAdjustment : handleBalanceUpdate}>
                <div className="space-y-5 max-md:space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Type</Label>
                    <Select
                      value={paymentType}
                      onValueChange={(v) => {
                        setPaymentType(v as 'payment' | 'lunch_card' | 'adjustment')
                        setPaymentAmount('')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment">Cash Payment</SelectItem>
                        {student.schoolLevel === 'high_school' && (
                          <SelectItem value="lunch_card">Lunch Card ($50 for 10 lunches)</SelectItem>
                        )}
                        <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentType === 'payment' && (
                    <div className="space-y-2">
                      <Label>Amount Paid ($)</Label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        required
                      />
                      {parseFloat(paymentAmount) > 0 && (
                        <p className="text-sm text-green-600 mt-2">
                          = <strong>{calculateLunches()} lunches</strong> at ${lunchPrice.toFixed(2)} each
                        </p>
                      )}
                    </div>
                  )}

                  {paymentType === 'lunch_card' && (
                    <div className="bg-gradient-to-br from-[var(--aca-gold-subtle)] to-amber-100 border-2 border-[var(--aca-gold)] rounded-lg p-5 max-md:p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl max-md:text-xl font-bold text-[var(--aca-gold-dark)]">
                          ${settings.highschoolLunchCardPrice.toFixed(2)}
                        </span>
                        <span className="text-lg max-md:text-base font-semibold text-[var(--aca-navy)]">
                          {settings.highschoolLunchCardLunches} lunches
                        </span>
                      </div>
                      <p className="text-[13px] max-md:text-xs text-green-600 m-0">
                        ${(settings.highschoolLunchCardPrice / settings.highschoolLunchCardLunches).toFixed(2)} per lunch (save ${(settings.highschoolLunchPrice - settings.highschoolLunchCardPrice / settings.highschoolLunchCardLunches).toFixed(2)} per lunch)
                      </p>
                    </div>
                  )}

                  {paymentType === 'adjustment' && (
                    <div className="space-y-2">
                      <Label>Lunches to Add/Remove</Label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Enter positive or negative number"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1.5">Use negative number to remove lunches</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="e.g., Cash payment"
                    />
                  </div>
                </div>

                <DialogFooter className="mt-7 max-md:mt-6 max-md:flex-col-reverse max-md:gap-2.5">
                  <Button type="button" variant="outline" onClick={() => setShowBalanceModal(false)} className="max-md:w-full">
                    Cancel
                  </Button>
                  <Button type="submit" className="max-md:w-full">
                    {paymentType === 'adjustment' ? 'Adjust Balance' : 'Add Lunches'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => !deleting && setShowDeleteModal(open)}>
        <DialogContent className="max-w-[400px] text-center max-md:max-w-full max-md:rounded-t-[20px] max-md:rounded-b-none">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center">Delete Student</DialogTitle>
          </DialogHeader>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            Are you sure you want to delete <strong className="text-gray-700">{student.name}</strong>? This will permanently remove all their data including transaction history.
          </p>
          <p className="text-red-500 text-[13px] font-medium mb-6">
            This action cannot be undone.
          </p>
          <DialogFooter className="max-md:flex-col-reverse max-md:gap-2.5">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting} className="max-md:w-full">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="max-md:w-full">
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Student'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
