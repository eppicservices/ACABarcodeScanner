import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { AppSettings, EmailProvider } from '@prisma/client'

/**
 * nodemailer only uses os.hostname() in the EHLO greeting when it looks like a
 * fully-qualified domain. A container hostname ("74fdd2f68cce") does not, so it
 * falls back to the literal [127.0.0.1] -- which Google's SMTP relay rejects
 * with "421 4.7.0 Try again later, closing connection. (EHLO)". Give it a real
 * name so the greeting is acceptable.
 */
function getEhloName(settings: AppSettings): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL
  if (siteUrl) {
    try {
      return new URL(siteUrl).hostname
    } catch {
      // fall through to the from-address domain
    }
  }
  return settings.emailFromAddress?.split('@')[1] || undefined
}

/**
 * Creates an email transporter based on the configured provider
 */
export function getEmailTransporter(settings: AppSettings): Transporter | null {
  const provider = settings.emailProvider as EmailProvider
  const name = getEhloName(settings)

  if (provider === 'none') {
    return null
  }

  if (provider === 'gmail') {
    if (!settings.gmailUser || !settings.gmailAppPassword) {
      console.error('Gmail credentials not configured')
      return null
    }
    return nodemailer.createTransport({
      name,
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
      name,
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
      name,
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
