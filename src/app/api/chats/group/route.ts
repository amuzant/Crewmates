import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const creatorId = request.cookies.get('userId')?.value
    if (!creatorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { name, memberIds } = await request.json()
    if (!name || !memberIds?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if group name already exists
    const existingChat = await prisma.chat.findFirst({
      where: { name }
    })

    if (existingChat) {
      return NextResponse.json({ error: 'Group name already exists' }, { status: 400 })
    }

    // Create group with transaction to ensure all operations succeed
    const group = await prisma.$transaction(async (tx) => {
      // Create the chat
      const chat = await tx.chat.create({
        data: {
          name,
          creatorId: parseInt(creatorId),
          senderId: parseInt(creatorId),
        }
      })

      // Add members including creator
      await tx.chatMembership.createMany({
        data: [
          { chatId: chat.id, userId: parseInt(creatorId), isAdmin: true },
          ...memberIds.map((id: number) => ({
            chatId: chat.id,
            userId: id,
            isAdmin: false
          }))
        ]
      })

      // Return chat with members
      return tx.chat.findUnique({
        where: { id: chat.id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true
                }
              }
            }
          }
        }
      })
    })

    if (!group) {
      throw new Error('Failed to create group chat')
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Group creation error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create group'
    }, { status: 500 })
  }
} 