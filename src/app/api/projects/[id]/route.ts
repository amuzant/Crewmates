import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('userId')
    
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)
    const projectId = parseInt(params.id)

    // First get the user with their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get project with all related data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sprint: true,
        teams: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        },
        leaders: {
          include: {
            user: {
              include: {
                role: true,
                badges: true
              }
            }
          }
        },
        members: {
          include: {
            role: true,
            badges: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user has access (is admin, project leader, or member)
    const hasAccess = 
      user.role.name === 'ADMIN' ||
      project.leaders.some(leader => leader.user.id === userId) ||
      project.members.some(member => member.id === userId)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Failed to fetch project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('userId')
    
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)
    const projectId = parseInt(params.id)

    // Check if user is admin or project leader
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { leaders: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const isProjectLeader = project.leaders.some(leader => leader.userId === userId)
    const isAdmin = user.role.name === 'ADMIN'

    if (!isAdmin && !isProjectLeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // First delete related records
    await prisma.$transaction([
      // Delete project leaders
      prisma.projectLeader.deleteMany({
        where: { projectId }
      }),
      // Delete the project itself
      prisma.project.delete({
        where: { id: projectId }
      })
    ])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Failed to delete project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
} 