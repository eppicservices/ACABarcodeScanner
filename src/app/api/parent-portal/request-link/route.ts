import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSecureToken, getTokenExpiryDate, getPortalUrl } from '@/lib/parent-portal'

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_MINUTES = 5

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Rate limiting check
    const normalizedEmail = email.toLowerCase().trim()
    const lastRequest = rateLimitMap.get(normalizedEmail)
    const now = Date.now()

    if (lastRequest && (now - lastRequest) < RATE_LIMIT_MINUTES * 60 * 1000) {
      const waitMinutes = Math.ceil((RATE_LIMIT_MINUTES * 60 * 1000 - (now - lastRequest)) / 60000)
      return NextResponse.json({
        error: `Please wait ${waitMinutes} minute(s) before requesting another link`
      }, { status: 429 })
    }

    // Update rate limit
    rateLimitMap.set(normalizedEmail, now)

    const supabase = await createClient()

    // Find parent by email
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id, name, email, is_active')
      .eq('email', normalizedEmail)
      .single()

    // Always return success to prevent email enumeration
    // Even if parent not found or inactive, show the same message
    if (parentError || !parent) {
      console.log(`Parent not found for email: ${normalizedEmail}`)
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a link has been sent.'
      })
    }

    // If parent is inactive, don't generate token but return same message
    if (!parent.is_active) {
      console.log(`Inactive parent requested link: ${normalizedEmail}`)
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a link has been sent.'
      })
    }

    // Generate new token
    const token = generateSecureToken()
    const expiresAt = getTokenExpiryDate()

    // Delete any existing tokens for this parent
    await supabase
      .from('parent_access_tokens')
      .delete()
      .eq('parent_id', parent.id)

    // Insert new token
    const { error: tokenError } = await supabase
      .from('parent_access_tokens')
      .insert({
        parent_id: parent.id,
        token,
        expires_at: expiresAt
      })

    if (tokenError) {
      console.error('Error creating token:', tokenError)
      return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })
    }

    const portalUrl = getPortalUrl(token)

    // TODO: Send email with portal link
    // For now, just log it (in production, integrate with email service)
    console.log(`
      ===== PARENT PORTAL LINK =====
      Parent: ${parent.name} (${parent.email})
      Portal URL: ${portalUrl}
      Expires: ${expiresAt}
      ==============================
    `)

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a link has been sent.'
    })
  } catch (error) {
    console.error('Error requesting link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
