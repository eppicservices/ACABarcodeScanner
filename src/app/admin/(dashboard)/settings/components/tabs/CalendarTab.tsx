'use client'

import { useSettings } from '../../context/SettingsContext'
import SchoolCalendarSettings from '@/components/admin/SchoolCalendarSettings'

export function CalendarTab() {
  const { settings, fetchData, setMessage } = useSettings()

  return (
    <div className="tab-panel">
      <SchoolCalendarSettings
        settings={settings}
        onSettingsChange={async () => {
          await fetchData()
        }}
        onMessage={setMessage}
      />
    </div>
  )
}
