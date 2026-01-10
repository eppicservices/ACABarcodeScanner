'use client';

import { useEffect, useState } from 'react';

interface ScanResultProps {
  code: string;
  status: 'success' | 'error' | 'duplicate';
  studentName?: string;
  message?: string;
  onDismiss: () => void;
}

export default function ScanResult({ code, status, studentName, message, onDismiss }: ScanResultProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const statusConfig = {
    success: {
      icon: (
        <svg className="result-icon-svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" className="icon-circle" />
          <polyline points="9 12 11 14 15 10" className="icon-check" />
        </svg>
      ),
      title: 'Check-in Successful!',
      bgClass: 'result-success',
      iconBg: 'icon-bg-success',
    },
    error: {
      icon: (
        <svg className="result-icon-svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" className="icon-circle" />
          <line x1="15" y1="9" x2="9" y2="15" className="icon-x" />
          <line x1="9" y1="9" x2="15" y2="15" className="icon-x" />
        </svg>
      ),
      title: 'Not Found',
      bgClass: 'result-error',
      iconBg: 'icon-bg-error',
    },
    duplicate: {
      icon: (
        <svg className="result-icon-svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" className="icon-circle" />
          <line x1="12" y1="8" x2="12" y2="12" className="icon-line" />
          <line x1="12" y1="16" x2="12.01" y2="16" className="icon-dot" />
        </svg>
      ),
      title: 'Already Checked In',
      bgClass: 'result-duplicate',
      iconBg: 'icon-bg-duplicate',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`result-container ${config.bgClass} ${isAnimating ? 'animate-successPop' : ''}`}>
      {/* Decorative Elements */}
      <div className="result-decoration">
        <div className="decoration-ring ring-1" />
        <div className="decoration-ring ring-2" />
        <div className="decoration-ring ring-3" />
      </div>

      {/* Icon */}
      <div className={`result-icon-wrapper ${config.iconBg} ${isAnimating ? 'animate-iconBounce' : ''}`}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="result-content">
        <h2 className="result-title">{config.title}</h2>
        {studentName && (
          <p className="student-name">{studentName}</p>
        )}
        {message && (
          <p className="result-message">{message}</p>
        )}
      </div>

      {/* Barcode Display */}
      <div className="barcode-display">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="7" y1="8" x2="17" y2="8" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="7" y1="16" x2="12" y2="16" />
        </svg>
        <span>{code}</span>
      </div>

      {/* Dismiss Button */}
      <button className="dismiss-btn" onClick={onDismiss}>
        <span>Scan Next</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      <style jsx>{`
        .result-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 40px 28px;
          border-radius: var(--border-radius-xl);
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        /* Background Styles */
        .result-success {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%);
          color: #065f46;
          box-shadow: var(--shadow-lg), 0 8px 32px rgba(34, 197, 94, 0.2);
        }

        .result-error {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%);
          color: #991b1b;
          box-shadow: var(--shadow-lg), 0 8px 32px rgba(239, 68, 68, 0.2);
        }

        .result-duplicate {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%);
          color: #92400e;
          box-shadow: var(--shadow-lg), 0 8px 32px rgba(245, 158, 11, 0.2);
        }

        /* Decorative Rings */
        .result-decoration {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .decoration-ring {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
        }

        .result-success .decoration-ring {
          border: 2px solid #22c55e;
        }

        .result-error .decoration-ring {
          border: 2px solid #ef4444;
        }

        .result-duplicate .decoration-ring {
          border: 2px solid #f59e0b;
        }

        .ring-1 {
          width: 200px;
          height: 200px;
          top: -80px;
          right: -80px;
        }

        .ring-2 {
          width: 150px;
          height: 150px;
          bottom: -60px;
          left: -60px;
        }

        .ring-3 {
          width: 100px;
          height: 100px;
          top: 50%;
          left: -40px;
        }

        /* Icon Wrapper */
        .result-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          position: relative;
        }

        .icon-bg-success {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          box-shadow: 0 8px 24px rgba(34, 197, 94, 0.35);
          color: white;
        }

        .icon-bg-error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.35);
          color: white;
        }

        .icon-bg-duplicate {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35);
          color: white;
        }

        :global(.result-icon-svg) {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        /* Content */
        .result-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .result-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .student-name {
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .result-message {
          font-size: 15px;
          opacity: 0.8;
          margin: 0;
          font-weight: 500;
        }

        /* Barcode Display */
        .barcode-display {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 100px;
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 600;
          opacity: 0.7;
          backdrop-filter: blur(8px);
        }

        /* Dismiss Button */
        .dismiss-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          background: rgba(255, 255, 255, 0.85);
          border: 2px solid currentColor;
          border-radius: var(--border-radius);
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 600;
          color: inherit;
          cursor: pointer;
          transition: all var(--transition-base);
          backdrop-filter: blur(8px);
        }

        .dismiss-btn:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .dismiss-btn:active {
          transform: translateY(0);
        }

        /* Success-specific icon animation */
        .result-success :global(.icon-check) {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: drawCheck 0.4s ease-out 0.2s forwards;
        }

        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* Error-specific icon animation */
        .result-error :global(.icon-x) {
          stroke-dasharray: 10;
          stroke-dashoffset: 10;
          animation: drawX 0.3s ease-out 0.2s forwards;
        }

        @keyframes drawX {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* Responsive */
        @media (max-width: 360px) {
          .result-container {
            padding: 32px 20px;
            gap: 16px;
          }

          .result-icon-wrapper {
            width: 72px;
            height: 72px;
          }

          :global(.result-icon-svg) {
            width: 40px;
            height: 40px;
          }

          .result-title {
            font-size: 22px;
          }

          .student-name {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}
