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

  // Styles are now in globals.css to prevent FOUC
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
    </div>
  );
}
