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
    const prizeClaim = await prisma.prizeClaim.findUnique({
      where: {
        prizeId_userId: {
          prizeId,
          userId
        }
      }
    })

    if (!prizeClaim) {
      return NextResponse.json(
        { error: 'Prize not found or not won by user' },
        { status: 404 }
      )
    }

    // Check if prize is already claimed
    if (prizeClaim.claimedAt) {
      return NextResponse.json(
        { error: 'Prize already claimed' },
        { status: 400 }
      )
    }

    // Update prize claim with claim date
    const updatedClaim = await prisma.prizeClaim.update({
      where: {
        prizeId_userId: {
          prizeId,
          userId
        }
      },
      data: {
        claimedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      prizeClaim: updatedClaim
    })
  } catch (error) {
    console.error('Failed to claim prize:', error)
    return NextResponse.json(
      { error: 'Failed to claim prize' },
      { status: 500 }
    )
  }
} 