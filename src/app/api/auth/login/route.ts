import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    console.log('Login request received')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { email, password } = body

    if (!email || !password) {
      console.log('Missing credentials')
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('Looking up user with email:', email)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true
      }
    })
    console.log('User found:', user ? 'yes' : 'no')

    if (!user || !await bcrypt.compare(password, user.password)) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    })

    // Set HTTP-only cookies for both auth flag and user ID
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
    return NextResponse.json(
      { message: 'Error during login', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}