'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  id: number
  content: string
  senderId: number
  isEdited: boolean
  sender: {
    id: number
    username: string
  }
}

interface Props {
  message: Message
  currentUserId: number
  onEdit: (messageId: number, newContent: string) => void
  onDelete: (messageId: number) => void
}

export function MessageItem({ message, currentUserId, onEdit, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const inputRef = useRef<HTMLInputElement>(null)

  const isOwner = message.senderId === currentUserId

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit(message.id, editContent.trim())
    }
    setIsEditing(false)
  }

  return (
    <div className={`relative group p-2 rounded-lg ${
      isOwner ? 'bg-blue-600 ml-auto' : 'bg-slate-700'
    } max-w-[80%] ${isOwner ? 'ml-auto' : 'mr-auto'}`}>
      <div className="text-xs text-slate-300 mb-1">{message.sender.username}</div>
      
      {isEditing ? (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 bg-slate-800 text-white rounded px-2 py-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEdit()
              if (e.key === 'Escape') setIsEditing(false)
            }}
          />
        </div>
      ) : (
        <>
          <div className="text-white">
            {message.content}
            {message.isEdited && (
              <span className="text-xs text-slate-400 ml-2">(edited)</span>
            )}
          </div>
          
          {isOwner && (
            <div className="absolute right-0 top-0 hidden group-hover:flex gap-1 p-1">
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 text-xs text-blue-300 hover:text-blue-200 transition-opacity"
              >
                Edit
              </button>
              <span className="opacity-0 group-hover:opacity-100 text-gray-500">|</span>
              <button
                onClick={() => onDelete(message.id)}
                className="opacity-0 group-hover:opacity-100 text-xs text-red-300 hover:text-red-200 transition-opacity"
              >
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
} 