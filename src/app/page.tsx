'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import ScanResult from '@/components/ScanResult';
import ManualEntry from '@/components/ManualEntry';
import StatsBar from '@/components/StatsBar';
import { lookupStudent, Student } from '@/data/students';

type ScanStatus = 'success' | 'error' | 'duplicate';

interface ScanResultData {
  code: string;
  status: ScanStatus;
  studentName?: string;
  message?: string;
}

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [totalScans, setTotalScans] = useState(0);
  const [successfulScans, setSuccessfulScans] = useState(0);
  const [scannedCodes, setScannedCodes] = useState<Set<string>>(new Set());
  const [scanBuffer, setScanBuffer] = useState('');
  const [isReady, setIsReady] = useState(true);
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processCode = useCallback((code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setTotalScans((prev) => prev + 1);

    // Check for duplicate
    if (scannedCodes.has(trimmedCode)) {
      setScanResult({
        code: trimmedCode,
        status: 'duplicate',
        message: 'This student has already checked in today',
      });
      return;
    }

    // Look up student in our data
    const student: Student | null = lookupStudent(trimmedCode);

    if (student) {
      setScannedCodes((prev) => new Set(prev).add(trimmedCode));
      setSuccessfulScans((prev) => prev + 1);
      setScanResult({
        code: trimmedCode,
        status: 'success',
        studentName: `${student.firstName} ${student.lastName}`,
        message: `${student.grade} Grade • ${student.homeroom}`,
      });
    } else {
      setScanResult({
        code: trimmedCode,
        status: 'error',
        message: 'No student found with this ID',
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
      {/* Decorative Background Elements */}
      <div className="bg-decoration">
        <div className="bg-circle bg-circle-1" />
        <div className="bg-circle bg-circle-2" />
        <div className="bg-circle bg-circle-3" />
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-wrapper">
            <Image
              src="https://www.aldersgatechristian.com/wp-content/uploads/2020/09/aca-logo-blue.png"
              alt="Aldersgate Christian Academy"
              width={160}
              height={53}
              className="logo"
              priority
            />
          </div>
          <div className="title-section">
            <h1 className="app-title">Lunch Check-In</h1>
            <p className="app-subtitle">Scan student ID to check in</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Stats */}
        <StatsBar totalScans={totalScans} successfulScans={successfulScans} />

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
            <div className={`scanner-ready ${isReady ? 'is-ready' : ''}`}>
              {/* Scanner Frame */}
              <div className="scanner-frame">
                <div className="scanner-corners">
                  <div className="corner corner-tl" />
                  <div className="corner corner-tr" />
                  <div className="corner corner-bl" />
                  <div className="corner corner-br" />
                </div>

                {/* Scan Line Animation */}
                <div className="scan-line" />

                {/* Scanner Icon */}
                <div className="scanner-icon-wrapper">
                  <div className="scanner-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="7" y1="8" x2="17" y2="8" strokeWidth="2" />
                      <line x1="7" y1="12" x2="17" y2="12" strokeWidth="2" />
                      <line x1="7" y1="16" x2="12" y2="16" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Ready State Text */}
              <div className="ready-content">
                <div className="ready-badge">
                  <span className="ready-dot" />
                  <span>Ready</span>
                </div>
                <h2 className="ready-title">Waiting for Scan</h2>
                <p className="ready-hint">
                  Point the barcode scanner at a student ID
                </p>
              </div>

              {/* Scan Buffer Display */}
              {scanBuffer && (
                <div className="scan-buffer">
                  <div className="buffer-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 17 10 11 4 5" />
                      <line x1="12" y1="19" x2="20" y2="19" />
                    </svg>
                  </div>
                  <span className="buffer-value">{scanBuffer}</span>
                  <span className="buffer-cursor" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn btn-primary btn-lg manual-btn"
            onClick={() => setIsManualEntryOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h12" />
            </svg>
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Test IDs Helper */}
        <div className="test-ids">
          <div className="test-ids-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>Test IDs for Demo</span>
          </div>
          <div className="test-ids-list">
            <button className="test-id-chip" onClick={() => processCode('1001')}>1001</button>
            <button className="test-id-chip" onClick={() => processCode('1002')}>1002</button>
            <button className="test-id-chip" onClick={() => processCode('1003')}>1003</button>
            <button className="test-id-chip" onClick={() => processCode('1004')}>1004</button>
            <button className="test-id-chip" onClick={() => processCode('1005')}>1005</button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <p>Aldersgate Christian Academy</p>
        </div>
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
          padding: 0 20px;
          position: relative;
          overflow: hidden;
        }

        /* Background Decoration */
        .bg-decoration {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: -1;
          overflow: hidden;
        }

        .bg-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
        }

        .bg-circle-1 {
          width: 400px;
          height: 400px;
          background: rgba(46, 163, 242, 0.15);
          top: -100px;
          right: -100px;
        }

        .bg-circle-2 {
          width: 300px;
          height: 300px;
          background: rgba(201, 162, 39, 0.1);
          bottom: 20%;
          left: -100px;
        }

        .bg-circle-3 {
          width: 250px;
          height: 250px;
          background: rgba(34, 197, 94, 0.1);
          bottom: -50px;
          right: -50px;
        }

        /* Header */
        .header {
          padding: 24px 0 20px;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .logo-wrapper {
          background: var(--white);
          padding: 12px 20px;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-md);
        }

        :global(.logo) {
          display: block;
          height: auto;
          width: auto;
          max-height: 50px;
        }

        .title-section {
          text-align: center;
        }

        .app-title {
          font-size: 28px;
          margin: 0;
          color: var(--aca-navy);
          letter-spacing: -0.02em;
        }

        .app-subtitle {
          font-size: 14px;
          color: var(--gray-400);
          margin: 4px 0 0 0;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-bottom: 24px;
        }

        /* Scanner Section */
        .scanner-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 320px;
        }

        .scanner-ready {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 32px 24px;
          background: var(--white);
          border-radius: var(--border-radius-xl);
          box-shadow: var(--shadow-lg);
          position: relative;
          overflow: hidden;
        }

        .scanner-ready::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(46, 163, 242, 0.03) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Scanner Frame */
        .scanner-frame {
          position: relative;
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .scanner-corners {
          position: absolute;
          inset: 0;
        }

        .corner {
          position: absolute;
          width: 24px;
          height: 24px;
          border: 3px solid var(--aca-blue);
        }

        .corner-tl {
          top: 0;
          left: 0;
          border-right: none;
          border-bottom: none;
          border-radius: 8px 0 0 0;
        }

        .corner-tr {
          top: 0;
          right: 0;
          border-left: none;
          border-bottom: none;
          border-radius: 0 8px 0 0;
        }

        .corner-bl {
          bottom: 0;
          left: 0;
          border-right: none;
          border-top: none;
          border-radius: 0 0 0 8px;
        }

        .corner-br {
          bottom: 0;
          right: 0;
          border-left: none;
          border-top: none;
          border-radius: 0 0 8px 0;
        }

        .scan-line {
          position: absolute;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--aca-blue), transparent);
          box-shadow: 0 0 12px var(--aca-blue), 0 0 24px var(--aca-blue);
          animation: scanLine 2.5s ease-in-out infinite;
        }

        .scanner-icon-wrapper {
          position: relative;
          z-index: 1;
        }

        .is-ready .scanner-icon-wrapper {
          animation: float 3s ease-in-out infinite;
        }

        .scanner-icon {
          color: var(--aca-blue);
          opacity: 0.9;
        }

        /* Ready Content */
        .ready-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
        }

        .ready-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-radius: 100px;
        }

        .ready-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .ready-title {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          color: var(--gray-800);
        }

        .ready-hint {
          font-size: 14px;
          color: var(--gray-400);
          margin: 0;
          max-width: 240px;
        }

        /* Scan Buffer */
        .scan-buffer {
          position: absolute;
          bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--gray-800);
          color: var(--white);
          padding: 10px 16px;
          border-radius: var(--border-radius);
          font-family: var(--font-mono);
          font-size: 14px;
          box-shadow: var(--shadow-lg);
          animation: slideUp 0.2s ease-out;
        }

        .buffer-icon {
          opacity: 0.6;
        }

        .buffer-value {
          font-weight: 600;
          color: #4ade80;
        }

        .buffer-cursor {
          width: 2px;
          height: 16px;
          background: #4ade80;
          animation: pulse 0.8s ease-in-out infinite;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .manual-btn {
          width: 100%;
          justify-content: center;
        }

        .manual-btn span {
          font-weight: 600;
        }

        /* Test IDs */
        .test-ids {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          padding: 16px 20px;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--gray-100);
        }

        .test-ids-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .test-ids-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }

        .test-id-chip {
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          padding: 8px 16px;
          border-radius: 100px;
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 600;
          color: var(--aca-blue);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .test-id-chip:hover {
          background: var(--aca-blue);
          border-color: var(--aca-blue);
          color: var(--white);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .test-id-chip:active {
          transform: translateY(0);
        }

        /* Footer */
        .footer {
          padding: 20px 0;
          border-top: 1px solid var(--gray-100);
        }

        .footer-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--gray-400);
          font-size: 13px;
        }

        .footer-logo {
          opacity: 0.5;
        }

        .footer p {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
