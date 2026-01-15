import type { AppSettings } from '@/types/database'
import { getEmailTransporter } from '../transporter'
import { getLogoUrl } from '../templates/shared'

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
  const logoUrl = getLogoUrl(settings)

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
      <img src="${logoUrl}" alt="${schoolName}" style="max-width: 180px; height: auto;" />
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
