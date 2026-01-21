import { type NextRequest } from 'next/server'
import { updateSession as updateSupabaseSession } from '@/lib/supabase/middleware'
import { updateSessionNextAuth } from '@/lib/auth/nextauth-middleware'

const authProvider = process.env.AUTH_PROVIDER || 'supabase'

export async function middleware(request: NextRequest) {
  if (authProvider === 'nextauth') {
    return await updateSessionNextAuth(request)
  }
  return await updateSupabaseSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
