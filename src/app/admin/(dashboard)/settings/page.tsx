'use client'

import { SettingsProvider, useSettings } from './context/SettingsContext'
import { SettingsTabNav } from './components/SettingsTabNav'
import { EmailPreviewModal } from './components/EmailPreviewModal'
import {
  PricingTab,
  NotificationsTab,
  EmailTab,
  ScannerTab,
  SchoolInfoTab,
  CalendarTab,
  BrandingTab,
  AdvancedTab,
  AdminsTab,
  PaymentsTab,
  ImportTab,
  DataExportTab,
} from './components/tabs'

function SettingsContent() {
  const { loading, message, activeTab, settings } = useSettings()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>Loading settings...</span>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px;
            gap: 16px;
            color: var(--gray-400);
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--gray-100);
            border-top-color: var(--aca-blue);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'pricing':
        return <PricingTab />
      case 'notifications':
        return <NotificationsTab />
      case 'email':
        return <EmailTab />
      case 'scanner':
        return <ScannerTab />
      case 'school':
        return <SchoolInfoTab />
      case 'calendar':
        return <CalendarTab />
      case 'branding':
        return <BrandingTab />
      case 'advanced':
        return <AdvancedTab />
      case 'admins':
        return <AdminsTab />
      case 'payments':
        return <PaymentsTab />
      case 'import':
        return <ImportTab />
      case 'data':
        return <DataExportTab />
      default:
        return <PricingTab />
    }
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h1>Settings</h1>
            <p className="subtitle">Manage your lunch system configuration</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-layout">
        <SettingsTabNav />
        <div className="tab-content">
          {renderActiveTab()}
        </div>
      </div>

      <EmailPreviewModal />

      {settings?.updated_at && (
        <p className="last-updated">
          Last updated: {new Date(settings.updated_at).toLocaleString()}
        </p>
      )}

      <style jsx>{`
        .settings-page {
          max-width: 1000px;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--gray-100) 0%, var(--white) 100%);
          border: 1px solid var(--gray-200);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-600);
        }

        h1 {
          font-size: 26px;
          margin: 0;
          color: var(--aca-navy);
        }

        .subtitle {
          color: var(--gray-400);
          margin: 2px 0 0 0;
          font-size: 14px;
        }

        .alert {
          padding: 14px 18px;
          border-radius: var(--border-radius);
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .alert-error {
          background: var(--error-bg);
          color: var(--error);
          border: 1px solid var(--error-border);
        }

        .alert-success {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid var(--success-border);
        }

        .settings-layout {
          display: flex;
          gap: 24px;
          background: var(--white);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--gray-200);
          overflow: hidden;
        }

        .tab-content {
          flex: 1;
          padding: 28px;
          min-height: 500px;
        }

        .last-updated {
          font-size: 12px;
          color: var(--gray-400);
          margin-top: 16px;
          text-align: right;
        }

        @media (max-width: 768px) {
          .settings-layout {
            flex-direction: column;
          }

          .tab-content {
            padding: 20px 16px;
            min-height: auto;
          }

          h1 {
            font-size: 22px;
          }

          .header-icon {
            width: 40px;
            height: 40px;
          }

          .header-icon svg {
            width: 20px;
            height: 20px;
          }
        }

        @media (max-width: 480px) {
          .tab-content {
            padding: 16px 12px;
          }
        }
      `}</style>

      <style jsx global>{`
        .tabs-sidebar {
          width: 200px;
          background: var(--gray-50);
          border-right: 1px solid var(--gray-200);
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border: none;
          background: transparent;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-600);
          text-align: left;
          transition: all 0.15s ease;
          font-family: var(--font-body);
        }

        .tab-btn:hover {
          background: var(--gray-100);
          color: var(--gray-700);
        }

        .tab-btn.active {
          background: var(--white);
          color: var(--aca-blue);
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .tab-icon {
          display: flex;
          opacity: 0.7;
        }

        .tab-btn.active .tab-icon {
          opacity: 1;
        }

        .tab-panel h2 {
          font-size: 18px;
          margin: 0 0 6px 0;
          color: var(--aca-navy);
        }

        .tab-panel h3 {
          font-size: 15px;
          margin: 28px 0 12px 0;
          color: var(--gray-700);
        }

        .section-desc {
          color: var(--gray-500);
          font-size: 14px;
          margin: 0 0 24px 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .form-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 400px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-700);
        }

        .input-with-prefix,
        .input-with-suffix {
          display: flex;
          align-items: center;
        }

        .input-with-prefix .input {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }

        .prefix {
          padding: 10px 12px;
          background: var(--gray-100);
          border: 1px solid var(--gray-300);
          border-right: none;
          border-radius: var(--border-radius) 0 0 var(--border-radius);
          color: var(--gray-500);
          font-weight: 500;
        }

        .input-with-suffix .input {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }

        .suffix {
          padding: 10px 12px;
          background: var(--gray-100);
          border: 1px solid var(--gray-300);
          border-left: none;
          border-radius: 0 var(--border-radius) var(--border-radius) 0;
          color: var(--gray-500);
          font-size: 13px;
        }

        .hint {
          font-size: 12px;
          color: var(--gray-400);
        }

        .toggle-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--gray-50);
          border-radius: var(--border-radius);
          margin-bottom: 12px;
        }

        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toggle-info strong {
          font-size: 14px;
          color: var(--gray-700);
        }

        .toggle-info span {
          font-size: 13px;
          color: var(--gray-500);
        }

        .toggle {
          width: 48px;
          height: 28px;
          background: var(--gray-300);
          border-radius: 14px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.2s ease;
          flex-shrink: 0;
        }

        .toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle.on {
          background: var(--aca-blue);
        }

        .toggle-handle {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          background: var(--white);
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }

        .toggle.on .toggle-handle {
          transform: translateX(20px);
        }

        .notification-options {
          transition: opacity 0.2s ease;
        }

        .notification-options.disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .day-checkboxes {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .day-checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--gray-50);
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 13px;
          user-select: none;
        }

        .day-checkbox:hover {
          background: var(--gray-100);
        }

        .day-checkbox input {
          margin: 0;
          cursor: pointer;
        }

        .day-checkbox input:checked + span {
          color: var(--aca-blue);
          font-weight: 500;
        }

        .info-box {
          display: flex;
          gap: 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: var(--border-radius);
          padding: 16px;
          margin-bottom: 20px;
          color: #1e40af;
        }

        .info-box svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .info-box strong {
          display: block;
          margin-bottom: 4px;
        }

        .info-box p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #3b82f6;
        }

        .info-box code {
          display: inline-block;
          background: var(--white);
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'SF Mono', Consolas, monospace;
          font-size: 12px;
          color: var(--gray-700);
          border: 1px solid var(--gray-200);
        }

        .invite-form {
          background: var(--gray-50);
          border-radius: var(--border-radius);
          padding: 20px;
          margin-bottom: 28px;
        }

        .invite-form h3 {
          margin: 0 0 12px 0;
        }

        .invite-row {
          display: flex;
          gap: 12px;
        }

        .invite-row .input {
          flex: 1;
        }

        .admin-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .admin-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--gray-50);
          border-radius: var(--border-radius);
        }

        .admin-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-avatar {
          width: 40px;
          height: 40px;
          background: var(--aca-blue);
          color: var(--white);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .admin-email {
          font-weight: 600;
          color: var(--gray-700);
        }

        .admin-role {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }

        .role-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
        }

        .role-badge.super_admin {
          background: var(--aca-gold-subtle);
          color: var(--aca-gold-dark);
        }

        .role-badge.admin {
          background: var(--gray-200);
          color: var(--gray-600);
        }

        .admin-date {
          font-size: 12px;
          color: var(--gray-400);
        }

        .export-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .export-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--gray-50);
          border-radius: var(--border-radius);
        }

        .export-icon {
          width: 48px;
          height: 48px;
          background: var(--white);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--aca-blue);
        }

        .export-info {
          flex: 1;
        }

        .export-info h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          color: var(--gray-700);
        }

        .export-info p {
          margin: 0;
          font-size: 13px;
          color: var(--gray-500);
        }

        .form-actions {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--gray-200);
        }

        .test-email-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--gray-200);
        }

        .test-email-section .hint {
          margin: 0;
        }

        .btn-ghost {
          background: transparent;
          color: var(--gray-500);
          padding: 6px 12px;
          font-size: 13px;
        }

        .btn-ghost:hover {
          background: var(--error-bg);
          color: var(--error);
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
        }

        .empty-payments {
          text-align: center;
          padding: 48px 24px;
          color: var(--gray-400);
        }

        .empty-payments .empty-icon {
          margin-bottom: 16px;
          color: var(--gray-300);
        }

        .empty-payments p {
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-500);
          margin: 0 0 4px 0;
        }

        .empty-hint {
          font-size: 13px;
        }

        .payments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .payment-card {
          background: var(--gray-50);
          border-radius: var(--border-radius);
          padding: 20px;
        }

        .payment-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .payment-info strong {
          display: block;
          font-size: 15px;
          color: var(--gray-700);
        }

        .payment-date {
          font-size: 12px;
          color: var(--gray-400);
        }

        .payment-total {
          font-size: 20px;
          font-weight: 700;
          color: var(--aca-teal);
        }

        .payment-students {
          border-top: 1px solid var(--gray-200);
          border-bottom: 1px solid var(--gray-200);
          padding: 12px 0;
          margin-bottom: 16px;
        }

        .student-payment {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 14px;
        }

        .student-name {
          color: var(--gray-600);
        }

        .student-amount {
          color: var(--gray-500);
        }

        .lunch-card-tag {
          display: inline-block;
          background: var(--aca-gold-subtle);
          color: var(--aca-gold-dark);
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 6px;
        }

        .payment-actions {
          display: flex;
          gap: 8px;
        }

        /* Email Template Cards */
        .template-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .template-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--gray-50);
          border-radius: var(--border-radius);
          transition: all 0.15s ease;
        }

        .template-card:hover {
          background: var(--gray-100);
        }

        .template-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .template-icon.balance {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
        }

        .template-icon.receipt {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #16a34a;
        }

        .template-icon.portal {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          color: #0284c7;
        }

        .template-icon.weekly {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #d97706;
        }

        .template-icon.welcome {
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          color: #9333ea;
        }

        .template-info {
          flex: 1;
        }

        .template-info h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          color: var(--gray-700);
        }

        .template-info p {
          margin: 0;
          font-size: 13px;
          color: var(--gray-500);
          line-height: 1.5;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--gray-200);
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: var(--aca-navy);
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border: none;
          background: var(--gray-100);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-500);
          transition: all 0.15s ease;
        }

        .modal-close:hover {
          background: var(--gray-200);
          color: var(--gray-700);
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .email-preview-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: var(--border-radius);
          margin-bottom: 20px;
          font-size: 13px;
          color: #1e40af;
        }

        .email-preview-info svg {
          flex-shrink: 0;
        }

        .email-preview-frame {
          width: 100%;
          height: 600px;
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius);
          background: #f8fafc;
        }

        /* Color picker styles */
        .color-input-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .color-picker {
          width: 50px;
          height: 40px;
          padding: 2px;
          border: 1px solid var(--gray-300);
          border-radius: var(--border-radius);
          cursor: pointer;
        }

        .color-input-row .input {
          flex: 1;
          font-family: monospace;
        }

        .preview-swatches {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .swatch {
          width: 80px;
          height: 60px;
          border-radius: var(--border-radius);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .swatch span {
          font-size: 11px;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .logo-preview {
          margin: 4px 0 16px 0;
        }

        .preview-box {
          margin-top: 8px;
          padding: 16px;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .tabs-sidebar {
            width: 100%;
            flex-direction: row;
            overflow-x: auto;
            border-right: none;
            border-bottom: 1px solid var(--gray-200);
            padding: 12px 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .tabs-sidebar::-webkit-scrollbar {
            display: none;
          }

          .tab-btn {
            white-space: nowrap;
            padding: 10px 14px;
            font-size: 13px;
            flex-shrink: 0;
          }

          .tab-label {
            display: none;
          }

          .tab-icon {
            opacity: 1;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .tab-panel h2 {
            font-size: 16px;
          }

          .tab-panel h3 {
            font-size: 14px;
            margin: 20px 0 10px 0;
          }

          .section-desc {
            font-size: 13px;
            margin-bottom: 20px;
          }

          .toggle-card {
            padding: 14px;
          }

          .toggle-info strong {
            font-size: 13px;
          }

          .toggle-info span {
            font-size: 12px;
          }

          .toggle {
            width: 44px;
            height: 26px;
          }

          .toggle-handle {
            width: 20px;
            height: 20px;
          }

          .toggle.on .toggle-handle {
            transform: translateX(18px);
          }

          .invite-row {
            flex-direction: column;
          }

          .admin-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .export-card {
            flex-direction: column;
            text-align: center;
            padding: 20px 16px;
          }

          .export-card .btn {
            width: 100%;
          }

          .info-box {
            padding: 14px;
            font-size: 12px;
          }

          .info-box p {
            font-size: 12px;
          }

          .test-email-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .payment-card {
            padding: 16px;
          }

          .payment-header {
            flex-direction: column;
            gap: 8px;
          }

          .payment-total {
            font-size: 18px;
          }

          .payment-actions {
            flex-direction: column;
          }

          .payment-actions .btn {
            width: 100%;
          }

          /* Template cards mobile */
          .template-card {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .template-card .btn {
            width: 100%;
          }

          /* Modal mobile */
          .modal-overlay {
            padding: 10px;
          }

          .modal-content {
            max-height: 95vh;
          }

          .modal-header {
            padding: 16px;
          }

          .modal-header h3 {
            font-size: 16px;
          }

          .modal-body {
            padding: 16px;
          }

          .email-preview-frame {
            height: 500px;
          }
        }

        @media (max-width: 480px) {
          .tab-btn {
            padding: 8px 12px;
          }

          .form-group label {
            font-size: 12px;
          }

          .hint {
            font-size: 11px;
          }

          .form-stack {
            max-width: 100%;
          }

          .admin-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .admin-avatar {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          .admin-email {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsContent />
    </SettingsProvider>
  )
}
