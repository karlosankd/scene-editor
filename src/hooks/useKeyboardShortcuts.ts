import { useEffect, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import type { TransformMode } from '@/types'

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

    // Transform modes (UE5 style)
    if (!ctrl) {
      switch (e.key.toLowerCase()) {
        case ' ':
          // Space - Cycle through transform modes (translate -> rotate -> scale -> translate)
          e.preventDefault()
          const modes: TransformMode[] = ['translate', 'rotate', 'scale']
          const currentIndex = modes.indexOf(transformMode)
          const nextIndex = (currentIndex + 1) % modes.length
          setTransformMode(modes[nextIndex])
          break
        case 'q':
          // Q - Select tool (deselect current selection)
          e.preventDefault()
          clearSelection()
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

    // Ctrl shortcuts
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

    // Escape - Clear selection
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
