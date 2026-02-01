import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { useI18n } from '@/i18n'

export interface HierarchySettings {
  // 显示选项
  showOnlySelected: boolean      // 仅选定
  hideEmptyFolders: boolean      // 隐藏空文件夹
  hideHiddenObjects: boolean     // 隐藏隐藏的对象
  // 选项
  focusOnSelect: boolean         // 选中时自动聚焦
  doubleClickToEnterFolder: boolean // 双击切换当前文件夹
}

export const defaultHierarchySettings: HierarchySettings = {
  showOnlySelected: false,
  hideEmptyFolders: false,
  hideHiddenObjects: false,
  focusOnSelect: false,
  doubleClickToEnterFolder: true,
}

interface SettingsMenuProps {
  isOpen: boolean
  onClose: () => void
  position: { x: number; y: number }
  settings: HierarchySettings
  onSettingsChange: (settings: HierarchySettings) => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

interface MenuItemProps {
  label: string
  checked?: boolean
  onClick: () => void
  isAction?: boolean
}

function MenuItem({ label, checked, onClick, isAction }: MenuItemProps) {
  return (
    <button
      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#cccccc] hover:bg-[#2a2d2e] transition-colors text-left"
      onClick={onClick}
    >
      {!isAction && (
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {checked && <Check size={14} className="text-[#0d6efd]" />}
        </div>
      )}
      <span className={isAction ? 'pl-6' : ''}>{label}</span>
    </button>
  )
}

function MenuSection({ title }: { title: string }) {
  return (
    <div className="px-3 py-1.5 text-[10px] text-[#808080] uppercase tracking-wider">
      {title}
    </div>
  )
}

function MenuDivider() {
  return <div className="h-px bg-[#454545] my-1" />
}

export function SettingsMenu({
  isOpen,
  onClose,
  position,
  settings,
  onSettingsChange,
  onExpandAll,
  onCollapseAll,
}: SettingsMenuProps) {
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

  const toggleSetting = (key: keyof HierarchySettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    })
  }

  // Adjust position to stay within viewport
  const adjustedPosition = { ...position }
  const menuWidth = 220
  const menuHeight = 320

  if (position.x + menuWidth > window.innerWidth) {
    adjustedPosition.x = position.x - menuWidth
  }
  if (position.y + menuHeight > window.innerHeight) {
    adjustedPosition.y = window.innerHeight - menuHeight - 8
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#252526] border border-[#454545] rounded shadow-lg min-w-[200px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {/* 层级操作 */}
      <MenuSection title={t.hierarchy.settingsMenu.hierarchy} />
      <MenuItem
        label={t.hierarchy.settingsMenu.expandAll}
        onClick={() => {
          onExpandAll()
          onClose()
        }}
        isAction
      />
      <MenuItem
        label={t.hierarchy.settingsMenu.collapseAll}
        onClick={() => {
          onCollapseAll()
          onClose()
        }}
        isAction
      />

      <MenuDivider />

      {/* 显示选项 */}
      <MenuSection title={t.hierarchy.settingsMenu.display} />
      <MenuItem
        label={t.hierarchy.settingsMenu.showOnlySelected}
        checked={settings.showOnlySelected}
        onClick={() => toggleSetting('showOnlySelected')}
      />
      <MenuItem
        label={t.hierarchy.settingsMenu.hideEmptyFolders}
        checked={settings.hideEmptyFolders}
        onClick={() => toggleSetting('hideEmptyFolders')}
      />
      <MenuItem
        label={t.hierarchy.settingsMenu.hideHiddenObjects}
        checked={settings.hideHiddenObjects}
        onClick={() => toggleSetting('hideHiddenObjects')}
      />

      <MenuDivider />

      {/* 选项 */}
      <MenuSection title={t.hierarchy.settingsMenu.options} />
      <MenuItem
        label={t.hierarchy.settingsMenu.focusOnSelect}
        checked={settings.focusOnSelect}
        onClick={() => toggleSetting('focusOnSelect')}
      />
      <MenuItem
        label={t.hierarchy.settingsMenu.doubleClickToEnterFolder}
        checked={settings.doubleClickToEnterFolder}
        onClick={() => toggleSetting('doubleClickToEnterFolder')}
      />
    </div>
  )
}
