import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get('userId')
    
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)
    const projectId = parseInt(params.id)
    const memberIdToRemove = parseInt(params.memberId)

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
      include: { 
        leaders: true,
        members: true
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const isProjectLeader = project.leaders.some(leader => leader.userId === userId)
    const isAdmin = user.role.name === 'ADMIN'

    if (!isAdmin && !isProjectLeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if member exists in project
    const memberExists = project.members.some(member => member.id === memberIdToRemove)
    if (!memberExists) {
      return NextResponse.json({ error: 'Member not found in project' }, { status: 404 })
    }

    // Don't allow removing project leaders
    const isLeader = project.leaders.some(leader => leader.userId === memberIdToRemove)
    if (isLeader) {
      return NextResponse.json({ error: 'Cannot remove project leader' }, { status: 400 })
    }

    // Remove member from project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          disconnect: {
            id: memberIdToRemove
          }
        }
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to remove member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
} 