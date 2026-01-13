import AdminNav from '@/components/admin/AdminNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      <AdminNav />
      <main className="admin-main">
        {children}
      </main>

      <style>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
        }

        .admin-main {
          flex: 1;
          margin-left: 240px;
          padding: 32px;
          background: var(--off-white);
        }
      `}</style>
    </div>
  )
}
