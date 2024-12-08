import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
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

    const { email } = await request.json()

    // Find user by email
    const memberToAdd = await prisma.user.findUnique({
      where: { email }
    })

    if (!memberToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already a member
    const isMember = await prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            id: memberToAdd.id
          }
        }
      }
    })

    if (isMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Add user to project members
    await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: {
            id: memberToAdd.id
          }
        }
      }
    })

    return NextResponse.json({ message: 'Member added successfully' })
  } catch (error) {
    console.error('Failed to add member:', error)
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    )
  }
} 