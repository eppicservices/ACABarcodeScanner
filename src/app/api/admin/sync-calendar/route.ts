import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/nextauth-config'
import prisma from '@/lib/prisma'

interface CalendarEvent {
  uid: string
  summary: string
  dateStart: string
}

function parseICalDate(dateStr: string): string | null {
  // Handle formats like: 20250115, 20250115T120000, 20250115T120000Z
  const cleanDate = dateStr.replace(/[:\-]/g, '')

  let year: string, month: string, day: string

  if (cleanDate.length >= 8) {
    year = cleanDate.substring(0, 4)
    month = cleanDate.substring(4, 6)
    day = cleanDate.substring(6, 8)

    // Validate
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

    // Handle line folding (lines starting with space/tab are continuations)
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
      // Parse property
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const fullKey = line.substring(0, colonIndex)
        const value = line.substring(colonIndex + 1)

        // Handle keys with parameters (e.g., DTSTART;VALUE=DATE:20250115)
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

export async function POST(request: NextRequest) {
  try {
    // Verify admin is authenticated using NextAuth
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an admin
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    })

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { calendar_url } = await request.json()

    if (!calendar_url) {
      return NextResponse.json({ error: 'Calendar URL is required' }, { status: 400 })
    }

    // Fetch the iCal feed
    let icalData: string
    try {
      const response = await fetch(calendar_url, {
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
      console.error('Error fetching calendar:', fetchError)
      return NextResponse.json({
        error: 'Could not fetch calendar. Please check the URL and ensure it is publicly accessible.'
      }, { status: 400 })
    }

    // Verify it's an iCal file
    if (!icalData.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json({
        error: 'Invalid calendar format. Please use an iCal/ICS URL.'
      }, { status: 400 })
    }

    // Parse the iCal feed
    const events = parseICalFeed(icalData)

    if (events.length === 0) {
      return NextResponse.json({
        error: 'No events found in calendar'
      }, { status: 400 })
    }

    // Filter to only future and recent past events (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const relevantEvents = events.filter(e => e.dateStart >= thirtyDaysAgoStr)

    // Import events as daily meals
    let imported = 0

    for (const event of relevantEvents) {
      // Check if meal already exists for this date
      const existing = await prisma.dailyMeal.findUnique({
        where: { mealDate: new Date(event.dateStart) },
        select: { id: true, source: true },
      })

      if (existing) {
        // Only update if source was 'calendar' (don't overwrite manual entries)
        if (existing.source === 'calendar') {
          await prisma.dailyMeal.update({
            where: { id: existing.id },
            data: {
              mealName: event.summary,
              calendarEventId: event.uid,
            },
          })
          imported++
        }
      } else {
        // Insert new meal
        await prisma.dailyMeal.create({
          data: {
            mealDate: new Date(event.dateStart),
            mealName: event.summary,
            source: 'calendar',
            calendarEventId: event.uid,
          },
        })
        imported++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total_events: events.length
    })
  } catch (error) {
    console.error('Error syncing calendar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
