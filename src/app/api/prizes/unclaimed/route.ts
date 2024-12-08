import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('userId')
    
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)

    // Find prizes won but not acknowledged
    const unclaimedPrizes = await prisma.prize.findMany({
      where: {
        winners: {
          some: {
            id: userId
          }
        },
        prizeClaims: {
          none: {
            userId,
            acknowledged: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        photo: true
      }
    })

    return NextResponse.json(unclaimedPrizes)
  } catch (error) {
    console.error('Failed to fetch unclaimed prizes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unclaimed prizes' },
      { status: 500 }
    )
  }
} 