import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { claims: true }
        }
      }
    })
    return NextResponse.json(rewards)
  } catch (error) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = request.cookies.get('userId')?.value
    if (!adminId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { id: parseInt(adminId) },
      include: { role: true }
    })

    if (admin?.role.name !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { name, description, cost } = await request.json()

    const reward = await prisma.reward.create({
      data: {
        name,
        description,
        cost,
        isActive: true
      }
    })

    return NextResponse.json(reward)
  } catch (error) {
    console.error('Error creating reward:', error)
    return NextResponse.json(
      { error: 'Failed to create reward' },
      { status: 500 }
    )
  }
} 