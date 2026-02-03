import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/nextauth-config'
import prisma from '@/lib/prisma'
import type { AdminRole } from '@prisma/client'

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
}

export interface RequireAdminResult {
  authorized: true
  user: AdminUser
} | {
  authorized: false
  response: NextResponse
}

/**
 * Verify the current session belongs to an admin user.
 * Returns the admin user if authorized, or an error response if not.
 *
 * Usage in API routes:
 * ```ts
 * const adminResult = await requireAdmin()
 * if (!adminResult.authorized) {
 *   return adminResult.response
 * }
 * const { user } = adminResult
 * ```
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      )
    }
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  })

  if (!adminUser) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      )
    }
  }

  // Explicitly verify the user has an admin role
  if (adminUser.role !== 'admin' && adminUser.role !== 'super_admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }
  }

  return {
    authorized: true,
    user: adminUser
  }
}

/**
 * Verify the current session belongs to a super admin.
 * Use this for sensitive operations like user management.
 */
export async function requireSuperAdmin(): Promise<RequireAdminResult> {
  const result = await requireAdmin()

  if (!result.authorized) {
    return result
  }

  if (result.user.role !== 'super_admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }
  }

  return result
}
