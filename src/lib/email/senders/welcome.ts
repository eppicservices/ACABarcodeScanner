import type { AppSettings } from '@prisma/client'
import type { WelcomeEmailData } from '../types'
import { getEmailTransporter } from '../transporter'
import { generateWelcomeHtml, generateWelcomeText } from '../templates/welcome'

/**
 * Sends a welcome email to a new parent
 */
export async function sendWelcomeEmail(
  settings: AppSettings,
  data: WelcomeEmailData
): Promise<{ success: boolean; error?: string }> {
  const transporter = getEmailTransporter(settings)

  if (!transporter) {
    return { success: false, error: 'Email not configured' }
  }

  const fromName = settings.emailFromName || settings.schoolName || 'ACA Lunch Program'
  const fromAddress = settings.emailFromAddress || settings.gmailUser || settings.smtpUser || 'noreply@school.com'
  const schoolName = settings.schoolName || 'Aldersgate Christian Academy'

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: data.parentEmail,
      subject: `Welcome to ${schoolName} Lunch Program!`,
      text: generateWelcomeText(data, schoolName),
      html: generateWelcomeHtml(data, schoolName, settings)
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}
