import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSecureToken, getTokenExpiryDate, getPortalUrl } from '@/lib/parent-portal'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { parent_id } = await request.json()

    if (!parent_id) {
      return NextResponse.json({ error: 'parent_id is required' }, { status: 400 })
    }

    // Verify parent exists
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id, name, email')
      .eq('id', parent_id)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Generate new token
    const token = generateSecureToken()
    const expiresAt = getTokenExpiryDate()

    // Delete any existing tokens for this parent (optional: keep for history)
    await supabase
      .from('parent_access_tokens')
      .delete()
      .eq('parent_id', parent_id)

    // Insert new token
    const { data: tokenData, error: tokenError } = await supabase
      .from('parent_access_tokens')
      .insert({
        parent_id,
        token,
        expires_at: expiresAt,
        created_by: user.id
      })
      .select()
      .single()

    if (tokenError) {
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
    }

    const portalUrl = getPortalUrl(token)

    return NextResponse.json({
      success: true,
      token,
      portalUrl,
      expiresAt,
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email
      }
    })
  } catch (error) {
    console.error('Error generating token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
