'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function RequestLinkPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/parent-portal/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send link')
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center p-6 max-[480px]:p-4 max-[480px]:items-start max-[480px]:pt-10 max-[360px]:p-3 max-[360px]:pt-6 bg-gradient-to-br from-[#002c5f] to-[#1e4a7a]">
      <Card className="w-full max-w-[420px] max-[480px]:max-w-full overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
        {/* Header with Logo */}
        <div className="bg-[#002c5f] p-6 max-[480px]:p-5 max-[480px]:px-4 flex items-center justify-center rounded-t-xl">
          <Image
            src="https://www.aldersgatechristian.com/wp-content/uploads/2017/12/ACA-Logo_Horizontal_White_small.png"
            alt="Aldersgate Christian Academy"
            width={200}
            height={50}
            className="h-11 max-[480px]:h-[38px] w-auto"
            priority
          />
        </div>

        {submitted ? (
          <div className="p-10 max-[480px]:p-8 max-[480px]:px-5 max-[360px]:p-6 text-center">
            <div className="text-green-500 mb-4">
              <CheckCircle className="h-12 w-12 mx-auto" />
            </div>
            <h1 className="text-[22px] max-[480px]:text-xl max-[360px]:text-lg font-semibold text-slate-800 m-0 mb-2">
              Check Your Email
            </h1>
            <p className="text-slate-500 text-sm max-[480px]:text-[13px] leading-relaxed mb-4 m-0">
              If an account exists for <strong className="text-slate-700">{email}</strong>, you&apos;ll receive an email
              with a link to view your children&apos;s lunch balances.
            </p>
            <p className="text-slate-400 text-[13px] max-[480px]:text-xs m-0">
              Don&apos;t see it? Check your spam folder or contact the school office.
            </p>
          </div>
        ) : (
          <CardContent className="p-8 max-[480px]:p-7 max-[480px]:px-5 max-[360px]:p-6 max-[360px]:px-4">
            <h1 className="text-[22px] max-[480px]:text-xl max-[360px]:text-lg font-semibold text-slate-800 text-center m-0 mb-2">
              Request Balance Link
            </h1>
            <p className="text-slate-500 text-sm max-[480px]:text-[13px] text-center leading-relaxed mb-6 m-0">
              Enter your email address and we&apos;ll send you a link to view
              your children&apos;s lunch balances.
            </p>

            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-2 mb-5 max-[480px]:mb-4">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  autoComplete="email"
                  className="h-12 text-base"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 text-[15px]">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Link'
                )}
              </Button>
            </form>
          </CardContent>
        )}

        {/* Footer */}
        <div className="p-4 max-[480px]:px-5 max-[360px]:p-3.5 bg-slate-50 border-t border-slate-200">
          <p className="text-[13px] max-[480px]:text-xs text-slate-500 text-center m-0">
            Questions? Contact the school office at{' '}
            <a href="mailto:office@aldersgatechristian.com" className="text-[#2e8bc0] hover:underline">
              office@aldersgatechristian.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
