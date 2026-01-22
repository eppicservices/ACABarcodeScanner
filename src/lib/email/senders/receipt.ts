import type { AppSettings } from '@prisma/client'
import type { ReceiptData } from '../types'
import { getEmailTransporter } from '../transporter'
import { generateReceiptHtml, generateReceiptText } from '../templates/receipt'

/**
 * Sends a receipt email to a parent
 */
export async function sendReceiptEmail(
  settings: AppSettings,
  data: ReceiptData
): Promise<{ success: boolean; error?: string }> {
  const transporter = getEmailTransporter(settings)

  if (!transporter) {
    return { success: false, error: 'Email not configured' }
  }

  const fromName = settings.emailFromName || settings.schoolName || 'ACA Lunch Program'
  const fromAddress = settings.emailFromAddress || settings.gmailUser || settings.smtpUser || 'noreply@school.com'
  const schoolName = settings.schoolName || 'Aldersgate Christian Academy'

  const formattedDate = data.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: data.parentEmail,
      subject: `${schoolName} Lunch Payment Receipt - ${formattedDate}`,
      text: generateReceiptText(data, schoolName),
      html: generateReceiptHtml(data, schoolName, settings)
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send receipt email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}
