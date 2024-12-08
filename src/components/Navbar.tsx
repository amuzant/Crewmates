'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface User {
  id: number
  username: string
  displayName?: string
  avatar?: string | null
  role: {
    displayName: string
  }
}

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { authVersion, refreshAuth } = useAuth()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router, authVersion])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Logout failed')
      setUser(null)
      refreshAuth()
      router.push('/auth')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading || !user || pathname === '/') return null

  return (
    <nav className="fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="relative w-10 h-10 bg-white/10 rounded-xl p-2 backdrop-blur-lg">
            <Image
              src="/images/crewmates-logo.svg"
              alt="Crewmates Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold text-white">Crewmates</span>
        </Link>

            <div className="hidden md:flex space-x-4">
              <Link
                href="/dashboard"
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/leaderboard"
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md transition-colors"
              >
                Leaderboard
              </Link>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-300">
                  Welcome back,
                </p>
                <p className="text-white font-medium">
                  {user.displayName || user.username}
                </p>
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-700 hover:ring-2 hover:ring-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.displayName || user.username}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg text-white">
                      {(user.displayName || user.username)[0].toUpperCase()}
                    </div>
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg py-1 border border-slate-700">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-white hover:bg-slate-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 