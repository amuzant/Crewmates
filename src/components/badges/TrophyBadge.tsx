interface TrophyBadgeProps {
  type: 'gold' | 'silver' | 'bronze'
  size?: number
}

const colors = {
  gold: {
    primary: '#FCD34D',
    secondary: '#F59E0B',
    shadow: '#D97706'
  },
  silver: {
    primary: '#E5E7EB',
    secondary: '#9CA3AF',
    shadow: '#6B7280'
  },
  bronze: {
    primary: '#D6B4AC',
    secondary: '#B45309',
    shadow: '#92400E'
  }
}

export function TrophyBadge({ type, size = 24 }: TrophyBadgeProps) {
  const color = colors[type]
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 6V17M12 6H7.8C6.11984 6 5.27976 6 4.63803 6.32698C4.07354 6.6146 3.6146 7.07354 3.32698 7.63803C3 8.27976 3 9.11984 3 10.8V11.2C3 12.8802 3 13.7202 3.32698 14.362C3.6146 14.9265 4.07354 15.3854 4.63803 15.673C5.27976 16 6.11984 16 7.8 16H12M12 6H16.2C17.8802 6 18.7202 6 19.362 6.32698C19.9265 6.6146 20.3854 7.07354 20.673 7.63803C21 8.27976 21 9.11984 21 10.8V11.2C21 12.8802 21 13.7202 20.673 14.362C20.3854 14.9265 19.9265 15.3854 19.362 15.673C18.7202 16 17.8802 16 16.2 16H12" 
        stroke={color.secondary} 
        strokeWidth="2"
      />
      <path 
        d="M12 17L8 21M12 17L16 21" 
        stroke={color.shadow} 
        strokeWidth="2"
      />
      <path 
        d="M7 8H9M15 8H17M7 12H9M15 12H17" 
        stroke={color.primary} 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  )
} 