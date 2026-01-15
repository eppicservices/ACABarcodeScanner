'use client'

import CsvImport from '@/components/admin/CsvImport'

export function ImportTab() {
  return (
    <div className="tab-panel">
      <h2>Import Data</h2>
      <p className="section-desc">Import students and parents from a CSV file.</p>
      <CsvImport />
    </div>
  )
}
