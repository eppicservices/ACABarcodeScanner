import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function updateSessionNextAuth(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'
  const isSignupPage = request.nextUrl.pathname === '/admin/signup'
  const isNextAuthRoute = request.nextUrl.pathname.startsWith('/api/auth')

  // Allow NextAuth API routes
  if (isNextAuthRoute) {
    return NextResponse.next()
  }

  if (isAdminRoute) {
    // Allow login and signup pages without auth
    if (isLoginPage || isSignupPage) {
      // If already logged in, redirect to dashboard
      if (token) {
        return NextResponse.redirect(new URL('/admin/students', request.url))
      }
      return NextResponse.next()
    }

    // Protected admin routes - require auth
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}
