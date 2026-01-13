'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  parseCsv,
  validateRows,
  importRows,
  downloadCsvTemplate,
  ParsedRow,
  ImportResult,
} from '@/lib/csvImport'

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete'

export default function CsvImport() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleFile = useCallback(async (file: File) => {
    setError(null)

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    try {
      const content = await file.text()
      const rows = parseCsv(content)

      if (rows.length === 0) {
        setError('No data found in CSV file')
        return
      }

      const validated = await validateRows(rows, supabase)
      setParsedRows(validated)
      setStep('preview')
    } catch (err) {
      setError(`Failed to parse CSV: ${err}`)
    }
  }, [supabase])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    setStep('importing')
    const result = await importRows(parsedRows, supabase)
    setImportResult(result)
    setStep('complete')
  }

  const handleReset = () => {
    setStep('upload')
    setParsedRows([])
    setImportResult(null)
    setError(null)
  }

  const validCount = parsedRows.filter(r => r.isValid).length
  const invalidCount = parsedRows.length - validCount

  return (
    <div className="csv-import">
      {step === 'upload' && (
        <div className="upload-section">
          <div className="template-download">
            <p>Download the template CSV file to see the expected format:</p>
            <button className="btn btn-secondary" onClick={downloadCsvTemplate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Template
            </button>
          </div>

          <div
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="drop-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <p className="drop-text">Drag and drop your CSV file here</p>
            <p className="drop-subtext">or</p>
            <label className="file-input-label">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="file-input"
              />
              <span className="btn btn-primary">Browse Files</span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>
      )}

      {step === 'preview' && (
        <div className="preview-section">
          <div className="preview-header">
            <h3>Preview Import</h3>
            <div className="preview-stats">
              <span className="stat valid">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {validCount} valid
              </span>
              {invalidCount > 0 && (
                <span className="stat invalid">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {invalidCount} with errors
                </span>
              )}
            </div>
          </div>

          <div className="preview-table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Status</th>
                  <th>Student Name</th>
                  <th>School Level</th>
                  <th>Barcode</th>
                  <th>Balance</th>
                  <th>Parent</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row) => (
                  <tr key={row.rowNumber} className={row.isValid ? '' : 'invalid-row'}>
                    <td>{row.rowNumber}</td>
                    <td>
                      {row.isValid ? (
                        <span className="status-badge valid">Valid</span>
                      ) : (
                        <span className="status-badge invalid" title={row.errors.join(', ')}>
                          Error
                        </span>
                      )}
                    </td>
                    <td>{row.student_name || <span className="empty">—</span>}</td>
                    <td>{row.school_level || <span className="empty">—</span>}</td>
                    <td>{row.barcode || <span className="auto-gen">Auto</span>}</td>
                    <td>{row.balance || '0'}</td>
                    <td>
                      {row.parent_email ? (
                        <span title={row.parent_email}>{row.parent_name || row.parent_email}</span>
                      ) : (
                        <span className="empty">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invalidCount > 0 && (
            <div className="error-list">
              <h4>Validation Errors</h4>
              {parsedRows
                .filter(r => !r.isValid)
                .map(row => (
                  <div key={row.rowNumber} className="error-item">
                    <strong>Row {row.rowNumber}:</strong> {row.errors.join('; ')}
                  </div>
                ))}
            </div>
          )}

          <div className="preview-actions">
            <button className="btn btn-secondary" onClick={handleReset}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={validCount === 0}
            >
              Import {validCount} Student{validCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="importing-section">
          <div className="loading-spinner" />
          <p>Importing students and parents...</p>
        </div>
      )}

      {step === 'complete' && importResult && (
        <div className="complete-section">
          <div className={`result-icon ${importResult.success ? 'success' : 'warning'}`}>
            {importResult.success ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>

          <h3>{importResult.success ? 'Import Complete!' : 'Import Completed with Errors'}</h3>

          <div className="result-stats">
            <div className="result-stat">
              <span className="stat-value">{importResult.studentsCreated}</span>
              <span className="stat-label">Students Created</span>
            </div>
            <div className="result-stat">
              <span className="stat-value">{importResult.parentsCreated}</span>
              <span className="stat-label">Parents Created</span>
            </div>
            {importResult.skippedRows > 0 && (
              <div className="result-stat warning">
                <span className="stat-value">{importResult.skippedRows}</span>
                <span className="stat-label">Rows Skipped</span>
              </div>
            )}
          </div>

          {importResult.errors.length > 0 && (
            <div className="error-list">
              <h4>Import Errors</h4>
              {importResult.errors.map((err, i) => (
                <div key={i} className="error-item">
                  <strong>Row {err.row}:</strong> {err.message}
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-primary" onClick={handleReset}>
            Import More
          </button>
        </div>
      )}

      <style jsx>{`
        .csv-import {
          padding: 8px 0;
        }

        .template-download {
          margin-bottom: 24px;
          padding: 16px;
          background: var(--gray-50);
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .template-download p {
          margin: 0;
          color: var(--gray-600);
          font-size: 14px;
        }

        .template-download .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .drop-zone {
          border: 2px dashed var(--gray-300);
          border-radius: var(--border-radius-lg);
          padding: 48px 24px;
          text-align: center;
          transition: all 0.2s ease;
          background: var(--gray-50);
        }

        .drop-zone.active {
          border-color: var(--aca-blue);
          background: rgba(0, 102, 204, 0.05);
        }

        .drop-icon {
          color: var(--gray-400);
          margin-bottom: 16px;
        }

        .drop-text {
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-700);
          margin: 0 0 8px 0;
        }

        .drop-subtext {
          font-size: 14px;
          color: var(--gray-400);
          margin: 0 0 16px 0;
        }

        .file-input {
          display: none;
        }

        .file-input-label {
          cursor: pointer;
        }

        .error-message {
          margin-top: 16px;
          padding: 12px 16px;
          background: var(--error-bg);
          color: var(--error);
          border-radius: var(--border-radius);
          font-size: 14px;
        }

        .preview-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .preview-header h3 {
          margin: 0;
          font-size: 16px;
          color: var(--gray-700);
        }

        .preview-stats {
          display: flex;
          gap: 16px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
        }

        .stat.valid {
          color: var(--success);
        }

        .stat.invalid {
          color: var(--error);
        }

        .preview-table-container {
          max-height: 400px;
          overflow: auto;
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius);
        }

        .preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .preview-table th {
          background: var(--gray-50);
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          color: var(--gray-600);
          border-bottom: 1px solid var(--gray-200);
          position: sticky;
          top: 0;
        }

        .preview-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--gray-100);
        }

        .preview-table tr.invalid-row {
          background: rgba(220, 38, 38, 0.05);
        }

        .status-badge {
          display: inline-flex;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.valid {
          background: var(--success-bg);
          color: var(--success);
        }

        .status-badge.invalid {
          background: var(--error-bg);
          color: var(--error);
          cursor: help;
        }

        .empty {
          color: var(--gray-300);
        }

        .auto-gen {
          color: var(--aca-blue);
          font-size: 11px;
          font-weight: 600;
          background: rgba(0, 102, 204, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .error-list {
          background: var(--error-bg);
          border: 1px solid var(--error-border);
          border-radius: var(--border-radius);
          padding: 16px;
        }

        .error-list h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--error);
        }

        .error-item {
          font-size: 13px;
          color: var(--error);
          margin-bottom: 8px;
        }

        .error-item:last-child {
          margin-bottom: 0;
        }

        .preview-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 8px;
        }

        .importing-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          gap: 16px;
          color: var(--gray-500);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--gray-200);
          border-top-color: var(--aca-blue);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .complete-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px;
          gap: 20px;
        }

        .result-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .result-icon.success {
          background: var(--success-bg);
          color: var(--success);
        }

        .result-icon.warning {
          background: var(--warning-bg);
          color: var(--warning);
        }

        .complete-section h3 {
          margin: 0;
          font-size: 20px;
          color: var(--gray-700);
        }

        .result-stats {
          display: flex;
          gap: 32px;
        }

        .result-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--aca-blue);
        }

        .stat-label {
          font-size: 13px;
          color: var(--gray-500);
        }

        .result-stat.warning .stat-value {
          color: var(--warning);
        }

        .complete-section .error-list {
          width: 100%;
          max-width: 500px;
          text-align: left;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .template-download {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .template-download .btn {
            width: 100%;
            justify-content: center;
          }

          .drop-zone {
            padding: 32px 16px;
          }

          .drop-icon svg {
            width: 40px;
            height: 40px;
          }

          .drop-text {
            font-size: 15px;
          }

          .preview-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .preview-table-container {
            max-height: 300px;
          }

          .preview-table {
            font-size: 12px;
          }

          .preview-table th,
          .preview-table td {
            padding: 8px 10px;
            white-space: nowrap;
          }

          .preview-actions {
            flex-direction: column;
          }

          .preview-actions .btn {
            width: 100%;
            justify-content: center;
          }

          .result-stats {
            gap: 20px;
          }

          .stat-value {
            font-size: 26px;
          }

          .complete-section {
            padding: 24px 16px;
          }
        }

        @media (max-width: 480px) {
          .preview-stats {
            flex-direction: column;
            gap: 8px;
          }

          .preview-table-container {
            max-height: 250px;
          }

          .preview-table {
            font-size: 11px;
          }

          .preview-table th,
          .preview-table td {
            padding: 6px 8px;
          }

          .result-stats {
            flex-direction: column;
            gap: 16px;
          }

          .stat-value {
            font-size: 28px;
          }

          .error-list {
            padding: 12px;
          }

          .error-list h4 {
            font-size: 13px;
          }

          .error-item {
            font-size: 12px;
          }

          .importing-section {
            padding: 40px 20px;
          }
        }
      `}</style>
    </div>
  )
}
