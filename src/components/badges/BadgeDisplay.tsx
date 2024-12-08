import { TrophyBadge } from './TrophyBadge'

interface BadgeDisplayProps {
  type: 'GOLD_TROPHY' | 'SILVER_TROPHY' | 'BRONZE_TROPHY'
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

const badgeInfo = {
  GOLD_TROPHY: {
    type: 'gold' as const,
    label: 'Gold Trophy',
    description: 'First Place'
  },
  SILVER_TROPHY: {
    type: 'silver' as const,
    label: 'Silver Trophy',
    description: 'Second Place'
  },
  BRONZE_TROPHY: {
    type: 'bronze' as const,
    label: 'Bronze Trophy',
    description: 'Third Place'
  }
}

const sizes = {
  sm: 20,
  md: 24,
  lg: 32
}

export function BadgeDisplay({ type, size = 'md', showTooltip = true }: BadgeDisplayProps) {
  const info = badgeInfo[type]
  
  return (
    <div className="relative group">
      <TrophyBadge type={info.type} size={sizes[size]} />
      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-slate-900 text-xs text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none">
            <p className="font-medium">{info.label}</p>
            <p className="text-slate-300">{info.description}</p>
          </div>
        </div>
      )}
    </div>
  )
} 