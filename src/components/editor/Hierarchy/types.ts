import type { ObjectType, SceneObject } from '@/types'

/**
 * Filter state for the hierarchy panel
 */
export interface HierarchyFilter {
  searchQuery: string
  typeFilters: ObjectType[]
}

/**
 * Context menu actions
 */
export type ContextMenuAction =
  | 'delete'
  | 'duplicate'
  | 'rename'
  | 'copy'
  | 'paste'
  | 'selectChildren'
  | 'createMesh'
  | 'createLight'
  | 'createCamera'
  | 'createGroup'
  | 'createFolder'

/**
 * Clipboard state for copy/paste
 */
export interface ClipboardState {
  copiedId: string | null
  isCut: boolean
}

/**
 * Keyboard navigation state
 */
export interface KeyboardNavState {
  focusedId: string | null
  isNavigating: boolean
}

/**
 * Context menu state
 */
export interface ContextMenuState {
  isOpen: boolean
  position: { x: number; y: number }
  targetId: string | null
}

/**
 * Drag and drop state
 */
export interface DragState {
  isDragging: boolean
  draggedId: string | null
  dropTargetId: string | null
  dropPosition: 'before' | 'after' | 'inside' | null
}

/**
 * Inline rename state
 */
export interface RenameState {
  isRenaming: boolean
  targetId: string | null
  value: string
}

/**
 * Props for the HierarchyItem component
 */
export interface HierarchyItemProps {
  object: SceneObject
  depth?: number
  isFiltered?: boolean
  onContextMenu: (e: React.MouseEvent, id: string) => void
  onStartRename: (id: string) => void
  onDragStart: (id: string) => void
  onDragOver: (id: string, position: 'before' | 'after' | 'inside') => void
  onDragEnd: () => void
  onDrop: (targetId: string) => void
  dragState: DragState
  renameState: RenameState
  onRenameChange: (value: string) => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
  lastSelectedId: string | null
  onShiftClick: (id: string) => void
}

/**
 * Props for the Hierarchy component
 */
export interface HierarchyProps {
  testId?: string
}

/**
 * Flattened object for rendering with hierarchy info
 */
export interface FlattenedObject {
  object: SceneObject
  depth: number
  index: number
  isParentHidden: boolean // 父级是否隐藏（用于继承可见性显示）
}
