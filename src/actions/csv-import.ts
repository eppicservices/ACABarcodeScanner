'use server'

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

// Validate parsed rows using Prisma
export async function validateCsvRows(rows: CsvRow[]): Promise<ParsedRow[]> {
  // Get existing barcodes from database
  const existingStudents = await prisma.student.findMany({
    select: { barcode: true },
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
export async function importCsvRows(rows: ParsedRow[]): Promise<ImportResult> {
  const validRows = rows.filter(r => r.isValid)
  const errors: { row: number; message: string }[] = []
  let studentsCreated = 0
  let parentsCreated = 0

  // Get max existing barcode for auto-generation
  const maxBarcodeStudent = await prisma.student.findFirst({
    orderBy: { barcode: 'desc' },
    select: { barcode: true },
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
      select: { id: true, email: true },
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
          const newParent = await prisma.parent.create({
            data: {
              name: row.parent_name || 'Parent',
              email: row.parent_email,
              phone: row.parent_phone || null,
            },
          })

          parentId = newParent.id
          parentEmailMap.set(emailLower, parentId)
          parentsCreated++
        }
      }

      // Generate barcode if not provided
      const barcode = row.barcode.trim() || String(nextBarcode++)

      // Determine is_active status (default to true)
      const isActive = !['false', '0', 'no', 'inactive'].includes(row.is_active.toLowerCase().trim())

      // Create student
      await prisma.student.create({
        data: {
          name: row.student_name.trim(),
          barcode,
          schoolLevel: normalizeSchoolLevel(row.school_level),
          balance: parseInt(row.balance) || 0,
          parentId: parentId!,
          isActive,
        },
      })

      studentsCreated++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push({ row: row.rowNumber, message: `Failed to create student: ${message}` })
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
