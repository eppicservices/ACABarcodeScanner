'use server'

import prisma from '@/lib/prisma'

export interface NotificationLog {
  id: string
  studentId: string
  parentId: string
  notificationType: string
  balanceAtNotification: number
  sentAt: Date
}

export interface EmailBlackoutPeriod {
  id: string
  name: string
  startDate: Date
  endDate: Date
  description: string | null
  createdAt: Date
  createdBy: string | null
}

// ================== Notification Log ==================

// Create notification log entry
export async function createNotificationLog(data: {
  studentId: string
  parentId: string
  notificationType: string
  balanceAtNotification: number
}): Promise<NotificationLog> {
  return prisma.notificationLog.create({
    data: {
      studentId: data.studentId,
      parentId: data.parentId,
      notificationType: data.notificationType,
      balanceAtNotification: data.balanceAtNotification,
    },
  })
}

// Get last notification for a parent of a specific type
export async function getLastNotificationForParent(
  parentId: string,
  notificationType: string
): Promise<NotificationLog | null> {
  return prisma.notificationLog.findFirst({
    where: {
      parentId,
      notificationType,
    },
    orderBy: { sentAt: 'desc' },
  })
}

// Get notification history for a student
export async function getStudentNotifications(studentId: string, limit = 20): Promise<NotificationLog[]> {
  return prisma.notificationLog.findMany({
    where: { studentId },
    orderBy: { sentAt: 'desc' },
    take: limit,
  })
}

// Get notification history for a parent
export async function getParentNotifications(parentId: string, limit = 20): Promise<NotificationLog[]> {
  return prisma.notificationLog.findMany({
    where: { parentId },
    orderBy: { sentAt: 'desc' },
    take: limit,
  })
}

// Check if notification was sent recently (based on settings)
export async function canSendNotification(
  parentId: string,
  notificationType: string,
  minDaysBetween: number
): Promise<boolean> {
  const lastNotification = await getLastNotificationForParent(parentId, notificationType)

  if (!lastNotification) return true

  const daysSinceLastNotification = Math.floor(
    (Date.now() - lastNotification.sentAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  return daysSinceLastNotification >= minDaysBetween
}

// ================== Blackout Periods ==================

// Get all blackout periods
export async function getBlackoutPeriods(): Promise<EmailBlackoutPeriod[]> {
  return prisma.emailBlackoutPeriod.findMany({
    orderBy: { startDate: 'asc' },
  })
}

// Get active blackout period for a date
export async function getActiveBlackoutPeriod(date: Date): Promise<EmailBlackoutPeriod | null> {
  const dateOnly = new Date(date.toISOString().split('T')[0])

  return prisma.emailBlackoutPeriod.findFirst({
    where: {
      startDate: { lte: dateOnly },
      endDate: { gte: dateOnly },
    },
  })
}

// Check if date is in a blackout period
export async function isInBlackoutPeriod(date: Date): Promise<boolean> {
  const blackout = await getActiveBlackoutPeriod(date)
  return !!blackout
}

// Create blackout period
export async function createBlackoutPeriod(data: {
  name: string
  startDate: Date
  endDate: Date
  description?: string
  createdBy?: string
}): Promise<EmailBlackoutPeriod> {
  return prisma.emailBlackoutPeriod.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate.toISOString().split('T')[0]),
      endDate: new Date(data.endDate.toISOString().split('T')[0]),
      description: data.description,
      createdBy: data.createdBy,
    },
  })
}

// Update blackout period
export async function updateBlackoutPeriod(
  id: string,
  data: {
    name?: string
    startDate?: Date
    endDate?: Date
    description?: string | null
  }
): Promise<EmailBlackoutPeriod> {
  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.startDate) updateData.startDate = new Date(data.startDate.toISOString().split('T')[0])
  if (data.endDate) updateData.endDate = new Date(data.endDate.toISOString().split('T')[0])

  return prisma.emailBlackoutPeriod.update({
    where: { id },
    data: updateData,
  })
}

// Delete blackout period
export async function deleteBlackoutPeriod(id: string): Promise<void> {
  await prisma.emailBlackoutPeriod.delete({
    where: { id },
  })
}

// ================== Helpers ==================

// Check if emails can be sent right now (considering all factors)
export async function canSendEmailsNow(): Promise<{
  canSend: boolean
  reason?: string
}> {
  // Check if in blackout period
  const today = new Date()
  const blackout = await getActiveBlackoutPeriod(today)

  if (blackout) {
    return {
      canSend: false,
      reason: `In blackout period: ${blackout.name} (${blackout.startDate.toLocaleDateString()} - ${blackout.endDate.toLocaleDateString()})`,
    }
  }

  // Get notification settings
  const settings = await prisma.appSettings.findUnique({
    where: { id: 1 },
    select: {
      notificationsEnabled: true,
      emailAllowedDays: true,
      emailWindowStart: true,
      emailWindowEnd: true,
      emailTimezone: true,
    },
  })

  if (!settings) {
    return { canSend: false, reason: 'Settings not found' }
  }

  if (!settings.notificationsEnabled) {
    return { canSend: false, reason: 'Notifications are disabled' }
  }

  // Check if today is an allowed day
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayName = dayNames[today.getDay()]

  if (!settings.emailAllowedDays.includes(todayName as never)) {
    return { canSend: false, reason: `Emails not allowed on ${todayName}` }
  }

  // Check if current time is within email window
  // Note: This is a simplified check; real implementation should use timezone
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  if (currentTime < settings.emailWindowStart || currentTime > settings.emailWindowEnd) {
    return {
      canSend: false,
      reason: `Outside email window (${settings.emailWindowStart} - ${settings.emailWindowEnd})`,
    }
  }

  return { canSend: true }
}
