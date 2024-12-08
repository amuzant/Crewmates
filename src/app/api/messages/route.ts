import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const otherUserId = searchParams.get('otherUserId')
    const isGroup = searchParams.get('isGroup') === 'true'
    const currentUserId = request.cookies.get('userId')?.value
  
    if (!otherUserId || !currentUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
  
    try {
      if (isGroup) {
        // Verify group membership
        const membership = await prisma.chatMembership.findFirst({
          where: {
            chatId: parseInt(otherUserId),
            userId: parseInt(currentUserId)
          }
        })
  
        if (!membership) {
          return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
        }
  
        // Get group messages
        const messages = await prisma.message.findMany({
          where: {
            chatId: parseInt(otherUserId),
            isGroupMessage: true,
            isDeleted: false
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        })
  
        return NextResponse.json(messages)
      } else {
        // Get direct messages
        const messages = await prisma.message.findMany({
          where: {
            OR: [
              {
                senderId: parseInt(currentUserId),
                receiverId: parseInt(otherUserId),
                isGroupMessage: false
              },
              {
                senderId: parseInt(otherUserId),
                receiverId: parseInt(currentUserId),
                isGroupMessage: false
              }
            ],
            isDeleted: false
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        })
  
        return NextResponse.json(messages)
      }
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
  }
  
  export async function POST(request: NextRequest) {
    const currentUserId = request.cookies.get('userId')?.value
    if (!currentUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
  
    try {
      const { content, receiverId, isGroupMessage = false } = await request.json()
  
      if (!content || !receiverId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
  
      // If group message, verify membership
      if (isGroupMessage) {
        const membership = await prisma.chatMembership.findFirst({
          where: {
            chatId: parseInt(receiverId),
            userId: parseInt(currentUserId)
          }
        })
  
        if (!membership) {
          return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
        }
      }
  
      const message = await prisma.message.create({
        data: {
          content,
          senderId: parseInt(currentUserId),
          receiverId: parseInt(receiverId),
          isGroupMessage,
          chatId: isGroupMessage ? parseInt(receiverId) : null
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        }
      })
  
      return NextResponse.json(message)
    } catch (error) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
  }