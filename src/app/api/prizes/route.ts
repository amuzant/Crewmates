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

    // Get all available prizes
    const prizes = await prisma.prize.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        photo: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(prizes)
  } catch (error) {
    console.error('Failed to fetch prizes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prizes' },
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!user || user.role.name !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, description, photo } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Prize name is required' },
        { status: 400 }
      )
    }

    const prize = await prisma.prize.create({
      data: {
        name,
        description,
        photo
      }
    })

    return NextResponse.json(prize)
  } catch (error) {
    console.error('Failed to create prize:', error)
    return NextResponse.json(
      { error: 'Failed to create prize' },
      { status: 500 }
    )
  }
} 