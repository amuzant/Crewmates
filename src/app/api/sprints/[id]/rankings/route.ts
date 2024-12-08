import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function awardBadgeToProjectMembers(
  projectId: number,
  rank: number,
  badgeType: string
) {
  // Get project members
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          badges: true
        }
      }
    }
  })

  if (!project) return

  // For each member, award badge if they don't have it
  for (const member of project.members) {
    const hasBadge = member.badges.some(badge => badge.type === badgeType)
    
    if (!hasBadge) {
      const badgeName = {
        'GOLD_TROPHY': 'Gold Trophy',
        'SILVER_TROPHY': 'Silver Trophy',
        'BRONZE_TROPHY': 'Bronze Trophy'
      }[badgeType]

      const badgeDescription = {
        'GOLD_TROPHY': 'Awarded for achieving first place in a sprint',
        'SILVER_TROPHY': 'Awarded for achieving second place in a sprint',
        'BRONZE_TROPHY': 'Awarded for achieving third place in a sprint'
      }[badgeType]

      await prisma.badge.create({
        data: {
          type: badgeType,
          name: badgeName,
          description: badgeDescription,
          userId: member.id
        }
      })
    }
  }
}

async function awardPrizeToProjectMembers(
  projectId: number,
  sprintId: number
) {
  // Get project members and sprint prize info
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      prize: true
    }
  })

  if (!sprint?.hasPrize || !sprint.prize) return

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: true
    }
  })

  if (!project) return

  // Award prize to all project members
  for (const member of project.members) {
    // Check if member already has this prize
    const hasPrize = await prisma.user.findFirst({
      where: {
        id: member.id,
        wonPrizes: {
          some: {
            id: sprint.prize.id
          }
        }
      }
    })

    if (!hasPrize) {
      await prisma.user.update({
        where: { id: member.id },
        data: {
          wonPrizes: {
            connect: {
              id: sprint.prize.id
            }
          }
        }
      })
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sprintId = parseInt(params.id)
    console.log('Fetching rankings for sprint:', sprintId)

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

    const rankings = await prisma.ranking.findMany({
      where: { sprintId },
      orderBy: { rank: 'asc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    console.log('Found rankings:', rankings)
    return NextResponse.json(rankings)
  } catch (error) {
    console.error('Failed to fetch rankings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sprintId = parseInt(params.id)
    const { rankings } = await request.json()

    // First handle rankings in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing rankings
      await tx.ranking.deleteMany({
        where: { sprintId }
      })

      // Create new rankings
      const createdRankings = await Promise.all(
        rankings.map(async (ranking: { projectId: number, rank: number }) => {
          return await tx.ranking.create({
            data: {
              sprintId,
              projectId: ranking.projectId,
              rank: ranking.rank
            },
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          })
        })
      )

      // Update sprint completion status
      await tx.sprint.update({
        where: { id: sprintId },
        data: {
          isCompleted: true,
          lastUpdated: new Date()
        }
      })

      return createdRankings
    })

    // After rankings are saved, handle badge and prize awards separately
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId }
    })

    for (const ranking of rankings) {
      // Award badges for top 3
      if (ranking.rank <= 3) {
        let badgeType: string
        switch (ranking.rank) {
          case 1:
            badgeType = 'GOLD_TROPHY'
            break
          case 2:
            badgeType = 'SILVER_TROPHY'
            break
          case 3:
            badgeType = 'BRONZE_TROPHY'
            break
          default:
            continue
        }

        // Award badges asynchronously
        awardBadgeToProjectMembers(ranking.projectId, ranking.rank, badgeType)
          .catch(error => {
            console.error('Failed to award badges for project:', ranking.projectId, error)
          })
      }

      // Award prize to winning team (rank 1) if it's a prize sprint
      if (ranking.rank === 1 && sprint?.hasPrize) {
        awardPrizeToProjectMembers(ranking.projectId, sprintId)
          .catch(error => {
            console.error('Failed to award prize for project:', ranking.projectId, error)
          })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update rankings:', error)
    return NextResponse.json(
      { error: 'Failed to update rankings' },
      { status: 500 }
    )
  }
}