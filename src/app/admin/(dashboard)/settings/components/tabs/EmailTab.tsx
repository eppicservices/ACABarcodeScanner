'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useSettings } from '../../context/SettingsContext'

export function EmailTab() {
  const { formData, updateField, saving, handleSave, setPreviewTemplate } = useSettings()
  const { data: session } = useSession()
  const [testingEmail, setTestingEmail] = useState(false)

  async function handleTestEmail() {
    setTestingEmail(true)

    // First save the current settings
    await handleSave()

    const userEmail = session?.user?.email
    if (!userEmail) {
      toast.error('Could not get your email address')
      setTestingEmail(false)
      return
    }

    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to send test email')
      } else {
        toast.success(`Test email sent to ${userEmail}`)
      }
    } catch {
      toast.error('Failed to send test email')
    }

    setTestingEmail(false)
  }

  return (
    <div className="tab-panel">
      <h2>Email Configuration</h2>
      <p className="section-desc">Configure email service for sending receipts and notifications.</p>

      <div className="form-group">
        <label>Email Provider</label>
        <select
          className="input"
          value={formData.email_provider}
          onChange={e => updateField('email_provider', e.target.value)}
        >
          <option value="none">None (Email Disabled)</option>
          <option value="gmail">Gmail</option>
          <option value="sendgrid">SendGrid</option>
          <option value="smtp">Custom SMTP</option>
        </select>
      </div>

      {formData.email_provider !== 'none' && (
        <>
          <h3>From Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>From Name</label>
              <input
                type="text"
                className="input"
                value={formData.email_from_name}
                onChange={e => updateField('email_from_name', e.target.value)}
                placeholder="ACA Lunch Program"
              />
              <span className="hint">Display name in emails</span>
            </div>
            <div className="form-group">
              <label>From Email</label>
              <input
                type="email"
                className="input"
                value={formData.email_from_address}
                onChange={e => updateField('email_from_address', e.target.value)}
                placeholder="lunch@school.edu"
              />
              <span className="hint">Sender email address</span>
            </div>
          </div>
        </>
      )}

      {formData.email_provider === 'gmail' && (
        <>
          <h3>Gmail Settings</h3>
          <div className="info-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <div>
              <strong>App Password Required</strong>
              <p>Gmail requires an App Password, not your regular password. Generate one at: Google Account → Security → 2-Step Verification → App passwords</p>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Gmail Address</label>
              <input
                type="email"
                className="input"
                value={formData.gmail_user}
                onChange={e => updateField('gmail_user', e.target.value)}
                placeholder="your.email@gmail.com"
              />
            </div>
            <div className="form-group">
              <label>App Password</label>
              <input
                type="password"
                className="input"
                value={formData.gmail_app_password}
                onChange={e => updateField('gmail_app_password', e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
              />
            </div>
          </div>
        </>
      )}

      {formData.email_provider === 'sendgrid' && (
        <>
          <h3>SendGrid Settings</h3>
          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              className="input"
              value={formData.sendgrid_api_key}
              onChange={e => updateField('sendgrid_api_key', e.target.value)}
              placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <span className="hint">Find this in your SendGrid dashboard under Settings → API Keys</span>
          </div>
        </>
      )}

      {formData.email_provider === 'smtp' && (
        <>
          <h3>SMTP Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>SMTP Host</label>
              <input
                type="text"
                className="input"
                value={formData.smtp_host}
                onChange={e => updateField('smtp_host', e.target.value)}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="form-group">
              <label>Port</label>
              <input
                type="number"
                className="input"
                value={formData.smtp_port}
                onChange={e => updateField('smtp_port', e.target.value)}
                placeholder="587"
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="input"
                value={formData.smtp_user}
                onChange={e => updateField('smtp_user', e.target.value)}
                placeholder="username"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="input"
                value={formData.smtp_password}
                onChange={e => updateField('smtp_password', e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="toggle-card">
            <div className="toggle-info">
              <strong>Use TLS/SSL</strong>
              <span>Enable secure connection (recommended)</span>
            </div>
            <button
              type="button"
              className={`toggle ${formData.smtp_secure ? 'on' : ''}`}
              onClick={() => updateField('smtp_secure', !formData.smtp_secure)}
            >
              <span className="toggle-handle" />
            </button>
          </div>
        </>
      )}

      {formData.email_provider !== 'none' && (
        <div className="test-email-section">
          <button
            className="btn btn-secondary"
            onClick={handleTestEmail}
            disabled={testingEmail}
          >
            {testingEmail ? 'Sending...' : 'Send Test Email'}
          </button>
          <span className="hint">Sends a test email to your admin email address</span>
        </div>
      )}

      <h3>Email Templates</h3>
      <p className="section-desc">Preview the email templates that are sent to parents.</p>

      <div className="template-cards">
        <div className="template-card">
          <div className="template-icon balance">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div className="template-info">
            <h4>Balance Notification</h4>
            <p>Sent when using "Email Balance" button on the Parents page. Includes individual student balances and a link to add funds.</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPreviewTemplate('balance')}
          >
            Preview
          </button>
        </div>

        <div className="template-card">
          <div className="template-icon receipt">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
              <path d="M8 10h8" />
              <path d="M8 14h4" />
            </svg>
          </div>
          <div className="template-info">
            <h4>Payment Receipt</h4>
            <p>Sent automatically after a payment is processed. Includes itemized details and new balances.</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPreviewTemplate('receipt')}
          >
            Preview
          </button>
        </div>

        <div className="template-card">
          <div className="template-icon portal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <div className="template-info">
            <h4>Portal Access Link</h4>
            <p>Sent when a parent requests access to the parent portal. Contains a secure time-limited link.</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPreviewTemplate('portal')}
          >
            Preview
          </button>
        </div>

        <div className="template-card">
          <div className="template-icon weekly">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="template-info">
            <h4>Weekly Summary</h4>
            <p>Sent weekly to parents showing lunch usage, payments, and current balances for the week.</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPreviewTemplate('weekly')}
          >
            Preview
          </button>
        </div>

        <div className="template-card">
          <div className="template-icon welcome">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="template-info">
            <h4>Welcome Email</h4>
            <p>Sent to new parents when they are added to the system. Introduces the lunch program and provides portal access.</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPreviewTemplate('welcome')}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
