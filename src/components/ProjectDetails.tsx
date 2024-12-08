'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { BadgeDisplay } from './badges/BadgeDisplay'
import { PrizeIcon } from './icons/PrizeIcon'

interface User {
  id: number
  username: string
  displayName: string
  role: {
    name: string
    displayName: string
  }
  progress?: Progress
}

interface Team {
  id: number
  name: string
  members: {
    user: User
  }[]
}

interface Project {
  id: number
  name: string
  description: string | null
  sprint: {
    id: number
    name: string
    startDate: string
    endDate: string
    hasPrize: boolean
  } | null
  leaders: {
    user: User
  }[]
  members: UserWithBadges[]
  teams: Team[]
}

interface AddMemberModalProps {
  projectId: number
  onClose: () => void
  onMemberAdded: () => void
}

function AddMemberModal({ projectId, onClose, onMemberAdded }: AddMemberModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add member')
      }

      onMemberAdded()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Team Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
              Member Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface Message {
  id: number
  content: string
  createdAt: string
  user: {
    id: number
    username: string
    displayName: string
    profile?: {
      avatar: string | null
    }
  }
}

interface MessageActionsProps {
  message: Message
  currentUser: User | null
  onEdit: (messageId: number, content: string) => void
  onDelete: (messageId: number) => void
  setEditingMessageId: (id: number | null) => void
  setEditContent: (content: string) => void
}

