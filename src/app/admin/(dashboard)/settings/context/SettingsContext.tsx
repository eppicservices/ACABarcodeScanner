'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { toast } from 'sonner'
import { getSettingsForClient, updateSettings, type SerializedAppSettings } from '@/actions/settings'
import { getAllAdmins, type AdminUser } from '@/actions/admin'
import { getPendingPayments, type PendingPaymentWithParent } from '@/actions/transactions'
import type { DayOfWeek, EmailProvider, AutoSendSchedule } from '@prisma/client'
import { type TabId, type Message, type PreviewTemplate, type SettingsFormData, defaultFormData } from '../types'

interface SettingsContextValue {
  // Tab state
  activeTab: TabId
  setActiveTab: (tab: TabId) => void

  // Data state
  settings: SerializedAppSettings | null
  admins: AdminUser[]
  pendingPayments: PendingPaymentWithParent[]
  loading: boolean

  // Form state
  formData: SettingsFormData
  updateField: (field: string, value: string | boolean | string[]) => void

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
  const [settings, setSettings] = useState<SerializedAppSettings | null>(null)
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
    const [settingsData, adminsData, paymentsData] = await Promise.all([
      getSettingsForClient(),
      getAllAdmins(),
      getPendingPayments('pending'),
    ])

    if (settingsData) {
      const s = settingsData
      setSettings(s)
      setFormData({
        elementary_lunch_price: s.elementaryLunchPrice?.toString() || '4.00',
        highschool_lunch_price: s.highschoolLunchPrice?.toString() || '6.00',
        highschool_lunch_card_price: s.highschoolLunchCardPrice?.toString() || '50.00',
        highschool_lunch_card_lunches: s.highschoolLunchCardLunches?.toString() || '10',
        second_meal_price: s.secondMealPrice?.toString() || '4.50',
        elementary_negative_limit: s.elementaryNegativeLimit?.toString() || '-5',
        highschool_negative_limit: s.highschoolNegativeLimit?.toString() || '0',
        elementary_low_lunch_threshold: s.elementaryLowLunchThreshold?.toString() || '5',
        highschool_low_lunch_threshold: s.highschoolLowLunchThreshold?.toString() || '3',
        notifications_enabled: s.notificationsEnabled ?? true,
        zero_balance_alerts: s.zeroBalanceAlerts ?? true,
        weekly_summary_enabled: s.weeklySummaryEnabled ?? false,
        notification_frequency: (s.notificationFrequency as 'immediate' | 'daily') || 'immediate',
        email_allowed_days: s.emailAllowedDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        email_window_start: s.emailWindowStart || '08:00',
        email_window_end: s.emailWindowEnd || '18:00',
        email_timezone: s.emailTimezone || 'America/New_York',
        min_days_between_emails: s.minDaysBetweenEmails?.toString() || '3',
        auto_send_enabled: s.autoSendEnabled ?? false,
        auto_send_schedule: s.autoSendSchedule || 'weekdays',
        auto_send_time: s.autoSendTime || '09:00',
        scanner_sound_enabled: s.scannerSoundEnabled ?? true,
        scanner_auto_deduct: s.scannerAutoDeduct ?? true,
        show_student_photo: s.showStudentPhoto ?? false,
        school_name: s.schoolName || 'Aldersgate Christian Academy',
        school_year: s.schoolYear || '2025-2026',
        contact_email: s.contactEmail || '',
        email_provider: (s.emailProvider as EmailProvider) || 'none',
        email_from_address: s.emailFromAddress || '',
        email_from_name: s.emailFromName || '',
        gmail_user: s.gmailUser || '',
        gmail_app_password: s.gmailAppPassword || '',
        sendgrid_api_key: s.sendgridApiKey || '',
        smtp_host: s.smtpHost || '',
        smtp_port: s.smtpPort?.toString() || '587',
        smtp_user: s.smtpUser || '',
        smtp_password: s.smtpPassword || '',
        smtp_secure: s.smtpSecure ?? true,
        school_logo_url: s.schoolLogoUrl || '',
        primary_color: s.primaryColor || '#002c5f',
        secondary_color: s.secondaryColor || '#ffc82e',
        accent_color: s.accentColor || '#00b1c1',
        scan_display_duration: s.scanDisplayDuration?.toString() || '3000',
        scanner_buffer_timeout: s.scannerBufferTimeout?.toString() || '100',
        parent_token_expiry_days: s.parentTokenExpiryDays?.toString() || '7',
        parent_portal_enabled: s.parentPortalEnabled ?? true,
        manual_entry_enabled: s.manualEntryEnabled ?? true,
        password_min_length: s.passwordMinLength?.toString() || '6',
        settings_cache_minutes: s.settingsCacheMinutes?.toString() || '5',
      })
    }

