'use client'
import { useState, useEffect } from 'react'
import './SpinWheel.css'

const PRIZES = [
  { id: 1, points: 100, symbol: '💎', color: '#FF6B6B' },
  { id: 2, points: 50, symbol: '⭐', color: '#4ECDC4' },
  { id: 3, points: 200, symbol: '🌟', color: '#45B7D1' },
  { id: 4, points: 75, symbol: '✨', color: '#96CEB4' },
  { id: 5, points: 150, symbol: '🎯', color: '#FFEEAD' },
  { id: 6, points: 25, symbol: '🎲', color: '#D4D4D4' }
]

export function SpinWheel() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [userPoints, setUserPoints] = useState(0)

  useEffect(() => {
    fetchUserPoints()
  }, [])

  const fetchUserPoints = async () => {
    try {
      const response = await fetch('/api/points')
      if (response.ok) {
        const data = await response.json()
        const total = data.reduce((sum: number, point: any) => sum + point.amount, 0)
        setUserPoints(total)
      }
    } catch (error) {
      console.error('Failed to fetch points:', error)
    }
  }

  const getRandomPrize = () => {
    // Use multiple random values for better randomness
    const randomValues = new Uint32Array(4)
    window.crypto.getRandomValues(randomValues)
    
    // Combine random values
    const combinedRandom = randomValues.reduce((acc, val) => acc ^ val, 0)
    return combinedRandom % PRIZES.length
  }

  const spinWheel = async () => {
    if (isSpinning) return

    try {
      setIsSpinning(true)
      
      // Get random prize index
      const prizeIndex = getRandomPrize()
      
      // Calculate spins and angles
      const minSpins = 8
      const maxSpins = 15
      const randomSpins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins
      const fullRotations = randomSpins * 360
      
      const sectionAngle = 360 / PRIZES.length
      const prizeAngle = 360 - (sectionAngle * prizeIndex)
      const randomOffset = (Math.random() * 0.6 + 0.2) * sectionAngle
      
      // Calculate new rotation
      const newRotation = rotation + fullRotations + prizeAngle + randomOffset
      
      // Set new rotation first
      setRotation(newRotation)

      // Calculate random spin duration
      const spinDuration = 4000 + Math.random() * 2000

      // Wait for spin to complete
      await new Promise(resolve => setTimeout(resolve, spinDuration))

      // Award points after spin completes
      const response = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: PRIZES[prizeIndex].points,
          reason: `Lucky Wheel: Won ${PRIZES[prizeIndex].points} points`
        })
      })

      if (response.ok) {
        await fetchUserPoints() // Update points display
      } else {
        throw new Error('Failed to award points')
      }

    } catch (error) {
      console.error('Error during wheel spin:', error)
    } finally {
      setIsSpinning(false)
    }
  }

  return (
    <div className="spin-wheel-container">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-3">Lucky Wheel</h2>
        <div className="bg-slate-800 rounded-lg px-6 py-3 inline-block">
          <p className="text-lg text-white">
            Balance: <span className="font-bold text-green-400">{userPoints}</span>
          </p>
        </div>
      </div>

      <div className="wheel-container">
        <div className="wheel-outer">
          <div 
            className="wheel"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transition: `transform ${isSpinning ? '5s' : '0s'} cubic-bezier(0.17, 0.67, 0.12, 0.99)`
            }}
          >
            {PRIZES.map((prize, index) => (
              <div
                key={prize.id}
                className="wheel-section"
                style={{
                  transform: `rotate(${(360 / PRIZES.length) * index}deg)`,
                }}
              >
                <span className="wheel-text">{prize.symbol}</span>
              </div>
            ))}
          </div>
          <div className="wheel-marker">⬇️</div>
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={spinWheel}
          disabled={isSpinning}
          className="spin-button"
        >
          {isSpinning ? 'Spinning...' : 'Spin!'}
        </button>
      </div>
    </div>
  )
} 