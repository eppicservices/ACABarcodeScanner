'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createParent } from '@/actions/parents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  ChevronLeft,
  AlertCircle,
  User,
  Mail,
  Phone,
  Bell,
  Loader2,
} from 'lucide-react'

export default function NewParentPage() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      await createParent({
        name,
        email,
        phone: phone || undefined,
      })
      router.push('/admin/parents')
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
              Create a parent account for student management
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
                  Create Parent
                </>
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
