import prisma from '@/lib/prisma'
import type { SchoolLevel } from '@prisma/client'

export interface CsvRow {
  student_name: string
  school_level: string
  barcode: string
  balance: string
  parent_name: string
  parent_email: string
  parent_phone: string
  is_active: string
}

export interface ParsedRow extends CsvRow {
  rowNumber: number
  errors: string[]
  isValid: boolean
}

export interface ImportResult {
  success: boolean
  studentsCreated: number
  parentsCreated: number
  skippedRows: number
  errors: { row: number; message: string }[]
}

// CSV template headers
export const CSV_HEADERS = [
  'student_name',
  'school_level',
  'barcode',
  'balance',
  'parent_name',
  'parent_email',
  'parent_phone',
  'is_active',
]

// Generate downloadable CSV template
export function generateCsvTemplate(): string {
  const headers = CSV_HEADERS.join(',')
  const exampleRows = [
    'John Smith,elementary,1001,0,Jane Smith,jane@email.com,555-123-4567,true',
    'Sarah Johnson,high_school,2001,5,Mike Johnson,mike@email.com,555-987-6543,true',
    'Tommy Brown,elementary,,0,,,,true',
  ]
  return [headers, ...exampleRows].join('\n')
}

// Download CSV template as file
export function downloadCsvTemplate() {
  const content = generateCsvTemplate()
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'student_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Parse CSV string into rows
export function parseCsv(csvContent: string): CsvRow[] {
  const lines = csvContent.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || ''
    })

    return {
      student_name: row['student_name'] || row['name'] || '',
      school_level: row['school_level'] || row['level'] || '',
      barcode: row['barcode'] || row['id'] || row['student_id'] || '',
      balance: row['balance'] || '0',
      parent_name: row['parent_name'] || row['parent'] || '',
      parent_email: row['parent_email'] || row['email'] || '',
      parent_phone: row['parent_phone'] || row['phone'] || '',
      is_active: row['is_active'] || row['active'] || 'true',
    }
  })
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Validate parsed rows using Prisma
export async function validateRows(rows: CsvRow[]): Promise<ParsedRow[]> {
  // Get existing barcodes from database using Prisma
  const existingStudents = await prisma.student.findMany({
    select: { barcode: true }
  })

  const existingBarcodes = new Set(existingStudents.map(s => s.barcode))
  const seenBarcodes = new Set<string>()

  return rows.map((row, index) => {
    const errors: string[] = []
    const rowNumber = index + 2 // +2 for header row and 0-indexing

    // Required field validation
    if (!row.student_name.trim()) {
      errors.push('Student name is required')
    }

    // School level validation
    const normalizedLevel = row.school_level.toLowerCase().trim()
    if (!normalizedLevel) {
      errors.push('School level is required')
    } else if (!['elementary', 'high_school', 'highschool', 'high school'].includes(normalizedLevel)) {
      errors.push('School level must be "elementary" or "high_school"')
    }

    // Barcode uniqueness (if provided)
    if (row.barcode.trim()) {
      if (existingBarcodes.has(row.barcode.trim())) {
        errors.push(`Barcode "${row.barcode}" already exists in database`)
      }
      if (seenBarcodes.has(row.barcode.trim())) {
        errors.push(`Duplicate barcode "${row.barcode}" in CSV file`)
      }
      seenBarcodes.add(row.barcode.trim())
    }

    // Balance validation
    if (row.balance && isNaN(parseInt(row.balance))) {
      errors.push('Balance must be a number')
    }

    // Email validation (if provided)
    if (row.parent_email && !isValidEmail(row.parent_email)) {
      errors.push('Invalid parent email format')
    }

    return {
      ...row,
      rowNumber,
      errors,
      isValid: errors.length === 0,
    }
  })
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Normalize school level to database format
function normalizeSchoolLevel(level: string): SchoolLevel {
  const normalized = level.toLowerCase().trim()
  if (['high_school', 'highschool', 'high school'].includes(normalized)) {
    return 'high_school'
  }
  return 'elementary'
}

// Import valid rows into database using Prisma
export async function importRows(rows: ParsedRow[]): Promise<ImportResult> {
  const validRows = rows.filter(r => r.isValid)
  const errors: { row: number; message: string }[] = []
  let studentsCreated = 0
  let parentsCreated = 0

  // Get max existing barcode for auto-generation
  const maxBarcodeStudent = await prisma.student.findFirst({
    select: { barcode: true },
    orderBy: { barcode: 'desc' }
  })

  let nextBarcode = 1001
  if (maxBarcodeStudent) {
    const maxNum = parseInt(maxBarcodeStudent.barcode)
    if (!isNaN(maxNum)) {
      nextBarcode = maxNum + 1
    }
  }

  // Group rows by parent email to avoid duplicates
  const parentEmailMap = new Map<string, string>() // email -> parent_id

  // First, get existing parents
  const uniqueEmails = [...new Set(validRows
    .filter(r => r.parent_email)
    .map(r => r.parent_email.toLowerCase()))]

  if (uniqueEmails.length > 0) {
    const existingParents = await prisma.parent.findMany({
      where: { email: { in: uniqueEmails } },
      select: { id: true, email: true }
    })

    existingParents.forEach(p => {
      parentEmailMap.set(p.email.toLowerCase(), p.id)
    })
  }

  // Process each row
  for (const row of validRows) {
    try {
      let parentId: string | null = null

      // Handle parent creation/lookup
      if (row.parent_email) {
        const emailLower = row.parent_email.toLowerCase()

        if (parentEmailMap.has(emailLower)) {
          parentId = parentEmailMap.get(emailLower)!
        } else {
          // Create new parent
          try {
            const newParent = await prisma.parent.create({
              data: {
                name: row.parent_name || 'Parent',
                email: row.parent_email,
                phone: row.parent_phone || null,
              },
              select: { id: true }
            })

            parentId = newParent.id
            parentEmailMap.set(emailLower, parentId)
            parentsCreated++
          } catch (parentError) {
            errors.push({ row: row.rowNumber, message: `Failed to create parent: ${parentError}` })
            continue
          }
        }
      }

      // Generate barcode if not provided
      const barcode = row.barcode.trim() || String(nextBarcode++)

      // Determine is_active status (default to true)
      const isActive = !['false', '0', 'no', 'inactive'].includes(row.is_active.toLowerCase().trim())

      // Create student - parentId is required in schema
      if (!parentId) {
        errors.push({ row: row.rowNumber, message: 'Student requires a valid parent email' })
        continue
      }

      try {
        await prisma.student.create({
          data: {
            name: row.student_name.trim(),
            barcode,
            schoolLevel: normalizeSchoolLevel(row.school_level),
            balance: parseInt(row.balance) || 0,
            parent: { connect: { id: parentId } },
            isActive: isActive,
          }
        })
        studentsCreated++
      } catch (studentError) {
        errors.push({ row: row.rowNumber, message: `Failed to create student: ${studentError}` })
        continue
      }
    } catch (err) {
      errors.push({ row: row.rowNumber, message: `Unexpected error: ${err}` })
    }
  }

  return {
    success: errors.length === 0,
    studentsCreated,
    parentsCreated,
    skippedRows: rows.length - validRows.length,
    errors,
  }
}
