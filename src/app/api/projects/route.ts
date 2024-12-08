import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get('userId')
    
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)

    // First get the user with their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If admin, get all projects, otherwise get projects where user is either a leader or member
    const projects = await prisma.project.findMany({
      where: user.role.name === 'ADMIN' 
        ? undefined 
        : {
            OR: [
              {
                leaders: {
                  some: {
                    userId: userId
                  }
                }
              },
              {
                members: {
                  some: {
                    id: userId
                  }
                }
              }
            ]
          },
      include: {
        sprint: true,
        teams: {
          include: {
            members: true
          }
        },
        leaders: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                role: {
                  select: {
                    name: true,
                    displayName: true
                  }
                }
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
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

    // Check if user is admin or team leader
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!user || !['ADMIN', 'TEAM_LEADER'].includes(user.role.name)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await request.json()
    const { name, description, sprintId } = data

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        sprintId: sprintId ? parseInt(sprintId) : null,
        leaders: {
          create: [{ userId }] // Only add creator as project leader
        }
      },
      include: {
        sprint: true,
        teams: {
          include: {
            members: true
          }
        },
        leaders: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                role: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
} 