import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const admin = await prisma.adminUser.findUnique({
          where: { email }
        })

        if (!admin || !admin.password) {
          return null
        }

        const passwordMatch = await bcrypt.compare(password, admin.password)

        if (!passwordMatch) {
          return null
        }

        return {
          id: admin.id,
          email: admin.email,
          role: admin.role as 'admin' | 'super_admin'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role as 'admin' | 'super_admin'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true // Required for Docker/proxy deployments
}

// Export the auth function for getting session
export const { auth, handlers } = NextAuth(authConfig)
