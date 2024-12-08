import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Initialize Prisma client
const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    console.log('[Progress GET] Fetching progress for project:', projectId)

    const progress = await prisma.progress.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    })
    console.log('[Progress GET] Found progress:', progress)

    return NextResponse.json(progress)
  } catch (error) {
    console.error('[Progress GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('[Progress POST] Starting progress update')
  try {
    const projectId = parseInt(params.id)
    console.log('[Progress POST] Project ID:', projectId)

    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('userId')
    console.log('[Progress POST] User cookie:', userIdCookie)
    
    if (!userIdCookie) {
      console.log('[Progress POST] No user cookie found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)
    const { content } = await request.json()
    console.log('[Progress POST] User ID:', userId, 'Content:', content)

    // First check if user is member of the project
    console.log('[Progress POST] Checking project membership')
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            id: userId
          }
        }
      }
    })
    console.log('[Progress POST] Found project:', project)

    if (!project) {
      console.log('[Progress POST] User not authorized for project')
      return NextResponse.json(
        { error: 'Not authorized to update progress for this project' },
        { status: 403 }
      )
    }

    try {
      // Create new progress
      console.log('[Progress POST] Creating new progress')
      const progress = await prisma.progress.create({
        data: {
          content,
          userId,
          projectId
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        }
      })

      console.log('[Progress POST] Operation successful:', progress)
      return NextResponse.json(progress)
    } catch (error) {
      // If creation fails due to unique constraint, try update
      console.log('[Progress POST] Create failed, trying update')
      const existingProgress = await prisma.progress.findFirst({
        where: {
          userId,
          projectId
        }
      })

      if (existingProgress) {
        const progress = await prisma.progress.update({
          where: { id: existingProgress.id },
          data: {
            content,
            updatedAt: new Date()
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        })

        console.log('[Progress POST] Update successful:', progress)
        return NextResponse.json(progress)
      }

      throw error
    }
  } catch (error) {
    console.error('[Progress POST] General error:', error)
    if (error instanceof Error) {
      console.error('[Progress POST] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('userId')
    
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)
    const { content } = await request.json()

    // Check if progress exists and belongs to user
    const existingProgress = await prisma.progress.findFirst({
      where: {
        projectId,
        userId
      }
    })

    if (!existingProgress) {
      return NextResponse.json(
        { error: 'Progress not found' },
        { status: 404 }
      )
    }

    // Update progress
    const progress = await prisma.progress.update({
      where: {
        id: existingProgress.id
      },
      data: {
        content,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Failed to update progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('userId')
    
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)

    // Check if progress exists and belongs to user
    const existingProgress = await prisma.progress.findFirst({
      where: {
        projectId,
        userId
      }
    })

    if (!existingProgress) {
      return NextResponse.json(
        { error: 'Progress not found' },
        { status: 404 }
      )
    }

    // Delete progress
    await prisma.progress.delete({
      where: {
        id: existingProgress.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete progress:', error)
    return NextResponse.json(
      { error: 'Failed to delete progress' },
      { status: 500 }
    )
  }
} 