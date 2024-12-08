import React, { useState } from 'react'

interface Prize {
  id: number
  name: string
  description: string | null
  photo?: string | null
}

interface PrizeNotificationProps {
  prize: Prize
  onClaim: (prizeId: number) => Promise<void>
  onAcknowledge: (prizeId: number) => Promise<void>
  onDismiss: () => void
}

export function PrizeNotification({ prize, onClaim, onAcknowledge, onDismiss }: PrizeNotificationProps) {
  const [acknowledging, setAcknowledging] = useState(false)

  const handleAccept = async () => {
    try {
      setAcknowledging(true)
      await onAcknowledge(prize.id)
      onDismiss()
    } catch (error) {
      console.error('Error acknowledging prize:', error)
    } finally {
      setAcknowledging(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-slate-700">
        <div className="flex items-center gap-4 mb-4">
          {prize.photo && (
            <div className="w-16 h-16 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0">
              <img
                src={prize.photo}
                alt={prize.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">Congratulations! 🎉</h3>
            <p className="text-slate-300 mt-1">You've won a prize!</p>
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-lg text-white">{prize.name}</h4>
          {prize.description && (
            <p className="text-slate-300 mt-1">{prize.description}</p>
          )}
        </div>

        <button
          onClick={handleAccept}
          disabled={acknowledging}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {acknowledging ? 'Accepting...' : 'Accept Prize'}
        </button>
      </div>
    </div>
  )
} 