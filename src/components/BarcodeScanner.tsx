'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  isActive: boolean;
}

export default function BarcodeScanner({ onScan, isActive }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const startScanning = useCallback(async () => {
    if (!videoRef.current || !isActive) return;

    try {
      readerRef.current = new BrowserMultiFormatReader();

      await readerRef.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, error) => {
          if (result) {
            onScan(result.getText());
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error('Scan error:', error);
          }
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (error) {
      console.error('Failed to start scanner:', error);
      setHasPermission(false);
    }
  }, [isActive, onScan]);

  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isActive, startScanning, stopScanning]);

  if (hasPermission === false) {
    return (
      <div className="scanner-error">
        <div className="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <p>Camera access denied</p>
        <p className="error-hint">Please allow camera access in your browser settings</p>
      </div>
    );
  }

  return (
    <div className="scanner-container">
      <video
        ref={videoRef}
        className="scanner-video"
        playsInline
        muted
      />
      {isScanning && (
        <div className="scanner-overlay">
          <div className="scanner-frame">
            <div className="corner corner-tl" />
            <div className="corner corner-tr" />
            <div className="corner corner-bl" />
            <div className="corner corner-br" />
            <div className="scan-line" />
          </div>
        </div>
      )}
      {!isScanning && isActive && (
        <div className="scanner-loading">
          <div className="loading-spinner" />
          <p>Starting camera...</p>
        </div>
      )}

      <style jsx>{`
        .scanner-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          background: var(--gray-700);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
        }

        .scanner-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .scanner-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
        }

        .scanner-frame {
          position: relative;
          width: 70%;
          aspect-ratio: 3/2;
          max-width: 280px;
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
          border-radius: 4px 0 0 0;
        }

        .corner-tr {
          top: 0;
          right: 0;
          border-left: none;
          border-bottom: none;
          border-radius: 0 4px 0 0;
        }

        .corner-bl {
          bottom: 0;
          left: 0;
          border-right: none;
          border-top: none;
          border-radius: 0 0 0 4px;
        }

        .corner-br {
          bottom: 0;
          right: 0;
          border-left: none;
          border-top: none;
          border-radius: 0 0 4px 0;
        }

        .scan-line {
          position: absolute;
          left: 8px;
          right: 8px;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--aca-blue), transparent);
          box-shadow: 0 0 8px var(--aca-blue);
          animation: scanLine 2s ease-in-out infinite;
        }

        .scanner-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: var(--gray-700);
          color: var(--white);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: var(--aca-blue);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .scanner-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 48px 24px;
          text-align: center;
          background: var(--gray-50);
          border-radius: var(--border-radius-lg);
          color: var(--error);
        }

        .error-icon {
          opacity: 0.7;
        }

        .error-hint {
          font-size: 14px;
          color: var(--gray-400);
        }
      `}</style>
    </div>
  );
}
