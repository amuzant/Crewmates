import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { rewardId } = await request.json()

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    })

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!user || user.pointsBalance < reward.cost) {
      return NextResponse.json({ error: 'Not enough points' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create claim
      const claim = await tx.rewardClaim.create({
        data: {
          userId: parseInt(userId),
          rewardId
        }
      })



      // Update user balance
      await tx.user.update({
        where: { id: parseInt(userId) },
        data: {
          pointsBalance: { decrement: reward.cost }
        }
      })

      return claim
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error claiming reward:', error)
    return NextResponse.json(
      { error: 'Failed to claim reward' },
      { status: 500 }
    )
  }
} 