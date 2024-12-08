import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const points = await prisma.points.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } }
    })

    return NextResponse.json(points)
  } catch (error) {
    console.error('Error fetching points:', error)
    return NextResponse.json(
      { error: 'Failed to fetch points' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = request.cookies.get('userId')?.value

    if (!adminId) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { id: parseInt(adminId) },
      include: { role: true }
    })

    if (!admin || admin.role.name !== 'ADMIN') {
      return NextResponse.json({ 
        success: false,
        error: 'Not authorized',
        role: admin?.role.name 
      }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body'
      }, { status: 400 })
    }

    const { userId, amount, reason } = body

    if (!userId || !amount || !reason) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields',
        received: { userId, amount, reason }
      }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId.toString()) }
    })

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: 'Target user not found'
      }, { status: 404 })
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const points = await tx.points.create({
          data: {
            userId: parseInt(userId.toString()),
            amount: parseInt(amount.toString()),
            reason: reason.trim(),
            isReward: false
          },
          include: {
            user: true
          }
        })

        const updatedUser = await tx.user.update({
          where: { 
            id: parseInt(userId.toString()) 
          },
          data: {
            pointsBalance: {
              increment: parseInt(amount.toString())
            }
          }
        })

        return {
          points,
          user: updatedUser
        }
      })

      return NextResponse.json({ 
        success: true,
        message: 'Points added successfully',
        data: result
      })

    } catch (txError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process transaction',
        details: txError instanceof Error ? txError.message : 'Unknown transaction error'
      }, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 