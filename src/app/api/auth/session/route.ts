import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get('userId')
    
    if (!userIdCookie) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        profile: {
          select: {
            avatar: true
          }
        },
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.profile?.avatar,
      role: user.role
    })

  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json(
      { message: 'Error fetching session' },
      { status: 500 }
    )
  }
} 