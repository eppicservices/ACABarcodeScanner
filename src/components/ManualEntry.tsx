'use client';

import { useState } from 'react';

interface ManualEntryProps {
  onSubmit: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualEntry({ onSubmit, isOpen, onClose }: ManualEntryProps) {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmit(code.trim());
      setCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Manual Entry</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="input-label">
            Student ID or Barcode
          </label>
          <input
            type="text"
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter ID number..."
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!code.trim()}>
              Submit
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 100;
        }

        .modal-content {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-width: 400px;
          padding: 24px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          font-family: var(--font-body);
          font-size: 20px;
          font-weight: 700;
          color: var(--aca-navy);
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--gray-400);
          border-radius: 4px;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: var(--gray-600);
        }

        .input-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-500);
          margin-bottom: 8px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .modal-actions .btn {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
