import { auth as getNextAuthSession } from './nextauth-config'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import type { AuthAdapter, AuthSession, AuthUser, SignInResult, SignUpResult } from './types'

export const nextAuthAdapter: AuthAdapter = {
  async getSession(): Promise<AuthSession | null> {
    const session = await getNextAuthSession()

    if (!session?.user?.email) return null

    const admin = await prisma.adminUser.findUnique({
      where: { email: session.user.email }
    })

    if (!admin) return null

    return {
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role as 'admin' | 'super_admin'
      }
    }
  },

  async signIn(email: string, password: string): Promise<SignInResult> {
    // Note: For NextAuth, actual sign-in is handled by the credentials provider
    // This method is for programmatic verification (e.g., API routes)
    const admin = await prisma.adminUser.findUnique({
      where: { email }
    })

    if (!admin || !admin.password) {
      return { success: false, error: 'Invalid credentials' }
    }

    const passwordMatch = await bcrypt.compare(password, admin.password)

    if (!passwordMatch) {
      return { success: false, error: 'Invalid credentials' }
    }

    return {
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role as 'admin' | 'super_admin'
      }
    }
  },

  async signOut(): Promise<void> {
    // Note: For NextAuth, sign-out is handled by the signOut() function
    // from next-auth/react on the client side
    // This is a no-op on the server side
  },

  async createUser(email: string, password: string, role: 'admin' | 'super_admin' = 'admin'): Promise<SignUpResult> {
    // Check if user already exists
    const existing = await prisma.adminUser.findUnique({
      where: { email }
    })

    if (existing) {
      return { success: false, error: 'User already exists' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create admin user
    const admin = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        role
      }
    })

    return {
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role as 'admin' | 'super_admin'
      }
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await this.getSession()
    return session?.user ?? null
  },

  async getAdminCount(): Promise<number> {
    return prisma.adminUser.count()
  }
}
