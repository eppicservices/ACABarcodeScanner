'use server'

import prisma from '@/lib/prisma'
import type { SchoolLevel } from '@prisma/client'

export interface StudentWithParent {
  id: string
  name: string
  barcode: string
  balance: number
  schoolLevel: SchoolLevel
  isActive: boolean
  createdAt: Date
  parentId: string
  parent: {
    id: string
    name: string
    email: string
    phone: string | null
  }
}

export interface StudentStats {
  activeCount: number
  inactiveCount: number
  lowBalanceCount: number
  elementaryCount: number
  highSchoolCount: number
}

export interface StudentFilters {
  schoolLevel?: 'all' | 'elementary' | 'high_school'
  status?: 'all' | 'active' | 'inactive'
  search?: string
  sortField?: 'name' | 'balance' | 'level'
  sortDirection?: 'asc' | 'desc'
}

// Get all students with parent info
export async function getStudentsWithParents(filters?: StudentFilters): Promise<StudentWithParent[]> {
  const where: Record<string, unknown> = {}

  // Apply school level filter
  if (filters?.schoolLevel && filters.schoolLevel !== 'all') {
    where.schoolLevel = filters.schoolLevel
  }

  // Apply status filter
  if (filters?.status === 'active') {
    where.isActive = true
  } else if (filters?.status === 'inactive') {
    where.isActive = false
  }

  // Determine sort order
  let orderBy: Record<string, 'asc' | 'desc'> = { name: 'asc' }
  if (filters?.sortField) {
    const direction = filters.sortDirection || 'asc'
    switch (filters.sortField) {
      case 'name':
        orderBy = { name: direction }
        break
      case 'balance':
        orderBy = { balance: direction }
        break
      case 'level':
        orderBy = { schoolLevel: direction }
        break
    }
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy,
  })

  // Apply search filter (client-side due to parent name search)
  let result = students
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    result = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchLower) ||
        student.barcode.toLowerCase().includes(searchLower) ||
        student.parent.name.toLowerCase().includes(searchLower)
    )
  }

  return result
}

// Get student stats
export async function getStudentStats(): Promise<StudentStats> {
  const students = await prisma.student.findMany({
    select: {
      isActive: true,
      balance: true,
      schoolLevel: true,
    },
  })

  const activeStudents = students.filter((s) => s.isActive)

  return {
    activeCount: activeStudents.length,
    inactiveCount: students.filter((s) => !s.isActive).length,
    lowBalanceCount: activeStudents.filter((s) => s.balance < 10).length,
    elementaryCount: activeStudents.filter((s) => s.schoolLevel === 'elementary').length,
    highSchoolCount: activeStudents.filter((s) => s.schoolLevel === 'high_school').length,
  }
}

// Get single student by ID
export async function getStudentById(id: string) {
  return prisma.student.findUnique({
    where: { id },
    include: {
      parent: true,
      balanceTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })
}

// Get student by barcode
export async function getStudentByBarcode(barcode: string) {
  return prisma.student.findUnique({
    where: { barcode },
    include: {
      parent: true,
    },
  })
}

// Create a new student
export async function createStudent(data: {
  name: string
  barcode: string
  parentId: string
  schoolLevel: SchoolLevel
  balance?: number
}) {
  return prisma.student.create({
    data: {
      name: data.name,
      barcode: data.barcode,
      parentId: data.parentId,
      schoolLevel: data.schoolLevel,
      balance: data.balance ?? 0,
    },
    include: {
      parent: true,
    },
  })
}

// Update student
export async function updateStudent(
  id: string,
  data: {
    name?: string
    barcode?: string
    parentId?: string
    schoolLevel?: SchoolLevel
    balance?: number
    isActive?: boolean
  }
) {
  return prisma.student.update({
    where: { id },
    data,
    include: {
      parent: true,
    },
  })
}

// Update student balance
export async function updateStudentBalance(id: string, balance: number) {
  return prisma.student.update({
    where: { id },
    data: { balance },
  })
}

// Bulk update student status
export async function updateStudentsStatus(ids: string[], isActive: boolean) {
  return prisma.student.updateMany({
    where: { id: { in: ids } },
    data: { isActive },
  })
}

// Check if barcode exists (for validation)
export async function checkBarcodeExists(barcode: string, excludeId?: string): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { barcode },
    select: { id: true },
  })

  if (!student) return false
  if (excludeId && student.id === excludeId) return false
  return true
}

// Get students by parent ID
export async function getStudentsByParentId(parentId: string) {
  return prisma.student.findMany({
    where: { parentId },
    orderBy: { name: 'asc' },
  })
}

// Delete student
export async function deleteStudent(id: string) {
  // Delete related transactions first, then the student
  await prisma.$transaction([
    prisma.balanceTransaction.deleteMany({
      where: { studentId: id },
    }),
    prisma.student.delete({
      where: { id },
    }),
  ])
}

// Get students for CSV export
export async function getStudentsForExport() {
  const students = await prisma.student.findMany({
    include: {
      parent: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return students.map((s) => ({
    id: s.id,
    name: s.name,
    barcode: s.barcode,
    balance: s.balance,
    schoolLevel: s.schoolLevel,
    isActive: s.isActive,
    parentName: s.parent.name,
    parentEmail: s.parent.email,
    createdAt: s.createdAt.toISOString(),
  }))
}
