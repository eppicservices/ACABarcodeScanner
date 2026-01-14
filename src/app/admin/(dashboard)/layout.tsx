import AdminNav from '@/components/admin/AdminNav'

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

      <style>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          overflow-x: hidden;
        }

        .admin-main {
          flex: 1;
          margin-left: 260px;
          min-height: 100vh;
          min-height: 100dvh;
          width: calc(100% - 260px);
          max-width: 100%;
          overflow-x: hidden;
          background:
            radial-gradient(ellipse at 100% 0%, rgba(46, 139, 192, 0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 0% 100%, rgba(212, 169, 41, 0.02) 0%, transparent 50%),
            linear-gradient(180deg, var(--gray-50) 0%, var(--off-white) 100%);
          position: relative;
        }

        .admin-main::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a365d' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }

        .admin-content {
          position: relative;
          padding: 32px 40px;
          max-width: 1400px;
          width: 100%;
          box-sizing: border-box;
          animation: fadeIn 0.3s ease-out;
        }

        @media (max-width: 1200px) {
          .admin-content {
            padding: 24px;
          }
        }

        @media (max-width: 767px) {
          .admin-main {
            margin-left: 0;
            width: 100%;
            max-width: 100%;
          }

          .admin-content {
            padding: 80px 16px 24px;
            max-width: 100%;
            width: 100%;
            overflow-x: hidden;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  )
}
