'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import ScanResult from '@/components/ScanResult';
import ManualEntry from '@/components/ManualEntry';
import { getPublicSettings, type PublicSettings } from '@/actions/settings';
import { getStudentByBarcode } from '@/actions/students';
import { consumeLunch } from '@/actions/transactions';

type ScanStatus = 'success' | 'error' | 'duplicate' | 'insufficient' | 'inactive';

interface ScanResultData {
  code: string;
  status: ScanStatus;
  studentName?: string;
  message?: string;
}

const DEFAULT_LOGO_URL = 'https://www.aldersgatechristian.com/wp-content/uploads/2017/12/ACA-Logo_Horizontal_White_small.png';

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [elementaryCount, setElementaryCount] = useState(0);
  const [highSchoolCount, setHighSchoolCount] = useState(0);
  const [scannedCodes, setScannedCodes] = useState<Set<string>>(new Set());
  const [scanBuffer, setScanBuffer] = useState('');
  const [isReady, setIsReady] = useState(true);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch public settings on mount (only non-sensitive settings)
  useEffect(() => {
    getPublicSettings().then(setSettings);
  }, []);

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

    // Look up student in database
    const student = await getStudentByBarcode(trimmedCode);

    if (!student) {
      setScanResult({
        code: trimmedCode,
        status: 'error',
        message: 'No student found with this ID',
      });
      return;
    }

    // Check if student is inactive
    if (!student.isActive) {
      setScanResult({
        code: trimmedCode,
        status: 'inactive',
        studentName: student.name,
        message: 'Student account is inactive',
      });
      return;
    }

    // Try to use a lunch (decrement balance)
    const result = await consumeLunch(student.id);
    const level = student.schoolLevel === 'elementary' ? 'Elementary' : 'High School';

    if (result.success) {
      setScannedCodes((prev) => new Set(prev).add(trimmedCode));
      if (student.schoolLevel === 'elementary') {
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

        // Clear buffer after configured timeout (scanner types fast)
        const bufferTimeout = settings?.scannerBufferTimeout ?? 100;
        if (bufferTimeoutRef.current) {
          clearTimeout(bufferTimeoutRef.current);
        }
        bufferTimeoutRef.current = setTimeout(() => {
          setScanBuffer('');
        }, bufferTimeout);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
    };
  }, [scanBuffer, isManualEntryOpen, processCode, settings?.scannerBufferTimeout]);

  // Auto-dismiss result after configured duration
  useEffect(() => {
    if (scanResult) {
      setIsReady(false);
      const displayDuration = settings?.scanDisplayDuration ?? 3000;
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
      resultTimeoutRef.current = setTimeout(() => {
        setScanResult(null);
        setIsReady(true);
      }, displayDuration);
    }

    return () => {
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
    };
  }, [scanResult, settings?.scanDisplayDuration]);

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
            src={settings?.schoolLogoUrl || DEFAULT_LOGO_URL}
            alt={settings?.schoolName || 'School Logo'}
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

        {/* Action Button - only show if manual entry is enabled */}
        {(settings?.manualEntryEnabled !== false) && (
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
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>{settings?.schoolName || 'School Lunch Program'}</p>
      </footer>

      {/* Manual Entry Modal */}
      <ManualEntry
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        onSubmit={handleManualSubmit}
      />
      {/* Styles are in globals.css to prevent FOUC */}
    </div>
  );
}
