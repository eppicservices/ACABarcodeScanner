'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createParentWithStudents } from '@/actions/parents'
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
  Users,
  ChevronLeft,
  AlertCircle,
  User,
  Mail,
  Phone,
  Bell,
  Loader2,
  Plus,
  Trash2,
  GraduationCap,
} from 'lucide-react'

interface StudentRow {
  id: string
  name: string
  schoolLevel: 'elementary' | 'high_school' | ''
  barcode: string
}

function createStudentRow(): StudentRow {
  return { id: crypto.randomUUID(), name: '', schoolLevel: '', barcode: '' }
}

export default function NewParentPage() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [students, setStudents] = useState<StudentRow[]>([])

  const router = useRouter()

  const addStudent = () => {
    setStudents((prev) => [...prev, createStudentRow()])
  }

  const removeStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  const updateStudent = (id: string, field: keyof StudentRow, value: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate students if any are added
    for (const student of students) {
      if (!student.name.trim()) {
        setError('All students must have a name')
        return
      }
      if (!student.schoolLevel) {
        setError(`Please select a school level for ${student.name || 'each student'}`)
        return
      }
    }

    setSaving(true)

    try {
      const result = await createParentWithStudents({
        parent: {
          name,
          email,
          phone: phone || undefined,
        },
        students: students.map((s) => ({
          name: s.name.trim(),
          schoolLevel: s.schoolLevel as 'elementary' | 'high_school',
          barcode: s.barcode.trim() || undefined,
        })),
      })
      router.push(`/admin/parents/${result?.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create parent')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-[640px]">
      {/* Page Header */}
      <div className="mb-7">
        <Link
          href="/admin/parents"
          className="inline-flex items-center gap-1.5 text-gray-400 text-sm font-medium mb-5 px-3 py-1.5 -ml-3 rounded-lg hover:text-[var(--aca-teal)] hover:bg-[var(--aca-teal-subtle)] transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Parents</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--aca-teal-subtle)] to-white border border-gray-100 rounded-[14px] flex items-center justify-center text-[var(--aca-teal)] shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[26px] font-semibold text-[var(--aca-navy)] tracking-tight m-0">
              Add New Parent
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Create a parent account and optionally add students
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
          {/* Contact Information Section */}
          <CardContent className="p-7 border-b border-gray-100">
            <h2 className="text-[15px] font-semibold text-gray-700 mb-5">Contact Information</h2>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    required
                    className="pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@email.com"
                    required
                    className="pl-11"
                  />
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-2">
                  <Bell className="h-3 w-3" />
                  This email will receive low balance notifications
                </p>
              </div>
            </div>
          </CardContent>

          {/* Additional Details Section */}
          <CardContent className="p-7 border-b border-gray-100">
            <h2 className="text-[15px] font-semibold text-gray-700 mb-5">
              Additional Details <span className="font-normal text-gray-400 text-[13px]">(Optional)</span>
            </h2>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-123-4567"
                  className="pl-11"
                />
              </div>
            </div>
          </CardContent>

          {/* Students Section */}
          <CardContent className="p-7 border-b border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-700">
                  Students <span className="font-normal text-gray-400 text-[13px]">(Optional)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">Add students now or later from the parent detail page</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStudent}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Student
              </Button>
            </div>

            {students.length === 0 ? (
              <button
                type="button"
                onClick={addStudent}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2.5 text-gray-400 hover:border-[var(--aca-teal)] hover:text-[var(--aca-teal)] transition-colors cursor-pointer bg-transparent"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Click to add a student</span>
              </button>
            ) : (
              <div className="space-y-4">
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    className="border border-gray-200 rounded-xl p-4 space-y-4 bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Student {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeStudent(student.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Student Name</Label>
                        <Input
                          type="text"
                          value={student.name}
                          onChange={(e) => updateStudent(student.id, 'name', e.target.value)}
                          placeholder="Student name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>School Level</Label>
                        <Select
                          value={student.schoolLevel}
                          onValueChange={(v) => updateStudent(student.id, 'schoolLevel', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="elementary">Elementary</SelectItem>
                            <SelectItem value="high_school">High School</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Barcode <span className="font-normal text-gray-400 text-[13px]">(auto-generated if empty)</span>
                      </Label>
                      <Input
                        type="text"
                        value={student.barcode}
                        onChange={(e) => updateStudent(student.id, 'barcode', e.target.value)}
                        placeholder="Leave blank to auto-generate"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Form Actions */}
          <CardContent className="p-6 bg-gray-50 rounded-b-xl flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/parents">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  {students.length > 0
                    ? `Create Parent & ${students.length} Student${students.length > 1 ? 's' : ''}`
                    : 'Create Parent'}
                </>
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
