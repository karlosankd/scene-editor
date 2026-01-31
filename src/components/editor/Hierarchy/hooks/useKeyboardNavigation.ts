import { useEffect, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { getNextVisibleId, getPreviousVisibleId } from '../utils'
import { KEYBOARD_SHORTCUTS } from '../constants'
import type { UseHierarchyStateReturn } from './useHierarchyState'

interface UseKeyboardNavigationProps {
  hierarchyState: UseHierarchyStateReturn
  containerRef: React.RefObject<HTMLDivElement>
}

export function useKeyboardNavigation({
  hierarchyState,
  containerRef,
}: UseKeyboardNavigationProps) {
  const {
    flattenedObjects,
    expandedIds,
    toggleExpanded,
    startRename,
    renameState,
    cancelRename,
    closeContextMenu,
    contextMenu,
  } = hierarchyState

  const selectedIds = useEditorStore((state) => state.selectedIds)
  const selectObject = useEditorStore((state) => state.selectObject)
  const removeObject = useEditorStore((state) => state.removeObject)
  const objects = useEditorStore((state) => state.objects)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if renaming
      if (renameState.isRenaming) {
        if (e.key === KEYBOARD_SHORTCUTS.ESCAPE) {
          cancelRename()
        }
        return
      }

      // Close context menu on escape
      if (contextMenu.isOpen && e.key === KEYBOARD_SHORTCUTS.ESCAPE) {
        closeContextMenu()
        return
      }

      // Skip if not focused on container
      if (!containerRef.current?.contains(document.activeElement)) {
        return
      }

      const currentId = selectedIds[0]
      if (!currentId && flattenedObjects.length > 0) {
        // Select first object if none selected
        if (e.key === KEYBOARD_SHORTCUTS.ARROW_DOWN || e.key === KEYBOARD_SHORTCUTS.ARROW_UP) {
          selectObject(flattenedObjects[0].object.id)
          e.preventDefault()
        }
        return
      }

      switch (e.key) {
        case KEYBOARD_SHORTCUTS.ARROW_DOWN: {
          const nextId = getNextVisibleId(flattenedObjects, currentId)
          if (nextId) {
            selectObject(nextId, e.shiftKey)
          }
          e.preventDefault()
          break
        }

        case KEYBOARD_SHORTCUTS.ARROW_UP: {
          const prevId = getPreviousVisibleId(flattenedObjects, currentId)
          if (prevId) {
            selectObject(prevId, e.shiftKey)
          }
          e.preventDefault()
          break
        }

        case KEYBOARD_SHORTCUTS.ARROW_RIGHT: {
          const obj = objects[currentId]
          if (obj && obj.childIds.length > 0) {
            if (!expandedIds.has(currentId)) {
              toggleExpanded(currentId)
            } else {
              // Already expanded, go to first child
              selectObject(obj.childIds[0])
            }
          }
          e.preventDefault()
          break
        }

        case KEYBOARD_SHORTCUTS.ARROW_LEFT: {
          const obj = objects[currentId]
          if (obj) {
            if (expandedIds.has(currentId) && obj.childIds.length > 0) {
              // Collapse
              toggleExpanded(currentId)
            } else if (obj.parentId) {
              // Go to parent
              selectObject(obj.parentId)
            }
          }
          e.preventDefault()
          break
        }

        case KEYBOARD_SHORTCUTS.RENAME: {
          if (currentId) {
            startRename(currentId)
          }
          e.preventDefault()
          break
        }

        case KEYBOARD_SHORTCUTS.DELETE: {
          if (currentId) {
            removeObject(currentId)
          }
          e.preventDefault()
          break
        }

        case KEYBOARD_SHORTCUTS.ESCAPE: {
          closeContextMenu()
          break
        }
      }
    },
    [
      selectedIds,
      flattenedObjects,
      expandedIds,
      objects,
      renameState.isRenaming,
      contextMenu.isOpen,
      selectObject,
      toggleExpanded,
      startRename,
      removeObject,
      cancelRename,
      closeContextMenu,
      containerRef,
    ]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown as EventListener)
    return () => {
      container.removeEventListener('keydown', handleKeyDown as EventListener)
    }
  }, [handleKeyDown, containerRef])
}
