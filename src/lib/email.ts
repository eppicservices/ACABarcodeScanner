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
function generateReceiptHtml(data: ReceiptData, schoolName: string, colors: { primary: string; secondary: string; accent: string }): string {
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
    <div style="background: ${colors.primary}; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
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
          <tr style="background: ${colors.primary};">
            <td style="padding: 14px; color: white; font-weight: 600;">Total</td>
            <td style="padding: 14px; color: ${colors.secondary}; font-weight: 700; text-align: right; font-size: 18px;">$${data.total.toFixed(2)}</td>
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
  const colors = {
    primary: settings.primary_color || '#002c5f',
    secondary: settings.secondary_color || '#ffc82e',
    accent: settings.accent_color || '#00b1c1'
  }

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
      html: generateReceiptHtml(data, schoolName, colors)
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
  const primaryColor = settings.primary_color || '#002c5f'

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
    <div style="background: ${primaryColor}; padding: 24px; text-align: center;">
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

export interface StudentBalance {
  name: string
  balance: number
  schoolLevel: 'elementary' | 'high_school'
}

export interface BalanceEmailData {
  parentName: string
  parentEmail: string
  students: StudentBalance[]
  portalUrl: string
}

/**
 * Generates the HTML balance notification email
 */
function generateBalanceHtml(data: BalanceEmailData, schoolName: string, settings: AppSettings): string {
  const totalBalance = data.students.reduce((sum, s) => sum + s.balance, 0)

  // Determine overall status
  const hasNegative = data.students.some(s => s.balance < 0)
  const hasLow = data.students.some(s => s.balance >= 0 && s.balance <= 5)

  let statusColor = '#22c55e' // green - good
  let statusBg = '#dcfce7'
  let statusText = 'Good Standing'
  let statusIcon = '&#10003;' // checkmark

  if (hasNegative) {
    statusColor = '#dc2626'
    statusBg = '#fef2f2'
    statusText = 'Attention Needed'
    statusIcon = '!'
  } else if (hasLow) {
    statusColor = '#f59e0b'
    statusBg = '#fef3c7'
    statusText = 'Low Balance'
    statusIcon = '&#9888;' // warning
  }

  const studentsHtml = data.students.map(student => {
    let balanceColor = '#22c55e'
    let balanceBg = '#dcfce7'
    if (student.balance < 0) {
      balanceColor = '#dc2626'
      balanceBg = '#fef2f2'
    } else if (student.balance <= 5) {
      balanceColor = '#f59e0b'
      balanceBg = '#fef3c7'
    }

    const lunchPrice = student.schoolLevel === 'elementary'
      ? settings.elementary_lunch_price
      : settings.highschool_lunch_price
    const lunchesValue = student.balance * lunchPrice

    return `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">${student.name}</div>
          <div style="font-size: 12px; color: #64748b; text-transform: capitalize;">${student.schoolLevel.replace('_', ' ')}</div>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          <div style="display: inline-block; background: ${balanceBg}; color: ${balanceColor}; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 16px;">
            ${student.balance} lunches
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">~$${lunchesValue.toFixed(2)} value</div>
        </td>
      </tr>
    `
  }).join('')

  const primaryColor = settings.primary_color || '#002c5f'
  const accentColor = settings.accent_color || '#00b1c1'
  const tokenExpiryDays = settings.parent_token_expiry_days || 7

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
    <div style="background: ${primaryColor}; padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${schoolName}</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 15px;">Lunch Account Balance Update</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <!-- Greeting -->
      <p style="color: #1e293b; font-size: 17px; margin: 0 0 24px 0; line-height: 1.5;">
        Dear <strong>${data.parentName}</strong>,
      </p>

      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
        Here is the current lunch account balance for your ${data.students.length === 1 ? 'child' : 'children'}:
      </p>

      <!-- Status Banner -->
      <div style="background: ${statusBg}; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center;">
        <div style="width: 40px; height: 40px; background: ${statusColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
          <span style="color: white; font-size: 20px; font-weight: bold;">${statusIcon}</span>
        </div>
        <div>
          <div style="font-weight: 700; color: ${statusColor}; font-size: 15px;">${statusText}</div>
          <div style="color: #64748b; font-size: 13px;">Family Total: ${totalBalance} lunches</div>
        </div>
      </div>

      <!-- Students Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);">
            <th style="padding: 14px 16px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Student</th>
            <th style="padding: 14px 16px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${studentsHtml}
        </tbody>
      </table>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${data.portalUrl}" style="display: inline-block; background: ${accentColor}; color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(0, 177, 193, 0.4);">
          Add Funds to Account
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
        Click the button above to access your parent portal and add funds to your child's lunch account.
        <br><br>
        <span style="font-size: 12px; color: #94a3b8;">This link will expire in ${tokenExpiryDays} days for security purposes.</span>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        ${schoolName} | Lunch Program
      </p>
      <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0 0;">
        Questions? Contact the school office for assistance.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Generates a plain text version of the balance email
 */
function generateBalanceText(data: BalanceEmailData, schoolName: string, settings: AppSettings): string {
  const totalBalance = data.students.reduce((sum, s) => sum + s.balance, 0)
  const tokenExpiryDays = settings.parent_token_expiry_days || 7

  const studentsText = data.students.map(student => {
    const lunchPrice = student.schoolLevel === 'elementary'
      ? settings.elementary_lunch_price
      : settings.highschool_lunch_price
    const lunchesValue = student.balance * lunchPrice
    return `  - ${student.name} (${student.schoolLevel.replace('_', ' ')}): ${student.balance} lunches (~$${lunchesValue.toFixed(2)} value)`
  }).join('\n')

  return `
${schoolName}
LUNCH ACCOUNT BALANCE UPDATE
============================================

Dear ${data.parentName},

Here is the current lunch account balance for your ${data.students.length === 1 ? 'child' : 'children'}:

${studentsText}

--------------------------------------------
FAMILY TOTAL: ${totalBalance} lunches
--------------------------------------------

To add funds to your account, visit:
${data.portalUrl}

This link will expire in ${tokenExpiryDays} days for security purposes.

If you have any questions, please contact the school office.

${schoolName} | Lunch Program
  `.trim()
}

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
