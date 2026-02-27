'use server'

import prisma from '@/lib/prisma'

export interface ParentWithStudents {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: Date
  students: {
    id: string
    name: string
    barcode: string
    balance: number
    schoolLevel: string
    isActive: boolean
  }[]
}

export interface ParentStats {
  activeCount: number
  inactiveCount: number
  totalStudents: number
  parentsWithMultipleKids: number
}

export interface ParentFilters {
  status?: 'all' | 'active' | 'inactive'
  search?: string
  sortField?: 'name' | 'balance' | 'children'
  sortDirection?: 'asc' | 'desc'
}

// Get all parents with students
export async function getParentsWithStudents(filters?: ParentFilters): Promise<ParentWithStudents[]> {
  const where: Record<string, unknown> = {}

  // Apply status filter
  if (filters?.status === 'active') {
    where.isActive = true
  } else if (filters?.status === 'inactive') {
    where.isActive = false
  }

  const parents = await prisma.parent.findMany({
    where,
    include: {
      students: {
        select: {
          id: true,
          name: true,
          barcode: true,
          balance: true,
          schoolLevel: true,
          isActive: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Apply search filter
  let result = parents
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    result = parents.filter(
      (parent) =>
        parent.name.toLowerCase().includes(searchLower) ||
        parent.email.toLowerCase().includes(searchLower)
    )
  }

  // Apply sorting for balance and children
  if (filters?.sortField && filters.sortField !== 'name') {
    const direction = filters.sortDirection || 'asc'
    result.sort((a, b) => {
      let comparison = 0
      switch (filters.sortField) {
        case 'balance':
          const balanceA = a.students.reduce((sum, s) => sum + s.balance, 0)
          const balanceB = b.students.reduce((sum, s) => sum + s.balance, 0)
          comparison = balanceA - balanceB
          break
        case 'children':
          comparison = a.students.length - b.students.length
          break
      }
      return direction === 'asc' ? comparison : -comparison
    })
  } else if (filters?.sortDirection === 'desc') {
    result.reverse()
  }

  return result
}

// Get parent stats
export async function getParentStats(): Promise<ParentStats> {
  const parents = await prisma.parent.findMany({
    select: {
      isActive: true,
      students: {
        select: {
          isActive: true,
        },
      },
    },
  })

  const activeParents = parents.filter((p) => p.isActive)
  const totalStudents = activeParents.reduce(
    (sum, p) => sum + p.students.filter((s) => s.isActive).length,
    0
  )
  const parentsWithMultipleKids = activeParents.filter(
    (p) => p.students.filter((s) => s.isActive).length > 1
  ).length

  return {
    activeCount: activeParents.length,
    inactiveCount: parents.filter((p) => !p.isActive).length,
    totalStudents,
    parentsWithMultipleKids,
  }
}

// Get single parent by ID with students
export async function getParentById(id: string) {
  return prisma.parent.findUnique({
    where: { id },
    include: {
      students: {
        orderBy: { name: 'asc' },
      },
    },
  })
}

// Get parent by email
export async function getParentByEmail(email: string) {
  return prisma.parent.findUnique({
    where: { email },
    include: {
      students: true,
    },
  })
}

// Create a new parent
export async function createParent(data: {
  name: string
  email: string
  phone?: string
  address?: string
}) {
  return prisma.parent.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
    },
    include: {
      students: true,
    },
  })
}

// Update parent
export async function updateParent(
  id: string,
  data: {
    name?: string
    email?: string
    phone?: string | null
    address?: string | null
    isActive?: boolean
  }
) {
  return prisma.parent.update({
    where: { id },
    data,
    include: {
      students: true,
    },
  })
}

// Bulk update parent status
export async function updateParentsStatus(ids: string[], isActive: boolean) {
  return prisma.parent.updateMany({
    where: { id: { in: ids } },
    data: { isActive },
  })
}

// Bulk update parents and their students status
export async function updateParentsAndStudentsStatus(parentIds: string[], isActive: boolean) {
  // Use a transaction to update both parents and students
  return prisma.$transaction([
    prisma.parent.updateMany({
      where: { id: { in: parentIds } },
      data: { isActive },
    }),
    prisma.student.updateMany({
      where: { parentId: { in: parentIds } },
      data: { isActive },
    }),
  ])
}

// Check if email exists (for validation)
export async function checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
  const parent = await prisma.parent.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!parent) return false
  if (excludeId && parent.id === excludeId) return false
  return true
}

// Get all parents (simple list for dropdowns)
export async function getAllParents() {
  return prisma.parent.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' },
  })
}

// Create parent with students in a single transaction
export async function createParentWithStudents(data: {
  parent: {
    name: string
    email: string
    phone?: string
  }
  students: {
    name: string
    schoolLevel: 'elementary' | 'high_school'
    barcode?: string
  }[]
}) {
  return prisma.$transaction(async (tx) => {
    // Create parent
    const parent = await tx.parent.create({
      data: {
        name: data.parent.name,
        email: data.parent.email,
        phone: data.parent.phone,
      },
    })

    // Create students if any
    if (data.students.length > 0) {
      for (const student of data.students) {
        // Generate barcode if not provided
        const barcode = student.barcode || await generateBarcode(tx)
        await tx.student.create({
          data: {
            parentId: parent.id,
            name: student.name,
            schoolLevel: student.schoolLevel,
            barcode,
          },
        })
      }
    }

    // Return parent with students
    return tx.parent.findUnique({
      where: { id: parent.id },
      include: { students: true },
    })
  })
}

// Generate a unique barcode
async function generateBarcode(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  let barcode: string
  let exists = true
  do {
    barcode = String(Math.floor(100000 + Math.random() * 900000))
    const existing = await tx.student.findUnique({ where: { barcode } })
    exists = !!existing
  } while (exists)
  return barcode
}

// Delete parent
export async function deleteParent(id: string) {
  // First check if parent has students
  const parent = await prisma.parent.findUnique({
    where: { id },
    include: { students: { select: { id: true } } },
  })

  if (parent?.students && parent.students.length > 0) {
    throw new Error('Cannot delete parent with students. Please reassign or delete their students first.')
  }

  await prisma.parent.delete({
    where: { id },
  })
}

// Get parents for CSV export
export async function getParentsForExport() {
  const parents = await prisma.parent.findMany({
    orderBy: { name: 'asc' },
  })

  return parents.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone || '',
    address: p.address || '',
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  }))
}
