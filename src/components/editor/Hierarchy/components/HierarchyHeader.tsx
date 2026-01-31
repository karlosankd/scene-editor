import { useState, useRef, useEffect } from 'react'
import { Eye, Settings, ChevronDown } from 'lucide-react'
import { useI18n } from '@/i18n'

export interface ColumnConfig {
  showVisibility: boolean
  showType: boolean
}

interface HierarchyHeaderProps {
  columnConfig: ColumnConfig
  onColumnConfigChange: (config: ColumnConfig) => void
}

export function HierarchyHeader({
  columnConfig,
  onColumnConfigChange,
}: HierarchyHeaderProps) {
  const { t } = useI18n()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex items-center h-6 bg-[#252525] border-b border-[#3a3a3a] text-[10px] text-[#808080] uppercase tracking-wide select-none">
      {/* 可见性列头 */}
      <div className="w-6 h-full flex items-center justify-center border-r border-[#3a3a3a]" title={t.hierarchy.visibility}>
        <Eye size={10} />
      </div>

      {/* 名称列头 */}
      <div className="flex-1 px-2 flex items-center">
        <span>{t.hierarchy.label}</span>
      </div>

      {/* 列设置下拉菜单 */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-6 h-full flex items-center justify-center hover:bg-[#2a2a2a] hover:text-[#c8c8c8]"
          title={t.hierarchy.columns}
        >
          <Settings size={10} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-[#252525] border border-[#3a3a3a] rounded shadow-lg z-50">
            <div className="px-2 py-1.5 text-[10px] text-[#808080] uppercase tracking-wide border-b border-[#3a3a3a]">
              {t.hierarchy.columns}
            </div>
            <button
              onClick={() => onColumnConfigChange({ ...columnConfig, showVisibility: !columnConfig.showVisibility })}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#c8c8c8] hover:bg-[#2a2a2a]"
            >
              <span className={columnConfig.showVisibility ? 'text-[#4a9eff]' : 'text-[#606060]'}>
                {columnConfig.showVisibility ? '✓' : '○'}
              </span>
              <Eye size={12} />
              <span>{t.hierarchy.visibility}</span>
            </button>
            <button
              onClick={() => onColumnConfigChange({ ...columnConfig, showType: !columnConfig.showType })}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#c8c8c8] hover:bg-[#2a2a2a]"
            >
              <span className={columnConfig.showType ? 'text-[#4a9eff]' : 'text-[#606060]'}>
                {columnConfig.showType ? '✓' : '○'}
              </span>
              <ChevronDown size={12} />
              <span>{t.hierarchy.type}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
