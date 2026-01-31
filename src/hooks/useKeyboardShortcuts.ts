import { useEffect, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import type { TransformMode } from '@/types'
import { rightMouseState } from './useRightMouseState'

export function useKeyboardShortcuts() {
  const {
    setTransformMode,
    transformMode,
    selectedIds,
    removeObject,
    duplicateObject,
    updateEditorSettings,
    editorSettings,
    undo,
    redo,
    clearSelection,
  } = useEditorStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return
    }

    const ctrl = e.ctrlKey || e.metaKey

    // UE5 Style: Transform mode shortcuts only work when RMB is NOT held
    // When RMB is held, these keys are handled by useFlyControls for camera movement
    if (!ctrl && !rightMouseState.isDown) {
      switch (e.key.toLowerCase()) {
        case ' ':
          // Space - Cycle through transform modes (select -> translate -> rotate -> scale -> select)
          e.preventDefault()
          const modes: TransformMode[] = ['select', 'translate', 'rotate', 'scale']
          const currentIndex = modes.indexOf(transformMode)
          const nextIndex = (currentIndex + 1) % modes.length
          setTransformMode(modes[nextIndex])
          break
        case 'q':
          // Q - Select tool (UE5 style - switches to select mode, no transform gizmo)
          e.preventDefault()
          setTransformMode('select')
          break
        case 'w':
          // W - Translate/Move tool
          e.preventDefault()
          setTransformMode('translate')
          break
        case 'e':
          // E - Rotate tool
          e.preventDefault()
          setTransformMode('rotate')
          break
        case 'r':
          // R - Scale tool
          e.preventDefault()
          setTransformMode('scale')
          break
        case 'g':
          // G - Toggle Grid
          e.preventDefault()
          updateEditorSettings({ showGrid: !editorSettings.showGrid })
          break
        case 'delete':
        case 'backspace':
          // Delete selected objects
          e.preventDefault()
          selectedIds.forEach((id) => removeObject(id))
          break
        case 'f':
          // F - Focus on selected (handled in viewport)
          e.preventDefault()
          break
      }
    }

    // Ctrl shortcuts (work regardless of RMB state)
    if (ctrl) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
          break
        case 'y':
          e.preventDefault()
          redo()
          break
        case 'd':
          // Duplicate
          e.preventDefault()
          selectedIds.forEach((id) => duplicateObject(id))
          break
        case 'a':
          // Select all
          e.preventDefault()
          useEditorStore.getState().selectAll()
          break
      }
    }

    // Escape - Clear selection (works regardless of RMB state)
    if (e.key === 'Escape') {
      e.preventDefault()
      clearSelection()
    }
  }, [
    setTransformMode,
    transformMode,
    selectedIds,
    removeObject,
    duplicateObject,
    updateEditorSettings,
    editorSettings,
    undo,
    redo,
    clearSelection,
  ])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
