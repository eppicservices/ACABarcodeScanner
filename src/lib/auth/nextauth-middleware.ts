import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function updateSessionNextAuth(request: NextRequest) {
  // Auth.js v5 prefixes the session cookie with __Secure- whenever the
  // deployment URL is https. getToken() defaults to the unprefixed name and
  // uses that name as the JWT salt, so on an https deployment it looks for a
  // cookie that does not exist and every admin route bounces to login.
  const secureCookie =
    process.env.NEXTAUTH_URL?.startsWith('https://') ??
    process.env.NODE_ENV === 'production'

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie
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
