'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logAudit } from '@/lib/audit'
import type { AdminRole } from '@prisma/client'
import { randomBytes } from 'crypto'

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
  invitedBy: string | null
  createdAt: Date
}

export interface AdminInvitation {
  id: string
  email: string
  invitedBy: string
  token: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
}

// ================== Admin Users ==================

// Get admin by email
export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      invitedBy: true,
      createdAt: true,
    },
  })

  return admin
}

// Get admin by ID
export async function getAdminById(id: string): Promise<AdminUser | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      invitedBy: true,
      createdAt: true,
    },
  })

  return admin
}

// Get all admins
export async function getAllAdmins(): Promise<AdminUser[]> {
  return prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      invitedBy: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
}

// Get admin count
export async function getAdminCount(): Promise<number> {
  return prisma.adminUser.count()
}

// Create admin (with password for Docker/NextAuth)
export async function createAdmin(data: {
  email: string
  password: string
  role?: AdminRole
  invitedBy?: string
}): Promise<AdminUser> {
  const hashedPassword = await bcrypt.hash(data.password, 12)

  const admin = await prisma.adminUser.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: data.role || 'admin',
      invitedBy: data.invitedBy,
    },
    select: {
      id: true,
      email: true,
      role: true,
      invitedBy: true,
      createdAt: true,
    },
  })

  return admin
}

// Update admin role
export async function updateAdminRole(id: string, role: AdminRole): Promise<AdminUser> {
  return prisma.adminUser.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      role: true,
      invitedBy: true,
      createdAt: true,
    },
  })
}

// Update admin password
export async function updateAdminPassword(id: string, newPassword: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.adminUser.update({
    where: { id },
    data: { password: hashedPassword },
  })
}

// Delete admin
export async function deleteAdmin(id: string): Promise<void> {
  await prisma.adminUser.delete({
    where: { id },
  })
}

// Verify admin password
export async function verifyAdminPassword(email: string, password: string): Promise<boolean> {
  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: { password: true },
  })

  if (!admin || !admin.password) return false

  return bcrypt.compare(password, admin.password)
}

// Check if email is already an admin
export async function isEmailAdmin(email: string): Promise<boolean> {
  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true },
  })

  return !!admin
}

// ================== Admin Invitations ==================

// Create invitation
export async function createInvitation(data: {
  email: string
  invitedBy: string
  expiresInDays?: number
}): Promise<AdminInvitation> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7))

  const invitation = await prisma.adminInvitation.create({
    data: {
      email: data.email,
      invitedBy: data.invitedBy,
      token,
      expiresAt,
    },
  })

  logAudit({
    action: 'admin.invite',
    actor: data.invitedBy,
    targetId: invitation.id,
    details: { email: data.email },
  })

  return invitation
}

// Get invitation by token
export async function getInvitationByToken(token: string): Promise<AdminInvitation | null> {
  return prisma.adminInvitation.findUnique({
    where: { token },
  })
}

// Validate invitation token
export async function validateInvitationToken(token: string): Promise<{
  valid: boolean
  email?: string
  error?: string
}> {
  const invitation = await getInvitationByToken(token)

  if (!invitation) {
    return { valid: false, error: 'Invalid invitation token' }
  }

  if (invitation.usedAt) {
    return { valid: false, error: 'Invitation has already been used' }
  }

  if (new Date() > invitation.expiresAt) {
    return { valid: false, error: 'Invitation has expired' }
  }

  return { valid: true, email: invitation.email }
}

// Accept invitation and create admin
export async function acceptInvitation(data: {
  token: string
  password: string
}): Promise<{
  success: boolean
  admin?: AdminUser
  error?: string
}> {
  const validation = await validateInvitationToken(data.token)

  if (!validation.valid || !validation.email) {
    return { success: false, error: validation.error }
  }

  // Check if email is already an admin
  const existingAdmin = await isEmailAdmin(validation.email)
  if (existingAdmin) {
    return { success: false, error: 'An admin with this email already exists' }
  }

  // Get the invitation to get the inviter
  const invitation = await getInvitationByToken(data.token)
  if (!invitation) {
    return { success: false, error: 'Invitation not found' }
  }

  // Create admin and mark invitation as used in a transaction
  const [admin] = await prisma.$transaction([
    prisma.adminUser.create({
      data: {
        email: validation.email,
        password: await bcrypt.hash(data.password, 12),
        role: 'admin',
        invitedBy: invitation.invitedBy,
      },
      select: {
        id: true,
        email: true,
        role: true,
        invitedBy: true,
        createdAt: true,
      },
    }),
    prisma.adminInvitation.update({
      where: { token: data.token },
      data: { usedAt: new Date() },
    }),
  ])

  return { success: true, admin }
}

// Get pending invitations
export async function getPendingInvitations(): Promise<AdminInvitation[]> {
  return prisma.adminInvitation.findMany({
    where: {
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// Delete invitation
export async function deleteInvitation(id: string): Promise<void> {
  await prisma.adminInvitation.delete({
    where: { id },
  })
}

// ================== Parent Access Tokens ==================

// Create parent access token
export async function createParentAccessToken(data: {
  parentId: string
  expiresInDays?: number
  createdBy?: string
}): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7))

  // Delete existing tokens for this parent
  await prisma.parentAccessToken.deleteMany({
    where: { parentId: data.parentId },
  })

  await prisma.parentAccessToken.create({
    data: {
      parentId: data.parentId,
      token,
      expiresAt,
      createdBy: data.createdBy,
    },
  })

  return { token, expiresAt }
}

// Validate parent access token
export async function validateParentAccessToken(token: string): Promise<{
  valid: boolean
  parentId?: string
  error?: string
}> {
  const accessToken = await prisma.parentAccessToken.findUnique({
    where: { token },
  })

  if (!accessToken) {
    return { valid: false, error: 'Invalid token' }
  }

  if (new Date() > accessToken.expiresAt) {
    return { valid: false, error: 'Token has expired' }
  }

  // Update last used timestamp
  await prisma.parentAccessToken.update({
    where: { id: accessToken.id },
    data: { lastUsedAt: new Date() },
  })

  return { valid: true, parentId: accessToken.parentId }
}
