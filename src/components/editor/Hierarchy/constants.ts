import type { ObjectType } from '@/types'
import type { ContextMenuAction } from './types'

/**
 * Context menu item definition
 */
export interface ContextMenuItem {
  action: ContextMenuAction
  label: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
}

/**
 * Main context menu items
 */
export const CONTEXT_MENU_ITEMS: ContextMenuItem[] = [
  { action: 'rename', label: 'Rename', shortcut: 'F2' },
  { action: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D' },
  { action: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
  { action: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
  { action: 'delete', label: 'Delete', shortcut: 'Del', separator: true },
  { action: 'selectChildren', label: 'Select Children', separator: true },
  { action: 'createMesh', label: 'Create Mesh Child' },
  { action: 'createLight', label: 'Create Light Child' },
  { action: 'createCamera', label: 'Create Camera Child' },
  { action: 'createGroup', label: 'Create Group Child' },
]

/**
 * Create child object options
 */
export const CREATE_CHILD_OPTIONS: { type: ObjectType; label: string }[] = [
  { type: 'mesh', label: 'Mesh' },
  { type: 'light', label: 'Light' },
  { type: 'camera', label: 'Camera' },
  { type: 'group', label: 'Group' },
]

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  RENAME: 'F2',
  DELETE: 'Delete',
  COPY: 'c',
  PASTE: 'v',
  DUPLICATE: 'd',
  SELECT_ALL: 'a',
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
} as const

/**
 * Drop position threshold (percentage of item height)
 */
export const DROP_THRESHOLD = {
  TOP: 0.25,
  BOTTOM: 0.75,
} as const
