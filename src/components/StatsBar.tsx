'use client';

interface StatsBarProps {
  totalScans: number;
  successfulScans: number;
}

export default function StatsBar({ totalScans, successfulScans }: StatsBarProps) {
  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-value">{successfulScans}</span>
        <span className="stat-label">Checked In</span>
      </div>
      <div className="stat-divider" />
      <div className="stat">
        <span className="stat-value">{totalScans}</span>
        <span className="stat-label">Total Scans</span>
      </div>

      <style jsx>{`
        .stats-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 16px 24px;
          background: var(--white);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-value {
          font-family: var(--font-body);
          font-size: 28px;
          font-weight: 700;
          color: var(--aca-teal);
          line-height: 1;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: var(--gray-200);
        }

        @media (max-width: 480px) {
          .stats-bar {
            gap: 16px;
            padding: 12px 16px;
          }

          .stat-value {
            font-size: 24px;
          }

          .stat-label {
            font-size: 11px;
          }

          .stat-divider {
            height: 32px;
          }
        }

        @media (max-width: 360px) {
          .stats-bar {
            gap: 12px;
            padding: 10px 12px;
          }

          .stat-value {
            font-size: 20px;
          }

          .stat-label {
            font-size: 10px;
          }

          .stat-divider {
            height: 28px;
          }
        }
      `}</style>
    </div>
  );
}
