import React, { useState, useEffect, useRef } from 'react'
import './Chat.css'
import { MessageItem } from './MessageItem'

interface Message {
  id: number
  content: string
  senderId: number
  receiverId: number
  createdAt: string
  isEdited: boolean
  isDeleted: boolean
  sender: {
    id: number
    username: string
  }
}

interface ChatWindowProps {
  currentUser: {
    id: number
    username: string
  }
  otherUser: {
    id: number
    username: string
    role?: {
      name: string
    }
  }
  onClose: () => void
}

// Function to convert URLs in text to clickable links
const formatMessageContent = (content: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return content.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {part}
        </a>
      )
    }
    return part
  })
}

// Function to format time without seconds
const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function ChatWindow({ currentUser, otherUser, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch messages and poll for updates
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const isGroup = otherUser.role?.name === 'GROUP'
        const response = await fetch(
          `/api/messages?otherUserId=${otherUser.id}&isGroup=${isGroup}`
        )
        
        if (response.ok) {
          const data = await response.json()
          setMessages(data)
        } else {
          // Better error handling
          let errorMessage = 'Failed to fetch messages'
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            // If JSON parsing fails, use default message
          }
          console.error(errorMessage)
        }
      } catch (error) {
        console.error('Network error while fetching messages:', 
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)

    return () => clearInterval(interval)
  }, [otherUser.id, otherUser.role?.name])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const isGroup = otherUser.role?.name === 'GROUP'
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          receiverId: otherUser.id,
          isGroupMessage: isGroup
        }),
      })

      if (response.ok) {
        const message = await response.json()
        setMessages(prev => [...prev, message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, content: newContent })
      })

      if (response.ok) {
        const updatedMessage = await response.json()
        setMessages(messages.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        ))
      }
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages?messageId=${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages(messages.filter(msg => msg.id !== messageId))
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  return (
    <div className="chat-window flex flex-col h-[500px]">
      <div className="chat-header flex-none">
        <span className="chat-user-info">
          {otherUser.role?.name === 'GROUP' ? `👥 ${otherUser.displayName}` : otherUser.username}
        </span>
        <button className="close-chat" onClick={onClose}>×</button>
      </div>

      <div className="messages-container flex-1 overflow-y-auto">
        {messages.map(message => (
          <MessageItem
            key={message.id}
            message={message}
            currentUserId={currentUser.id}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input flex-none mt-auto">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full"
        />
      </form>
    </div>
  )
} 