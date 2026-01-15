import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List all blackout periods
export async function GET() {
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
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all blackout periods
    const { data: periods, error } = await supabase
      .from('email_blackout_periods')
      .select('*')
      .order('start_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ periods })
  } catch (error) {
    console.error('Error fetching blackout periods:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new blackout period
export async function POST(request: NextRequest) {
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
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, start_date, end_date, description } = await request.json()

    // Validate required fields
    if (!name || !start_date || !end_date) {
      return NextResponse.json({ error: 'name, start_date, and end_date are required' }, { status: 400 })
    }

    // Validate dates
    const start = new Date(start_date)
    const end = new Date(end_date)
    if (end < start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Create blackout period
    const { data: period, error } = await supabase
      .from('email_blackout_periods')
      .insert({
        name,
        start_date,
        end_date,
        description: description || null,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, period })
  } catch (error) {
    console.error('Error creating blackout period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a blackout period
export async function DELETE(request: NextRequest) {
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
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('email_blackout_periods')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blackout period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update a blackout period
export async function PATCH(request: NextRequest) {
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
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, start_date, end_date, description } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (start_date !== undefined) updates.start_date = start_date
    if (end_date !== undefined) updates.end_date = end_date
    if (description !== undefined) updates.description = description

    // Validate dates if both are provided
    if (start_date && end_date) {
      const start = new Date(start_date)
      const end = new Date(end_date)
      if (end < start) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
      }
    }

    const { data: period, error } = await supabase
      .from('email_blackout_periods')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, period })
  } catch (error) {
    console.error('Error updating blackout period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
