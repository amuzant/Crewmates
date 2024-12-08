import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    
    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Check if name exists
    const existingChat = await prisma.chat.findFirst({
      where: { name }
    })

    if (existingChat) {
      return NextResponse.json({ error: 'Group name already exists' }, { status: 400 })
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check group name' }, { status: 500 })
  }
} 