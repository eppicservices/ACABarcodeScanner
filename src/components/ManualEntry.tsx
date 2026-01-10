'use client';

import { useState, useEffect, useRef } from 'react';

interface ManualEntryProps {
  onSubmit: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualEntry({ onSubmit, isOpen, onClose }: ManualEntryProps) {
  const [code, setCode] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to allow animation to start
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (isOpen) {
      setIsClosing(false);
      setCode('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmit(code.trim());
      setCode('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`modal-content ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h12" />
            </svg>
          </div>
          <div className="header-text">
            <h3>Manual Entry</h3>
            <p>Enter student ID or barcode number</p>
          </div>
          <button className="close-btn" onClick={handleClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <div className="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="7" y1="8" x2="17" y2="8" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="7" y1="16" x2="12" y2="16" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., 1001 or ACA2024001"
            />
            {code && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setCode('')}
                aria-label="Clear input"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </button>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!code.trim()}>
              <span>Submit</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </form>

        {/* Quick Actions */}
        <div className="quick-actions">
          <p className="quick-label">Quick test IDs:</p>
          <div className="quick-chips">
            {['1001', '1002', '1003'].map((id) => (
              <button
                key={id}
                type="button"
                className="quick-chip"
                onClick={() => setCode(id)}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 100;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-overlay.closing {
          animation: fadeOut 0.2s ease-in forwards;
        }

        .modal-content {
          background: var(--white);
          border-radius: var(--border-radius-xl);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-width: 420px;
          padding: 28px;
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .modal-content.closing {
          animation: slideDown 0.2s ease-in forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
        }

        /* Header */
        .modal-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
        }

        .header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(46, 163, 242, 0.15) 0%, rgba(46, 163, 242, 0.05) 100%);
          border-radius: 14px;
          color: var(--aca-blue);
          flex-shrink: 0;
        }

        .header-text {
          flex: 1;
        }

        .header-text h3 {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          color: var(--gray-800);
        }

        .header-text p {
          font-size: 14px;
          color: var(--gray-400);
          margin: 4px 0 0 0;
        }

        .close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: var(--gray-50);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          color: var(--gray-400);
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .close-btn:hover {
          background: var(--gray-100);
          color: var(--gray-600);
        }

        /* Input */
        .input-wrapper {
          position: relative;
          margin-bottom: 20px;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-300);
          pointer-events: none;
          transition: color var(--transition-fast);
        }

        .input-wrapper:focus-within .input-icon {
          color: var(--aca-blue);
        }

        .input {
          padding-left: 48px;
          padding-right: 48px;
          font-size: 18px;
          height: 56px;
        }

        .clear-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--gray-100);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: var(--gray-400);
          transition: all var(--transition-fast);
        }

        .clear-btn:hover {
          background: var(--gray-200);
          color: var(--gray-600);
        }

        /* Actions */
        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-actions .btn {
          flex: 1;
          height: 52px;
        }

        .btn-secondary {
          background: var(--gray-100);
          color: var(--gray-600);
          border: none;
        }

        .btn-secondary:hover {
          background: var(--gray-200);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* Quick Actions */
        .quick-actions {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--gray-100);
          text-align: center;
        }

        .quick-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .quick-chips {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .quick-chip {
          padding: 8px 16px;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: 100px;
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-500);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .quick-chip:hover {
          background: var(--aca-blue);
          border-color: var(--aca-blue);
          color: var(--white);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
