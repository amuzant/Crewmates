'use client'
import { useState, useEffect } from 'react'
import { User } from '@/types/user'
import { Chat } from '@/types/chat'

interface Props {
  users: User[]
  currentUser: User | null
  onSelectUser: (user: User) => void
  onCreateGroup: () => void
}

export function ChatDropdown({ users, currentUser, onSelectUser, onCreateGroup }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [groupChats, setGroupChats] = useState<Chat[]>([])

  useEffect(() => {
    const fetchGroupChats = async () => {
      const response = await fetch('/api/chats/groups')
      if (response.ok) {
        const data = await response.json()
        setGroupChats(data)
      }
    }
    fetchGroupChats()
  }, [])

  // Filter out current user and apply search
  const filteredUsers = users.filter(user => 
    // Exclude current user
    user.id !== currentUser?.id && 
    // Apply search filter
    (user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="chat-dropdown">
      <div className="p-3 border-b">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Messages</h3>
          <button
            onClick={onCreateGroup}
            className="text-sm px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors flex items-center gap-1"
          >
            <span>👥</span>
            New Group
          </button>
        </div>
      </div>

      <div className="chat-search">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="groups-list mb-4">
        <h4 className="font-medium text-gray-700 px-3 py-2">Group Chats</h4>
        {groupChats.map(chat => (
          <div
            key={chat.id}
            className="user-item"
            onClick={() => onSelectUser({
              id: chat.id,
              username: chat.name,
              displayName: chat.name,
              role: { name: 'GROUP', displayName: 'Group Chat' }
            })}
          >
            <div className="user-info">
              <span className="display-name text-black font-medium">👥 {chat.name}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="users-list">
        {filteredUsers.map(user => (
          <div
            key={user.id}
            className="user-item"
            onClick={() => onSelectUser(user)}
          >
            <div className="user-info">
              <span className="display-name text-black font-medium">{user.displayName}</span>
              <span className="username text-gray-600">@{user.username}</span>
              <span className="role text-gray-500">{user.role.displayName}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 