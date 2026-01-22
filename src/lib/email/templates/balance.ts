import type { AppSettings } from '@prisma/client'
import type { BalanceEmailData } from '../types'
import { getLogoUrl } from './shared'

/**
 * Generates the HTML balance notification email
 */
export function generateBalanceHtml(data: BalanceEmailData, schoolName: string, settings: AppSettings): string {
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
      ? Number(settings.elementaryLunchPrice)
      : Number(settings.highschoolLunchPrice)
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

  const primaryColor = settings.primaryColor || '#002c5f'
  const accentColor = settings.accentColor || '#00b1c1'
  const tokenExpiryDays = settings.parentTokenExpiryDays || 7
  const logoUrl = getLogoUrl(settings)

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
      <img src="${logoUrl}" alt="${schoolName}" style="max-width: 220px; height: auto; margin-bottom: 12px;" />
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Lunch Account Balance Update</p>
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
export function generateBalanceText(data: BalanceEmailData, schoolName: string, settings: AppSettings): string {
  const totalBalance = data.students.reduce((sum, s) => sum + s.balance, 0)
  const tokenExpiryDays = settings.parentTokenExpiryDays || 7

  const studentsText = data.students.map(student => {
    const lunchPrice = student.schoolLevel === 'elementary'
      ? Number(settings.elementaryLunchPrice)
      : Number(settings.highschoolLunchPrice)
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
