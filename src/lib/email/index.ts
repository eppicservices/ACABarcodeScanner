/**
 * Email module - backwards compatible re-exports
 *
 * All imports from '@/lib/email' continue to work as before.
 */

// Types
export type {
  ReceiptItem,
  ReceiptData,
  StudentBalance,
  BalanceEmailData,
  PortalLinkEmailData,
  WeeklySummaryStudent,
  WeeklySummaryEmailData,
  WelcomeEmailData,
} from './types'

// Transporter
export { getEmailTransporter } from './transporter'

// Senders
export { sendReceiptEmail } from './senders/receipt'
export { sendBalanceEmail } from './senders/balance'
export { sendPortalLinkEmail } from './senders/portal-link'
export { sendWeeklySummaryEmail } from './senders/weekly-summary'
export { sendWelcomeEmail } from './senders/welcome'
export { sendTestEmail } from './senders/test'
