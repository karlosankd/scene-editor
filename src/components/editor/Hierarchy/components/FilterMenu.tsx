import { useEffect, useRef } from 'react'
import {
  Box,
  Sun,
  Camera,
  Layers,
  Folder,
  Sparkles,
  Package,
  Check
} from 'lucide-react'
import { useI18n } from '@/i18n'
import type { ObjectType } from '@/types'

interface FilterMenuProps {
  isOpen: boolean
  onClose: () => void
  position: { x: number; y: number }
  activeFilters: ObjectType[]
  onToggleFilter: (type: ObjectType) => void
  onClearFilters: () => void
}

const FILTER_OPTIONS: Array<{ type: ObjectType; icon: typeof Box; color: string }> = [
  { type: 'mesh', icon: Box, color: '#7aa3cc' },
  { type: 'light', icon: Sun, color: '#ffd966' },
  { type: 'camera', icon: Camera, color: '#a8d08d' },
  { type: 'group', icon: Layers, color: '#c9c9c9' },
  { type: 'folder', icon: Folder, color: '#f4b183' },
  { type: 'particle', icon: Sparkles, color: '#da70d6' },
  { type: 'model', icon: Package, color: '#8faadc' },
]

export function FilterMenu({
  isOpen,
  onClose,
  position,
  activeFilters,
  onToggleFilter,
  onClearFilters,
}: FilterMenuProps) {
  const { t } = useI18n()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#252526] border border-[#454545] rounded shadow-lg min-w-[180px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 text-[11px] text-[#cccccc] border-b border-[#454545] font-semibold">
        {t.hierarchy.filterByType}
      </div>

      {/* Filter Options */}
      <div className="py-1">
        {FILTER_OPTIONS.map(({ type, icon: Icon, color }) => {
          const isActive = activeFilters.includes(type)
          const label = t.hierarchy.objectTypes[type]
          return (
            <button
              key={type}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#cccccc] hover:bg-[#2a2d2e] transition-colors"
              onClick={() => onToggleFilter(type)}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                {isActive && <Check size={14} className="text-[#0d6efd]" />}
              </div>
              <Icon size={14} style={{ color }} />
              <span className="flex-1 text-left">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      {activeFilters.length > 0 && (
        <>
          <div className="border-t border-[#454545]" />
          <button
            className="w-full px-3 py-2 text-[11px] text-[#4a9eff] hover:bg-[#2a2d2e] text-left transition-colors"
            onClick={onClearFilters}
          >
            {t.hierarchy.clearAllFilters}
          </button>
        </>
      )}
    </div>
  )
}
