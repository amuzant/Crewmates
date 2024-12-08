import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(
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
    const prizeId = parseInt(params.id)

    // Check if user has won this prize
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        wonPrizes: {
          some: {
            id: prizeId
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Prize not found or not won by user' },
        { status: 404 }
      )
    }

    // Create or update prize claim with acknowledged status
    const prizeClaim = await prisma.prizeClaim.upsert({
      where: {
        prizeId_userId: {
          prizeId,
          userId
        }
      },
      create: {
        prizeId,
        userId,
        acknowledged: true
      },
      update: {
        acknowledged: true
      }
    })

    return NextResponse.json({
      success: true,
      prizeClaim
    })
  } catch (error) {
    console.error('Failed to acknowledge prize:', error)
    return NextResponse.json(
      { error: 'Failed to acknowledge prize' },
      { status: 500 }
    )
  }
}