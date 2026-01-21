'use client'

import { useState } from 'react'

export interface HorizontalTab {
  id: string
  label: string
  content: React.ReactNode
}

interface HorizontalTabsProps {
  tabs: HorizontalTab[]
  defaultTab?: string
}

export function HorizontalTabs({ tabs, defaultTab }: HorizontalTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className="horizontal-tabs">
      <div className="horizontal-tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`horizontal-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="horizontal-tab-content">
        {activeContent}
      </div>

      <style jsx>{`
        .horizontal-tabs {
          width: 100%;
        }

        .horizontal-tab-nav {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--gray-200);
          margin-bottom: 24px;
        }

        .horizontal-tab-btn {
          padding: 10px 16px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-500);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.15s ease;
          font-family: var(--font-body);
        }

        .horizontal-tab-btn:hover {
          color: var(--gray-700);
        }

        .horizontal-tab-btn.active {
          color: var(--aca-blue);
          border-bottom-color: var(--aca-blue);
        }

        .horizontal-tab-content {
          min-height: 200px;
        }

        @media (max-width: 480px) {
          .horizontal-tab-nav {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .horizontal-tab-nav::-webkit-scrollbar {
            display: none;
          }

          .horizontal-tab-btn {
            padding: 8px 12px;
            font-size: 13px;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  )
}
