import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface CalendarEvent {
  uid: string
  summary: string
  dateStart: string
}

function parseICalDate(dateStr: string): string | null {
  const cleanDate = dateStr.replace(/[:\-]/g, '')

  if (cleanDate.length >= 8) {
    const year = cleanDate.substring(0, 4)
    const month = cleanDate.substring(4, 6)
    const day = cleanDate.substring(6, 8)

    const numYear = parseInt(year)
    const numMonth = parseInt(month)
    const numDay = parseInt(day)

    if (numYear >= 2000 && numYear <= 2100 &&
        numMonth >= 1 && numMonth <= 12 &&
        numDay >= 1 && numDay <= 31) {
      return `${year}-${month}-${day}`
    }
  }

  return null
}

function parseICalFeed(icalData: string): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const lines = icalData.split(/\r?\n/)

  let currentEvent: Partial<CalendarEvent> | null = null

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++
      line += lines[i].substring(1)
    }

    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {}
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent && currentEvent.uid && currentEvent.summary && currentEvent.dateStart) {
        events.push(currentEvent as CalendarEvent)
      }
      currentEvent = null
    } else if (currentEvent) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const fullKey = line.substring(0, colonIndex)
        const value = line.substring(colonIndex + 1)
        const key = fullKey.split(';')[0]

        switch (key) {
          case 'UID':
            currentEvent.uid = value
            break
          case 'SUMMARY':
            currentEvent.summary = value
            break
          case 'DTSTART':
            const parsedDate = parseICalDate(value)
            if (parsedDate) {
              currentEvent.dateStart = parsedDate
            }
            break
        }
      }
    }
  }

  return events
}

// Cron-compatible endpoint for scheduled calendar sync
// Can be called by Vercel Cron, external cron services, etc.
// Requires CRON_SECRET environment variable for authentication
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role key for cron jobs (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get calendar settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('calendar_url, calendar_enabled')
      .eq('id', 1)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
    }

    if (!settings.calendar_enabled || !settings.calendar_url) {
      return NextResponse.json({
        success: true,
        message: 'Calendar sync is disabled or no URL configured',
        imported: 0
      })
    }

    // Fetch the iCal feed
    let icalData: string
    try {
      const response = await fetch(settings.calendar_url, {
        headers: {
          'Accept': 'text/calendar',
          'User-Agent': 'ACABarcodeScanner/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar: ${response.status}`)
      }

      icalData = await response.text()
    } catch (fetchError) {
      console.error('Cron: Error fetching calendar:', fetchError)
      return NextResponse.json({
        error: 'Could not fetch calendar'
      }, { status: 400 })
    }

    if (!icalData.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json({
        error: 'Invalid calendar format'
      }, { status: 400 })
    }

    const events = parseICalFeed(icalData)

    // Filter to recent events
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const relevantEvents = events.filter(e => e.dateStart >= thirtyDaysAgoStr)

    let imported = 0

    for (const event of relevantEvents) {
      const { data: existing } = await supabase
        .from('daily_meals')
        .select('id, source')
        .eq('meal_date', event.dateStart)
        .single()

      if (existing) {
        if (existing.source === 'calendar') {
          await supabase
            .from('daily_meals')
            .update({
              meal_name: event.summary,
              calendar_event_id: event.uid
            })
            .eq('id', existing.id)
          imported++
        }
      } else {
        await supabase
          .from('daily_meals')
          .insert({
            meal_date: event.dateStart,
            meal_name: event.summary,
            source: 'calendar',
            calendar_event_id: event.uid
          })
        imported++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total_events: events.length,
      synced_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron: Error syncing calendar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
