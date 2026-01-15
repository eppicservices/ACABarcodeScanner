import type { AppSettings } from '@/types/database'
import type { PortalLinkEmailData } from '../types'
import { getEmailTransporter } from '../transporter'
import { generatePortalLinkHtml, generatePortalLinkText } from '../templates/portal-link'

/**
 * Sends a portal access link email to a parent
 */
export async function sendPortalLinkEmail(
  settings: AppSettings,
  data: PortalLinkEmailData
): Promise<{ success: boolean; error?: string }> {
  const transporter = getEmailTransporter(settings)

  if (!transporter) {
    return { success: false, error: 'Email not configured' }
  }

  const fromName = settings.email_from_name || settings.school_name || 'ACA Lunch Program'
  const fromAddress = settings.email_from_address || settings.gmail_user || settings.smtp_user || 'noreply@school.com'
  const schoolName = settings.school_name || 'Aldersgate Christian Academy'

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: data.parentEmail,
      subject: `${schoolName} - Your Parent Portal Access Link`,
      text: generatePortalLinkText(data, schoolName, settings),
      html: generatePortalLinkHtml(data, schoolName, settings)
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send portal link email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}
