'use client'
import { useState, useEffect } from 'react'
import { ChatDropdown } from './ChatDropdown'
import { ChatWindow } from './ChatWindow'
import { CreateGroupModal } from './CreateGroupModal'
import { User } from '@/types/user'

export function Chat() {
  const [showDropdown, setShowDropdown] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data)
      } else {
        setCurrentUser(null)
      }
    }
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (!currentUser) return // Only fetch users if logged in
    
    const fetchUsers = async () => {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    }
    fetchUsers()
  }, [currentUser]) // Add currentUser as dependency

  // Don't render anything if user is not logged in
  if (!currentUser) return null

  const handleCreateGroup = async (name: string, memberIds: number[]) => {
    try {
      const response = await fetch('/api/chats/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          memberIds
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setShowGroupModal(false)
        setActiveChatUser({
          id: data.id,
          username: data.name,
          displayName: data.name,
          role: { name: 'GROUP', displayName: 'Group Chat' }
        })
      } else {
        throw new Error(data.error || 'Failed to create group')
      }
    } catch (error) {
      console.error('Failed to create group:', error instanceof Error ? error.message : error)
      // Optionally show error to user
      alert('Failed to create group: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleSelectUser = (user: User) => {
    setActiveChatUser(user)
    setShowDropdown(false)
  }

  const handleCreateGroupClick = () => {
    setShowGroupModal(true)
    setShowDropdown(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center text-2xl transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        💬
      </button>

      {showDropdown && (
        <ChatDropdown
          users={users}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
          onCreateGroup={handleCreateGroupClick}
        />
      )}

      {activeChatUser && currentUser && (
        <ChatWindow
          currentUser={currentUser}
          otherUser={activeChatUser}
          onClose={() => setActiveChatUser(null)}
        />
      )}

      {showGroupModal && (
        <CreateGroupModal
          users={users}
          currentUser={currentUser}
          onClose={() => setShowGroupModal(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}
    </div>
  )
} 