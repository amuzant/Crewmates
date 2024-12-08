'use client'
import { useState, useEffect } from 'react'

interface User {
  id: number
  username: string
  pointsBalance: number
  role: {
    name: string
    displayName: string
  }
}

export function PointsManager() {
  const [users, setUsers] = useState<User[]>([])
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        // Filtrăm adminii din listă
        setUsers(data.filter((user: User) => user.role.name !== 'ADMIN'))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with values:', { selectedUser, amount, reason })
    
    if (!selectedUser || !amount || !reason) {
      console.log('Missing required fields')
      return
    }

    setLoading(true)
    try {
      const requestData = {
        userId: selectedUser,
        amount: parseInt(amount),
        reason: reason.trim()
      }

      console.log('Sending request with data:', requestData)

      const response = await fetch('/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('Response status:', response.status)
      const responseText = await response.text()
      console.log('Raw response:', responseText)

      let responseData
      try {
        responseData = responseText ? JSON.parse(responseText) : null
        console.log('Parsed response data:', responseData)
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        responseData = null
      }

      if (!response.ok) {
        const errorMessage = responseData?.error || `Server error (${response.status}): ${response.statusText}`
        console.error('Error response:', errorMessage)
        setMessage(errorMessage)
        return
      }

      if (responseData?.success) {
        console.log('Success! Updated data:', responseData.data)
        setMessage('Points added successfully!')
        setAmount('')
        setReason('')
        setSelectedUser(null)
        fetchUsers()
      } else {
        console.error('Unexpected response format:', responseData)
        setMessage('Unexpected response format')
      }
    } catch (error) {
      console.error('Network error:', error)
      setMessage('Network error occurred')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-6 text-white">
      <h2 className="text-2xl font-bold mb-6 text-white">Manage User Points</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Select User
          </label>
          <select
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(Number(e.target.value))}
            className="w-full p-2 border rounded-md bg-slate-700 text-white border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          >
            <option value="" className="bg-slate-700">Choose a user</option>
            {users.map(user => (
              <option key={user.id} value={user.id} className="bg-slate-700">
                {user.username} - Current Balance: {user.pointsBalance} points
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded-md bg-slate-700 text-white border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter amount"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Reason
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border rounded-md bg-slate-700 text-white border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter reason"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Adding Points...' : 'Add Points'}
        </button>

        {message && (
          <div className={`text-center p-2 rounded ${
            message.includes('success') 
              ? 'bg-green-900 text-green-200' 
              : 'bg-red-900 text-red-200'
          }`}>
            {message}
          </div>
        )}
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-white">User Balances</h3>
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="flex justify-between items-center p-2 bg-slate-700 rounded text-white">
              <span>{user.username}</span>
              <span className="font-semibold text-green-400">{user.pointsBalance} points</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 