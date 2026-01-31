import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { canReparent } from '../utils'
import { DROP_THRESHOLD } from '../constants'
import type { DragState } from '../types'

interface UseDragAndDropProps {
  setDragState: (updates: Partial<DragState>) => void
  resetDragState: () => void
}

export function useDragAndDrop({ setDragState, resetDragState }: UseDragAndDropProps) {
  const objects = useEditorStore((state) => state.objects)
  const reparentObject = useEditorStore((state) => state.reparentObject)
  const reorderObject = useEditorStore((state) => state.reorderObject)

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', id)
      setDragState({ isDragging: true, draggedId: id })
    },
    [setDragState]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      e.stopPropagation()

      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top
      const height = rect.height

      let position: 'before' | 'after' | 'inside'
      if (y < height * DROP_THRESHOLD.TOP) {
        position = 'before'
      } else if (y > height * DROP_THRESHOLD.BOTTOM) {
        position = 'after'
      } else {
        position = 'inside'
      }

      setDragState({ dropTargetId: targetId, dropPosition: position })
    },
    [setDragState]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragState({ dropTargetId: null, dropPosition: null })
    },
    [setDragState]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string, draggedId: string, dropPosition: 'before' | 'after' | 'inside' | null) => {
      e.preventDefault()
      e.stopPropagation()

      if (!draggedId || !targetId || draggedId === targetId) {
        resetDragState()
        return
      }

      const draggedObj = objects[draggedId]
      const targetObj = objects[targetId]

      if (!draggedObj || !targetObj) {
        resetDragState()
        return
      }

      if (dropPosition === 'inside') {
        // Reparent: make dragged object a child of target
        if (canReparent(objects, draggedId, targetId)) {
          reparentObject(draggedId, targetId)
        }
      } else if (dropPosition === 'before' || dropPosition === 'after') {
        // Reorder within same parent or move to new parent's level
        if (draggedObj.parentId === targetObj.parentId) {
          // Same parent: just reorder
          reorderObject(draggedId, targetId, dropPosition)
        } else {
          // Different parent: first reparent to target's parent, then reorder
          const newParentId = targetObj.parentId
          if (canReparent(objects, draggedId, newParentId)) {
            reparentObject(draggedId, newParentId)
            // After reparenting, reorder
            setTimeout(() => {
              reorderObject(draggedId, targetId, dropPosition)
            }, 0)
          }
        }
      }

      resetDragState()
    },
    [objects, reparentObject, reorderObject, resetDragState]
  )

  const handleDragEnd = useCallback(() => {
    resetDragState()
  }, [resetDragState])

  return {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  }
}
