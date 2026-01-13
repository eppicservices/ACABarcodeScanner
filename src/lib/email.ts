import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { AppSettings, EmailProvider } from '@/types/database'

export interface ReceiptItem {
  studentName: string
  amount: number
  lunches: number
  isLunchCard: boolean
  newBalance: number
}

export interface ReceiptData {
  parentName: string
  parentEmail: string
  paymentMethod: string
  items: ReceiptItem[]
  total: number
  date: Date
}

/**
 * Creates an email transporter based on the configured provider
 */
export function getEmailTransporter(settings: AppSettings): Transporter | null {
  const provider = settings.email_provider as EmailProvider

  if (provider === 'none') {
    return null
  }

  if (provider === 'gmail') {
    if (!settings.gmail_user || !settings.gmail_app_password) {
      console.error('Gmail credentials not configured')
      return null
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: settings.gmail_user,
        pass: settings.gmail_app_password
      }
    })
  }

  if (provider === 'sendgrid') {
    if (!settings.sendgrid_api_key) {
      console.error('SendGrid API key not configured')
      return null
    }
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: settings.sendgrid_api_key
      }
    })
  }

  if (provider === 'smtp') {
    if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
      console.error('SMTP credentials not configured')
      return null
    }
    return nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port || 587,
      secure: settings.smtp_secure,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password
      }
    })
  }

  return null
}

/**
 * Generates the HTML receipt email
 */
function generateReceiptHtml(data: ReceiptData, schoolName: string): string {
  const formattedDate = data.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
        ${item.studentName}
        ${item.isLunchCard ? '<span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">Lunch Card</span>' : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${item.amount.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.lunches} lunches</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${item.newBalance} lunches</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: #002c5f; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 20px;">${schoolName}</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Lunch Payment Receipt</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
      <p style="color: #1e293b; font-size: 16px; margin: 0 0 24px 0;">
        Dear ${data.parentName},
      </p>

      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        Thank you for your payment! Here are the details of your transaction:
      </p>

      <!-- Payment Info -->
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #64748b; font-size: 13px;">Payment Date</span>
          <span style="color: #1e293b; font-size: 13px; font-weight: 500;">${formattedDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b; font-size: 13px;">Payment Method</span>
          <span style="color: #1e293b; font-size: 13px; font-weight: 500;">${data.paymentMethod}</span>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px; text-align: left; font-size: 13px; color: #475569; font-weight: 600;">Student</th>
            <th style="padding: 12px; text-align: right; font-size: 13px; color: #475569; font-weight: 600;">Amount</th>
            <th style="padding: 12px; text-align: center; font-size: 13px; color: #475569; font-weight: 600;">Lunches</th>
            <th style="padding: 12px; text-align: right; font-size: 13px; color: #475569; font-weight: 600;">New Balance</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #002c5f;">
            <td style="padding: 14px; color: white; font-weight: 600;">Total</td>
            <td style="padding: 14px; color: #ffc82e; font-weight: 700; text-align: right; font-size: 18px;">$${data.total.toFixed(2)}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>

      <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0;">
        If you have any questions about this payment, please contact the school office.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        ${schoolName} | Lunch Program
      </p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Generates a plain text version of the receipt
 */
function generateReceiptText(data: ReceiptData, schoolName: string): string {
  const formattedDate = data.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const itemsText = data.items.map(item =>
    `  - ${item.studentName}: $${item.amount.toFixed(2)} (${item.lunches} lunches)${item.isLunchCard ? ' [Lunch Card]' : ''}\n    New Balance: ${item.newBalance} lunches`
  ).join('\n\n')

  return `
${schoolName}
LUNCH PAYMENT RECEIPT
============================================

Dear ${data.parentName},

Thank you for your payment!

Payment Date: ${formattedDate}
Payment Method: ${data.paymentMethod === 'cash' ? 'Cash' : 'Online Payment'}

PAYMENT DETAILS:
${itemsText}

--------------------------------------------
TOTAL: $${data.total.toFixed(2)}
--------------------------------------------

If you have any questions about this payment, please contact the school office.

${schoolName} | Lunch Program
  `.trim()
}

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

  const fromName = settings.email_from_name || settings.school_name || 'ACA Lunch Program'
  const fromAddress = settings.email_from_address || settings.gmail_user || settings.smtp_user || 'noreply@school.com'
  const schoolName = settings.school_name || 'Aldersgate Christian Academy'

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
      html: generateReceiptHtml(data, schoolName)
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

/**
 * Sends a test email to verify configuration
 */
export async function sendTestEmail(
  settings: AppSettings,
  testEmail: string
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
      to: testEmail,
      subject: `${schoolName} - Email Configuration Test`,
      text: `This is a test email from ${schoolName} Lunch Program.\n\nIf you received this email, your email configuration is working correctly!`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #002c5f; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 18px;">${schoolName}</h1>
    </div>
    <div style="padding: 32px; text-align: center;">
      <div style="width: 64px; height: 64px; background: #22c55e; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 32px;">&#10003;</span>
      </div>
      <h2 style="color: #1e293b; margin: 0 0 8px 0;">Email Configuration Successful!</h2>
      <p style="color: #64748b; margin: 0;">Your email settings are working correctly.</p>
    </div>
  </div>
</body>
</html>
      `
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send test email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}
