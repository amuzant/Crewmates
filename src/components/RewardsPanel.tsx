import { useState, useEffect } from 'react'

interface Reward {
  id: number
  name: string
  description: string
  cost: number
  _count: {
    claims: number
  }
}

export function RewardsPanel() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchRewards()
    fetchUserPoints()
  }, [])

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/rewards')
      if (response.ok) {
        const data = await response.json()
        setRewards(data)
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
    }
  }

  const fetchUserPoints = async () => {
    try {
      const response = await fetch('/api/points')
      if (response.ok) {
        const data = await response.json()
        const total = data.reduce((sum: number, point: any) => sum + point.amount, 0)
        setUserPoints(total)
      }
    } catch (error) {
      console.error('Error fetching points:', error)
    }
  }

  const claimReward = async (rewardId: number, cost: number) => {
    if (userPoints < cost) {
      alert('Not enough points!')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardId }),
      })

      if (response.ok) {
        fetchUserPoints()
        fetchRewards()
        alert('Reward claimed successfully!')
      } else {
        const error = await response.json()
        alert(error.message)
      }
    } catch (error) {
      console.error('Error claiming reward:', error)
      alert('Failed to claim reward')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Rewards</h2>
      <div className="mb-4">
        <p className="text-lg">Your Points: <span className="font-bold">{userPoints}</span></p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map(reward => (
          <div key={reward.id} className="border rounded-lg p-4 shadow-sm">
            <h3 className="text-xl font-semibold">{reward.name}</h3>
            <p className="text-gray-600 mb-2">{reward.description}</p>
            <p className="text-lg font-bold mb-2">{reward.cost} points</p>
            <button
              onClick={() => claimReward(reward.id, reward.cost)}
              disabled={loading || userPoints < reward.cost}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Claiming...' : 'Claim Reward'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 