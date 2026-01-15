import type { AppSettings } from '@/types/database'
import type { WeeklySummaryEmailData } from '../types'
import { getEmailTransporter } from '../transporter'
import { generateWeeklySummaryHtml, generateWeeklySummaryText } from '../templates/weekly-summary'

/**
 * Sends a weekly summary email to a parent
 */
export async function sendWeeklySummaryEmail(
  settings: AppSettings,
  data: WeeklySummaryEmailData
): Promise<{ success: boolean; error?: string }> {
  const transporter = getEmailTransporter(settings)

  if (!transporter) {
    return { success: false, error: 'Email not configured' }
  }

  const fromName = settings.email_from_name || settings.school_name || 'ACA Lunch Program'
  const fromAddress = settings.email_from_address || settings.gmail_user || settings.smtp_user || 'noreply@school.com'
  const schoolName = settings.school_name || 'Aldersgate Christian Academy'

  const weekRange = `${data.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${data.weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: data.parentEmail,
      subject: `${schoolName} Weekly Lunch Summary - ${weekRange}`,
      text: generateWeeklySummaryText(data, schoolName),
      html: generateWeeklySummaryHtml(data, schoolName, settings)
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send weekly summary email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}
