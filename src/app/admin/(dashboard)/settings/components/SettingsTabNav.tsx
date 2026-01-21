'use client'

import { useSettings } from '../context/SettingsContext'
import { tabIconMap, tabLabels } from '../utils/tabIcons'
import type { TabId } from '../types'

const tabOrder: TabId[] = [
  'pricing',
  'school',
  'scanner',
  'calendar',
  'communications',
  'admins',
  'data',
  'advanced',
]

export function SettingsTabNav() {
  const { activeTab, setActiveTab } = useSettings()

  return (
    <div className="tabs-sidebar">
      {tabOrder.map(tabId => {
        const Icon = tabIconMap[tabId]
        const label = tabLabels[tabId]

        return (
          <button
            key={tabId}
            className={`tab-btn ${activeTab === tabId ? 'active' : ''}`}
            onClick={() => setActiveTab(tabId)}
          >
            <span className="tab-icon">
              <Icon />
            </span>
            <span className="tab-label">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
