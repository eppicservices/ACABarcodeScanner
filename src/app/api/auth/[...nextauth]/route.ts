import { handlers } from '@/lib/auth/nextauth-config'

// NextAuth handlers for Prisma-based authentication
// AUTH_PROVIDER env var is no longer needed (defaults to nextauth)
export const GET = handlers.GET
export const POST = handlers.POST
