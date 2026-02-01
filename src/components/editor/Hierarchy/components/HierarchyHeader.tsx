import { Eye } from 'lucide-react'
import { useI18n } from '@/i18n'

export function HierarchyHeader() {
  const { t } = useI18n()

  return (
    <div className="flex items-center h-[22px] bg-[#1e1e1e] border-b border-[#3a3a3a] text-[11px] text-[#808080] select-none flex-shrink-0">
      {/* Visibility Column - Fixed 24px */}
      <div className="w-6 h-full flex items-center justify-center flex-shrink-0">
        <Eye size={12} className="opacity-60" />
      </div>

      {/* Label Column - Flex */}
      <div className="flex-1 px-1 flex items-center min-w-0">
        <span className="truncate">{t.hierarchy.label}</span>
      </div>

      {/* Type Column - Fixed ~100px */}
      <div className="w-[100px] flex-shrink-0 px-2 flex items-center">
        <span className="truncate">{t.hierarchy.type}</span>
      </div>
    </div>
  )
}
