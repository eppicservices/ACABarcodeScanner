import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { AppSettings, EmailProvider } from '@/types/database'

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