    if (adminsData) {
      setAdmins(adminsData)
    }

    if (paymentsData) {
      setPendingPayments(paymentsData)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateField = useCallback((field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)

    try {
      await updateSettings({
        elementaryLunchPrice: parseFloat(formData.elementary_lunch_price),
        highschoolLunchPrice: parseFloat(formData.highschool_lunch_price),
        highschoolLunchCardPrice: parseFloat(formData.highschool_lunch_card_price),
        highschoolLunchCardLunches: parseInt(formData.highschool_lunch_card_lunches),
        secondMealPrice: parseFloat(formData.second_meal_price),
        elementaryNegativeLimit: parseInt(formData.elementary_negative_limit),
        highschoolNegativeLimit: parseInt(formData.highschool_negative_limit),
        elementaryLowLunchThreshold: parseFloat(formData.elementary_low_lunch_threshold),
        highschoolLowLunchThreshold: parseFloat(formData.highschool_low_lunch_threshold),
        notificationsEnabled: formData.notifications_enabled,
        zeroBalanceAlerts: formData.zero_balance_alerts,
        weeklySummaryEnabled: formData.weekly_summary_enabled,
        notificationFrequency: formData.notification_frequency,
        emailAllowedDays: formData.email_allowed_days as DayOfWeek[],
        emailWindowStart: formData.email_window_start,
        emailWindowEnd: formData.email_window_end,
        emailTimezone: formData.email_timezone,
        minDaysBetweenEmails: parseInt(formData.min_days_between_emails),
        autoSendEnabled: formData.auto_send_enabled,
        autoSendSchedule: formData.auto_send_schedule as AutoSendSchedule,
        autoSendTime: formData.auto_send_time,
        scannerSoundEnabled: formData.scanner_sound_enabled,
        scannerAutoDeduct: formData.scanner_auto_deduct,
        showStudentPhoto: formData.show_student_photo,
        scanDisplayDuration: parseInt(formData.scan_display_duration),
        scannerBufferTimeout: parseInt(formData.scanner_buffer_timeout),
        schoolName: formData.school_name,
        schoolYear: formData.school_year,
        contactEmail: formData.contact_email || null,
        emailProvider: formData.email_provider as EmailProvider,
        emailFromAddress: formData.email_from_address || null,
        emailFromName: formData.email_from_name || null,
        gmailUser: formData.gmail_user || null,
        gmailAppPassword: formData.gmail_app_password || null,
        sendgridApiKey: formData.sendgrid_api_key || null,
        smtpHost: formData.smtp_host || null,
        smtpPort: formData.smtp_port ? parseInt(formData.smtp_port) : null,
        smtpUser: formData.smtp_user || null,
        smtpPassword: formData.smtp_password || null,
        smtpSecure: formData.smtp_secure,
        schoolLogoUrl: formData.school_logo_url || null,
        primaryColor: formData.primary_color,
        secondaryColor: formData.secondary_color,
        accentColor: formData.accent_color,
        parentPortalEnabled: formData.parent_portal_enabled,
        manualEntryEnabled: formData.manual_entry_enabled,
        parentTokenExpiryDays: parseInt(formData.parent_token_expiry_days),
        passwordMinLength: parseInt(formData.password_min_length),
        settingsCacheMinutes: parseInt(formData.settings_cache_minutes),
      })

      toast.success('Settings saved successfully')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
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
