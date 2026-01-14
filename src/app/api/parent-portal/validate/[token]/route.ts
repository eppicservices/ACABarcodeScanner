import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isTokenExpired } from '@/lib/parent-portal'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createClient()

    // Look up the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('parent_access_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired link'
      }, { status: 404 })
    }

    // Check if expired
    if (isTokenExpired(tokenData.expires_at)) {
      return NextResponse.json({
        valid: false,
        error: 'This link has expired. Please request a new one.'
      }, { status: 410 })
    }

    // Get parent with students
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('*, students(*)')
      .eq('id', tokenData.parent_id)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({
        valid: false,
        error: 'Parent account not found'
      }, { status: 404 })
    }

    // Check if parent is active
    if (!parent.is_active) {
      return NextResponse.json({
        valid: false,
        error: 'This account has been deactivated. Please contact the school office.'
      }, { status: 403 })
    }

    // Filter to only include active students
    parent.students = parent.students.filter((s: { is_active: boolean }) => s.is_active)

    // Get settings for pricing
    const { data: settings } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()

    // Update last_used_at
    await supabase
      .from('parent_access_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    return NextResponse.json({
      valid: true,
      parent,
      expiresAt: tokenData.expires_at,
      settings
    })
  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json({
      valid: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