function MessageActions({ 
  message, 
  currentUser,
  onEdit,
  onDelete,
  setEditingMessageId,
  setEditContent
}: MessageActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (message.user.id !== currentUser?.id) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-1 hover:bg-slate-600/50 rounded transition-colors"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 opacity-70 hover:opacity-100" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" 
          />
        </svg>
      </button>
      {showDropdown && (
        <div className="absolute top-0 right-0 mt-8 w-32 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden z-10">
          <button
            onClick={() => {
              setEditingMessageId(message.id)
              setEditContent(message.content)
              setShowDropdown(false)
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => {
              onDelete(message.id)
              setShowDropdown(false)
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function ChatBox({ projectId, currentUser }: { projectId: number, currentUser: User | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/messages`)
        if (!response.ok) throw new Error('Failed to fetch messages')
        const data = await response.json()
        setMessages(data)
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return

    try {
      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const message = await response.json()
      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleEdit = async (messageId: number, content: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editContent }),
      })

      if (!response.ok) throw new Error('Failed to edit message')

      const updatedMessage = await response.json()
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ))
      setEditingMessageId(null)
      setEditContent('')
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  const handleDelete = async (messageId: number) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/messages/${messageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete message')

      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading messages...</div>
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.user.id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[70%] gap-3 ${
                message.user.id === currentUser?.id ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className="flex-shrink-0">
                {message.user.profile?.avatar ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={message.user.profile.avatar}
                      alt={message.user.displayName}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm">
                    {message.user.displayName[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.user.id === currentUser?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                <div className="flex justify-between items-start gap-4 mb-1">
                  <div className="text-sm font-medium">
                    {message.user.id === currentUser?.id ? 'You' : message.user.displayName}
                  </div>
                  <MessageActions
                    message={message}
                    currentUser={currentUser}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    setEditingMessageId={setEditingMessageId}
                    setEditContent={setEditContent}
                  />
                </div>
                {editingMessageId === message.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleEdit(message.id, editContent)
                    }}
                    className="mt-1"
                  >
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-slate-800/50 rounded px-2 py-1 text-sm"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessageId(null)
                          setEditContent('')
                        }}
                        className="text-xs opacity-70 hover:opacity-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="text-xs bg-blue-500/20 px-2 py-1 rounded hover:bg-blue-500/30"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-sm">{message.content}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

interface Progress {
  id: number
  content: string
  userId: number
  projectId: number
  createdAt: string
  updatedAt: string
}

const CrownIcon = () => (
  <div className="relative group">
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className="h-4 w-4 text-yellow-500" 
      viewBox="0 0 20 20" 
      fill="currentColor"
    >
      <path 
        fillRule="evenodd" 
        d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477 6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" 
      />
    </svg>
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-xs text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
      Project Leader
    </div>
  </div>
)

interface UserWithBadges extends User {
  badges: {
    type: string
  }[]
}

export function ProjectDetails({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const [showAddMember, setShowAddMember] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progress, setProgress] = useState('')
  const [userProgress, setUserProgress] = useState<Record<number, Progress>>({})
  const [showTeamMembers, setShowTeamMembers] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [isEditingProgress, setIsEditingProgress] = useState(false)

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }
      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [projectId])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setCurrentUser(userData)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    // Check if this is a newly created project
    const searchParams = new URLSearchParams(window.location.search)
    setShowWelcome(searchParams.get('new') === 'true')
  }, [])

  useEffect(() => {
    const fetchUserProgress = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/progress`)
        if (response.ok) {
          const data = await response.json()
          const progressMap = data.reduce((acc: Record<number, Progress>, curr: Progress) => {
            acc[curr.userId] = curr
            return acc
          }, {})
          setUserProgress(progressMap)
        }
      } catch (error) {
        console.error('Error fetching progress:', error)
      }
    }

    fetchUserProgress()
  }, [projectId])

  const isProjectLeader = project?.leaders.some(
    leader => leader.user.id === user?.id
  )

  const isAdmin = user?.role.name === 'ADMIN'

  const canManageMembers = isAdmin || isProjectLeader

  const handleMemberAdded = () => {
    fetchProject()
  }

  const handleDeleteMember = async (memberId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status !== 204) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to remove member')
        }
      }

      // Refresh project data after successful deletion
      fetchProject()
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member. Please try again.')
    }
  }

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete project')
      }

      if (data.success) {
        router.push('/dashboard')
      } else {
        throw new Error('Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete project. Please try again.')
    }
  }

  const handleProgressSubmit = async () => {
    if (!progress.trim() || !user) return

    try {
      // Process the content to handle newlines properly
      const formattedContent = progress
        .trim()
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\n{3,}/g, '\n\n') // Replace 3+ consecutive newlines with 2
      
      console.log('Saving progress:', { 
        projectId, 
        content: formattedContent,
        originalLength: progress.length,
        formattedLength: formattedContent.length 
      })
      
      const response = await fetch(`/api/projects/${projectId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: formattedContent }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save progress')
      }

      const updatedProgress = await response.json()
      console.log('Progress saved:', updatedProgress)

      // Update the userProgress state with the new progress
      setUserProgress(prev => ({
        ...prev,
        [user.id]: updatedProgress
      }))

      // Close modal and clear input
      setShowProgressModal(false)
      setProgress('')

      // Show success message
      alert('Progress updated successfully!')
    } catch (error) {
      console.error('Error saving progress:', error)
      alert(error instanceof Error ? error.message : 'Failed to save progress')
    }
  }

  const handleProgressButtonClick = () => {
    if (user && userProgress[user.id]) {
      // If user has existing progress, set it in the form
      setProgress(userProgress[user.id].content)
      setIsEditingProgress(true)
    } else {
      setProgress('')
      setIsEditingProgress(false)
    }
    setShowProgressModal(true)
  }

  const handleCloseProgressModal = () => {
    setShowProgressModal(false)
    setProgress('')
    setIsEditingProgress(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !project) {
    return <div className="text-red-500">{error || 'Project not found'}</div>
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      {showWelcome && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-6 py-4 rounded-lg">
          <h3 className="font-semibold mb-1">Project Created Successfully!</h3>
          <p className="text-sm">
            Get started by adding team members to your project.
          </p>
        </div>
      )}

      {/* Project Header */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-slate-300 mt-2">{project.description}</p>
          </div>
          <div className="flex items-center gap-4">
            {canManageMembers && (
              <button
                onClick={handleDeleteProject}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete Project
              </button>
            )}
            <button
              onClick={() => router.back()}
              className="bg-slate-700 px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        {/* Sprint Tag */}
        {project.sprint && (
          <div className="inline-flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-full text-sm">
            <span className="font-medium">{project.sprint.name}</span>
            <span className="text-slate-400">
              {new Date(project.sprint.startDate).toLocaleDateString()} - {new Date(project.sprint.endDate).toLocaleDateString()}
            </span>
            {project.sprint.hasPrize && <PrizeIcon />}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowTeamMembers(!showTeamMembers)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
        >
          <span>{showTeamMembers ? 'Hide' : 'Show'} Team Members</span>
          <span className="bg-slate-600 px-2 py-0.5 rounded-full text-sm">
            {project.members.length}
          </span>
        </button>
        <button
          onClick={() => setShowProgress(!showProgress)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
        >
          {showProgress ? 'Hide' : 'Show'} Progress
        </button>
      </div>

      {/* Collapsible Sections */}
      <div className={`grid grid-cols-1 ${showTeamMembers && showProgress ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Team Members Section */}
        {showTeamMembers && (
          <div className={`bg-slate-800 rounded-lg p-6 ${!showProgress ? 'lg:col-span-full' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Team Members</h2>
              {canManageMembers && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Add Member
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.members.length === 0 ? (
                <div className="col-span-2 text-center py-8 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 mb-2">No team members yet</p>
                  {canManageMembers && (
                    <p className="text-sm text-slate-500">
                      Click the "Add Member" button above to start building your team
                    </p>
                  )}
                </div>
              ) : (
                project.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between gap-3 bg-slate-700/50 p-4 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                        {member.displayName[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{member.displayName}</p>
                          {project.leaders.some(leader => leader.user.id === member.id) && <CrownIcon />}
                          {member.badges?.map((badge, index) => (
                            <BadgeDisplay 
                              key={index}
                              type={badge.type as 'GOLD_TROPHY' | 'SILVER_TROPHY' | 'BRONZE_TROPHY'}
                              size="sm"
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
                          <span className="truncate">@{member.username}</span>
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-600 rounded-full text-xs whitespace-nowrap">
                            {member.role.displayName}
                          </span>
                        </div>
                      </div>
                    </div>
                    {canManageMembers && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove ${member.displayName} from the project?`)) {
                            handleDeleteMember(member.id)
                          }
                        }}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
                        title="Remove member"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Progress Section */}
        {showProgress && (
          <div className={`bg-slate-800 rounded-lg p-6 ${!showTeamMembers ? 'lg:col-span-full' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Team Progress</h2>
              {user && (
                <button
                  onClick={handleProgressButtonClick}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {userProgress[user.id] ? 'Update Progress' : 'Add Progress'}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {project.members.map(member => (
                <div 
                  key={member.id}
                  className="bg-slate-700/50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-2 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                      {member.displayName[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{member.displayName}</p>
                        {project.leaders.some(leader => leader.user.id === member.id) && <CrownIcon />}
                        {member.badges?.map((badge, index) => (
                          <BadgeDisplay 
                            key={index}
                            type={badge.type as 'GOLD_TROPHY' | 'SILVER_TROPHY' | 'BRONZE_TROPHY'}
                            size="sm"
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
                        <span className="truncate">@{member.username}</span>
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-600 rounded-full text-xs whitespace-nowrap">
                          {member.role.displayName}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {userProgress[member.id] ? (
                    <div className="ml-13 bg-slate-700/30 rounded p-3 mt-2">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {userProgress[member.id].content}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Last updated: {new Date(userProgress[member.id].updatedAt).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="ml-13 text-sm text-slate-500 italic mt-2">
                      No progress update yet
                    </p>
                  )}
                </div>
              ))}

              {project.members.length === 0 && (
                <div className="text-center py-8 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400">No team members yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Section - Main Focus */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold">Project Chat</h2>
        </div>
        <ChatBox projectId={projectId} currentUser={user} />
      </div>

      {/* Modals */}
      {showAddMember && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddMember(false)}
          onMemberAdded={handleMemberAdded}
        />
      )}

      {showProgressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {isEditingProgress ? 'Update Progress' : 'Add Progress'}
            </h3>
            <textarea
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder="Describe your progress on this project..."
              className="w-full h-32 bg-slate-700 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleCloseProgressModal}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProgressSubmit}
                disabled={!progress.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditingProgress ? 'Update' : 'Save'} Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 