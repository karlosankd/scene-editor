import { useState, useMemo, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import type { ObjectType } from '@/types'
import type {
  HierarchyFilter,
  ContextMenuState,
  DragState,
  RenameState,
  FlattenedObject,
} from '../types'
import { filterObjects, flattenHierarchy } from '../utils'

const initialFilter: HierarchyFilter = {
  searchQuery: '',
  typeFilters: [],
}

const initialContextMenu: ContextMenuState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  targetId: null,
}

const initialDragState: DragState = {
  isDragging: false,
  draggedId: null,
  dropTargetId: null,
  dropPosition: null,
}

const initialRenameState: RenameState = {
  isRenaming: false,
  targetId: null,
  value: '',
}

export function useHierarchyState() {
  const objects = useEditorStore((state) => state.objects)
  const rootObjectIds = useEditorStore((state) => state.rootObjectIds)
  const updateObject = useEditorStore((state) => state.updateObject)

  // Local state
  const [filter, setFilter] = useState<HierarchyFilter>(initialFilter)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(initialContextMenu)
  const [dragState, setDragStateRaw] = useState<DragState>(initialDragState)
  const [renameState, setRenameState] = useState<RenameState>(initialRenameState)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(rootObjectIds))
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  // Filter actions
  const setSearchQuery = useCallback((query: string) => {
    setFilter((prev) => ({ ...prev, searchQuery: query }))
  }, [])

  const toggleTypeFilter = useCallback((type: ObjectType) => {
    setFilter((prev) => {
      const typeFilters = prev.typeFilters.includes(type)
        ? prev.typeFilters.filter((t) => t !== type)
        : [...prev.typeFilters, type]
      return { ...prev, typeFilters }
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilter(initialFilter)
  }, [])

  // Context menu actions
  const openContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      targetId: id,
    })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(initialContextMenu)
  }, [])

  // Drag state actions
  const setDragState = useCallback((updates: Partial<DragState>) => {
    setDragStateRaw((prev) => ({ ...prev, ...updates }))
  }, [])

  const resetDragState = useCallback(() => {
    setDragStateRaw(initialDragState)
  }, [])

  // Rename actions
  const startRename = useCallback((id: string) => {
    const obj = objects[id]
    if (obj) {
      setRenameState({
        isRenaming: true,
        targetId: id,
        value: obj.name,
      })
    }
  }, [objects])

  const updateRenameValue = useCallback((value: string) => {
    setRenameState((prev) => ({ ...prev, value }))
  }, [])

  const submitRename = useCallback(() => {
    if (renameState.targetId && renameState.value.trim()) {
      updateObject(renameState.targetId, { name: renameState.value.trim() })
    }
    setRenameState(initialRenameState)
  }, [renameState, updateObject])

  const cancelRename = useCallback(() => {
    setRenameState(initialRenameState)
  }, [])

  // Expanded state actions
  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(Object.keys(objects)))
  }, [objects])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  // Computed values
  const isFiltering = filter.searchQuery.trim() !== '' || filter.typeFilters.length > 0

  const filteredIds = useMemo(() => {
    if (!isFiltering) return undefined
    return filterObjects(objects, rootObjectIds, filter)
  }, [objects, rootObjectIds, filter, isFiltering])

  const flattenedObjects: FlattenedObject[] = useMemo(() => {
    return flattenHierarchy(objects, rootObjectIds, expandedIds, filteredIds)
  }, [objects, rootObjectIds, expandedIds, filteredIds])

  return {
    // State
    filter,
    contextMenu,
    dragState,
    renameState,
    expandedIds,
    lastSelectedId,
    isFiltering,

    // Filter actions
    setSearchQuery,
    toggleTypeFilter,
    clearFilters,

    // Context menu actions
    openContextMenu,
    closeContextMenu,

    // Drag state actions
    setDragState,
    resetDragState,

    // Rename actions
    startRename,
    updateRenameValue,
    submitRename,
    cancelRename,

    // Expanded state actions
    toggleExpanded,
    expandAll,
    collapseAll,

    // Selection tracking
    setLastSelectedId,

    // Computed
    filteredIds,
    flattenedObjects,
  }
}

export type UseHierarchyStateReturn = ReturnType<typeof useHierarchyState>
