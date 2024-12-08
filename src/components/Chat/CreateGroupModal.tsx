'use client'
import { useState } from 'react'
import { User } from '@/types/user'

interface Props {
  users: User[]
  currentUser: User | null
  onClose: () => void
  onCreateGroup: (name: string, members: number[]) => void
}

export function CreateGroupModal({ users, currentUser, onClose, onCreateGroup }: Props) {
  const [groupName, setGroupName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  const availableUsers = users.filter(user => 
    user.id !== currentUser?.id
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate group name
    if (!groupName.trim()) {
      setError('Group name is required')
      return
    }

    // Check if group name already exists
    try {
      const response = await fetch('/api/chats/group/check-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim() })
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Group name already exists')
        return
      }

      // If validation passes, create group
      if (selectedUsers.length > 0) {
        onCreateGroup(groupName.trim(), selectedUsers)
      } else {
        setError('Please select at least one member')
      }
    } catch (error) {
      setError('Failed to create group')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4 text-black">Create Group Chat</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value)
                setError(null) // Clear error when typing
              }}
              className={`w-full p-2 border rounded text-black ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter group name"
              required
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Members
            </label>
            <div className="max-h-48 overflow-y-auto border rounded p-2">
              {availableUsers.map(user => (
                <label key={user.id} className="flex items-center p-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id])
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-black">{user.displayName} (@{user.username})</span>
                </label>
              ))}
            </div>
            {selectedUsers.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">Select at least one member</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!groupName.trim() || selectedUsers.length === 0}
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 