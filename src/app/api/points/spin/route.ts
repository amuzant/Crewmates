import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!user || user.pointsBalance < 10) {
      return NextResponse.json({ error: 'Not enough points' }, { status: 400 })
    }

    // Deduct points for spinning
    await prisma.points.create({
      data: {
        userId: parseInt(userId),
        amount: -10,
        reason: 'Lucky Wheel Spin'
      }
    })

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        pointsBalance: {
          decrement: 10
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing spin:', error)
    return NextResponse.json(
      { error: 'Failed to process spin' },
      { status: 500 }
    )
  }
} 