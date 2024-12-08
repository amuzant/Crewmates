import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' })
  
  response.cookies.set('auth', '', { maxAge: 0 })
  response.cookies.set('userId', '', { maxAge: 0 })
  
  return response
} 