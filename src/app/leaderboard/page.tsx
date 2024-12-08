'use client'
import { useState, useEffect } from 'react'
import { Leaderboard } from '@/components/Leaderboard'

interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
}

interface User {
  role: {
    name: string
  }
}

export default function LeaderboardPage() {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [selectedSprint, setSelectedSprint] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sprintsResponse, userResponse] = await Promise.all([
          fetch('/api/sprints'),
          fetch('/api/auth/session')
        ])

        if (sprintsResponse.ok) {
          const sprintsData = await sprintsResponse.json()
          setSprints(sprintsData)
          setSelectedSprint(sprintsData[0]?.id || null)
        }

        if (userResponse.ok) {
          const userData: User = await userResponse.json()
          setIsAdmin(userData.role.name === 'ADMIN')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Project Rankings</h1>
          <select
            value={selectedSprint || ''}
            onChange={(e) => setSelectedSprint(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sprints.map(sprint => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} ({new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {selectedSprint ? (
          <Leaderboard sprintId={selectedSprint} isAdmin={isAdmin} />
        ) : (
          <div className="text-center text-slate-400 py-8">
            No sprints available
          </div>
        )}
      </div>
    </div>
  )
} 