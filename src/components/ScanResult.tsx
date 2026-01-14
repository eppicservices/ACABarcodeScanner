'use client';

interface ScanResultProps {
  code: string;
  status: 'success' | 'error' | 'duplicate' | 'insufficient';
  studentName?: string;
  message?: string;
  onDismiss: () => void;
}

export default function ScanResult({ code, status, studentName, message, onDismiss }: ScanResultProps) {
  const statusConfig = {
    success: {
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-6" />
        </svg>
      ),
      title: 'Check-in Successful',
      bgClass: 'result-success',
    },
    error: {
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      ),
      title: 'Not Found',
      bgClass: 'result-error',
    },
    duplicate: {
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      ),
      title: 'Already Checked In',
      bgClass: 'result-duplicate',
    },
    insufficient: {
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6M12 14v.01" />
          <path d="M9 18h6" strokeLinecap="round" />
        </svg>
      ),
      title: 'Insufficient Balance',
      bgClass: 'result-insufficient',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`result-container ${config.bgClass} animate-successPop`}>
      <div className="result-icon">{config.icon}</div>
      <h2 className="result-title">{config.title}</h2>
      {studentName && <p className="student-name">{studentName}</p>}
      {message && <p className="result-message">{message}</p>}
      <p className="barcode-display">{code}</p>
      <button className="btn btn-outline dismiss-btn" onClick={onDismiss}>
        Scan Next
      </button>

      <style jsx>{`
        .result-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 24px;
          border-radius: var(--border-radius-lg);
          text-align: center;
        }

        .result-success {
          background: linear-gradient(135deg, var(--success-bg) 0%, #bbf7d0 100%);
          color: #166534;
        }

        .result-success .result-icon {
          color: var(--success);
        }

        .result-error {
          background: linear-gradient(135deg, var(--error-bg) 0%, #fecaca 100%);
          color: #991b1b;
        }

        .result-error .result-icon {
          color: var(--error);
        }

        .result-duplicate {
          background: linear-gradient(135deg, var(--warning-bg) 0%, #fde68a 100%);
          color: #92400e;
        }

        .result-duplicate .result-icon {
          color: var(--warning);
        }

        .result-insufficient {
          background: linear-gradient(135deg, var(--error-bg) 0%, #fecaca 100%);
          color: #991b1b;
        }

        .result-insufficient .result-icon {
          color: var(--error);
        }

        .result-icon {
          margin-bottom: 16px;
        }

        .result-title {
          font-family: var(--font-body);
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .student-name {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .result-message {
          font-size: 14px;
          opacity: 0.8;
          margin: 0 0 8px 0;
        }

        .barcode-display {
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          opacity: 0.6;
          margin: 0 0 24px 0;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 4px;
        }

        .dismiss-btn {
          background: rgba(255, 255, 255, 0.8);
          border-color: currentColor;
          color: inherit;
        }

        .dismiss-btn:hover {
          background: rgba(255, 255, 255, 1);
        }

        @media (max-width: 480px) {
          .result-container {
            padding: 32px 20px;
          }

          .result-icon :global(svg) {
            width: 56px;
            height: 56px;
          }

          .result-title {
            font-size: 20px;
          }

          .student-name {
            font-size: 18px;
          }

          .result-message {
            font-size: 13px;
          }

          .barcode-display {
            font-size: 11px;
            margin-bottom: 20px;
          }
        }

        @media (max-width: 360px) {
          .result-container {
            padding: 24px 16px;
          }

          .result-icon :global(svg) {
            width: 48px;
            height: 48px;
          }

          .result-icon {
            margin-bottom: 12px;
          }

          .result-title {
            font-size: 18px;
          }

          .student-name {
            font-size: 16px;
          }

          .result-message {
            font-size: 12px;
          }

          .barcode-display {
            font-size: 10px;
            margin-bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
}
