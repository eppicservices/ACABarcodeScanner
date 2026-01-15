import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Verify admin is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super_admin can reload schema cache
    if (adminUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can reload the schema cache' }, { status: 403 })
    }

    // Send NOTIFY to PostgREST to reload the schema cache
    // This requires the pgrst channel to be available
    const { error: notifyError } = await supabase.rpc('reload_schema_cache')

    if (notifyError) {
      // If the RPC function doesn't exist, provide helpful instructions
      if (notifyError.message.includes('does not exist') || notifyError.code === '42883') {
        return NextResponse.json({
          error: 'Schema cache reload function not available. Please reload the schema cache manually from the Supabase dashboard: Settings > API > Reload Schema Cache',
          manual_required: true
        }, { status: 503 })
      }
      throw notifyError
    }

    return NextResponse.json({
      success: true,
      message: 'Schema cache reload triggered. Changes should be visible within a few seconds.'
    })
  } catch (error) {
    console.error('Error reloading schema cache:', error)
    return NextResponse.json({
      error: 'Failed to reload schema cache. Please try manually from the Supabase dashboard: Settings > API > Reload Schema Cache',
      manual_required: true
    }, { status: 500 })
  }
}
