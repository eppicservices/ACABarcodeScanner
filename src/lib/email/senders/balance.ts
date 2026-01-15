import type { AppSettings } from '@/types/database'
import type { BalanceEmailData } from '../types'
import { getEmailTransporter } from '../transporter'
import { generateBalanceHtml, generateBalanceText } from '../templates/balance'

/**
 * Sends a balance notification email to a parent
 */
export async function sendBalanceEmail(
  settings: AppSettings,
  data: BalanceEmailData
): Promise<{ success: boolean; error?: string }> {
  const transporter = getEmailTransporter(settings)

  if (!transporter) {
    return { success: false, error: 'Email not configured' }
  }

  const fromName = settings.email_from_name || settings.school_name || 'ACA Lunch Program'
  const fromAddress = settings.email_from_address || settings.gmail_user || settings.smtp_user || 'noreply@school.com'
  const schoolName = settings.school_name || 'Aldersgate Christian Academy'

  const totalBalance = data.students.reduce((sum, s) => sum + s.balance, 0)
  const hasNegative = data.students.some(s => s.balance < 0)
  const hasLow = data.students.some(s => s.balance >= 0 && s.balance <= 5)

  let subjectPrefix = ''
  if (hasNegative) {
    subjectPrefix = 'Action Required: '
  } else if (hasLow) {
    subjectPrefix = 'Low Balance Alert: '
  }

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: data.parentEmail,
      subject: `${subjectPrefix}${schoolName} Lunch Balance - ${totalBalance} Lunches Remaining`,
      text: generateBalanceText(data, schoolName, settings),
      html: generateBalanceHtml(data, schoolName, settings)
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send balance email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}
