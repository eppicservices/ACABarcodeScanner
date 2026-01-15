'use client'

import AdminNav from '@/components/admin/AdminNav'

// Styles are in globals.css to prevent FOUC
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      <AdminNav />
      <main className="admin-main">
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  )
}
