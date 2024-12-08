import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('userId')
    
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        role: true,
        badges: true,
        wonPrizes: {
          include: {
            prizeClaims: {
              where: {
                userId
              },
              select: {
                claimedAt: true,
                acknowledged: true
              }
            }
          }
        },
        prizeClaims: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.profile?.avatar,
      role: {
        name: user.role.name,
        displayName: user.role.displayName
      },
      badges: user.badges.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        type: badge.type,
        createdAt: badge.createdAt
      })),
      wonPrizes: user.wonPrizes.map(prize => ({
        id: prize.id,
        name: prize.name,
        description: prize.description,
        photo: prize.photo,
        claims: prize.prizeClaims.map(claim => ({
          claimedAt: claim.claimedAt,
          acknowledged: claim.acknowledged
        }))
      }))
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get('userId')
    
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = parseInt(userIdCookie.value)
    
    // Handle multipart form data
    const formData = await request.formData()
    const username = formData.get('username') as string
    const displayName = formData.get('displayName') as string
    const avatar = formData.get('avatar') as File | null

    if (!username || !displayName) {
      return NextResponse.json(
        { error: 'Username and display name are required' },
        { status: 400 }
      )
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: userId }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      )
    }

    let avatarUrl: string | null = null

    if (avatar) {
      // Convert file to base64 for storage
      // In a production environment, you'd want to upload this to a proper storage service
      const bytes = await avatar.arrayBuffer()
      const buffer = Buffer.from(bytes)
      avatarUrl = `data:${avatar.type};base64,${buffer.toString('base64')}`
    }

    // Update user and profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        displayName,
        profile: {
          upsert: {
            create: {
              avatar: avatarUrl
            },
            update: {
              avatar: avatarUrl
            }
          }
        }
      },
      select: {
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
        },
        badges: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json({
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatar: updatedUser.profile?.avatar,
      role: updatedUser.role,
      badges: updatedUser.badges
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 