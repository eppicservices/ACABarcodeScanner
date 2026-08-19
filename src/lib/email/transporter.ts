import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { AppSettings, EmailProvider } from '@prisma/client'

/**
 * Creates an email transporter based on the configured provider
 */
export function getEmailTransporter(settings: AppSettings): Transporter | null {
  const provider = settings.emailProvider as EmailProvider

  if (provider === 'none') {
    return null
  }

  if (provider === 'gmail') {
    if (!settings.gmailUser || !settings.gmailAppPassword) {
      console.error('Gmail credentials not configured')
      return null
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: settings.gmailUser,
        pass: settings.gmailAppPassword
      }
    })
  }

  if (provider === 'sendgrid') {
    if (!settings.sendgridApiKey) {
      console.error('SendGrid API key not configured')
      return null
    }
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: settings.sendgridApiKey
      }
    })
  }

  if (provider === 'smtp') {
    if (!settings.smtpHost) {
      console.error('SMTP host not configured')
      return null
    }
    // A relay that authorises by source IP -- Google Workspace SMTP relay with
    // an allowlisted address, for instance -- accepts no credentials at all, so
    // only attach auth when both halves are actually present.
    const hasCredentials = Boolean(settings.smtpUser && settings.smtpPassword)
    return nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: settings.smtpSecure,
      ...(hasCredentials && {
        auth: {
          user: settings.smtpUser as string,
          pass: settings.smtpPassword as string
        }
      })
    })
  }

  return null
}
