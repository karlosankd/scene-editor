import type { ReactNode } from 'react'
import type { ObjectType } from '@/types'

interface TypeFilterButtonProps {
  type: ObjectType
  label: string
  icon: ReactNode
  isActive: boolean
  onClick: () => void
}

export function TypeFilterButton({
  label,
  icon,
  isActive,
  onClick,
}: TypeFilterButtonProps) {
  return (
    <button
      className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
        isActive
          ? 'bg-ue-accent-blue text-white'
          : 'bg-ue-bg-dark text-ue-text-secondary hover:bg-ue-bg-hover hover:text-ue-text-primary'
      }`}
      onClick={onClick}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
