'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AppSettings, AdminUser, PendingPayment, DayOfWeek, EmailProvider } from '@/types/database'
import { type TabId, type Message, type PreviewTemplate, type SettingsFormData, defaultFormData } from '../types'

interface PendingPaymentWithParent extends PendingPayment {
  parent_name?: string
}

interface SettingsContextValue {
  // Tab state
  activeTab: TabId
  setActiveTab: (tab: TabId) => void

  // Data state
  settings: AppSettings | null
  admins: AdminUser[]
  pendingPayments: PendingPaymentWithParent[]
  loading: boolean

  // Form state
  formData: SettingsFormData
  updateField: (field: string, value: string | boolean | DayOfWeek[]) => void

  // UI state
  saving: boolean
  message: Message | null
  setMessage: (msg: Message | null) => void
  previewTemplate: PreviewTemplate
  setPreviewTemplate: (template: PreviewTemplate) => void

  // Actions
  fetchData: () => Promise<void>
  handleSave: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('pricing')

  // Data state
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentWithParent[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [formData, setFormData] = useState<SettingsFormData>(defaultFormData)

  // UI state
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<PreviewTemplate>(null)

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
        school_logo_url: s.school_logo_url || '',
        primary_color: s.primary_color || '#002c5f',
        secondary_color: s.secondary_color || '#ffc82e',
        accent_color: s.accent_color || '#00b1c1',
        scan_display_duration: s.scan_display_duration?.toString() || '3000',
        scanner_buffer_timeout: s.scanner_buffer_timeout?.toString() || '100',
        parent_token_expiry_days: s.parent_token_expiry_days?.toString() || '7',
        parent_portal_enabled: s.parent_portal_enabled ?? true,
        manual_entry_enabled: s.manual_entry_enabled ?? true,
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

  const updateField = useCallback((field: string, value: string | boolean | DayOfWeek[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSave = useCallback(async () => {
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
        school_logo_url: formData.school_logo_url || null,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        accent_color: formData.accent_color,
        scan_display_duration: parseInt(formData.scan_display_duration),
        scanner_buffer_timeout: parseInt(formData.scanner_buffer_timeout),
        parent_token_expiry_days: parseInt(formData.parent_token_expiry_days),
        parent_portal_enabled: formData.parent_portal_enabled,
        manual_entry_enabled: formData.manual_entry_enabled,
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
  }, [formData, fetchData])

  const value: SettingsContextValue = {
    activeTab,
    setActiveTab,
    settings,
    admins,
    pendingPayments,
    loading,
    formData,
    updateField,
    saving,
    message,
    setMessage,
    previewTemplate,
    setPreviewTemplate,
    fetchData,
    handleSave,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
