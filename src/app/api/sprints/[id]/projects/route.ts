import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sprintId = parseInt(params.id)

    // First check if sprint exists
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId }
    })

    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    // Get all projects in this sprint that don't have rankings
    const projects = await prisma.project.findMany({
      where: {
        sprintId,
        rankings: {
          none: {
            sprintId
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
} 