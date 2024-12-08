import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json()
    } catch (e) {
      console.error('Error parsing JSON:', e)
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    console.log('Received request body:', body)

    const { email, password, username } = body

    // Validate required fields
    if (!email || !password || !username) {
      console.log('Missing fields:', { email: !!email, password: !!password, username: !!username })
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Get the TEAM_MEMBER role
    const memberRole = await prisma.role.findFirst({
      where: { name: 'TEAM_MEMBER' }
    })

    if (!memberRole) {
      return NextResponse.json(
        { message: 'Error setting up user role' },
        { status: 500 }
      )
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: username,
        password: hashedPassword,
        role: {
          connect: {
            id: memberRole.id
          }
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    })

    const response = NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    }, { status: 201 })

    // Set auth cookies after successful signup
    response.cookies.set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    response.cookies.set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { 
        message: 'Error creating user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 