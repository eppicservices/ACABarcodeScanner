import type { SettingsFormData } from '../types'

const DEFAULT_LOGO_URL = 'https://www.aldersgatechristian.com/wp-content/uploads/2017/12/ACA-Logo_Horizontal_White_small.png'

export function getBalanceEmailPreview(formData: SettingsFormData): string {
  const schoolName = formData.school_name || 'Your School'
  const logoUrl = formData.school_logo_url || DEFAULT_LOGO_URL
  const primaryColor = formData.primary_color || '#002c5f'
  const accentColor = formData.accent_color || '#00b1c1'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${primaryColor}; padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
      <img src="${logoUrl}" alt="${schoolName}" style="max-width: 220px; height: auto; margin-bottom: 12px;" />
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Lunch Account Balance Update</p>
    </div>
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <p style="color: #1e293b; font-size: 17px; margin: 0 0 24px 0; line-height: 1.5;">Dear <strong>John Smith</strong>,</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">Here is the current lunch account balance for your children:</p>
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center;">
        <div style="width: 40px; height: 40px; background: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
          <span style="color: white; font-size: 20px; font-weight: bold;">&#9888;</span>
        </div>
        <div>
          <div style="font-weight: 700; color: #f59e0b; font-size: 15px;">Low Balance</div>
          <div style="color: #64748b; font-size: 13px;">Family Total: 7 lunches</div>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);">
            <th style="padding: 14px 16px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Student</th>
            <th style="padding: 14px 16px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">Emma Smith</div>
              <div style="font-size: 12px; color: #64748b;">Elementary</div>
            </td>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <div style="display: inline-block; background: #fef3c7; color: #f59e0b; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 16px;">4 lunches</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">~$16.00 value</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">Jake Smith</div>
              <div style="font-size: 12px; color: #64748b;">High School</div>
            </td>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <div style="display: inline-block; background: #fef3c7; color: #f59e0b; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 16px;">3 lunches</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">~$18.00 value</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="#" style="display: inline-block; background: ${accentColor}; color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(0, 177, 193, 0.4);">Add Funds to Account</a>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Click the button above to access your parent portal and add funds to your child's lunch account.<br><br><span style="font-size: 12px; color: #94a3b8;">This link will expire in 7 days for security purposes.</span></p>
    </div>
    <div style="text-align: center; padding: 24px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">${schoolName} | Lunch Program</p>
      <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0 0;">Questions? Contact the school office for assistance.</p>
    </div>
  </div>
</body>
</html>`
}

export function getReceiptEmailPreview(formData: SettingsFormData): string {
  const schoolName = formData.school_name || 'Your School'
  const logoUrl = formData.school_logo_url || DEFAULT_LOGO_URL
  const primaryColor = formData.primary_color || '#002c5f'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${primaryColor}; padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
      <img src="${logoUrl}" alt="${schoolName}" style="max-width: 200px; height: auto; margin-bottom: 12px;" />
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Lunch Payment Receipt</p>
    </div>
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="color: #22c55e; font-size: 32px;">&#10003;</span>
        </div>
        <h2 style="color: #1e293b; margin: 0 0 4px 0; font-size: 20px;">Payment Confirmed</h2>
        <p style="color: #64748b; margin: 0; font-size: 14px;">${today}</p>
      </div>
      <p style="color: #1e293b; font-size: 15px; margin: 0 0 24px 0;">Dear <strong>John Smith</strong>,</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Thank you for your payment! Here's your receipt:</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);">
            <th style="padding: 14px 16px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Student</th>
            <th style="padding: 14px 16px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Amount</th>
            <th style="padding: 14px 16px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Lunches</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e293b;">Emma Smith</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">$40.00</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="background: #dcfce7; color: #22c55e; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px;">+10</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e293b;">Jake Smith</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">$50.00</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
              <span style="background: #fef3c7; color: #f59e0b; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px;">Lunch Card</span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc;">
            <td style="padding: 16px; font-weight: 700; color: #1e293b;">Total</td>
            <td style="padding: 16px; text-align: right; font-weight: 700; color: #00b1c1; font-size: 18px;">$90.00</td>
            <td style="padding: 16px;"></td>
          </tr>
        </tfoot>
      </table>
      <div style="background: #dcfce7; border-radius: 10px; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #16a34a; font-size: 14px; font-weight: 500;">New Balance: Emma (14 lunches) | Jake (13 lunches)</p>
      </div>
    </div>
    <div style="text-align: center; padding: 24px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">${schoolName} | Lunch Program</p>
    </div>
  </div>
</body>
</html>`
}

