'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { signUp, checkSetup } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  Shield,
  Loader2,
  UserPlus,
  Layers,
} from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingAdmins, setCheckingAdmins] = useState(true)
  const [hasAdmins, setHasAdmins] = useState(false)
  const [passwordMinLength, setPasswordMinLength] = useState(6)
  const router = useRouter()

  useEffect(() => {
    async function checkAdminsAndSettings() {
      const setup = await checkSetup()
      setHasAdmins(setup.hasAdmins)
      setPasswordMinLength(setup.passwordMinLength)
      setCheckingAdmins(false)
    }
    checkAdminsAndSettings()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < passwordMinLength) {
      setError(`Password must be at least ${passwordMinLength} characters`)
      return
    }

    setLoading(true)

    const result = await signUp(email, password)

    if (!result.success) {
      setError(result.error || 'Failed to create account')
      setLoading(false)
      return
    }

    router.push('/admin/students')
    router.refresh()
  }

  if (checkingAdmins) {
    return (
      <div className="signup-container">
        <div className="signup-backdrop" />
        <div className="signup-card">
          <div className="card-inner">
            <div className="flex flex-col items-center gap-4 py-10">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (hasAdmins) {
    return (
      <div className="signup-container">
        <div className="signup-backdrop" />
        <div className="signup-card">
          <div className="card-inner">
            <div className="logo-section">
              <div className="logo-badge">
                <Layers className="h-8 w-8" />
              </div>
              <div className="logo-container">
                <Image
                  src="https://www.aldersgatechristian.com/wp-content/uploads/2020/09/aca-logo-blue.png"
                  alt="Aldersgate Christian Academy"
                  width={200}
                  height={70}
                  className="logo"
                  priority
                />
              </div>
            </div>

            <div className="header-section">
              <div className="status-badge">
                <Shield className="h-4 w-4" />
                Already Configured
              </div>
              <h1>Admin Exists</h1>
              <p className="subtitle">
                An administrator account has already been created for this system.
                Please contact an existing admin for an invitation.
              </p>
            </div>

            <Button asChild size="lg" className="w-full">
              <Link href="/admin/login">
                Go to Login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="card-footer">
            <Link href="/" className="back-link">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Scanner</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="signup-container">
      <div className="signup-backdrop" />

      <div className="signup-card">
        <div className="card-inner">
          <div className="logo-section">
            <div className="logo-badge">
              <Layers className="h-8 w-8" />
            </div>
            <div className="logo-container">
              <Image
                src="https://www.aldersgatechristian.com/wp-content/uploads/2020/09/aca-logo-blue.png"
                alt="Aldersgate Christian Academy"
                width={200}
                height={70}
                className="logo"
                priority
              />
            </div>
          </div>

          <div className="header-section">
            <div className="setup-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Initial Setup
            </div>
            <h1>Create Admin Account</h1>
            <p className="subtitle">Set up the first administrator for the lunch management system</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="animate-shake">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-gray-600">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@aldersgatechristian.com"
                  required
                  autoComplete="email"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wide text-gray-600">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`At least ${passwordMinLength} characters`}
                  required
                  minLength={passwordMinLength}
                  autoComplete="new-password"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wide text-gray-600">
                Confirm Password
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Admin Account
                  <UserPlus className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <p className="login-link">
            Already have an account? <Link href="/admin/login">Sign in</Link>
          </p>
        </div>

        <div className="card-footer">
          <Link href="/" className="back-link">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Scanner</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
