'use client'
import { useState, useEffect } from 'react'

interface SprintFormProps {
  onClose: () => void
  onSprintCreated: () => void
}

export function SprintForm({ onClose, onSprintCreated }: SprintFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    hasPrize: false,
    prizeId: ''
  })
  const [prizes, setPrizes] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const response = await fetch('/api/prizes')
        if (!response.ok) throw new Error('Failed to fetch prizes')
        const data = await response.json()
        setPrizes(data)
      } catch (error) {
        console.error('Error fetching prizes:', error)
      }
    }

    fetchPrizes()
  }, [])

  const validateDates = (): string | null => {
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Please select valid dates'
    }

    if (end <= start) {
      return 'End date must be after start date'
    }

    if (start < today) {
      return 'Start date cannot be in the past'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dateError = validateDates()
    if (dateError) {
      setError(dateError)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/sprints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create sprint')
      }

      onSprintCreated()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create sprint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Sprint</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
              Sprint Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasPrize}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    hasPrize: e.target.checked,
                    prizeId: e.target.checked ? prev.prizeId : ''
                  }))
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-slate-300">
                Prize Sprint
              </span>
            </label>
          </div>
          {formData.hasPrize && (
            <div>
              <label htmlFor="prizeId" className="block text-sm font-medium text-slate-300 mb-1">
                Select Prize
              </label>
              <select
                id="prizeId"
                value={formData.prizeId}
                onChange={(e) => setFormData(prev => ({ ...prev, prizeId: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={formData.hasPrize}
              >
                <option value="">Select a prize</option>
                {prizes.map(prize => (
                  <option key={prize.id} value={prize.id}>
                    {prize.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
              {loading ? 'Creating...' : 'Create Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 