export function getPortalLinkEmailPreview(formData: SettingsFormData): string {
  const schoolName = formData.school_name || 'Your School'
  const logoUrl = formData.school_logo_url || DEFAULT_LOGO_URL
  const primaryColor = formData.primary_color || '#002c5f'
  const accentColor = formData.accent_color || '#00b1c1'
  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${primaryColor}; padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
      <img src="${logoUrl}" alt="${schoolName}" style="max-width: 220px; height: auto; margin-bottom: 12px;" />
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Parent Portal Access</p>
    </div>
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <p style="color: #1e293b; font-size: 17px; margin: 0 0 24px 0; line-height: 1.5;">Dear <strong>John Smith</strong>,</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">You requested access to the ${schoolName} Lunch Program parent portal. Click the button below to view your children's lunch balances and add funds to their accounts.</p>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="#" style="display: inline-block; background: ${accentColor}; color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(0, 177, 193, 0.4);">Access Parent Portal</a>
      </div>
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
        <div style="font-weight: 600; color: #92400e; font-size: 14px; margin-bottom: 4px;">Security Notice</div>
        <div style="color: #78350f; font-size: 13px; line-height: 1.5;">This link is personal to you and expires on <strong>${expiryDate}</strong>. Do not share this link with others.</div>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">If you didn't request this link, you can safely ignore this email.<br><br><span style="font-size: 12px; color: #94a3b8;">This link will expire in 7 days for security purposes.</span></p>
    </div>
    <div style="text-align: center; padding: 24px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">${schoolName} | Lunch Program</p>
    </div>
  </div>
</body>
</html>`
}

export function getWeeklySummaryEmailPreview(formData: SettingsFormData): string {
  const schoolName = formData.school_name || 'Your School'
  const logoUrl = formData.school_logo_url || DEFAULT_LOGO_URL
  const primaryColor = formData.primary_color || '#002c5f'
  const accentColor = formData.accent_color || '#00b1c1'
  const secondaryColor = formData.secondary_color || '#ffc82e'
  const weekEnd = new Date()
  const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000)
  const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${primaryColor}; padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
      <img src="${logoUrl}" alt="${schoolName}" style="max-width: 220px; height: auto; margin-bottom: 12px;" />
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Weekly Lunch Summary</p>
    </div>
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <p style="color: #1e293b; font-size: 17px; margin: 0 0 8px 0; line-height: 1.5;">Dear <strong>John Smith</strong>,</p>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">Week of ${weekRange}</p>
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="flex: 1; background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #dc2626;">7</div>
          <div style="font-size: 12px; color: #991b1b; font-weight: 500;">Lunches Used</div>
        </div>
        <div style="flex: 1; background: #dcfce7; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #22c55e;">10</div>
          <div style="font-size: 12px; color: #166534; font-weight: 500;">Lunches Added</div>
        </div>
        <div style="flex: 1; background: ${secondaryColor}20; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: ${primaryColor};">18</div>
          <div style="font-size: 12px; color: ${primaryColor}; font-weight: 500;">Current Balance</div>
        </div>
      </div>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="#" style="display: inline-block; background: ${accentColor}; color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(0, 177, 193, 0.4);">View Full History</a>
      </div>
    </div>
    <div style="text-align: center; padding: 24px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">${schoolName} | Lunch Program</p>
    </div>
  </div>
</body>
</html>`
}

export function getWelcomeEmailPreview(formData: SettingsFormData): string {
  const schoolName = formData.school_name || 'Your School'
  const logoUrl = formData.school_logo_url || DEFAULT_LOGO_URL
  const primaryColor = formData.primary_color || '#002c5f'
  const accentColor = formData.accent_color || '#00b1c1'
  const secondaryColor = formData.secondary_color || '#ffc82e'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${primaryColor}; padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
      <img src="${logoUrl}" alt="${schoolName}" style="max-width: 220px; height: auto; margin-bottom: 12px;" />
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Welcome to the Lunch Program!</p>
    </div>
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${secondaryColor} 0%, #f59e0b 100%); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">&#127860;</span>
        </div>
        <h2 style="color: #1e293b; margin: 0 0 8px 0; font-size: 24px;">Welcome, John Smith!</h2>
        <p style="color: #64748b; margin: 0; font-size: 15px;">Your account has been set up successfully.</p>
      </div>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Your children have been enrolled in the ${schoolName} lunch program. Here's what you need to know:</p>
      <div style="margin-bottom: 24px;">
        <div style="font-weight: 600; color: #1e293b; margin-bottom: 12px; font-size: 14px;">Enrolled Students:</div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f8fafc; border-radius: 10px; margin-bottom: 8px;">
          <div style="width: 40px; height: 40px; background: ${accentColor}; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px;">E</div>
          <div>
            <div style="font-weight: 600; color: #1e293b;">Emma Smith</div>
            <div style="font-size: 12px; color: #64748b;">Elementary</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f8fafc; border-radius: 10px;">
          <div style="width: 40px; height: 40px; background: ${accentColor}; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px;">J</div>
          <div>
            <div style="font-weight: 600; color: #1e293b;">Jake Smith</div>
            <div style="font-size: 12px; color: #64748b;">High School</div>
          </div>
        </div>
      </div>
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="font-weight: 700; color: ${primaryColor}; margin-bottom: 12px; font-size: 15px;">How It Works</div>
        <div style="color: #475569; font-size: 14px; line-height: 1.8;">
          <div style="margin-bottom: 8px;">&#10003; Add funds to your account online or at the school office</div>
          <div style="margin-bottom: 8px;">&#10003; Your child scans their barcode at lunch to deduct a meal</div>
          <div>&#10003; Receive email notifications when the balance is low</div>
        </div>
      </div>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="#" style="display: inline-block; background: ${accentColor}; color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(0, 177, 193, 0.4);">Access Parent Portal</a>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Use the parent portal to add funds and view your account history.</p>
    </div>
    <div style="text-align: center; padding: 24px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">${schoolName} | Lunch Program</p>
    </div>
  </div>
</body>
</html>`
}

export function getEmailPreview(template: 'balance' | 'receipt' | 'portal' | 'weekly' | 'welcome', formData: SettingsFormData): string {
  switch (template) {
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
