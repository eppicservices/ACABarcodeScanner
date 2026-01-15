'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '../../context/SettingsContext'

export function AdminsTab() {
  const { admins, setMessage, fetchData } = useSettings()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  async function handleInviteAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return

    setInviting(true)
    setMessage(null)

    // For now, just show a message - full invitation system would need email sending
    setMessage({
      type: 'success',
      text: `Invitation would be sent to ${inviteEmail}. (Email sending not yet configured)`
    })
    setInviteEmail('')
    setInviting(false)
  }

  async function handleRemoveAdmin(adminId: string) {
    if (!confirm('Are you sure you want to remove this admin?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminId)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Admin removed successfully' })
      fetchData()
    }
  }

  return (
    <div className="tab-panel">
      <h2>Admin Management</h2>
      <p className="section-desc">Manage who has access to the admin dashboard.</p>

      <div className="invite-form">
        <h3>Invite New Admin</h3>
        <form onSubmit={handleInviteAdmin} className="invite-row">
          <input
            type="email"
            className="input"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@school.edu"
            required
          />
          <button type="submit" className="btn btn-primary" disabled={inviting}>
            {inviting ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      <h3>Current Admins</h3>
      <div className="admin-list">
        {admins.map(admin => (
          <div key={admin.id} className="admin-card">
            <div className="admin-info">
              <div className="admin-avatar">
                {admin.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="admin-email">{admin.email}</div>
                <div className="admin-role">
                  <span className={`role-badge ${admin.role}`}>
                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                  <span className="admin-date">
                    Added {new Date(admin.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            {admin.role !== 'super_admin' && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleRemoveAdmin(admin.id)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
