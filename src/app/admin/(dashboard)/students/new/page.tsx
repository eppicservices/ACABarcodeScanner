'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createStudent } from '@/actions/students'
import { getAllParents, createParent } from '@/actions/parents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  UserPlus,
  ChevronLeft,
  AlertCircle,
  AlertTriangle,
  Barcode,
  Loader2,
  Plus,
  User,
  Mail,
  Phone,
} from 'lucide-react'

interface Parent {
  id: string
  name: string
  email: string
}

export default function NewStudentPage() {
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [schoolLevel, setSchoolLevel] = useState<'elementary' | 'high_school'>('elementary')
  const [studentType, setStudentType] = useState<'regular' | 'staff_faculty' | 'student_unlimited'>('regular')
  const [parentId, setParentId] = useState('')
  const [balance, setBalance] = useState('0')

  const [showNewParentModal, setShowNewParentModal] = useState(false)
  const [newParentName, setNewParentName] = useState('')
  const [newParentEmail, setNewParentEmail] = useState('')
  const [newParentPhone, setNewParentPhone] = useState('')
  const [creatingParent, setCreatingParent] = useState(false)
  const [parentError, setParentError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedParentId = searchParams.get('parent')

  async function fetchParents() {
    const data = await getAllParents()
    if (data) {
      setParents(data)
      if (preselectedParentId && data.some(p => p.id === preselectedParentId)) {
        setParentId(preselectedParentId)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchParents()
  }, [preselectedParentId])

  async function handleCreateParent(e: React.FormEvent) {
    e.preventDefault()
    setParentError(null)
    setCreatingParent(true)

    try {
      const newParent = await createParent({
        name: newParentName,
        email: newParentEmail,
        phone: newParentPhone || undefined,
      })

      setParents(prev => [...prev, { id: newParent.id, name: newParent.name, email: newParent.email }].sort((a, b) => a.name.localeCompare(b.name)))
      setParentId(newParent.id)
      setNewParentName('')
      setNewParentEmail('')
      setNewParentPhone('')
      setShowNewParentModal(false)
    } catch (err) {
      setParentError(err instanceof Error ? err.message : 'Failed to create parent')
    } finally {
      setCreatingParent(false)
    }
  }

  function handleParentSelectChange(value: string) {
    if (value === '__new__') {
      setShowNewParentModal(true)
    } else {
      setParentId(value)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!parentId) {
      setError('Please select a parent or guardian before creating a student.')
      return
    }

    setSaving(true)

    try {
      await createStudent({
        name,
        barcode,
        schoolLevel,
        studentType,
        parentId,
        balance: studentType === 'regular' ? (parseInt(balance) || 0) : 0,
      })
      router.push(preselectedParentId ? `/admin/parents/${preselectedParentId}` : '/admin/students')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-[640px]">
        <div className="mb-7">
          <Skeleton className="h-5 w-32 mb-5" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-[14px]" />
            <div>
              <Skeleton className="h-7 w-48 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="p-7 space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-[640px]">
      {/* Page Header */}
      <div className="mb-7">
        <Link
          href={preselectedParentId ? `/admin/parents/${preselectedParentId}` : '/admin/students'}
          className="inline-flex items-center gap-1.5 text-gray-400 text-sm font-medium mb-5 px-3 py-1.5 -ml-3 rounded-lg hover:text-[var(--aca-teal)] hover:bg-[var(--aca-teal-subtle)] transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>{preselectedParentId ? 'Back to Parent' : 'Back to Students'}</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--aca-teal-subtle)] to-white border border-gray-100 rounded-[14px] flex items-center justify-center text-[var(--aca-teal)] shadow-sm">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[26px] font-semibold text-[var(--aca-navy)] tracking-tight m-0">
              Add New Student
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Create a new student account for lunch tracking
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          {/* Student Details Section */}
          <CardContent className="p-7 border-b border-gray-100">
            <h2 className="text-[15px] font-semibold text-gray-700 mb-5">Student Details</h2>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Student Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode / Student ID</Label>
                  <div className="relative">
                    <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
                    <Input
                      id="barcode"
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="1001"
                      required
                      className="pl-11"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">This will be scanned during lunch check-in</p>
                </div>

                <div className="space-y-2">
                  <Label>School Level</Label>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 border-2 rounded-lg font-semibold text-sm transition-all ${
                        schoolLevel === 'elementary'
                          ? 'border-[var(--aca-teal)] bg-[var(--aca-teal-subtle)] text-[var(--aca-teal)]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                      onClick={() => setSchoolLevel('elementary')}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Elementary
                    </button>
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 border-2 rounded-lg font-semibold text-sm transition-all ${
                        schoolLevel === 'high_school'
                          ? 'border-[var(--aca-teal)] bg-[var(--aca-teal-subtle)] text-[var(--aca-teal)]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                      onClick={() => setSchoolLevel('high_school')}
                    >
                      <div className="w-2 h-2 rounded-full bg-[var(--aca-gold)]" />
                      High School
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Student Type</Label>
                <div className="flex gap-2.5 flex-wrap">
                  <button
                    type="button"
                    className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3.5 px-4 border-2 rounded-lg font-semibold text-sm transition-all ${
                      studentType === 'regular'
                        ? 'border-[var(--aca-teal)] bg-[var(--aca-teal-subtle)] text-[var(--aca-teal)]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                    onClick={() => setStudentType('regular')}
                  >
                    Regular
                  </button>
                  <button
                    type="button"
                    className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3.5 px-4 border-2 rounded-lg font-semibold text-sm transition-all ${
                      studentType === 'staff_faculty'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                    onClick={() => setStudentType('staff_faculty')}
                  >
                    Staff/Faculty
                  </button>
                  <button
                    type="button"
                    className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3.5 px-4 border-2 rounded-lg font-semibold text-sm transition-all ${
                      studentType === 'student_unlimited'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                    onClick={() => setStudentType('student_unlimited')}
                  >
                    Unlimited Plan
                  </button>
                </div>
                {studentType !== 'regular' && (
                  <p className="text-xs text-purple-600 mt-1.5">Unlimited meal accounts do not require or track balance</p>
                )}
              </div>
            </div>
          </CardContent>

          {/* Account Setup Section */}
          <CardContent className="p-7 border-b border-gray-100">
            <h2 className="text-[15px] font-semibold text-gray-700 mb-5">Account Setup</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent / Guardian</Label>
                <Select value={parentId} onValueChange={handleParentSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.name} ({parent.email})
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__" className="text-[var(--aca-teal)] font-medium">
                      <span className="flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Create New Parent
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {studentType === 'regular' && (
                <div className="space-y-2">
                  <Label htmlFor="balance">Starting Lunches</Label>
                  <div className="flex items-center gap-2.5">
                    <Input
                      id="balance"
                      type="number"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      step="1"
                      min="0"
                      className="w-24 text-center text-lg font-semibold font-mono"
                    />
                    <span className="text-sm font-medium text-gray-500">lunches</span>
                  </div>
                </div>
              )}
            </div>

            {parents.length === 0 && (
              <Alert className="mt-5 bg-amber-50 border-amber-300 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong className="block mb-1">No parents available</strong>
                  <span className="text-[13px] opacity-90">
                    <button
                      type="button"
                      className="underline font-semibold hover:opacity-80"
                      onClick={() => setShowNewParentModal(true)}
                    >
                      Create a parent
                    </button>{' '}
                    before adding students.
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          {/* Form Actions */}
          <CardContent className="p-6 bg-gray-50 rounded-b-xl flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/admin/students">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving || parents.length === 0} className="w-full sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Student
                </>
              )}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* New Parent Modal */}
      <Dialog open={showNewParentModal} onOpenChange={setShowNewParentModal}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Create New Parent</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateParent}>
            <div className="space-y-5 py-4">
              {parentError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{parentError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newParentName">Parent Name *</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
                  <Input
                    id="newParentName"
                    type="text"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    placeholder="John Smith"
                    required
                    autoFocus
                    className="pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newParentEmail">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
                  <Input
                    id="newParentEmail"
                    type="email"
                    value={newParentEmail}
                    onChange={(e) => setNewParentEmail(e.target.value)}
                    placeholder="parent@email.com"
                    required
                    className="pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newParentPhone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
                  <Input
                    id="newParentPhone"
                    type="tel"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="pl-11"
                  />
                </div>
                <p className="text-xs text-gray-400">Optional</p>
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewParentModal(false)}
                disabled={creatingParent}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingParent} className="w-full sm:w-auto">
                {creatingParent ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Parent
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
