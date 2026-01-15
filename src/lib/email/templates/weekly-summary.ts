import type { AppSettings } from '@/types/database'
import type { WeeklySummaryEmailData } from '../types'
import { getLogoUrl } from './shared'

/**
 * Generates the HTML weekly summary email
 */
export function generateWeeklySummaryHtml(data: WeeklySummaryEmailData, schoolName: string, settings: AppSettings): string {
  const primaryColor = settings.primary_color || '#002c5f'
  const accentColor = settings.accent_color || '#00b1c1'
  const secondaryColor = settings.secondary_color || '#ffc82e'
  const logoUrl = getLogoUrl(settings)

  const weekRange = `${data.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${data.weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const totalLunchesUsed = data.students.reduce((sum, s) => sum + s.lunchesUsed, 0)
  const totalLunchesAdded = data.students.reduce((sum, s) => sum + s.lunchesAdded, 0)
  const totalBalance = data.students.reduce((sum, s) => sum + s.currentBalance, 0)

  const studentsHtml = data.students.map(student => {
    let balanceColor = '#22c55e'
    let balanceBg = '#dcfce7'
    if (student.currentBalance < 0) {
      balanceColor = '#dc2626'
      balanceBg = '#fef2f2'
    } else if (student.currentBalance <= 5) {
      balanceColor = '#f59e0b'
      balanceBg = '#fef3c7'
    }

    return `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">${student.name}</div>
          <div style="font-size: 12px; color: #64748b; text-transform: capitalize;">${student.schoolLevel.replace('_', ' ')}</div>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="color: #dc2626; font-weight: 600;">-${student.lunchesUsed}</span>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="color: #22c55e; font-weight: 600;">+${student.lunchesAdded}</span>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          <div style="display: inline-block; background: ${balanceBg}; color: ${balanceColor}; padding: 6px 12px; border-radius: 8px; font-weight: 700;">
            ${student.currentBalance}
          </div>
        </td>
      </tr>
    `
  }).join('')

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
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Weekly Lunch Summary</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <p style="color: #1e293b; font-size: 17px; margin: 0 0 8px 0; line-height: 1.5;">
        Dear <strong>${data.parentName}</strong>,
      </p>

      <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">
        Week of ${weekRange}
      </p>

      <!-- Summary Stats -->
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="flex: 1; background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${totalLunchesUsed}</div>
          <div style="font-size: 12px; color: #991b1b; font-weight: 500;">Lunches Used</div>
        </div>
        <div style="flex: 1; background: #dcfce7; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #22c55e;">${totalLunchesAdded}</div>
          <div style="font-size: 12px; color: #166534; font-weight: 500;">Lunches Added</div>
        </div>
        <div style="flex: 1; background: ${secondaryColor}20; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: ${primaryColor};">${totalBalance}</div>
          <div style="font-size: 12px; color: ${primaryColor}; font-weight: 500;">Current Balance</div>
        </div>
      </div>

      <!-- Students Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);">
            <th style="padding: 14px 16px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Student</th>
            <th style="padding: 14px 16px; text-align: center; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Used</th>
            <th style="padding: 14px 16px; text-align: center; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Added</th>
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
          View Full History
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
        Click the button above to access your parent portal and view detailed transaction history.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        ${schoolName} | Lunch Program
      </p>
      <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0 0;">
        You're receiving this because weekly summaries are enabled for your account.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Generates a plain text version of the weekly summary email
 */
export function generateWeeklySummaryText(data: WeeklySummaryEmailData, schoolName: string): string {
  const weekRange = `${data.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${data.weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const totalLunchesUsed = data.students.reduce((sum, s) => sum + s.lunchesUsed, 0)
  const totalLunchesAdded = data.students.reduce((sum, s) => sum + s.lunchesAdded, 0)
  const totalBalance = data.students.reduce((sum, s) => sum + s.currentBalance, 0)

  const studentsText = data.students.map(student =>
    `  - ${student.name} (${student.schoolLevel.replace('_', ' ')})\n    Used: ${student.lunchesUsed} | Added: ${student.lunchesAdded} | Balance: ${student.currentBalance}`
  ).join('\n\n')

  return `
${schoolName}
WEEKLY LUNCH SUMMARY
============================================
Week of ${weekRange}

Dear ${data.parentName},

Here's your weekly lunch account summary:

WEEKLY TOTALS:
  Lunches Used: ${totalLunchesUsed}
  Lunches Added: ${totalLunchesAdded}
  Current Balance: ${totalBalance}

STUDENT DETAILS:
${studentsText}

--------------------------------------------

View full history at:
${data.portalUrl}

${schoolName} | Lunch Program
  `.trim()
}
