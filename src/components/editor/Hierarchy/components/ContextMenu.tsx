import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/i18n'
import type { ContextMenuAction } from '../types'

interface ContextMenuItem {
  action: ContextMenuAction
  labelKey: keyof typeof import('@/i18n/translations').translations.zh.hierarchy.contextMenu
  shortcut?: string
  separator?: boolean
}

const MENU_ITEMS: ContextMenuItem[] = [
  { action: 'rename', labelKey: 'rename', shortcut: 'F2' },
  { action: 'duplicate', labelKey: 'duplicate', shortcut: 'Ctrl+D' },
  { action: 'copy', labelKey: 'copy', shortcut: 'Ctrl+C' },
  { action: 'paste', labelKey: 'paste', shortcut: 'Ctrl+V' },
  { action: 'delete', labelKey: 'delete', shortcut: 'Del', separator: true },
  { action: 'selectChildren', labelKey: 'selectChildren', separator: true },
  { action: 'createFolder', labelKey: 'createFolder' },
  { action: 'createMesh', labelKey: 'createMesh' },
  { action: 'createLight', labelKey: 'createLight' },
  { action: 'createCamera', labelKey: 'createCamera' },
  { action: 'createGroup', labelKey: 'createGroup' },
]

interface ContextMenuProps {
  position: { x: number; y: number }
  targetId: string
  canPaste: boolean
  hasChildren: boolean
  onAction: (action: ContextMenuAction) => void
  onClose: () => void
}

export function ContextMenu({
  position,
  canPaste,
  hasChildren,
  onAction,
  onClose,
}: ContextMenuProps) {
  const { t } = useI18n()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
  }, [onClose])

  // Adjust position to stay within viewport
  const adjustedPosition = { ...position }
  const menuWidth = 200
  const menuHeight = MENU_ITEMS.length * 32

  if (position.x + menuWidth > window.innerWidth) {
    adjustedPosition.x = window.innerWidth - menuWidth - 8
  }
  if (position.y + menuHeight > window.innerHeight) {
    adjustedPosition.y = window.innerHeight - menuHeight - 8
  }

  const handleItemClick = (action: ContextMenuAction) => {
    onAction(action)
    onClose()
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed bg-ue-bg-light border border-ue-border rounded shadow-lg py-1 z-50 min-w-[180px]"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {MENU_ITEMS.map((item, index) => {
        const isDisabled =
          (item.action === 'paste' && !canPaste) ||
          (item.action === 'selectChildren' && !hasChildren)

        const label = t.hierarchy.contextMenu[item.labelKey]

        return (
          <div key={item.action}>
            {item.separator && index > 0 && (
              <div className="h-px bg-ue-border my-1" />
            )}
            <button
              className={`w-full flex items-center justify-between px-3 py-1.5 text-sm text-left ${
                isDisabled
                  ? 'text-ue-text-muted cursor-not-allowed'
                  : 'text-ue-text-primary hover:bg-ue-bg-hover'
              }`}
              onClick={() => !isDisabled && handleItemClick(item.action)}
              disabled={isDisabled}
            >
              <span>{label}</span>
              {item.shortcut && (
                <span className="text-xs text-ue-text-muted ml-4">{item.shortcut}</span>
              )}
            </button>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
