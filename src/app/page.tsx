'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import ScanResult from '@/components/ScanResult';
import ManualEntry from '@/components/ManualEntry';
import { lookupStudentByBarcode, consumeLunch, StudentRecord } from '@/lib/supabase';

type ScanStatus = 'success' | 'error' | 'duplicate' | 'insufficient';

interface ScanResultData {
  code: string;
  status: ScanStatus;
  studentName?: string;
  message?: string;
}

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [elementaryCount, setElementaryCount] = useState(0);
  const [highSchoolCount, setHighSchoolCount] = useState(0);
  const [scannedCodes, setScannedCodes] = useState<Set<string>>(new Set());
  const [scanBuffer, setScanBuffer] = useState('');
  const [isReady, setIsReady] = useState(true);
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processCode = useCallback(async (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    // Check for duplicate (already checked in today)
    if (scannedCodes.has(trimmedCode)) {
      setScanResult({
        code: trimmedCode,
        status: 'duplicate',
        message: 'This student has already checked in today',
      });
      return;
    }

    // Look up student in Supabase
    const student: StudentRecord | null = await lookupStudentByBarcode(trimmedCode);

    if (!student) {
      setScanResult({
        code: trimmedCode,
        status: 'error',
        message: 'No student found with this ID',
      });
      return;
    }

    // Try to use a lunch (decrement balance)
    const result = await consumeLunch(student.id, student.school_level, student.balance);
    const level = student.school_level === 'elementary' ? 'Elementary' : 'High School';

    if (result.success) {
      setScannedCodes((prev) => new Set(prev).add(trimmedCode));
      if (student.school_level === 'elementary') {
        setElementaryCount((prev) => prev + 1);
      } else {
        setHighSchoolCount((prev) => prev + 1);
      }
      const lunchText = result.newBalance === 1 ? 'lunch' : 'lunches';
      setScanResult({
        code: trimmedCode,
        status: 'success',
        studentName: student.name,
        message: `${level} • ${result.newBalance} ${lunchText} remaining`,
      });
    } else if (result.error === 'insufficient_balance') {
      setScanResult({
        code: trimmedCode,
        status: 'insufficient',
        studentName: student.name,
        message: result.message || 'Insufficient lunch balance',
      });
    } else {
      setScanResult({
        code: trimmedCode,
        status: 'error',
        message: result.message || 'Error processing check-in',
      });
    }
  }, [scannedCodes]);

  // Handle USB barcode scanner input (acts like keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modal is open or typing in an input
      if (isManualEntryOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Enter key submits the buffer
      if (e.key === 'Enter') {
        if (scanBuffer.length > 0) {
          processCode(scanBuffer);
          setScanBuffer('');
        }
        return;
      }

      // Only accept alphanumeric characters
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        e.preventDefault();
        setScanBuffer((prev) => prev + e.key);

        // Clear buffer after 100ms of no input (scanner types fast)
        if (bufferTimeoutRef.current) {
          clearTimeout(bufferTimeoutRef.current);
        }
        bufferTimeoutRef.current = setTimeout(() => {
          setScanBuffer('');
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
    };
  }, [scanBuffer, isManualEntryOpen, processCode]);

  // Auto-dismiss result after 3 seconds
  useEffect(() => {
    if (scanResult) {
      setIsReady(false);
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
      resultTimeoutRef.current = setTimeout(() => {
        setScanResult(null);
        setIsReady(true);
      }, 3000);
    }

    return () => {
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
    };
  }, [scanResult]);

  const handleDismissResult = () => {
    setScanResult(null);
    setIsReady(true);
  };

  const handleManualSubmit = (code: string) => {
    setIsManualEntryOpen(false);
    processCode(code);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <Image
            src="https://www.aldersgatechristian.com/wp-content/uploads/2017/12/ACA-Logo_Horizontal_White_small.png"
            alt="Aldersgate Christian Academy"
            width={220}
            height={55}
            className="logo"
            priority
          />
        </div>
        <h1 className="app-title">Lunch Check-In</h1>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Elementary</span>
            <span className="stat-value">{elementaryCount}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-label">High School</span>
            <span className="stat-value">{highSchoolCount}</span>
          </div>
        </div>

        {/* Scanner or Result Display */}
        <div className="scanner-section">
          {scanResult ? (
            <ScanResult
              code={scanResult.code}
              status={scanResult.status}
              studentName={scanResult.studentName}
              message={scanResult.message}
              onDismiss={handleDismissResult}
            />
          ) : (
            <div className={`scanner-ready ${isReady ? 'pulse' : ''}`}>
              <div className="ready-icon">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 7V5a2 2 0 012-2h2" />
                  <path d="M17 3h2a2 2 0 012 2v2" />
                  <path d="M21 17v2a2 2 0 01-2 2h-2" />
                  <path d="M7 21H5a2 2 0 01-2-2v-2" />
                  <line x1="7" y1="12" x2="17" y2="12" strokeWidth="2" />
                  <line x1="7" y1="8" x2="10" y2="8" />
                  <line x1="7" y1="16" x2="10" y2="16" />
                  <line x1="14" y1="8" x2="17" y2="8" />
                  <line x1="14" y1="16" x2="17" y2="16" />
                </svg>
              </div>
              <p className="ready-text">Ready to Scan</p>
              <p className="ready-hint">Scan a student ID barcode or type manually</p>
              {scanBuffer && (
                <div className="scan-buffer">
                  <span className="buffer-label">Scanning:</span>
                  <span className="buffer-value">{scanBuffer}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="action-buttons">
          <button
            className="btn btn-outline btn-lg"
            onClick={() => setIsManualEntryOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h12" />
            </svg>
            Manual Entry
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Aldersgate Christian Academy</p>
      </footer>

      {/* Manual Entry Modal */}
      <ManualEntry
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        onSubmit={handleManualSubmit}
      />

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          max-width: var(--container-max);
          margin: 0 auto;
          padding: 16px 16px 0;
        }

        .header {
          background: var(--white);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin-bottom: 8px;
          box-shadow: var(--shadow-sm);
        }

        .logo-container {
          margin-bottom: 12px;
          display: flex;
          justify-content: center;
        }

        :global(.logo) {
          height: auto;
          width: auto;
          max-height: 60px;
          filter: brightness(0) saturate(100%) invert(12%) sepia(45%) saturate(2500%) hue-rotate(200deg) brightness(95%) contrast(105%);
        }

        .app-title {
          font-size: 20px;
          margin: 0;
          color: var(--aca-navy);
          font-weight: 600;
        }

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

        .stat-item {
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

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-bottom: 24px;
        }

        .scanner-section {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .scanner-ready {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 300px;
          background: linear-gradient(135deg, var(--aca-teal-subtle) 0%, #cdf3f5 100%);
          border: 3px solid var(--aca-teal);
          border-radius: var(--border-radius-lg);
          color: var(--aca-navy);
          position: relative;
          padding: 24px;
        }

        .scanner-ready.pulse .ready-icon {
          animation: pulse 2s ease-in-out infinite;
        }

        .ready-icon {
          color: var(--aca-teal);
        }

        .ready-text {
          font-family: var(--font-body);
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          text-align: center;
        }

        .ready-hint {
          font-size: 14px;
          color: var(--gray-500);
          margin: 0;
          text-align: center;
        }

        .scan-buffer {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--aca-navy);
          color: var(--white);
          padding: 8px 16px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 14px;
          display: flex;
          gap: 8px;
          max-width: calc(100% - 40px);
        }

        .buffer-label {
          opacity: 0.7;
        }

        .buffer-value {
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .action-buttons .btn {
          width: 100%;
        }

        .footer {
          padding: 16px 0;
          text-align: center;
          color: var(--gray-400);
          font-size: 12px;
          border-top: 1px solid var(--gray-100);
        }

        .footer p {
          margin: 0;
        }

        /* Mobile optimizations */
        @media (max-width: 480px) {
          .app-container {
            padding: 0 12px;
          }

          .header {
            padding: 16px;
            border-radius: 10px;
          }

          :global(.logo) {
            max-height: 50px;
          }

          .app-title {
            font-size: 18px;
          }

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

          .main-content {
            gap: 12px;
            padding-bottom: 16px;
          }

          .scanner-ready {
            min-height: 250px;
            padding: 20px 16px;
            gap: 10px;
          }

          .ready-icon svg {
            width: 70px;
            height: 70px;
          }

          .ready-text {
            font-size: 22px;
          }

          .ready-hint {
            font-size: 13px;
          }

          .scan-buffer {
            bottom: 12px;
            padding: 6px 12px;
            font-size: 12px;
          }

          .action-buttons .btn {
            padding: 12px 24px;
            font-size: 13px;
          }

          .footer {
            padding: 12px 0;
            font-size: 11px;
          }
        }

        /* Very small screens */
        @media (max-width: 360px) {
          .app-title {
            font-size: 18px;
          }

          .scanner-ready {
            min-height: 220px;
          }

          .ready-icon svg {
            width: 60px;
            height: 60px;
          }

          .ready-text {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
