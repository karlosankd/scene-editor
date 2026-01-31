import { useState, useCallback, useEffect } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import type { ClipboardState } from '../types'

const initialClipboard: ClipboardState = {
  copiedId: null,
  isCut: false,
}

export function useClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardState>(initialClipboard)
  const duplicateObject = useEditorStore((state) => state.duplicateObject)
  const removeObject = useEditorStore((state) => state.removeObject)
  const selectObject = useEditorStore((state) => state.selectObject)
  const selectedIds = useEditorStore((state) => state.selectedIds)

  const copy = useCallback((id: string) => {
    setClipboard({ copiedId: id, isCut: false })
  }, [])

  const cut = useCallback((id: string) => {
    setClipboard({ copiedId: id, isCut: true })
  }, [])

  const paste = useCallback(() => {
    if (!clipboard.copiedId) return

    const newId = duplicateObject(clipboard.copiedId)
    if (newId) {
      selectObject(newId)
      if (clipboard.isCut) {
        removeObject(clipboard.copiedId)
        setClipboard(initialClipboard)
      }
    }
  }, [clipboard, duplicateObject, removeObject, selectObject])

  const canPaste = clipboard.copiedId !== null

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const currentId = selectedIds[0]
      if (!currentId) return

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            copy(currentId)
            e.preventDefault()
            break
          case 'x':
            cut(currentId)
            e.preventDefault()
            break
          case 'v':
            if (canPaste) {
              paste()
              e.preventDefault()
            }
            break
          case 'd':
            const newId = duplicateObject(currentId)
            if (newId) {
              selectObject(newId)
            }
            e.preventDefault()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, copy, cut, paste, canPaste, duplicateObject, selectObject])

  return {
    clipboard,
    copy,
    cut,
    paste,
    canPaste,
  }
}
