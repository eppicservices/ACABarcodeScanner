'use client';

interface StatsBarProps {
  totalScans: number;
  successfulScans: number;
}

export default function StatsBar({ totalScans, successfulScans }: StatsBarProps) {
  return (
    <div className="stats-bar">
      <div className="stat stat-primary">
        <div className="stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{successfulScans}</span>
          <span className="stat-label">Checked In</span>
        </div>
      </div>

      <div className="stat-divider">
        <div className="divider-line" />
      </div>

      <div className="stat stat-secondary">
        <div className="stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="7" y1="8" x2="17" y2="8" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="7" y1="16" x2="12" y2="16" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{totalScans}</span>
          <span className="stat-label">Total Scans</span>
        </div>
      </div>

      <style jsx>{`
        .stats-bar {
          display: flex;
          align-items: stretch;
          justify-content: center;
          gap: 0;
          padding: 0;
          background: var(--white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          border: 1px solid var(--gray-100);
        }

        .stat {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          transition: all var(--transition-fast);
        }

        .stat:hover {
          background: var(--gray-50);
        }

        .stat-primary .stat-icon {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%);
          color: #16a34a;
        }

        .stat-secondary .stat-icon {
          background: linear-gradient(135deg, rgba(46, 163, 242, 0.15) 0%, rgba(46, 163, 242, 0.05) 100%);
          color: var(--aca-blue);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-value {
          font-family: var(--font-body);
          font-size: 28px;
          font-weight: 700;
          color: var(--gray-800);
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-divider {
          display: flex;
          align-items: center;
          padding: 12px 0;
        }

        .divider-line {
          width: 1px;
          height: 100%;
          background: linear-gradient(180deg, transparent 0%, var(--gray-200) 20%, var(--gray-200) 80%, transparent 100%);
        }

        @media (max-width: 360px) {
          .stat {
            padding: 14px 16px;
            gap: 10px;
          }

          .stat-icon {
            width: 40px;
            height: 40px;
          }

          .stat-value {
            font-size: 24px;
          }

          .stat-label {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
