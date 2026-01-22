'use server'

import prisma from '@/lib/prisma'
import type { MealSource } from '@prisma/client'

export interface DailyMeal {
  id: string
  mealDate: Date
  mealName: string
  source: MealSource
  calendarEventId: string | null
  createdAt: Date
  updatedAt: Date
  updatedBy: string | null
}

// Get meal by date
export async function getMealByDate(date: Date): Promise<DailyMeal | null> {
  // Normalize to start of day in UTC
  const dateStr = date.toISOString().split('T')[0]

  return prisma.dailyMeal.findUnique({
    where: { mealDate: new Date(dateStr) },
  })
}

// Get meals by date range
export async function getMealsByDateRange(startDate: Date, endDate: Date): Promise<DailyMeal[]> {
  const start = new Date(startDate.toISOString().split('T')[0])
  const end = new Date(endDate.toISOString().split('T')[0])

  return prisma.dailyMeal.findMany({
    where: {
      mealDate: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { mealDate: 'asc' },
  })
}

// Create or update meal
export async function upsertMeal(data: {
  mealDate: Date
  mealName: string
  source?: MealSource
  calendarEventId?: string
  updatedBy?: string
}): Promise<DailyMeal> {
  const dateStr = data.mealDate.toISOString().split('T')[0]
  const mealDate = new Date(dateStr)

  return prisma.dailyMeal.upsert({
    where: { mealDate },
    update: {
      mealName: data.mealName,
      source: data.source || 'manual',
      calendarEventId: data.calendarEventId,
      updatedBy: data.updatedBy,
    },
    create: {
      mealDate,
      mealName: data.mealName,
      source: data.source || 'manual',
      calendarEventId: data.calendarEventId,
      updatedBy: data.updatedBy,
    },
  })
}

// Delete meal
export async function deleteMeal(id: string): Promise<void> {
  await prisma.dailyMeal.delete({
    where: { id },
  })
}

// Get today's meal
export async function getTodaysMeal(): Promise<DailyMeal | null> {
  const today = new Date()
  return getMealByDate(today)
}

// Get current week's meals
export async function getCurrentWeekMeals(): Promise<DailyMeal[]> {
  const today = new Date()
  const dayOfWeek = today.getDay()

  // Get Monday of current week
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

  // Get Friday of current week
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  return getMealsByDateRange(monday, friday)
}

// Bulk import meals from calendar sync
export async function bulkUpsertMeals(
  meals: Array<{
    mealDate: Date
    mealName: string
    calendarEventId?: string
  }>,
  updatedBy?: string
): Promise<number> {
  let count = 0

  for (const meal of meals) {
    await upsertMeal({
      mealDate: meal.mealDate,
      mealName: meal.mealName,
      source: 'calendar',
      calendarEventId: meal.calendarEventId,
      updatedBy,
    })
    count++
  }

  return count
}

// Get meal stats for a date range
export async function getMealStats(startDate: Date, endDate: Date) {
  const meals = await getMealsByDateRange(startDate, endDate)

  const manualCount = meals.filter((m) => m.source === 'manual').length
  const calendarCount = meals.filter((m) => m.source === 'calendar').length

  return {
    totalMeals: meals.length,
    manualCount,
    calendarCount,
    meals,
  }
}

// Get all meals ordered by date descending
export async function getAllMeals(): Promise<DailyMeal[]> {
  return prisma.dailyMeal.findMany({
    orderBy: { mealDate: 'desc' },
  })
}

// Get daily scan statistics
export interface DailyScanStats {
  date: string
  mealName: string | null
  totalScans: number
  elementaryScans: number
  highschoolScans: number
}

export async function getDailyScanStats(): Promise<DailyScanStats[]> {
  // Get all lunch_used transactions with student school level
  const transactions = await prisma.balanceTransaction.findMany({
    where: { transactionType: 'lunch_used' },
    select: {
      createdAt: true,
      student: {
        select: { schoolLevel: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get all meals for lookup
  const meals = await prisma.dailyMeal.findMany()
  const mealsMap = new Map(
    meals.map((m) => [m.mealDate.toISOString().split('T')[0], m.mealName])
  )

  // Aggregate by date
  const statsMap = new Map<string, DailyScanStats>()

  for (const tx of transactions) {
    const date = tx.createdAt.toISOString().split('T')[0]
    const schoolLevel = tx.student.schoolLevel

    if (!statsMap.has(date)) {
      statsMap.set(date, {
        date,
        mealName: mealsMap.get(date) || null,
        totalScans: 0,
        elementaryScans: 0,
        highschoolScans: 0,
      })
    }

    const stats = statsMap.get(date)!
    stats.totalScans++
    if (schoolLevel === 'elementary') {
      stats.elementaryScans++
    } else if (schoolLevel === 'high_school') {
      stats.highschoolScans++
    }
  }

  // Sort by date descending
  return Array.from(statsMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}
