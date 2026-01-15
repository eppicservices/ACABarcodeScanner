'use client'

import { useSettings } from '../context/SettingsContext'
import {
  getBalanceEmailPreview,
  getReceiptEmailPreview,
  getPortalLinkEmailPreview,
  getWeeklySummaryEmailPreview,
  getWelcomeEmailPreview,
} from '../utils/emailPreviews'

export function EmailPreviewModal() {
  const { previewTemplate, setPreviewTemplate, formData } = useSettings()

  if (!previewTemplate) return null

  const getPreviewHtml = () => {
    switch (previewTemplate) {
      case 'balance':
        return getBalanceEmailPreview(formData)
      case 'receipt':
        return getReceiptEmailPreview(formData)
      case 'portal':
        return getPortalLinkEmailPreview(formData)
      case 'weekly':
        return getWeeklySummaryEmailPreview(formData)
      case 'welcome':
        return getWelcomeEmailPreview(formData)
      default:
        return ''
    }
  }

  const getTitle = () => {
    switch (previewTemplate) {
      case 'balance':
        return 'Balance Notification Email'
      case 'receipt':
        return 'Payment Receipt Email'
      case 'portal':
        return 'Portal Access Link Email'
      case 'weekly':
        return 'Weekly Summary Email'
      case 'welcome':
        return 'Welcome Email'
      default:
        return 'Email Preview'
    }
  }

  return (
    <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{getTitle()}</h3>
          <button className="modal-close" onClick={() => setPreviewTemplate(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="email-preview-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>This is a preview with sample data. Actual emails will contain real student information.</span>
          </div>
          <iframe
            srcDoc={getPreviewHtml()}
            className="email-preview-frame"
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  )
}
