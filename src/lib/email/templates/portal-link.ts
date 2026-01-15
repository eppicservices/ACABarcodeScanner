import type { AppSettings } from '@/types/database'
import type { PortalLinkEmailData } from '../types'
import { getLogoUrl } from './shared'

/**
 * Generates the HTML portal access link email
 */
export function generatePortalLinkHtml(data: PortalLinkEmailData, schoolName: string, settings: AppSettings): string {
  const primaryColor = settings.primary_color || '#002c5f'
  const accentColor = settings.accent_color || '#00b1c1'
  const tokenExpiryDays = settings.parent_token_expiry_days || 7
  const logoUrl = getLogoUrl(settings)

  const expiryDate = data.expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

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
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Parent Portal Access</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <p style="color: #1e293b; font-size: 17px; margin: 0 0 24px 0; line-height: 1.5;">
        Dear <strong>${data.parentName}</strong>,
      </p>

      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
        You requested access to the ${schoolName} Lunch Program parent portal. Click the button below to view your children's lunch balances and add funds to their accounts.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${data.portalUrl}" style="display: inline-block; background: ${accentColor}; color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(0, 177, 193, 0.4);">
          Access Parent Portal
        </a>
      </div>

      <!-- Security Notice -->
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
        <div style="font-weight: 600; color: #92400e; font-size: 14px; margin-bottom: 4px;">Security Notice</div>
        <div style="color: #78350f; font-size: 13px; line-height: 1.5;">
          This link is personal to you and expires on <strong>${expiryDate}</strong>. Do not share this link with others.
        </div>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
        If you didn't request this link, you can safely ignore this email.
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
 * Generates a plain text version of the portal link email
 */
export function generatePortalLinkText(data: PortalLinkEmailData, schoolName: string, settings: AppSettings): string {
  const tokenExpiryDays = settings.parent_token_expiry_days || 7
  const expiryDate = data.expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
${schoolName}
PARENT PORTAL ACCESS
============================================

Dear ${data.parentName},

You requested access to the ${schoolName} Lunch Program parent portal.

Access your parent portal here:
${data.portalUrl}

SECURITY NOTICE:
This link is personal to you and expires on ${expiryDate}.
Do not share this link with others.

This link will expire in ${tokenExpiryDays} days for security purposes.

If you didn't request this link, you can safely ignore this email.

${schoolName} | Lunch Program
  `.trim()
}
