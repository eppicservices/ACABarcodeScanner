'use client';

interface ScanResultProps {
  code: string;
  status: 'success' | 'error' | 'duplicate' | 'insufficient' | 'inactive';
  studentName?: string;
  message?: string;
  onDismiss: () => void;
}

// Styles are in globals.css to prevent FOUC
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
    inactive: {
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
      title: 'Inactive Student',
      bgClass: 'result-inactive',
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
    </div>
  );
}
