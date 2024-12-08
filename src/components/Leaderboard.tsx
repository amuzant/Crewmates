'use client'
import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

interface Project {
  id: number
  name: string
  description: string | null
}

interface Ranking {
  id: number
  rank: number
  project: Project
}

interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
}

interface SprintRankingStatus {
  isComplete: boolean
  lastUpdated: string | null
}

export function Leaderboard() {
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [unrankedProjects, setUnrankedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [latestSprint, setLatestSprint] = useState<Sprint | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [rankingStatus, setRankingStatus] = useState<SprintRankingStatus>({
    isComplete: false,
    lastUpdated: null
  })

  useEffect(() => {
    fetchLatestSprintAndData()
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const userData = await response.json()
        setIsAdmin(userData.role.name === 'ADMIN')
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  const fetchLatestSprintAndData = async () => {
    try {
      // First get the latest ended sprint
      const sprintsResponse = await fetch('/api/sprints')
      if (!sprintsResponse.ok) throw new Error('Failed to fetch sprints')
      const sprints: Sprint[] = await sprintsResponse.json()

      // Find the latest ended sprint
      const now = new Date()
      const endedSprints = sprints
        .filter(sprint => new Date(sprint.endDate) < now)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())

      const latestEndedSprint = endedSprints[0]
      setLatestSprint(latestEndedSprint)

      if (latestEndedSprint) {
        // Fetch rankings and unranked projects
        await Promise.all([
          fetchRankings(latestEndedSprint.id),
          fetchUnrankedProjects(latestEndedSprint.id),
          fetchRankingStatus(latestEndedSprint.id)
        ])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchRankings = async (sprintId: number) => {
    try {
      const response = await fetch(`/api/sprints/${sprintId}/rankings`)
      const contentType = response.headers.get('content-type')
      
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid response type')
      }

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch rankings')
      }

      setRankings(data)
    } catch (error) {
      console.error('Error fetching rankings:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch rankings')
    }
  }

  const fetchUnrankedProjects = async (sprintId: number) => {
    try {
      const response = await fetch(`/api/sprints/${sprintId}/projects`)
      const contentType = response.headers.get('content-type')
      
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid response type')
      }

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects')
      }

      setUnrankedProjects(data)
    } catch (error) {
      console.error('Error fetching unranked projects:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch projects')
    }
  }

  const fetchRankingStatus = async (sprintId: number) => {
    try {
      const response = await fetch(`/api/sprints/${sprintId}/rankings/status`)
      if (!response.ok) {
        throw new Error('Failed to fetch ranking status')
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid response type')
      }

      const data = await response.json()
      if (!data) {
        throw new Error('No data received')
      }

      console.log('Ranking status:', data)
      setRankingStatus({
        isComplete: data.isComplete ?? false,
        lastUpdated: data.lastUpdated
      })
    } catch (error) {
      console.error('Error fetching ranking status:', error)
      // Don't show error to user, just set default values
      setRankingStatus({
        isComplete: false,
        lastUpdated: null
      })
    }
  }

  const handleSaveRankings = async () => {
    if (!latestSprint) return
    console.log('[Save] Starting save rankings')
    console.log('[Save] Current rankings:', rankings)
    console.log('[Save] Current unranked projects:', unrankedProjects)

    try {
      // Convert unranked projects to rankings with sequential ranks
      const startRank = rankings.length + 1
      const unrankedRankings = unrankedProjects.map((project, index) => ({
        projectId: project.id,
        rank: startRank + index
      }))

      // Combine existing rankings with unranked projects
      const allRankings = [
        ...rankings.map((r, index) => ({
          projectId: r.project.id,
          rank: index + 1
        })),
        ...unrankedRankings
      ]

      console.log('[Save] All rankings data to save:', allRankings)

      // Save all rankings
      const response = await fetch(`/api/sprints/${latestSprint.id}/rankings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rankings: allRankings }),
      })

      const responseData = await response.json()
      console.log('[Save] Rankings save response:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save rankings')
      }

      // Mark rankings as complete
      console.log('[Save] Marking sprint as complete')
      const completeResponse = await fetch(`/api/sprints/${latestSprint.id}/rankings/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!completeResponse.ok) {
        const completeData = await completeResponse.json()
        console.error('[Save] Complete response error:', completeData)
        throw new Error('Failed to complete rankings')
      }

      const completeData = await completeResponse.json()
      console.log('[Save] Complete response:', completeData)

      // Update UI
      setRankings(responseData)
      setUnrankedProjects([]) // Clear unranked projects as they're now ranked
      setEditMode(false)
      await fetchRankingStatus(latestSprint.id)
      alert('Rankings saved successfully!')
    } catch (error) {
      console.error('[Save] Error in handleSaveRankings:', error)
      alert('Failed to save rankings. Please try again.')
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !latestSprint) return

    const { source, destination, draggableId } = result
    console.log('Drag end event:', { source, destination, draggableId })
    console.log('Current rankings before update:', rankings)
    console.log('Current unranked projects:', unrankedProjects)

    try {
      let newRankings = Array.from(rankings)
      let newUnrankedProjects = Array.from(unrankedProjects)

      // Handle moving within rankings
      if (source.droppableId === 'rankings' && destination.droppableId === 'rankings') {
        console.log('Moving within rankings')
        const [removed] = newRankings.splice(source.index, 1)
        newRankings.splice(destination.index, 0, removed)
      }
      // Handle moving from unranked to rankings
      else if (source.droppableId === 'unranked' && destination.droppableId === 'rankings') {
        console.log('Moving from unranked to rankings')
        const projectId = parseInt(draggableId.split('-')[1])
        const project = unrankedProjects.find(p => p.id === projectId)
        
        if (!project) {
          console.error('Project not found:', projectId)
          return
        }

        console.log('Project being moved:', project)
        
        // Remove from unranked
        newUnrankedProjects = newUnrankedProjects.filter(p => p.id !== projectId)
        
        // Create new ranking
        const newRanking = {
          id: Date.now(),
          rank: destination.index + 1,
          project
        }
        console.log('New ranking created:', newRanking)
        
        // Add to rankings
        newRankings.splice(destination.index, 0, newRanking)

        // Update all ranks
        newRankings = newRankings.map((r, index) => ({
          ...r,
          rank: index + 1
        }))
      }
      // Handle moving from rankings to unranked
      else if (source.droppableId === 'rankings' && destination.droppableId === 'unranked') {
        console.log('Moving from rankings to unranked')
        const [removedRanking] = newRankings.splice(source.index, 1)
        newUnrankedProjects.splice(destination.index, 0, removedRanking.project)
      }
      // Handle moving within unranked
      else if (source.droppableId === 'unranked' && destination.droppableId === 'unranked') {
        console.log('Moving within unranked')
        const [removed] = newUnrankedProjects.splice(source.index, 1)
        newUnrankedProjects.splice(destination.index, 0, removed)
      }

      console.log('Updated rankings:', newRankings)
      console.log('Updated unranked projects:', newUnrankedProjects)

      // Update states immediately
      setRankings(newRankings)
      setUnrankedProjects(newUnrankedProjects)

      // Save to server if rankings were modified
      if (destination.droppableId === 'rankings' || source.droppableId === 'rankings') {
        const rankingsData = newRankings.map(r => ({
          projectId: r.project.id,
          rank: r.rank
        }))
        console.log('Rankings data to send to server:', rankingsData)

        const response = await fetch(`/api/sprints/${latestSprint.id}/rankings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rankings: rankingsData }),
        })

        const responseData = await response.json()
        console.log('Server response:', responseData)

        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to save rankings')
        }

        // Update rankings with server data
        setRankings(responseData)
      }
    } catch (error) {
      console.error('Error in handleDragEnd:', error)
      // Revert changes on error
      await fetchLatestSprintAndData()
      alert('Failed to save rankings. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-lg">
        {error}
      </div>
    )
  }

  if (!latestSprint) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="text-center py-8 text-slate-400">
          <p className="mb-2">No completed sprints found</p>
          <p className="text-sm">Rankings will be available once a sprint is completed</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Latest Sprint Rankings</h2>
          <p className="text-sm text-slate-400 mt-1">
            {latestSprint.name} ({new Date(latestSprint.startDate).toLocaleDateString()} - {new Date(latestSprint.endDate).toLocaleDateString()})
          </p>
          {rankingStatus.lastUpdated && (
            <p className="text-xs text-slate-500 mt-1">
              Last updated: {new Date(rankingStatus.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        {isAdmin && !rankingStatus.isComplete && (
          <div className="flex gap-4">
            {editMode ? (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRankings}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Save Rankings
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Edit Rankings
              </button>
            )}
          </div>
        )}
      </div>

      {!rankingStatus.isComplete && !isAdmin ? (
        <div className="text-center py-12 bg-slate-700/30 rounded-lg">
          <p className="text-lg text-slate-300">Rankings have not been finalized yet.</p>
          <p className="text-sm text-slate-400 mt-2">Please check back later.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            <Droppable 
              droppableId="rankings" 
              isDropDisabled={!editMode}
              isCombineEnabled={false}
              type="RANKING"
              ignoreContainerClipping={false}
              mode="standard"
              direction="vertical"
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-4"
                >
                  {rankings.map((ranking, index) => (
                    <Draggable
                      key={ranking.id}
                      draggableId={`ranking-${ranking.id}`}
                      index={index}
                      isDragDisabled={!editMode}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center gap-4 bg-slate-700/50 p-4 rounded-lg ${
                            snapshot.isDragging ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <div className={`text-2xl font-bold ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-slate-300' :
                            index === 2 ? 'text-amber-600' :
                            'text-slate-400'
                          } w-8`}>
                            {ranking.rank}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{ranking.project.name}</h3>
                            {ranking.project.description && (
                              <p className="text-sm text-slate-400">{ranking.project.description}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {editMode && unrankedProjects.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Unranked Projects</h3>
                <Droppable 
                  droppableId="unranked"
                  isDropDisabled={!editMode}
                  isCombineEnabled={false}
                  type="RANKING"
                  ignoreContainerClipping={false}
                  mode="standard"
                  direction="vertical"
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2"
                    >
                      {unrankedProjects.map((project, index) => (
                        <Draggable
                          key={project.id}
                          draggableId={`project-${project.id}`}
                          index={index}
                          isDragDisabled={!editMode}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors ${
                                snapshot.isDragging ? 'ring-2 ring-blue-500' : ''
                              }`}
                            >
                              <h4 className="font-medium">{project.name}</h4>
                              {project.description && (
                                <p className="text-sm text-slate-400">{project.description}</p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )}
          </div>
        </DragDropContext>
      )}
    </div>
  )
}