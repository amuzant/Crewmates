import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sprintId = parseInt(await Promise.resolve(params.id))

    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId }
    })

    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      isComplete: sprint.isCompleted ?? false,
      lastUpdated: sprint.lastUpdated ?? null
    })
  } catch (error) {
    console.error('Failed to fetch ranking status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ranking status' },
      { status: 500 }
    )
  }
} 