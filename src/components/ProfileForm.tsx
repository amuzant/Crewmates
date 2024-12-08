'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'

interface Profile {
  email: string
  username: string
  displayName: string
  avatar?: string | null
  role: {
    name: string
    displayName: string
  }
  badges?: {
    id: number
    name: string
    description: string
    type: string
  }[]
}

interface ProfileFormProps {
  profile: Profile
  onCancel: () => void
  onSuccess: (updatedProfile: Profile) => void
}

export function ProfileForm({ profile: initialProfile, onCancel, onSuccess }: ProfileFormProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { refreshAuth } = useAuth()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('username', profile.username)
      formData.append('displayName', profile.displayName)
      
      if (fileInputRef.current?.files?.[0]) {
        formData.append('avatar', fileInputRef.current.files[0])
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      refreshAuth()
      onSuccess(updatedProfile)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
          {error}
        </div>
      )}
      
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 group">
          <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-700">
            {(imagePreview || profile.avatar) ? (
              <Image
                src={imagePreview || profile.avatar || ''}
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
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
          >
            <span className="text-white text-sm">Change Photo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-slate-200 mb-1">Profile Picture</h3>
          <p className="text-sm text-slate-400">
            Click the image to upload a new profile picture. Maximum size: 5MB
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={profile.email}
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-400 cursor-not-allowed"
          disabled
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">
          Username
        </label>
        <input
          type="text"
          id="username"
          value={profile.username}
          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-1">
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          value={profile.displayName}
          onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          Cancel
        </button>
      </div>
    </form>
  )
} 