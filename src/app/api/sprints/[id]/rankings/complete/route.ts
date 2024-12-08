import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sprintId = parseInt(await Promise.resolve(params.id))
    console.log('[Complete] Starting completion for sprint:', sprintId)

    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('userId')
    console.log('[Complete] User cookie:', userIdCookie)
    
    if (!userIdCookie) {
      console.log('[Complete] No user cookie found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)
    console.log('[Complete] User ID:', userId)

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })
    console.log('[Complete] Found user:', user)

    if (!user || user.role.name !== 'ADMIN') {
      console.log('[Complete] User not authorized:', user?.role.name)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // First check if sprint exists
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: {
        id: true,
        name: true,
        isCompleted: true
      }
    })
    console.log('[Complete] Found sprint:', sprint)

    if (!sprint) {
      console.log('[Complete] Sprint not found')
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
    }

    // Update the sprint status
    const now = new Date()
    console.log('[Complete] Updating sprint with date:', now)

    const result = await prisma.$transaction(async (tx) => {
      // Update sprint status
      const updated = await tx.sprint.update({
        where: { id: sprintId },
        data: {
          isCompleted: true,
          lastUpdated: now,
          updatedAt: now
        },
        select: {
          id: true,
          isCompleted: true,
          lastUpdated: true
        }
      })
      console.log('[Complete] Updated sprint in transaction:', updated)
      return updated
    })

    console.log('[Complete] Transaction completed:', result)

    const response = {
      isComplete: true,
      lastUpdated: result.lastUpdated
    }
    console.log('[Complete] Sending response:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Complete] Error completing rankings:', error)
    if (error instanceof Error) {
      console.error('[Complete] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json(
      { error: 'Failed to complete rankings' },
      { status: 500 }
    )
  }
} 