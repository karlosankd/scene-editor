import { Search, X, Box, Sun, Camera, Layers, Sparkles } from 'lucide-react'
import type { ObjectType } from '@/types'
import { TypeFilterButton } from './TypeFilterButton'
import { TYPE_FILTER_OPTIONS } from '../utils'

interface SearchBarProps {
  searchQuery: string
  typeFilters: ObjectType[]
  onSearchChange: (query: string) => void
  onTypeToggle: (type: ObjectType) => void
  onClear: () => void
}

const iconMap: Record<string, React.ReactNode> = {
  box: <Box size={12} />,
  sun: <Sun size={12} />,
  camera: <Camera size={12} />,
  layers: <Layers size={12} />,
  sparkles: <Sparkles size={12} />,
}

export function SearchBar({
  searchQuery,
  typeFilters,
  onSearchChange,
  onTypeToggle,
  onClear,
}: SearchBarProps) {
  const hasFilters = searchQuery.trim() !== '' || typeFilters.length > 0

  return (
    <div className="border-b border-ue-border">
      {/* Search Input */}
      <div className="flex items-center px-2 py-1.5 gap-2">
        <Search size={14} className="text-ue-text-muted flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search objects..."
          className="flex-1 bg-transparent text-sm text-ue-text-primary placeholder-ue-text-muted focus:outline-none"
        />
        {hasFilters && (
          <button
            onClick={onClear}
            className="p-1 hover:bg-ue-bg-hover rounded text-ue-text-muted hover:text-ue-text-primary"
            title="Clear filters"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Type Filters */}
      <div className="flex items-center gap-1 px-2 pb-1.5 flex-wrap">
        {TYPE_FILTER_OPTIONS.map((option) => (
          <TypeFilterButton
            key={option.type}
            type={option.type}
            label={option.label}
            icon={iconMap[option.icon]}
            isActive={typeFilters.includes(option.type)}
            onClick={() => onTypeToggle(option.type)}
          />
        ))}
      </div>
    </div>
  )
}
