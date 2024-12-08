'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ProfileForm } from './ProfileForm'
import { useAuth } from '@/contexts/AuthContext'
import { BadgeDisplay } from './badges/BadgeDisplay'

interface Badge {
  id: number
  name: string
  description: string
  type: string
  createdAt: string
}

interface Profile {
  email: string
  username: string
  displayName: string
  avatar?: string | null
  role: {
    name: string
    displayName: string
  }
  badges: Badge[]
  wonPrizes: Prize[]
}

interface Prize {
  id: number
  name: string
  description: string | null
  photo?: string | null
  claims: {
    claimedAt: string | null
    acknowledged: boolean
  }[]
}

// Add a helper function for date formatting
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', dateString, error)
    return 'Date unavailable'
  }
}

export function ProfileView() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()
  const { refreshAuth } = useAuth()

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile)
    setIsEditing(false)
    refreshAuth() // Refresh auth state to update navbar
  }

  const handleClaimPrize = async (prizeId: number) => {
    try {
      const response = await fetch(`/api/prizes/${prizeId}/claim`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim prize')
      }

      // Refresh profile data
      await fetchProfile()
    } catch (error) {
      console.error('Error claiming prize:', error)
      alert(error instanceof Error ? error.message : 'Failed to claim prize. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!profile) {
    return <div className="text-red-500">Failed to load profile</div>
  }

  if (isEditing) {
    return (
      <ProfileForm 
        profile={profile} 
        onCancel={() => setIsEditing(false)} 
        onSuccess={handleProfileUpdate}
      />
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-700">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={profile.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-slate-400">
                {profile.displayName[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile.displayName}</h2>
            <p className="text-slate-400">@{profile.username}</p>
            <div className="mt-2">
              <span className="px-3 py-1 bg-slate-700 rounded-full text-sm">
                {profile.role.displayName}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Edit Profile
        </button>
      </div>

      {profile.badges && profile.badges.length > 0 && (
        <div className="pt-6 border-t border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Badges</h3>
          <div className="grid grid-cols-2 gap-4">
            {profile.badges.map(badge => (
              <div key={badge.id} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{badge.name}</h4>
                    <p className="text-sm text-slate-400">{badge.description}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Earned on {formatDate(badge.createdAt)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <BadgeDisplay 
                      type={badge.type as 'GOLD_TROPHY' | 'SILVER_TROPHY' | 'BRONZE_TROPHY'} 
                      size="lg"
                      showTooltip={false}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.wonPrizes && profile.wonPrizes.length > 0 && (
        <div className="pt-6 border-t border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Prizes Won</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.wonPrizes.map(prize => (
              <div key={prize.id} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {prize.photo && (
                    <div className="w-16 h-16 rounded-lg bg-slate-600 overflow-hidden flex-shrink-0">
                      <img
                        src={prize.photo}
                        alt={prize.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-lg">{prize.name}</h4>
                    <p className="text-sm text-slate-300 mb-2">{prize.description}</p>
                    {prize.claims?.some(claim => claim.claimedAt) ? (
                      <p className="text-xs text-green-400">
                        Claimed on {new Date(prize.claims[0].claimedAt!).toLocaleDateString()}
                      </p>
                    ) : (
                      <button
                        onClick={() => handleClaimPrize(prize.id)}
                        className="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                      >
                        Claim Prize
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 