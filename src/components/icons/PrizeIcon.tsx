export function PrizeIcon() {
  return (
    <div className="relative group">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 text-purple-400" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" 
          clipRule="evenodd"
        />
        <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
      </svg>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-slate-900 text-xs text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none">
          Prize Sprint
        </div>
      </div>
    </div>
  )
} 