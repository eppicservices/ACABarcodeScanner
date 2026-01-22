import type { AppSettings } from '@prisma/client'
import type { WelcomeEmailData } from '../types'
import { getLogoUrl } from './shared'

/**
 * Generates the HTML welcome email
 */
export function generateWelcomeHtml(data: WelcomeEmailData, schoolName: string, settings: AppSettings): string {
  const primaryColor = settings.primaryColor || '#002c5f'
  const accentColor = settings.accentColor || '#00b1c1'
  const secondaryColor = settings.secondaryColor || '#ffc82e'
  const logoUrl = getLogoUrl(settings)

  const studentsHtml = data.students.map(student => `
    <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f8fafc; border-radius: 10px; margin-bottom: 8px;">
      <div style="width: 40px; height: 40px; background: ${accentColor}; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px;">
        ${student.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <div style="font-weight: 600; color: #1e293b;">${student.name}</div>
        <div style="font-size: 12px; color: #64748b; text-transform: capitalize;">${student.schoolLevel.replace('_', ' ')}</div>
      </div>
    </div>
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
    <div style="background: ${primaryColor}; padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
      <img src="${logoUrl}" alt="${schoolName}" style="max-width: 220px; height: auto; margin-bottom: 12px;" />
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Welcome to the Lunch Program!</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <!-- Welcome Banner -->
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${secondaryColor} 0%, #f59e0b 100%); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">&#127860;</span>
        </div>
        <h2 style="color: #1e293b; margin: 0 0 8px 0; font-size: 24px;">Welcome, ${data.parentName}!</h2>
        <p style="color: #64748b; margin: 0; font-size: 15px;">Your account has been set up successfully.</p>
      </div>

      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Your ${data.students.length === 1 ? 'child has' : 'children have'} been enrolled in the ${schoolName} lunch program. Here's what you need to know:
      </p>

      <!-- Students -->
      <div style="margin-bottom: 24px;">
        <div style="font-weight: 600; color: #1e293b; margin-bottom: 12px; font-size: 14px;">Enrolled Students:</div>
        ${studentsHtml}
      </div>

      <!-- How It Works -->
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="font-weight: 700; color: ${primaryColor}; margin-bottom: 12px; font-size: 15px;">How It Works</div>
        <div style="color: #475569; font-size: 14px; line-height: 1.8;">
          <div style="margin-bottom: 8px;">&#10003; Add funds to your account online or at the school office</div>
          <div style="margin-bottom: 8px;">&#10003; Your child scans their barcode at lunch to deduct a meal</div>
          <div>&#10003; Receive email notifications when the balance is low</div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${data.portalUrl}" style="display: inline-block; background: ${accentColor}; color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(0, 177, 193, 0.4);">
          Access Parent Portal
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
        Use the parent portal to add funds and view your account history.
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
 * Generates a plain text version of the welcome email
 */
export function generateWelcomeText(data: WelcomeEmailData, schoolName: string): string {
  const studentsText = data.students.map(s =>
    `  - ${s.name} (${s.schoolLevel.replace('_', ' ')})`
  ).join('\n')

  return `
${schoolName}
WELCOME TO THE LUNCH PROGRAM!
============================================

Dear ${data.parentName},

Welcome! Your account has been set up successfully.

Your ${data.students.length === 1 ? 'child has' : 'children have'} been enrolled in the lunch program:

${studentsText}

HOW IT WORKS:
- Add funds to your account online or at the school office
- Your child scans their barcode at lunch to deduct a meal
- Receive email notifications when the balance is low

ACCESS YOUR PARENT PORTAL:
${data.portalUrl}

Use the parent portal to add funds and view your account history.

Questions? Contact the school office for assistance.

${schoolName} | Lunch Program
  `.trim()
}
