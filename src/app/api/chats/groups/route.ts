import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId: parseInt(userId)
          }
        }
      },
      include: {
        members: true,
        messages: {
          select: {
            id: true
          }
        }
      }
    })

    return NextResponse.json(chats)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch group chats' }, { status: 500 })
  }
} 