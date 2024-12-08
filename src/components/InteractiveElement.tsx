'use client'
import { useState, useEffect } from 'react'
import { Switch } from '@headlessui/react'
import Image from 'next/image'

export function InteractiveElement() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check if user is logged in by checking for auth cookie
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session')
        setIsLoggedIn(response.ok)
      } catch (error) {
        console.error('Error checking auth status:', error)
        setIsLoggedIn(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16 bg-white/10 rounded-2xl p-3 backdrop-blur-lg">
                <Image
                  src="/images/crewmates-logo.svg"
                  alt="Crewmates Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-6xl font-bold text-white mb-4">
              Crewmates
            </h1>
            <p className="text-xl text-slate-300">
              Where great teams come together and grow stronger
            </p>

            {/* CTA Section */}
            <div className="text-center">
              <a 
                href={isLoggedIn ? "/dashboard" : "/auth"}
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                {isLoggedIn ? "View Your Dashboard" : "Join Your Team Today"}
              </a>
            </div>
          </div>

          {/* Toggle Guide */}
          <div className="text-center mb-8">
            <p className="text-slate-300 text-lg">
              👀 Take a peek at how Crewmates works for everyone! 
              <br />
            </p>
          </div>

          {/* Role Toggle */}
          <div className="flex items-center justify-center gap-6 mb-12 bg-white/5 backdrop-blur-lg rounded-full p-2 max-w-xs mx-auto">
            <span className={`text-sm font-medium transition-colors ${!isAdmin ? 'text-white' : 'text-slate-400'}`}>
              Team Member
            </span>
            <Switch
              checked={isAdmin}
              onChange={setIsAdmin}
              className={`${
                isAdmin ? 'bg-blue-600' : 'bg-slate-600'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900`}
            >
              <span className="sr-only">Toggle admin view</span>
              <span
                className={`${
                  isAdmin ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
            <span className={`text-sm font-medium transition-colors ${isAdmin ? 'text-white' : 'text-slate-400'}`}>
              Admin
            </span>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {isAdmin ? (
              // Admin Features
              <>
                <FeatureCard
                  title="Surprise & Delight"
                  description="Make work fun with spin-the-wheel rewards and custom prizes for your team's wins!"
                  icon="🎁"
                />
                <FeatureCard
                  title="Team Insights"
                  description="Watch your team grow with easy-to-read progress tracking and achievements"
                  icon="📈"
                />
                <FeatureCard
                  title="Smart Task Magic"
                  description="Keep everyone moving forward with simple task management that just works"
                  icon="✨"
                />
              </>
            ) : (
              // Team Member Features
              <>
                <FeatureCard
                  title="Win Together"
                  description="Chat with your team, share wins, and climb the leaderboard together"
                  icon="🏆"
                />
                <FeatureCard
                  title="Level Up"
                  description="Earn cool badges and rewards as you crush your goals"
                  icon="⭐"
                />
                <FeatureCard
                  title="Stay in Sync"
                  description="Keep track of your tasks and celebrate team progress in real-time"
                  icon="🚀"
                />
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="group bg-white/[0.05] backdrop-blur-lg rounded-xl p-6 hover:bg-white/[0.08] transition-colors border border-white/[0.05]">
      <div className="text-3xl mb-4 bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-300 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  )
}

