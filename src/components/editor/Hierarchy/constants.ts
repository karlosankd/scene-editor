import type { ObjectType } from '@/types'
import type { ContextMenuAction } from './types'

// --- Original Constants ---

export interface ContextMenuItem {
  action: ContextMenuAction
  label: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
}

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

export const CREATE_CHILD_OPTIONS: { type: ObjectType; label: string }[] = [
  { type: 'mesh', label: 'Mesh' },
  { type: 'light', label: 'Light' },
  { type: 'camera', label: 'Camera' },
  { type: 'group', label: 'Group' },
]

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

export const DROP_THRESHOLD = {
  TOP: 0.25,
  BOTTOM: 0.75,
} as const

// --- New UE5 Design Constants ---

export const UE5_COLORS = {
  folder: '#e8a33c', // Orange/Yellow
  light: '#f4d03f',  // Yellow
  sky: '#87ceeb',    // Light Blue
  mesh: '#4a9eff',   // Blue
  camera: '#9b59b6', // Purple
  group: '#808080',  // Gray
  particle: '#ff69b4', // Pink
  atmosphere: '#5dade2', // Teal
  
  // UI Colors
  selected: '#0d6efd',
  selectedText: '#ffffff',
  hover: '#3a3a3a',
  background: '#2a2a2a',
  headerBg: '#252525',
  border: '#3a3a3a',
  text: '#d4d4d4',
  textMuted: '#707070',
} as const

export const UE5_INDENT = 20 // 20px per level
export const UE5_ROW_HEIGHT = 'h-[24px]' // Compact height

export const TYPE_ICONS_MAPPING: Record<ObjectType, string> = {
  folder: 'folder',
  mesh: 'mesh',
  light: 'light',
  camera: 'camera',
  group: 'group',
  particle: 'particle',
  model: 'mesh',
  ui: 'group',
}
