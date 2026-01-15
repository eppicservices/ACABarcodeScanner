'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AppSettings, AdminUser, PendingPayment, EmailProvider, DayOfWeek, AutoSendSchedule } from '@/types/database'
import CsvImport from '@/components/admin/CsvImport'
import SchoolCalendarSettings from '@/components/admin/SchoolCalendarSettings'

type TabId = 'pricing' | 'notifications' | 'email' | 'scanner' | 'school' | 'calendar' | 'branding' | 'advanced' | 'admins' | 'payments' | 'import' | 'data'

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'pricing',
    label: 'Pricing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Email',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    id: 'scanner',
    label: 'Scanner',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <line x1="7" y1="12" x2="17" y2="12" />
      </svg>
    ),
  },
  {
    id: 'school',
    label: 'School Info',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'School Calendar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'branding',
    label: 'Branding',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    id: 'admins',
    label: 'Admins',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    id: 'import',
    label: 'Import',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    id: 'data',
    label: 'Data & Export',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('pricing')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [pendingPayments, setPendingPayments] = useState<(PendingPayment & { parent_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    // Pricing
    elementary_lunch_price: '4.00',
    highschool_lunch_price: '6.00',
    highschool_lunch_card_price: '50.00',
    highschool_lunch_card_lunches: '10',
    second_meal_price: '4.50',
    // Negative limits
    elementary_negative_limit: '-5',
    highschool_negative_limit: '0',
    // Notifications
    elementary_low_lunch_threshold: '5',
    highschool_low_lunch_threshold: '3',
    notifications_enabled: true,
    zero_balance_alerts: true,
    weekly_summary_enabled: false,
    notification_frequency: 'immediate' as 'immediate' | 'daily',
    // Email scheduling
    email_allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[],
    email_window_start: '08:00',
    email_window_end: '18:00',
    email_timezone: 'America/New_York',
    min_days_between_emails: '3',
    auto_send_enabled: false,
    auto_send_schedule: 'weekdays' as AutoSendSchedule,
    auto_send_time: '09:00',
    // Scanner
    scanner_sound_enabled: true,
    scanner_auto_deduct: true,
    show_student_photo: false,
    // School
    school_name: 'Aldersgate Christian Academy',
    school_year: '2025-2026',
    contact_email: '',
    // Email
    email_provider: 'none' as EmailProvider,
    email_from_address: '',
    email_from_name: '',
    gmail_user: '',
    gmail_app_password: '',
    sendgrid_api_key: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_secure: true,
    // Branding
    school_logo_url: '',
    primary_color: '#002c5f',
    secondary_color: '#ffc82e',
    accent_color: '#00b1c1',
    // Timing
    scan_display_duration: '3000',
    scanner_buffer_timeout: '100',
    parent_token_expiry_days: '7',
    // Feature flags
    parent_portal_enabled: true,
    manual_entry_enabled: true,
    // Security settings
    password_min_length: '6',
    settings_cache_minutes: '5',
  })

  // Admin invite state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  // Test email state
  const [testingEmail, setTestingEmail] = useState(false)

  // Email template preview state
  const [previewTemplate, setPreviewTemplate] = useState<'balance' | 'receipt' | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [settingsRes, adminsRes, paymentsRes] = await Promise.all([
      supabase.from('app_settings').select('*').eq('id', 1).single(),
      supabase.from('admin_users').select('*').order('created_at'),
      supabase.from('pending_payments').select('*, parent:parents(name)').eq('status', 'pending').order('created_at', { ascending: false }),
    ])

    if (settingsRes.data) {
      const s = settingsRes.data
      setSettings(s)
      setFormData({
        elementary_lunch_price: s.elementary_lunch_price?.toString() || '4.00',
        highschool_lunch_price: s.highschool_lunch_price?.toString() || '6.00',
        highschool_lunch_card_price: s.highschool_lunch_card_price?.toString() || '50.00',
        highschool_lunch_card_lunches: s.highschool_lunch_card_lunches?.toString() || '10',
        second_meal_price: s.second_meal_price?.toString() || '4.50',
        elementary_negative_limit: s.elementary_negative_limit?.toString() || '-5',
        highschool_negative_limit: s.highschool_negative_limit?.toString() || '0',
        elementary_low_lunch_threshold: s.elementary_low_lunch_threshold?.toString() || '5',
        highschool_low_lunch_threshold: s.highschool_low_lunch_threshold?.toString() || '3',
        notifications_enabled: s.notifications_enabled ?? true,
        zero_balance_alerts: s.zero_balance_alerts ?? true,
        weekly_summary_enabled: s.weekly_summary_enabled ?? false,
        notification_frequency: s.notification_frequency || 'immediate',
        // Email scheduling
        email_allowed_days: s.email_allowed_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        email_window_start: s.email_window_start || '08:00',
        email_window_end: s.email_window_end || '18:00',
        email_timezone: s.email_timezone || 'America/New_York',
        min_days_between_emails: s.min_days_between_emails?.toString() || '3',
        auto_send_enabled: s.auto_send_enabled ?? false,
        auto_send_schedule: s.auto_send_schedule || 'weekdays',
        auto_send_time: s.auto_send_time || '09:00',
        scanner_sound_enabled: s.scanner_sound_enabled ?? true,
        scanner_auto_deduct: s.scanner_auto_deduct ?? true,
        show_student_photo: s.show_student_photo ?? false,
        school_name: s.school_name || 'Aldersgate Christian Academy',
        school_year: s.school_year || '2025-2026',
        contact_email: s.contact_email || '',
        email_provider: (s.email_provider as EmailProvider) || 'none',
        email_from_address: s.email_from_address || '',
        email_from_name: s.email_from_name || '',
        gmail_user: s.gmail_user || '',
        gmail_app_password: s.gmail_app_password || '',
        sendgrid_api_key: s.sendgrid_api_key || '',
        smtp_host: s.smtp_host || '',
        smtp_port: s.smtp_port?.toString() || '587',
        smtp_user: s.smtp_user || '',
        smtp_password: s.smtp_password || '',
        smtp_secure: s.smtp_secure ?? true,
        // Branding
        school_logo_url: s.school_logo_url || '',
        primary_color: s.primary_color || '#002c5f',
        secondary_color: s.secondary_color || '#ffc82e',
        accent_color: s.accent_color || '#00b1c1',
        // Timing
        scan_display_duration: s.scan_display_duration?.toString() || '3000',
        scanner_buffer_timeout: s.scanner_buffer_timeout?.toString() || '100',
        parent_token_expiry_days: s.parent_token_expiry_days?.toString() || '7',
        // Feature flags
        parent_portal_enabled: s.parent_portal_enabled ?? true,
        manual_entry_enabled: s.manual_entry_enabled ?? true,
        // Security settings
        password_min_length: s.password_min_length?.toString() || '6',
        settings_cache_minutes: s.settings_cache_minutes?.toString() || '5',
      })
    }

    if (adminsRes.data) {
      setAdmins(adminsRes.data)
    }

    if (paymentsRes.data) {
      setPendingPayments(paymentsRes.data.map((p: PendingPayment & { parent?: { name: string } }) => ({
        ...p,
        parent_name: p.parent?.name
      })))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleCompletePayment(paymentId: string) {
    if (!confirm('Mark this payment as completed? This will add lunches to the students\' accounts.')) return

    setProcessingPayment(paymentId)
    setMessage(null)

    const payment = pendingPayments.find(p => p.id === paymentId)
    if (!payment) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Track new balances for receipt
    const receiptItems: { student_name: string; amount: number; lunches: number; is_lunch_card: boolean; new_balance: number }[] = []

    // Process each student payment
    for (const sp of payment.student_payments) {
      // Get current student balance
      const { data: student } = await supabase
        .from('students')
        .select('balance')
        .eq('id', sp.student_id)
        .single()

      if (!student) continue

      const previousBalance = student.balance
      const newBalance = previousBalance + sp.lunches_to_add

      // Update student balance
      await supabase
        .from('students')
        .update({ balance: newBalance })
        .eq('id', sp.student_id)

      // Create transaction record
      await supabase
        .from('balance_transactions')
        .insert({
          student_id: sp.student_id,
          lunches_change: sp.lunches_to_add,
          previous_lunches: previousBalance,
          new_lunches: newBalance,
          amount_paid: sp.amount,
          lunches_added: sp.lunches_to_add,
          transaction_type: sp.is_lunch_card ? 'lunch_card' : 'payment',
          notes: 'Online payment via parent portal',
          created_by: user?.id || null
        })

      // Add to receipt items
      receiptItems.push({
        student_name: sp.student_name,
        amount: sp.amount,
        lunches: sp.lunches_to_add,
        is_lunch_card: sp.is_lunch_card,
        new_balance: newBalance
      })
    }

    // Mark payment as completed
    await supabase
      .from('pending_payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: user?.id || null
      })
      .eq('id', paymentId)

    // Send receipt email
    try {
      await fetch('/api/admin/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: payment.parent_id,
          payment_method: 'online',
          items: receiptItems,
          total: payment.total_amount
        })
      })
    } catch {
      // Don't fail if email fails, just log it
      console.error('Failed to send receipt email')
    }

    setMessage({ type: 'success', text: 'Payment completed and lunches added!' })
    setProcessingPayment(null)
    fetchData()
  }

  async function handleCancelPayment(paymentId: string) {
    if (!confirm('Cancel this pending payment?')) return

    const supabase = createClient()
    await supabase
      .from('pending_payments')
      .update({ status: 'cancelled' })
      .eq('id', paymentId)

    setMessage({ type: 'success', text: 'Payment cancelled' })
    fetchData()
  }

  async function handleSave() {
    setMessage(null)
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('app_settings')
      .update({
        elementary_lunch_price: parseFloat(formData.elementary_lunch_price),
        highschool_lunch_price: parseFloat(formData.highschool_lunch_price),
        highschool_lunch_card_price: parseFloat(formData.highschool_lunch_card_price),
        highschool_lunch_card_lunches: parseInt(formData.highschool_lunch_card_lunches),
        second_meal_price: parseFloat(formData.second_meal_price),
        elementary_negative_limit: parseInt(formData.elementary_negative_limit),
        highschool_negative_limit: parseInt(formData.highschool_negative_limit),
        elementary_low_lunch_threshold: parseFloat(formData.elementary_low_lunch_threshold),
        highschool_low_lunch_threshold: parseFloat(formData.highschool_low_lunch_threshold),
        notifications_enabled: formData.notifications_enabled,
        zero_balance_alerts: formData.zero_balance_alerts,
        weekly_summary_enabled: formData.weekly_summary_enabled,
        notification_frequency: formData.notification_frequency,
        // Email scheduling
        email_allowed_days: formData.email_allowed_days,
        email_window_start: formData.email_window_start,
        email_window_end: formData.email_window_end,
        email_timezone: formData.email_timezone,
        min_days_between_emails: parseInt(formData.min_days_between_emails),
        auto_send_enabled: formData.auto_send_enabled,
        auto_send_schedule: formData.auto_send_schedule,
        auto_send_time: formData.auto_send_time,
        scanner_sound_enabled: formData.scanner_sound_enabled,
        scanner_auto_deduct: formData.scanner_auto_deduct,
        show_student_photo: formData.show_student_photo,
        school_name: formData.school_name,
        school_year: formData.school_year,
        contact_email: formData.contact_email || null,
        email_provider: formData.email_provider,
        email_from_address: formData.email_from_address || null,
        email_from_name: formData.email_from_name || null,
        gmail_user: formData.gmail_user || null,
        gmail_app_password: formData.gmail_app_password || null,
        sendgrid_api_key: formData.sendgrid_api_key || null,
        smtp_host: formData.smtp_host || null,
        smtp_port: formData.smtp_port ? parseInt(formData.smtp_port) : null,
        smtp_user: formData.smtp_user || null,
        smtp_password: formData.smtp_password || null,
        smtp_secure: formData.smtp_secure,
        // Branding
        school_logo_url: formData.school_logo_url || null,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        accent_color: formData.accent_color,
        // Timing
        scan_display_duration: parseInt(formData.scan_display_duration),
        scanner_buffer_timeout: parseInt(formData.scanner_buffer_timeout),
        parent_token_expiry_days: parseInt(formData.parent_token_expiry_days),
        // Feature flags
        parent_portal_enabled: formData.parent_portal_enabled,
        manual_entry_enabled: formData.manual_entry_enabled,
        // Security settings
        password_min_length: parseInt(formData.password_min_length),
        settings_cache_minutes: parseInt(formData.settings_cache_minutes),
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
      })
      .eq('id', 1)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully' })
      fetchData()
    }

    setSaving(false)
  }

  async function handleInviteAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return

    setInviting(true)
    setMessage(null)

    // For now, just show a message - full invitation system would need email sending
    setMessage({
      type: 'success',
      text: `Invitation would be sent to ${inviteEmail}. (Email sending not yet configured)`
    })
    setInviteEmail('')
    setInviting(false)
  }

  async function handleRemoveAdmin(adminId: string) {
    if (!confirm('Are you sure you want to remove this admin?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminId)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Admin removed successfully' })
      fetchData()
    }
  }

  async function handleTestEmail() {
    setTestingEmail(true)
    setMessage(null)

    // First save the current settings
    await handleSave()

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setMessage({ type: 'error', text: 'Could not get your email address' })
        setTestingEmail(false)
        return
      }

      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to send test email' })
      } else {
        setMessage({ type: 'success', text: `Test email sent to ${user.email}` })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to send test email' })
    }

    setTestingEmail(false)
  }

  async function exportData(type: 'students' | 'transactions' | 'parents') {
    setMessage(null)

    const supabase = createClient()
    let query
    let filename

    if (type === 'students') {
      query = supabase.from('students').select('*, parent:parents(name, email)')
      filename = 'students.csv'
    } else if (type === 'transactions') {
      query = supabase.from('balance_transactions').select('*, student:students(name, barcode)')
      filename = 'transactions.csv'
    } else {
      query = supabase.from('parents').select('*')
      filename = 'parents.csv'
    }

    const { data, error } = await query

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    if (!data || data.length === 0) {
      setMessage({ type: 'error', text: 'No data to export' })
      return
    }

    // Convert to CSV
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h as keyof typeof row]
          if (typeof val === 'object') return JSON.stringify(val)
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`
          return val
        }).join(',')
      )
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    setMessage({ type: 'success', text: `${type} exported successfully` })
  }

  const updateField = (field: string, value: string | boolean | DayOfWeek[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Generate balance email preview HTML
  const getBalanceEmailPreview = () => {
    const schoolName = formData.school_name || 'Your School'
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #002c5f 0%, #004494 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${schoolName}</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 15px;">Lunch Account Balance Update</p>
    </div>
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <p style="color: #1e293b; font-size: 17px; margin: 0 0 24px 0; line-height: 1.5;">
        Dear <strong>John Smith</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
        Here is the current lunch account balance for your children:
      </p>
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center;">
        <div style="width: 40px; height: 40px; background: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
          <span style="color: white; font-size: 20px; font-weight: bold;">&#9888;</span>
        </div>
        <div>
          <div style="font-weight: 700; color: #f59e0b; font-size: 15px;">Low Balance</div>
          <div style="color: #64748b; font-size: 13px;">Family Total: 7 lunches</div>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);">
            <th style="padding: 14px 16px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Student</th>
            <th style="padding: 14px 16px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">Emma Smith</div>
              <div style="font-size: 12px; color: #64748b;">Elementary</div>
            </td>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <div style="display: inline-block; background: #fef3c7; color: #f59e0b; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                4 lunches
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">~$16.00 value</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">Jake Smith</div>
              <div style="font-size: 12px; color: #64748b;">High School</div>
            </td>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <div style="display: inline-block; background: #fef3c7; color: #f59e0b; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                3 lunches
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">~$18.00 value</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="#" style="display: inline-block; background: linear-gradient(135deg, #00b1c1 0%, #008891 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(0, 177, 193, 0.4);">
          Add Funds to Account
        </a>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
        Click the button above to access your parent portal and add funds to your child's lunch account.
        <br><br>
        <span style="font-size: 12px; color: #94a3b8;">This link will expire in 7 days for security purposes.</span>
      </p>
    </div>
    <div style="text-align: center; padding: 24px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">${schoolName} | Lunch Program</p>
      <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0 0;">Questions? Contact the school office for assistance.</p>
    </div>
  </div>
</body>
</html>`
  }

  // Generate receipt email preview HTML
  const getReceiptEmailPreview = () => {
    const schoolName = formData.school_name || 'Your School'
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #002c5f 0%, #004494 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${schoolName}</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 15px;">Payment Receipt</p>
    </div>
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="color: #22c55e; font-size: 32px;">&#10003;</span>
        </div>
        <h2 style="color: #1e293b; margin: 0 0 4px 0; font-size: 20px;">Payment Confirmed</h2>
        <p style="color: #64748b; margin: 0; font-size: 14px;">${today}</p>
      </div>
      <p style="color: #1e293b; font-size: 15px; margin: 0 0 24px 0;">
        Dear <strong>John Smith</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Thank you for your payment! Here's your receipt:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);">
            <th style="padding: 14px 16px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Student</th>
            <th style="padding: 14px 16px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Amount</th>
            <th style="padding: 14px 16px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Lunches</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e293b;">Emma Smith</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">$40.00</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="background: #dcfce7; color: #22c55e; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px;">+10</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e293b;">Jake Smith</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">$50.00</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="background: #fef3c7; color: #f59e0b; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px;">Lunch Card</span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc;">
            <td style="padding: 16px; font-weight: 700; color: #1e293b;">Total</td>
            <td style="padding: 16px; text-align: right; font-weight: 700; color: #00b1c1; font-size: 18px;">$90.00</td>
            <td style="padding: 16px;"></td>
          </tr>
        </tfoot>
      </table>
      <div style="background: #f8fafc; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #64748b; font-size: 13px;">Payment Method</span>
          <span style="color: #1e293b; font-size: 13px; font-weight: 600;">Online Payment</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b; font-size: 13px;">Transaction Date</span>
          <span style="color: #1e293b; font-size: 13px; font-weight: 600;">${today}</span>
        </div>
      </div>
      <div style="background: #dcfce7; border-radius: 10px; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #16a34a; font-size: 14px; font-weight: 500;">
          New Balance: Emma (14 lunches) | Jake (13 lunches)
        </p>
      </div>
    </div>
    <div style="text-align: center; padding: 24px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">${schoolName} | Lunch Program</p>
      <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0 0;">Questions? Contact the school office for assistance.</p>
    </div>
  </div>
</body>
</html>`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>Loading settings...</span>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px;
            gap: 16px;
            color: var(--gray-400);
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--gray-100);
            border-top-color: var(--aca-blue);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h1>Settings</h1>
            <p className="subtitle">Manage your lunch system configuration</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-layout">
        <div className="tabs-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'pricing' && (
            <div className="tab-panel">
              <h2>Lunch Pricing</h2>
              <p className="section-desc">Set the prices for lunches and lunch cards.</p>

              <div className="form-grid">
                <div className="form-group">
                  <label>Elementary Lunch Price</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      className="input"
                      value={formData.elementary_lunch_price}
                      onChange={e => updateField('elementary_lunch_price', e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>High School Lunch Price</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      className="input"
                      value={formData.highschool_lunch_price}
                      onChange={e => updateField('highschool_lunch_price', e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Second Meal Price</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      className="input"
                      value={formData.second_meal_price}
                      onChange={e => updateField('second_meal_price', e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <span className="hint">Price for additional meals in the same day</span>
                </div>
              </div>

              <h3>Lunch Cards</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>High School Lunch Card Price</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      className="input"
                      value={formData.highschool_lunch_card_price}
                      onChange={e => updateField('highschool_lunch_card_price', e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Lunches per Card</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.highschool_lunch_card_lunches}
                    onChange={e => updateField('highschool_lunch_card_lunches', e.target.value)}
                    min="1"
                  />
                  <span className="hint">Number of lunches included in a lunch card</span>
                </div>
              </div>

              <h3>Negative Balance Limits</h3>
              <p className="section-desc">How many lunches students can go negative before being blocked.</p>
              <div className="form-grid">
                <div className="form-group">
                  <label>Elementary Limit</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.elementary_negative_limit}
                    onChange={e => updateField('elementary_negative_limit', e.target.value)}
                    max="0"
                  />
                  <span className="hint">Use negative number (e.g., -5)</span>
                </div>

                <div className="form-group">
                  <label>High School Limit</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.highschool_negative_limit}
                    onChange={e => updateField('highschool_negative_limit', e.target.value)}
                    max="0"
                  />
                  <span className="hint">0 means no negative balance allowed</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="tab-panel">
              <h2>Notification Settings</h2>
              <p className="section-desc">Configure how and when parents receive notifications.</p>

              <div className="toggle-card">
                <div className="toggle-info">
                  <strong>Enable Notifications</strong>
                  <span>Send email alerts to parents</span>
                </div>
                <button
                  type="button"
                  className={`toggle ${formData.notifications_enabled ? 'on' : ''}`}
                  onClick={() => updateField('notifications_enabled', !formData.notifications_enabled)}
                >
                  <span className="toggle-handle" />
                </button>
              </div>

              <div className={`notification-options ${!formData.notifications_enabled ? 'disabled' : ''}`}>
                <div className="toggle-card">
                  <div className="toggle-info">
                    <strong>Zero Balance Alerts</strong>
                    <span>Notify when balance reaches zero</span>
                  </div>
                  <button
                    type="button"
                    className={`toggle ${formData.zero_balance_alerts ? 'on' : ''}`}
                    onClick={() => updateField('zero_balance_alerts', !formData.zero_balance_alerts)}
                    disabled={!formData.notifications_enabled}
                  >
                    <span className="toggle-handle" />
                  </button>
                </div>

                <div className="toggle-card">
                  <div className="toggle-info">
                    <strong>Weekly Summary</strong>
                    <span>Send weekly balance summaries to all parents</span>
                  </div>
                  <button
                    type="button"
                    className={`toggle ${formData.weekly_summary_enabled ? 'on' : ''}`}
                    onClick={() => updateField('weekly_summary_enabled', !formData.weekly_summary_enabled)}
                    disabled={!formData.notifications_enabled}
                  >
                    <span className="toggle-handle" />
                  </button>
                </div>

                <div className="form-group">
                  <label>Notification Frequency</label>
                  <select
                    className="input"
                    value={formData.notification_frequency}
                    onChange={e => updateField('notification_frequency', e.target.value)}
                    disabled={!formData.notifications_enabled}
                  >
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily Digest</option>
                  </select>
                  <span className="hint">When to send low balance alerts</span>
                </div>

                <h3>Low Balance Thresholds</h3>
                <p className="section-desc">Alert parents when lunches remaining falls below these amounts.</p>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Elementary Threshold</label>
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        className="input"
                        value={formData.elementary_low_lunch_threshold}
                        onChange={e => updateField('elementary_low_lunch_threshold', e.target.value)}
                        min="0"
                        disabled={!formData.notifications_enabled}
                      />
                      <span className="suffix">lunches</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>High School Threshold</label>
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        className="input"
                        value={formData.highschool_low_lunch_threshold}
                        onChange={e => updateField('highschool_low_lunch_threshold', e.target.value)}
                        min="0"
                        disabled={!formData.notifications_enabled}
                      />
                      <span className="suffix">lunches</span>
                    </div>
                  </div>
                </div>

                <h3>Email Scheduling</h3>
                <p className="section-desc">Control when low balance emails can be sent.</p>

                <div className="form-group">
                  <label>Allowed Days</label>
                  <div className="day-checkboxes">
                    {(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as DayOfWeek[]).map(day => (
                      <label key={day} className="day-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.email_allowed_days.includes(day)}
                          onChange={e => {
                            const newDays = e.target.checked
                              ? [...formData.email_allowed_days, day]
                              : formData.email_allowed_days.filter(d => d !== day)
                            updateField('email_allowed_days', newDays)
                          }}
                          disabled={!formData.notifications_enabled}
                        />
                        <span>{day.charAt(0).toUpperCase() + day.slice(1, 3)}</span>
                      </label>
                    ))}
                  </div>
                  <span className="hint">Days when emails can be sent</span>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Send Window Start</label>
                    <input
                      type="time"
                      className="input"
                      value={formData.email_window_start}
                      onChange={e => updateField('email_window_start', e.target.value)}
                      disabled={!formData.notifications_enabled}
                    />
                    <span className="hint">Earliest time to send emails</span>
                  </div>

                  <div className="form-group">
                    <label>Send Window End</label>
                    <input
                      type="time"
                      className="input"
                      value={formData.email_window_end}
                      onChange={e => updateField('email_window_end', e.target.value)}
                      disabled={!formData.notifications_enabled}
                    />
                    <span className="hint">Latest time to send emails</span>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Timezone</label>
                    <select
                      className="input"
                      value={formData.email_timezone}
                      onChange={e => updateField('email_timezone', e.target.value)}
                      disabled={!formData.notifications_enabled}
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Anchorage">Alaska Time (AKT)</option>
                      <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Min Days Between Emails</label>
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        className="input"
                        value={formData.min_days_between_emails}
                        onChange={e => updateField('min_days_between_emails', e.target.value)}
                        min="0"
                        max="30"
                        disabled={!formData.notifications_enabled}
                      />
                      <span className="suffix">days</span>
                    </div>
                    <span className="hint">Prevent emailing same parent too often</span>
                  </div>
                </div>

                <h3>Automatic Sending</h3>
                <p className="section-desc">Automatically send low balance emails on a schedule.</p>

                <div className="toggle-card">
                  <div className="toggle-info">
                    <strong>Enable Auto-Send</strong>
                    <span>Automatically send low balance emails</span>
                  </div>
                  <button
                    type="button"
                    className={`toggle ${formData.auto_send_enabled ? 'on' : ''}`}
                    onClick={() => updateField('auto_send_enabled', !formData.auto_send_enabled)}
                    disabled={!formData.notifications_enabled}
                  >
                    <span className="toggle-handle" />
                  </button>
                </div>

                {formData.auto_send_enabled && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Schedule</label>
                      <select
                        className="input"
                        value={formData.auto_send_schedule}
                        onChange={e => updateField('auto_send_schedule', e.target.value)}
                        disabled={!formData.notifications_enabled}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekdays">Weekdays Only</option>
                        <option value="weekly">Weekly (Mondays)</option>
                      </select>
                      <span className="hint">How often to send batch emails</span>
                    </div>

                    <div className="form-group">
                      <label>Send Time</label>
                      <input
                        type="time"
                        className="input"
                        value={formData.auto_send_time}
                        onChange={e => updateField('auto_send_time', e.target.value)}
                        disabled={!formData.notifications_enabled}
                      />
                      <span className="hint">Time to send batch emails</span>
                    </div>
                  </div>
                )}

                {formData.auto_send_enabled && (
                  <div className="info-box">
                    <strong>Cron Setup Required</strong>
                    <p>To enable automatic sending, configure a cron job to call:</p>
                    <code>POST /api/cron/send-low-balance-emails</code>
                    <p className="hint">Include header: <code>Authorization: Bearer YOUR_CRON_SECRET</code></p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="tab-panel">
              <h2>Email Configuration</h2>
              <p className="section-desc">Configure email service for sending receipts and notifications.</p>

              <div className="form-group">
                <label>Email Provider</label>
                <select
                  className="input"
                  value={formData.email_provider}
                  onChange={e => updateField('email_provider', e.target.value)}
                >
                  <option value="none">None (Email Disabled)</option>
                  <option value="gmail">Gmail</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="smtp">Custom SMTP</option>
                </select>
              </div>

              {formData.email_provider !== 'none' && (
                <>
                  <h3>From Settings</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>From Name</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.email_from_name}
                        onChange={e => updateField('email_from_name', e.target.value)}
                        placeholder="ACA Lunch Program"
                      />
                      <span className="hint">Display name in emails</span>
                    </div>
                    <div className="form-group">
                      <label>From Email</label>
                      <input
                        type="email"
                        className="input"
                        value={formData.email_from_address}
                        onChange={e => updateField('email_from_address', e.target.value)}
                        placeholder="lunch@school.edu"
                      />
                      <span className="hint">Sender email address</span>
                    </div>
                  </div>
                </>
              )}

              {formData.email_provider === 'gmail' && (
                <>
                  <h3>Gmail Settings</h3>
                  <div className="info-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    <div>
                      <strong>App Password Required</strong>
                      <p>Gmail requires an App Password, not your regular password. Generate one at: Google Account → Security → 2-Step Verification → App passwords</p>
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Gmail Address</label>
                      <input
                        type="email"
                        className="input"
                        value={formData.gmail_user}
                        onChange={e => updateField('gmail_user', e.target.value)}
                        placeholder="your.email@gmail.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>App Password</label>
                      <input
                        type="password"
                        className="input"
                        value={formData.gmail_app_password}
                        onChange={e => updateField('gmail_app_password', e.target.value)}
                        placeholder="xxxx xxxx xxxx xxxx"
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.email_provider === 'sendgrid' && (
                <>
                  <h3>SendGrid Settings</h3>
                  <div className="form-group">
                    <label>API Key</label>
                    <input
                      type="password"
                      className="input"
                      value={formData.sendgrid_api_key}
                      onChange={e => updateField('sendgrid_api_key', e.target.value)}
                      placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <span className="hint">Find this in your SendGrid dashboard under Settings → API Keys</span>
                  </div>
                </>
              )}

              {formData.email_provider === 'smtp' && (
                <>
                  <h3>SMTP Settings</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>SMTP Host</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.smtp_host}
                        onChange={e => updateField('smtp_host', e.target.value)}
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Port</label>
                      <input
                        type="number"
                        className="input"
                        value={formData.smtp_port}
                        onChange={e => updateField('smtp_port', e.target.value)}
                        placeholder="587"
                      />
                    </div>
                    <div className="form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.smtp_user}
                        onChange={e => updateField('smtp_user', e.target.value)}
                        placeholder="username"
                      />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        className="input"
                        value={formData.smtp_password}
                        onChange={e => updateField('smtp_password', e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="toggle-card">
                    <div className="toggle-info">
                      <strong>Use TLS/SSL</strong>
                      <span>Enable secure connection (recommended)</span>
                    </div>
                    <button
                      type="button"
                      className={`toggle ${formData.smtp_secure ? 'on' : ''}`}
                      onClick={() => updateField('smtp_secure', !formData.smtp_secure)}
                    >
                      <span className="toggle-handle" />
                    </button>
                  </div>
                </>
              )}

              {formData.email_provider !== 'none' && (
                <div className="test-email-section">
                  <button
                    className="btn btn-secondary"
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                  >
                    {testingEmail ? 'Sending...' : 'Send Test Email'}
                  </button>
                  <span className="hint">Sends a test email to your admin email address</span>
                </div>
              )}

              <h3>Email Templates</h3>
              <p className="section-desc">Preview the email templates that are sent to parents.</p>

              <div className="template-cards">
                <div className="template-card">
                  <div className="template-icon balance">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="template-info">
                    <h4>Balance Notification</h4>
                    <p>Sent when using "Email Balance" button on the Parents page. Includes individual student balances and a link to add funds.</p>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPreviewTemplate('balance')}
                  >
                    Preview
                  </button>
                </div>

                <div className="template-card">
                  <div className="template-icon receipt">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
                      <path d="M8 10h8" />
                      <path d="M8 14h4" />
                    </svg>
                  </div>
                  <div className="template-info">
                    <h4>Payment Receipt</h4>
                    <p>Sent automatically after a payment is processed. Includes itemized details and new balances.</p>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPreviewTemplate('receipt')}
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scanner' && (
            <div className="tab-panel">
              <h2>Scanner Settings</h2>
              <p className="section-desc">Configure how the barcode scanner behaves.</p>

              <div className="toggle-card">
                <div className="toggle-info">
                  <strong>Sound Effects</strong>
                  <span>Play sounds on successful/failed scans</span>
                </div>
                <button
                  type="button"
                  className={`toggle ${formData.scanner_sound_enabled ? 'on' : ''}`}
                  onClick={() => updateField('scanner_sound_enabled', !formData.scanner_sound_enabled)}
                >
                  <span className="toggle-handle" />
                </button>
              </div>

              <div className="toggle-card">
                <div className="toggle-info">
                  <strong>Auto-Deduct</strong>
                  <span>Automatically deduct lunch on scan</span>
                </div>
                <button
                  type="button"
                  className={`toggle ${formData.scanner_auto_deduct ? 'on' : ''}`}
                  onClick={() => updateField('scanner_auto_deduct', !formData.scanner_auto_deduct)}
                >
                  <span className="toggle-handle" />
                </button>
              </div>

              <div className="toggle-card">
                <div className="toggle-info">
                  <strong>Show Student Photo</strong>
                  <span>Display student photo on scan (if available)</span>
                </div>
                <button
                  type="button"
                  className={`toggle ${formData.show_student_photo ? 'on' : ''}`}
                  onClick={() => updateField('show_student_photo', !formData.show_student_photo)}
                >
                  <span className="toggle-handle" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'school' && (
            <div className="tab-panel">
              <h2>School Information</h2>
              <p className="section-desc">Basic information about your school.</p>

              <div className="form-stack">
                <div className="form-group">
                  <label>School Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.school_name}
                    onChange={e => updateField('school_name', e.target.value)}
                    placeholder="Enter school name"
                  />
                  <span className="hint">Used in emails and reports</span>
                </div>

                <div className="form-group">
                  <label>School Year</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.school_year}
                    onChange={e => updateField('school_year', e.target.value)}
                    placeholder="e.g., 2025-2026"
                  />
                </div>

                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.contact_email}
                    onChange={e => updateField('contact_email', e.target.value)}
                    placeholder="lunch@school.edu"
                  />
                  <span className="hint">Reply-to address for notification emails</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <SchoolCalendarSettings
              settings={settings}
              onSettingsChange={(updates) => {
                if (settings) {
                  setSettings({ ...settings, ...updates } as AppSettings)
                }
              }}
              onMessage={setMessage}
            />
          )}

          {activeTab === 'branding' && (
            <div className="tab-panel">
              <h2>Branding & Appearance</h2>
              <p className="section-desc">Customize the look and feel of your lunch program.</p>

              <div className="form-stack">
                <div className="form-group">
                  <label>School Logo URL</label>
                  <input
                    type="url"
                    className="input"
                    value={formData.school_logo_url}
                    onChange={e => updateField('school_logo_url', e.target.value)}
                    placeholder="https://your-school.com/logo.png"
                  />
                  <span className="hint">Used in the scanner header and emails. Leave blank to use default.</span>
                </div>

                {formData.school_logo_url && (
                  <div className="logo-preview">
                    <label>Logo Preview</label>
                    <div className="preview-box">
                      <img
                        src={formData.school_logo_url}
                        alt="School logo preview"
                        style={{ maxHeight: '60px', maxWidth: '100%' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Primary Color</label>
                  <div className="color-input-row">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={e => updateField('primary_color', e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      className="input"
                      value={formData.primary_color}
                      onChange={e => updateField('primary_color', e.target.value)}
                      placeholder="#002c5f"
                    />
                  </div>
                  <span className="hint">Main brand color used in headers and buttons (default: navy #002c5f)</span>
                </div>

                <div className="form-group">
                  <label>Secondary Color</label>
                  <div className="color-input-row">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={e => updateField('secondary_color', e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      className="input"
                      value={formData.secondary_color}
                      onChange={e => updateField('secondary_color', e.target.value)}
                      placeholder="#ffc82e"
                    />
                  </div>
                  <span className="hint">Accent color for highlights (default: gold #ffc82e)</span>
                </div>

                <div className="form-group">
                  <label>Accent Color</label>
                  <div className="color-input-row">
                    <input
                      type="color"
                      value={formData.accent_color}
                      onChange={e => updateField('accent_color', e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      className="input"
                      value={formData.accent_color}
                      onChange={e => updateField('accent_color', e.target.value)}
                      placeholder="#00b1c1"
                    />
                  </div>
                  <span className="hint">Used for call-to-action buttons (default: teal #00b1c1)</span>
                </div>

                <div className="color-preview">
                  <label>Color Preview</label>
                  <div className="preview-swatches">
                    <div className="swatch" style={{ backgroundColor: formData.primary_color }}>
                      <span>Primary</span>
                    </div>
                    <div className="swatch" style={{ backgroundColor: formData.secondary_color }}>
                      <span>Secondary</span>
                    </div>
                    <div className="swatch" style={{ backgroundColor: formData.accent_color }}>
                      <span>Accent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="tab-panel">
              <h2>Advanced Settings</h2>
              <p className="section-desc">Fine-tune timing and behavior settings.</p>

              <h3>Timing Settings</h3>
              <div className="form-stack">
                <div className="form-group">
                  <label>Scan Result Display Time (ms)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.scan_display_duration}
                    onChange={e => updateField('scan_display_duration', e.target.value)}
                    min="1000"
                    max="10000"
                    step="500"
                  />
                  <span className="hint">How long the scan result stays on screen (default: 3000ms = 3 seconds)</span>
                </div>

                <div className="form-group">
                  <label>Scanner Buffer Timeout (ms)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.scanner_buffer_timeout}
                    onChange={e => updateField('scanner_buffer_timeout', e.target.value)}
                    min="50"
                    max="500"
                    step="10"
                  />
                  <span className="hint">Time to wait for scanner input before clearing (default: 100ms)</span>
                </div>

                <div className="form-group">
                  <label>Parent Portal Link Expiry (days)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.parent_token_expiry_days}
                    onChange={e => updateField('parent_token_expiry_days', e.target.value)}
                    min="1"
                    max="90"
                  />
                  <span className="hint">How long parent portal links remain valid (default: 7 days)</span>
                </div>
              </div>

              <h3>Feature Toggles</h3>
              <div className="toggle-card">
                <div className="toggle-info">
                  <strong>Parent Portal</strong>
                  <span>Allow parents to view balances and submit payments online</span>
                </div>
                <button
                  type="button"
                  className={`toggle ${formData.parent_portal_enabled ? 'on' : ''}`}
                  onClick={() => updateField('parent_portal_enabled', !formData.parent_portal_enabled)}
                >
                  <span className="toggle-handle" />
                </button>
              </div>

              <div className="toggle-card">
                <div className="toggle-info">
                  <strong>Manual Entry</strong>
                  <span>Show manual barcode entry button on scanner screen</span>
                </div>
                <button
                  type="button"
                  className={`toggle ${formData.manual_entry_enabled ? 'on' : ''}`}
                  onClick={() => updateField('manual_entry_enabled', !formData.manual_entry_enabled)}
                >
                  <span className="toggle-handle" />
                </button>
              </div>

              <h3>Security & Performance</h3>
              <div className="form-stack">
                <div className="form-group">
                  <label>Minimum Password Length</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.password_min_length}
                    onChange={e => updateField('password_min_length', e.target.value)}
                    min="4"
                    max="32"
                  />
                  <span className="hint">Minimum characters required for admin passwords (default: 6)</span>
                </div>

                <div className="form-group">
                  <label>Settings Cache Duration (minutes)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.settings_cache_minutes}
                    onChange={e => updateField('settings_cache_minutes', e.target.value)}
                    min="1"
                    max="60"
                  />
                  <span className="hint">How long to cache settings before refreshing from database (default: 5 minutes)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="tab-panel">
              <h2>Admin Management</h2>
              <p className="section-desc">Manage who has access to the admin dashboard.</p>

              <div className="invite-form">
                <h3>Invite New Admin</h3>
                <form onSubmit={handleInviteAdmin} className="invite-row">
                  <input
                    type="email"
                    className="input"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="email@school.edu"
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={inviting}>
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </button>
                </form>
              </div>

              <h3>Current Admins</h3>
              <div className="admin-list">
                {admins.map(admin => (
                  <div key={admin.id} className="admin-card">
                    <div className="admin-info">
                      <div className="admin-avatar">
                        {admin.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="admin-email">{admin.email}</div>
                        <div className="admin-role">
                          <span className={`role-badge ${admin.role}`}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                          <span className="admin-date">
                            Added {new Date(admin.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {admin.role !== 'super_admin' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemoveAdmin(admin.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="tab-panel">
              <h2>Pending Payments</h2>
              <p className="section-desc">Review and complete payments from the parent portal.</p>

              {pendingPayments.length === 0 ? (
                <div className="empty-payments">
                  <div className="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </div>
                  <p>No pending payments</p>
                  <span className="empty-hint">Payments from the parent portal will appear here</span>
                </div>
              ) : (
                <div className="payments-list">
                  {pendingPayments.map(payment => (
                    <div key={payment.id} className="payment-card">
                      <div className="payment-header">
                        <div className="payment-info">
                          <strong>{payment.parent_name || 'Unknown Parent'}</strong>
                          <span className="payment-date">
                            {new Date(payment.created_at).toLocaleDateString()} at {new Date(payment.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="payment-total">${payment.total_amount.toFixed(2)}</div>
                      </div>

                      <div className="payment-students">
                        {payment.student_payments.map((sp, idx) => (
                          <div key={idx} className="student-payment">
                            <span className="student-name">{sp.student_name}</span>
                            <span className="student-amount">
                              ${sp.amount.toFixed(2)} → {sp.lunches_to_add} {sp.lunches_to_add === 1 ? 'lunch' : 'lunches'}
                              {sp.is_lunch_card && <span className="lunch-card-tag">Card</span>}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="payment-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleCompletePayment(payment.id)}
                          disabled={processingPayment === payment.id}
                        >
                          {processingPayment === payment.id ? 'Processing...' : 'Mark as Paid'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleCancelPayment(payment.id)}
                          disabled={processingPayment === payment.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="tab-panel">
              <h2>Bulk Import</h2>
              <p className="section-desc">Import students and parents from a CSV file.</p>
              <CsvImport />
            </div>
          )}

          {activeTab === 'data' && (
            <div className="tab-panel">
              <h2>Data & Export</h2>
              <p className="section-desc">Export your data for backup or analysis.</p>

              <div className="export-grid">
                <div className="export-card">
                  <div className="export-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="export-info">
                    <h4>Students</h4>
                    <p>Export all students with their balances and parent info</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => exportData('students')}>
                    Export CSV
                  </button>
                </div>

                <div className="export-card">
                  <div className="export-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="export-info">
                    <h4>Parents</h4>
                    <p>Export all parent contact information</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => exportData('parents')}>
                    Export CSV
                  </button>
                </div>

                <div className="export-card">
                  <div className="export-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
                      <path d="M8 10h8" />
                      <path d="M8 14h4" />
                    </svg>
                  </div>
                  <div className="export-info">
                    <h4>Transactions</h4>
                    <p>Export complete transaction history</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => exportData('transactions')}>
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'admins' && activeTab !== 'payments' && activeTab !== 'import' && activeTab !== 'data' && (
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Email Template Preview Modal */}
      {previewTemplate && (
        <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {previewTemplate === 'balance' ? 'Balance Notification Email' : 'Payment Receipt Email'}
              </h3>
              <button className="modal-close" onClick={() => setPreviewTemplate(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="email-preview-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <span>This is a preview with sample data. Actual emails will contain real student information.</span>
              </div>
              <iframe
                srcDoc={previewTemplate === 'balance' ? getBalanceEmailPreview() : getReceiptEmailPreview()}
                className="email-preview-frame"
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}

      {settings?.updated_at && (
        <p className="last-updated">
          Last updated: {new Date(settings.updated_at).toLocaleString()}
        </p>
      )}

      <style jsx>{`
        .settings-page {
          max-width: 1000px;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--gray-100) 0%, var(--white) 100%);
          border: 1px solid var(--gray-200);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-600);
        }

        h1 {
          font-size: 26px;
          margin: 0;
          color: var(--aca-navy);
        }

        .subtitle {
          color: var(--gray-400);
          margin: 2px 0 0 0;
          font-size: 14px;
        }

        .alert {
          padding: 14px 18px;
          border-radius: var(--border-radius);
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .alert-error {
          background: var(--error-bg);
          color: var(--error);
          border: 1px solid var(--error-border);
        }

        .alert-success {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid var(--success-border);
        }

        .settings-layout {
          display: flex;
          gap: 24px;
          background: var(--white);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--gray-200);
          overflow: hidden;
        }

        .tabs-sidebar {
          width: 200px;
          background: var(--gray-50);
          border-right: 1px solid var(--gray-200);
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border: none;
          background: transparent;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-600);
          text-align: left;
          transition: all 0.15s ease;
          font-family: var(--font-body);
        }

        .tab-btn:hover {
          background: var(--gray-100);
          color: var(--gray-700);
        }

        .tab-btn.active {
          background: var(--white);
          color: var(--aca-blue);
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .tab-icon {
          display: flex;
          opacity: 0.7;
        }

        .tab-btn.active .tab-icon {
          opacity: 1;
        }

        .tab-content {
          flex: 1;
          padding: 28px;
          min-height: 500px;
        }

        .tab-panel h2 {
          font-size: 18px;
          margin: 0 0 6px 0;
          color: var(--aca-navy);
        }

        .tab-panel h3 {
          font-size: 15px;
          margin: 28px 0 12px 0;
          color: var(--gray-700);
        }

        .section-desc {
          color: var(--gray-500);
          font-size: 14px;
          margin: 0 0 24px 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .form-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 400px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-700);
        }

        .input-with-prefix,
        .input-with-suffix {
          display: flex;
          align-items: center;
        }

        .input-with-prefix .input {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }

        .prefix {
          padding: 10px 12px;
          background: var(--gray-100);
          border: 1px solid var(--gray-300);
          border-right: none;
          border-radius: var(--border-radius) 0 0 var(--border-radius);
          color: var(--gray-500);
          font-weight: 500;
        }

        .input-with-suffix .input {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }

        .suffix {
          padding: 10px 12px;
          background: var(--gray-100);
          border: 1px solid var(--gray-300);
          border-left: none;
          border-radius: 0 var(--border-radius) var(--border-radius) 0;
          color: var(--gray-500);
          font-size: 13px;
        }

        .hint {
          font-size: 12px;
          color: var(--gray-400);
        }

        .toggle-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--gray-50);
          border-radius: var(--border-radius);
          margin-bottom: 12px;
        }

        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toggle-info strong {
          font-size: 14px;
          color: var(--gray-700);
        }

        .toggle-info span {
          font-size: 13px;
          color: var(--gray-500);
        }

        .toggle {
          width: 48px;
          height: 28px;
          background: var(--gray-300);
          border-radius: 14px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.2s ease;
          flex-shrink: 0;
        }

        .toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle.on {
          background: var(--aca-blue);
        }

        .toggle-handle {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          background: var(--white);
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }

        .toggle.on .toggle-handle {
          transform: translateX(20px);
        }

        .notification-options {
          transition: opacity 0.2s ease;
        }

        .notification-options.disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .day-checkboxes {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .day-checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--gray-50);
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 13px;
          user-select: none;
        }

        .day-checkbox:hover {
          background: var(--gray-100);
        }

        .day-checkbox input {
          margin: 0;
          cursor: pointer;
        }

        .day-checkbox input:checked + span {
          color: var(--aca-blue);
          font-weight: 500;
        }

        .info-box {
          background: var(--aca-blue-light, #e8f4fd);
          border: 1px solid var(--aca-blue);
          border-radius: var(--border-radius);
          padding: 16px;
          margin-top: 16px;
        }

        .info-box strong {
          display: block;
          color: var(--aca-blue);
          margin-bottom: 8px;
          font-size: 14px;
        }

        .info-box p {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: var(--gray-600);
        }

        .info-box code {
          display: inline-block;
          background: var(--white);
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'SF Mono', Consolas, monospace;
          font-size: 12px;
          color: var(--gray-700);
          border: 1px solid var(--gray-200);
        }

        .invite-form {
          background: var(--gray-50);
          border-radius: var(--border-radius);
          padding: 20px;
          margin-bottom: 28px;
        }

        .invite-form h3 {
          margin: 0 0 12px 0;
        }

        .invite-row {
          display: flex;
          gap: 12px;
        }

        .invite-row .input {
          flex: 1;
        }

        .admin-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .admin-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--gray-50);
          border-radius: var(--border-radius);
        }

        .admin-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-avatar {
          width: 40px;
          height: 40px;
          background: var(--aca-blue);
          color: var(--white);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .admin-email {
          font-weight: 600;
          color: var(--gray-700);
        }

        .admin-role {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }

        .role-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
        }

        .role-badge.super_admin {
          background: var(--aca-gold-subtle);
          color: var(--aca-gold-dark);
        }

        .role-badge.admin {
          background: var(--gray-200);
          color: var(--gray-600);
        }

        .admin-date {
          font-size: 12px;
          color: var(--gray-400);
        }

        .export-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .export-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--gray-50);
          border-radius: var(--border-radius);
        }

        .export-icon {
          width: 48px;
          height: 48px;
          background: var(--white);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--aca-blue);
        }

        .export-info {
          flex: 1;
        }

        .export-info h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          color: var(--gray-700);
        }

        .export-info p {
          margin: 0;
          font-size: 13px;
          color: var(--gray-500);
        }

        .form-actions {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--gray-200);
        }

        .last-updated {
          font-size: 12px;
          color: var(--gray-400);
          margin-top: 16px;
          text-align: right;
        }

        .info-box {
          display: flex;
          gap: 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: var(--border-radius);
          padding: 16px;
          margin-bottom: 20px;
          color: #1e40af;
        }

        .info-box svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .info-box strong {
          display: block;
          margin-bottom: 4px;
        }

        .info-box p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #3b82f6;
        }

        .test-email-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--gray-200);
        }

        .test-email-section .hint {
          margin: 0;
        }

        .btn-ghost {
          background: transparent;
          color: var(--gray-500);
          padding: 6px 12px;
          font-size: 13px;
        }

        .btn-ghost:hover {
          background: var(--error-bg);
          color: var(--error);
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
        }

        .empty-payments {
          text-align: center;
          padding: 48px 24px;
          color: var(--gray-400);
        }

        .empty-payments .empty-icon {
          margin-bottom: 16px;
          color: var(--gray-300);
        }

        .empty-payments p {
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-500);
          margin: 0 0 4px 0;
        }

        .empty-hint {
          font-size: 13px;
        }

        .payments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .payment-card {
          background: var(--gray-50);
          border-radius: var(--border-radius);
          padding: 20px;
        }

        .payment-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .payment-info strong {
          display: block;
          font-size: 15px;
          color: var(--gray-700);
        }

        .payment-date {
          font-size: 12px;
          color: var(--gray-400);
        }

        .payment-total {
          font-size: 20px;
          font-weight: 700;
          color: var(--aca-teal);
        }

        .payment-students {
          border-top: 1px solid var(--gray-200);
          border-bottom: 1px solid var(--gray-200);
          padding: 12px 0;
          margin-bottom: 16px;
        }

        .student-payment {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 14px;
        }

        .student-name {
          color: var(--gray-600);
        }

        .student-amount {
          color: var(--gray-500);
        }

        .lunch-card-tag {
          display: inline-block;
          background: var(--aca-gold-subtle);
          color: var(--aca-gold-dark);
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 6px;
        }

        .payment-actions {
          display: flex;
          gap: 8px;
        }

        /* Email Template Cards */
        .template-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .template-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--gray-50);
          border-radius: var(--border-radius);
          transition: all 0.15s ease;
        }

        .template-card:hover {
          background: var(--gray-100);
        }

        .template-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .template-icon.balance {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
        }

        .template-icon.receipt {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #16a34a;
        }

        .template-info {
          flex: 1;
        }

        .template-info h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          color: var(--gray-700);
        }

        .template-info p {
          margin: 0;
          font-size: 13px;
          color: var(--gray-500);
          line-height: 1.5;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--gray-200);
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: var(--aca-navy);
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border: none;
          background: var(--gray-100);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-500);
          transition: all 0.15s ease;
        }

        .modal-close:hover {
          background: var(--gray-200);
          color: var(--gray-700);
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .email-preview-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: var(--border-radius);
          margin-bottom: 20px;
          font-size: 13px;
          color: #1e40af;
        }

        .email-preview-info svg {
          flex-shrink: 0;
        }

        .email-preview-frame {
          width: 100%;
          height: 600px;
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius);
          background: #f8fafc;
        }

        @media (max-width: 768px) {
          .settings-layout {
            flex-direction: column;
          }

          .tabs-sidebar {
            width: 100%;
            flex-direction: row;
            overflow-x: auto;
            border-right: none;
            border-bottom: 1px solid var(--gray-200);
            padding: 12px 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .tabs-sidebar::-webkit-scrollbar {
            display: none;
          }

          .tab-btn {
            white-space: nowrap;
            padding: 10px 14px;
            font-size: 13px;
            flex-shrink: 0;
          }

          .tab-label {
            display: none;
          }

          .tab-icon {
            opacity: 1;
          }

          .tab-content {
            padding: 20px 16px;
            min-height: auto;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .tab-panel h2 {
            font-size: 16px;
          }

          .tab-panel h3 {
            font-size: 14px;
            margin: 20px 0 10px 0;
          }

          .section-desc {
            font-size: 13px;
            margin-bottom: 20px;
          }

          .toggle-card {
            padding: 14px;
          }

          .toggle-info strong {
            font-size: 13px;
          }

          .toggle-info span {
            font-size: 12px;
          }

          .toggle {
            width: 44px;
            height: 26px;
          }

          .toggle-handle {
            width: 20px;
            height: 20px;
          }

          .toggle.on .toggle-handle {
            transform: translateX(18px);
          }

          .invite-row {
            flex-direction: column;
          }

          .admin-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .export-card {
            flex-direction: column;
            text-align: center;
            padding: 20px 16px;
          }

          .export-card .btn {
            width: 100%;
          }

          h1 {
            font-size: 22px;
          }

          .header-icon {
            width: 40px;
            height: 40px;
          }

          .header-icon svg {
            width: 20px;
            height: 20px;
          }

          .info-box {
            padding: 14px;
            font-size: 12px;
          }

          .info-box p {
            font-size: 12px;
          }

          .test-email-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .payment-card {
            padding: 16px;
          }

          .payment-header {
            flex-direction: column;
            gap: 8px;
          }

          .payment-total {
            font-size: 18px;
          }

          .payment-actions {
            flex-direction: column;
          }

          .payment-actions .btn {
            width: 100%;
          }

          /* Template cards mobile */
          .template-card {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .template-card .btn {
            width: 100%;
          }

          /* Modal mobile */
          .modal-overlay {
            padding: 10px;
          }

          .modal-content {
            max-height: 95vh;
          }

          .modal-header {
            padding: 16px;
          }

          .modal-header h3 {
            font-size: 16px;
          }

          .modal-body {
            padding: 16px;
          }

          .email-preview-frame {
            height: 500px;
          }
        }

        @media (max-width: 480px) {
          .tab-content {
            padding: 16px 12px;
          }

          .tab-btn {
            padding: 8px 12px;
          }

          .form-group label {
            font-size: 12px;
          }

          .hint {
            font-size: 11px;
          }

          .form-stack {
            max-width: 100%;
          }

          .admin-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .admin-avatar {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          .admin-email {
            font-size: 13px;
          }
        }

        /* Color picker styles */
        .color-input-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .color-picker {
          width: 50px;
          height: 40px;
          padding: 2px;
          border: 1px solid var(--gray-300);
          border-radius: var(--border-radius);
          cursor: pointer;
        }

        .color-input-row .input {
          flex: 1;
          font-family: monospace;
        }

        .preview-swatches {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .swatch {
          width: 80px;
          height: 60px;
          border-radius: var(--border-radius);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .swatch span {
          font-size: 11px;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .logo-preview {
          margin: 4px 0 16px 0;
        }

        .preview-box {
          margin-top: 8px;
          padding: 16px;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  )
}
