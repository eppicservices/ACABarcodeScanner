import { handlers } from '@/lib/auth/nextauth-config'

// Only export handlers if using NextAuth (Docker mode)
const authProvider = process.env.AUTH_PROVIDER || 'supabase'

const disabledHandler = () => new Response('NextAuth is not enabled', { status: 404 })

export const GET = authProvider === 'nextauth' ? handlers.GET : disabledHandler
export const POST = authProvider === 'nextauth' ? handlers.POST : disabledHandler
