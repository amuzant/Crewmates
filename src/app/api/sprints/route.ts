import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const sprints = await prisma.sprint.findMany({
      orderBy: {
        startDate: 'desc'
      }
    })
    return NextResponse.json(sprints)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sprints' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('userId')
    
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!user || user.role.name !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, startDate, endDate, hasPrize, prizeId } = await request.json()

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Convert strings to Date objects for comparison
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Check if end date is after start date
    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Check if dates are in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (start < today) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      )
    }

    // Check for overlapping sprints
    const overlappingSprint = await prisma.sprint.findFirst({
      where: {
        OR: [
          {
            // New sprint starts during an existing sprint
            AND: {
              startDate: { lte: end },
              endDate: { gte: start }
            }
          },
          {
            // New sprint ends during an existing sprint
            AND: {
              startDate: { lte: end },
              endDate: { gte: start }
            }
          }
        ]
      }
    })

    if (overlappingSprint) {
      return NextResponse.json(
        { error: 'Sprint dates overlap with an existing sprint' },
        { status: 400 }
      )
    }

    const sprint = await prisma.sprint.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        hasPrize,
        ...(hasPrize && prizeId ? { prizeId: parseInt(prizeId) } : {})
      }
    })

    return NextResponse.json(sprint)
  } catch (error) {
    console.error('Failed to create sprint:', error)
    return NextResponse.json(
      { error: 'Failed to create sprint' },
      { status: 500 }
    )
  }
} 