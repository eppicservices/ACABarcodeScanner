'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import BarcodeScanner from '@/components/BarcodeScanner';
import ScanResult from '@/components/ScanResult';
import ManualEntry from '@/components/ManualEntry';
import StatsBar from '@/components/StatsBar';

type ScanStatus = 'success' | 'error' | 'duplicate';

interface ScanResultData {
  code: string;
  status: ScanStatus;
  studentName?: string;
  message?: string;
}

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [totalScans, setTotalScans] = useState(0);
  const [successfulScans, setSuccessfulScans] = useState(0);
  const [scannedCodes, setScannedCodes] = useState<Set<string>>(new Set());

  const processCode = useCallback((code: string) => {
    setIsScanning(false);
    setTotalScans((prev) => prev + 1);

    // Check for duplicate
    if (scannedCodes.has(code)) {
      setScanResult({
        code,
        status: 'duplicate',
        message: 'This ID has already been scanned today',
      });
      return;
    }

    // For demo purposes, simulate different responses
    // In production, this would call your backend API
    const isValid = code.length >= 4;

    if (isValid) {
      setScannedCodes((prev) => new Set(prev).add(code));
      setSuccessfulScans((prev) => prev + 1);
      setScanResult({
        code,
        status: 'success',
        studentName: `Student #${code}`,
        message: 'Lunch check-in recorded',
      });
    } else {
      setScanResult({
        code,
        status: 'error',
        message: 'No student found with this ID',
      });
    }
  }, [scannedCodes]);

  const handleDismissResult = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  const handleStartScanning = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
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
            src="https://www.aldersgatechristian.com/wp-content/uploads/2020/09/aca-logo-blue.png"
            alt="Aldersgate Christian Academy"
            width={180}
            height={60}
            className="logo"
            priority
          />
        </div>
        <h1 className="app-title">Lunch Check-In</h1>
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
            <>
              {isScanning ? (
                <BarcodeScanner onScan={processCode} isActive={isScanning} />
              ) : (
                <div className="scanner-placeholder">
                  <div className="placeholder-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="placeholder-text">Ready to scan student IDs</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {!scanResult && (
            <>
              {isScanning ? (
                <button className="btn btn-danger btn-lg" onClick={handleStopScanning}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                  Stop Scanning
                </button>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={handleStartScanning}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Start Scanning
                </button>
              )}
              <button
                className="btn btn-outline"
                onClick={() => setIsManualEntryOpen(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h12" />
                </svg>
                Manual Entry
              </button>
            </>
          )}
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
          padding: 0 16px;
        }

        .header {
          padding: 24px 0 16px;
          text-align: center;
        }

        .logo-container {
          margin-bottom: 12px;
        }

        :global(.logo) {
          height: auto;
          width: auto;
          max-height: 60px;
        }

        .app-title {
          font-size: 24px;
          margin: 0;
          color: var(--aca-navy);
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

        .scanner-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          min-height: 280px;
          background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
          border: 2px dashed var(--gray-200);
          border-radius: var(--border-radius-lg);
          color: var(--gray-400);
        }

        .placeholder-icon {
          opacity: 0.5;
        }

        .placeholder-text {
          font-size: 16px;
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
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

        @media (min-width: 480px) {
          .action-buttons {
            flex-direction: row;
          }

          .action-buttons .btn {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
