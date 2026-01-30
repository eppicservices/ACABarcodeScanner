'use server'

import prisma from '@/lib/prisma'
import type { SchoolLevel, StudentType } from '@prisma/client'

export interface ReportFilters {
  startDate: Date
  endDate: Date
  studentType?: 'all' | 'regular' | 'staff_faculty' | 'student_unlimited'
  schoolLevel?: 'all' | 'elementary' | 'high_school'
}

export interface MealUsageReport {
  studentId: string
  studentName: string
  studentType: StudentType
  schoolLevel: SchoolLevel
  parentName: string
  mealsCount: number
}

export interface ReportStats {
  totalMeals: number
  regularMeals: number
  staffFacultyMeals: number
  unlimitedMeals: number
  elementaryMeals: number
  highSchoolMeals: number
}

// Get meal usage aggregated by student for date range
export async function getMealUsageReport(filters: ReportFilters): Promise<MealUsageReport[]> {
  // Build the student filter conditions
  const studentWhere: Record<string, unknown> = {}
  if (filters.studentType && filters.studentType !== 'all') {
    studentWhere.studentType = filters.studentType
  }
  if (filters.schoolLevel && filters.schoolLevel !== 'all') {
    studentWhere.schoolLevel = filters.schoolLevel
  }

  // Get all lunch_used transactions in the date range
  const transactions = await prisma.balanceTransaction.findMany({
    where: {
      transactionType: 'lunch_used',
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
      student: studentWhere,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          studentType: true,
          schoolLevel: true,
          parent: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  // Aggregate by student
  const studentMeals: Record<string, MealUsageReport> = {}

  for (const tx of transactions) {
    const studentId = tx.student.id
    if (!studentMeals[studentId]) {
      studentMeals[studentId] = {
        studentId,
        studentName: tx.student.name,
        studentType: tx.student.studentType,
        schoolLevel: tx.student.schoolLevel,
        parentName: tx.student.parent.name,
        mealsCount: 0,
      }
    }
    // Count each lunch_used transaction as 1 meal (regardless of lunchesChange which could be 0 for unlimited)
    studentMeals[studentId].mealsCount += 1
  }

  // Convert to array and sort by meals count descending
  return Object.values(studentMeals).sort((a, b) => b.mealsCount - a.mealsCount)
}

// Get summary statistics for the report header
export async function getReportStats(filters: ReportFilters): Promise<ReportStats> {
  // Get all lunch_used transactions in the date range with student info
  const transactions = await prisma.balanceTransaction.findMany({
    where: {
      transactionType: 'lunch_used',
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    },
    include: {
      student: {
        select: {
          studentType: true,
          schoolLevel: true,
        },
      },
    },
  })

  let regularMeals = 0
  let staffFacultyMeals = 0
  let unlimitedMeals = 0
  let elementaryMeals = 0
  let highSchoolMeals = 0

  for (const tx of transactions) {
    // Count by type
    if (tx.student.studentType === 'regular') {
      regularMeals++
    } else if (tx.student.studentType === 'staff_faculty') {
      staffFacultyMeals++
    } else if (tx.student.studentType === 'student_unlimited') {
      unlimitedMeals++
    }

    // Count by level
    if (tx.student.schoolLevel === 'elementary') {
      elementaryMeals++
    } else {
      highSchoolMeals++
    }
  }

  return {
    totalMeals: transactions.length,
    regularMeals,
    staffFacultyMeals,
    unlimitedMeals,
    elementaryMeals,
    highSchoolMeals,
  }
}

// Get report data formatted for CSV export
export async function getMealUsageForExport(filters: ReportFilters): Promise<{
  studentName: string
  studentType: string
  schoolLevel: string
  parentName: string
  mealsCount: number
}[]> {
  const data = await getMealUsageReport(filters)

  return data.map(row => ({
    studentName: row.studentName,
    studentType: row.studentType === 'regular' ? 'Regular' :
                 row.studentType === 'staff_faculty' ? 'Staff/Faculty' : 'Unlimited',
    schoolLevel: row.schoolLevel === 'elementary' ? 'Elementary' : 'High School',
    parentName: row.parentName,
    mealsCount: row.mealsCount,
  }))
}
