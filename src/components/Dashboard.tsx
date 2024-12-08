'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SprintForm } from './SprintForm'
import { PrizeIcon } from './icons/PrizeIcon'
import { PrizeNotification } from './PrizeNotification'

interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
  isCompleted: boolean
  hasPrize: boolean
}

interface ProjectLeader {
  user: {
    id: number
    username: string
    displayName: string
    role: {
      name: string
      displayName: string
    }
  }
}

interface Project {
  id: number
  name: string
  description: string | null
  sprintId: number | null
  teams: {
    members: {
      userId: number
    }[]
  }[]
  leaders: {
    userId: number
    user: {
      displayName: string
      username: string
    }
  }[]
  sprint?: Sprint
}

interface User {
  id: number
  email: string
  username: string
  role: {
    name: string
    displayName: string
  }
}

export function Dashboard() {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedSprint, setSelectedSprint] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showSprintForm, setShowSprintForm] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showRankingAlert, setShowRankingAlert] = useState(false)
  const [uncompletedSprint, setUncompletedSprint] = useState<Sprint | null>(null)
  const [unclaimedPrize, setUnclaimedPrize] = useState<Prize | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sprints and projects
        const [sprintsResponse, projectsResponse, userResponse] = await Promise.all([
          fetch('/api/sprints'),
          fetch('/api/projects'),
          fetch('/api/auth/session')
        ])
        
        if (!projectsResponse.ok) {
          throw new Error('Failed to fetch projects')
        }
        
        if (!sprintsResponse.ok) {
          throw new Error('Failed to fetch sprints')
        }

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user session')
        }

        const [sprintsData, projectsData, userData] = await Promise.all([
          sprintsResponse.json(),
          projectsResponse.json(),
          userResponse.json()
        ])
        
        setSprints(sprintsData)
        setProjects(projectsData)
        setSelectedSprint(sprintsData[0]?.id || null)
        setUser(userData)
      } catch (error) {
        console.error('Error fetching data:', error)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const userData = await response.json()
          setIsAdmin(userData.role.name === 'ADMIN')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    checkAdminAndSprints()
  }, [])

  useEffect(() => {
    const checkUnclaimedPrizes = async () => {
      try {
        const response = await fetch('/api/prizes/unclaimed')
        if (response.ok) {
          const prizes = await response.json()
          if (prizes.length > 0) {
            setUnclaimedPrize(prizes[0]) // Show first unclaimed prize
          }
        }
      } catch (error) {
        console.error('Error checking unclaimed prizes:', error)
      }
    }

    if (user) {
      checkUnclaimedPrizes()
    }
  }, [user])

  const checkAdminAndSprints = async () => {
    try {
      // Check if user is admin
      const userResponse = await fetch('/api/auth/session')
      if (userResponse.ok) {
        const userData: User = await userResponse.json()
        const isUserAdmin = userData.role.name === 'ADMIN'
        setIsAdmin(isUserAdmin)

        // If admin, check for uncompleted sprint rankings
        if (isUserAdmin) {
          const sprintsResponse = await fetch('/api/sprints')
          if (sprintsResponse.ok) {
            const sprints: Sprint[] = await sprintsResponse.json()
            const now = new Date()

            // Find the latest ended sprint that isn't completed
            const uncompletedEndedSprint = sprints
              .filter(sprint => new Date(sprint.endDate) < now && !sprint.isCompleted)
              .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0]

            if (uncompletedEndedSprint) {
              setUncompletedSprint(uncompletedEndedSprint)
              setShowRankingAlert(true)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking admin status and sprints:', error)
    }
  }

  const filteredProjects = projects.filter(project => {
    if (!selectedSprint) return true
    return project.sprintId === selectedSprint
  })

  const isProjectLeader = (project: Project) => {
    return project.leaders.some(leader => leader.userId === user?.id)
  }

  const handleProjectClick = (projectId: number) => {
    router.push(`/projects/${projectId}` as const)
  }

  const handleSprintCreated = () => {
    // Refresh your sprints data here
    fetchSprints()
  }

  const fetchSprints = async () => {
    try {
      const response = await fetch('/api/sprints')
      if (!response.ok) throw new Error('Failed to fetch sprints')
      const data = await response.json()
      setSprints(data)
    } catch (error) {
      console.error('Error fetching sprints:', error)
    }
  }

  const handleClaimPrize = async (prizeId: number) => {
    try {
      const response = await fetch(`/api/prizes/${prizeId}/claim`, {
        method: 'POST'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to claim prize')
      }

      setUnclaimedPrize(null)
    } catch (error) {
      console.error('Error claiming prize:', error)
      alert(error instanceof Error ? error.message : 'Failed to claim prize')
    }
  }

  const handleAcknowledgePrize = async (prizeId: number) => {
    try {
      const response = await fetch(`/api/prizes/${prizeId}/acknowledge`, {
        method: 'POST'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to acknowledge prize')
      }

      setUnclaimedPrize(null)
    } catch (error) {
      console.error('Error acknowledging prize:', error)
      alert(error instanceof Error ? error.message : 'Failed to acknowledge prize')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen pt-16">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {isAdmin && showRankingAlert && uncompletedSprint && (
          <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-blue-500">
                Sprint Rankings Need Attention
              </h3>
              <p className="text-sm text-blue-400 mt-1">
                {uncompletedSprint.name} has ended and needs rankings to be completed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRankingAlert(false)}
                className="px-3 py-1.5 text-sm text-blue-500 hover:text-blue-400 transition-colors"
              >
                Dismiss
              </button>
              <Link
                href="/leaderboard"
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Update Rankings
              </Link>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Projects Dashboard</h1>
            {user && (
              <p className="text-slate-400 mt-1">
                Logged in as <span className="text-blue-400">{user.username}</span>
                {user.role && (
                  <span className="ml-2 px-2 py-1 bg-slate-800 rounded-full text-xs">
                    {user.role.displayName}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                onClick={() => setShowSprintForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Create Sprint
              </button>
            )}
            {(user?.role.name === 'ADMIN' || user?.role.name === 'TEAM_LEADER') && (
              <Link
                href="/projects/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                New Project
              </Link>
            )}
            <select
              value={selectedSprint || ''}
              onChange={(e) => setSelectedSprint(Number(e.target.value) || null)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sprints</option>
              {sprints.map(sprint => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name} ({new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className={`bg-slate-800 rounded-lg p-6 border transition-colors cursor-pointer ${
                isProjectLeader(project)
                  ? 'border-blue-500/50 hover:border-blue-500'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{project.name}</h3>
                {isProjectLeader(project) && (
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                    Project Leader
                  </span>
                )}
              </div>
              <p className="text-slate-300 mb-4">{project.description}</p>
              <div className="space-y-2">
                <div className="text-sm text-slate-400 flex items-center gap-2">
                  Sprint: {sprints.find(s => s.id === project.sprintId)?.name || 'Unassigned'}
                  {project.sprint?.hasPrize && <PrizeIcon />}
                </div>
                {project.leaders.length > 0 && (
                  <div className="text-sm text-slate-400">
                    Led by: {project.leaders.map(leader => 
                      leader.user.displayName || leader.user.username
                    ).join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center text-slate-400 py-8">
              No projects found for the selected sprint
            </div>
          )}
        </div>

        {showSprintForm && (
          <SprintForm
            onClose={() => setShowSprintForm(false)}
            onSprintCreated={fetchSprints}
          />
        )}

        {/* Prize notification */}
        {unclaimedPrize && (
          <PrizeNotification
            prize={unclaimedPrize}
            onClaim={handleClaimPrize}
            onAcknowledge={handleAcknowledgePrize}
            onDismiss={() => setUnclaimedPrize(null)}
          />
        )}
      </div>
    </div>
  )
} 