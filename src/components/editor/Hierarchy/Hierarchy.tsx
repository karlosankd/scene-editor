import { useRef, useCallback } from 'react'
import { Layers, MousePointer2 } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import { useHierarchyState, useDragAndDrop, useKeyboardNavigation, useClipboard } from './hooks'
import { SearchBar, HierarchyItem, ContextMenu } from './components'
import { getAllDescendantIds } from './utils'
import type { ContextMenuAction } from './types'

export function Hierarchy() {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)

  const objects = useEditorStore((state) => state.objects)
  const clearSelection = useEditorStore((state) => state.clearSelection)
  const selectObject = useEditorStore((state) => state.selectObject)
  const removeObject = useEditorStore((state) => state.removeObject)
  const duplicateObject = useEditorStore((state) => state.duplicateObject)
  const addObject = useEditorStore((state) => state.addObject)

  const hierarchyState = useHierarchyState()
  const clipboard = useClipboard()

  const {
    filter,
    contextMenu,
    dragState,
    renameState,
    expandedIds,
    flattenedObjects,
    setSearchQuery,
    toggleTypeFilter,
    clearFilters,
    openContextMenu,
    closeContextMenu,
    setDragState,
    resetDragState,
    startRename,
    updateRenameValue,
    submitRename,
    cancelRename,
    toggleExpanded,
  } = hierarchyState

  const dragHandlers = useDragAndDrop({ setDragState, resetDragState })

  useKeyboardNavigation({
    hierarchyState,
    containerRef,
  })

  const handleContextAction = useCallback(
    (action: ContextMenuAction) => {
      const targetId = contextMenu.targetId
      if (!targetId) return

      switch (action) {
        case 'delete':
          removeObject(targetId)
          break
        case 'duplicate': {
          const newId = duplicateObject(targetId)
          if (newId) selectObject(newId)
          break
        }
        case 'rename':
          startRename(targetId)
          break
        case 'copy':
          clipboard.copy(targetId)
          break
        case 'paste':
          clipboard.paste()
          break
        case 'selectChildren': {
          const descendantIds = getAllDescendantIds(objects, targetId)
          descendantIds.forEach((id) => selectObject(id, true))
          break
        }
        case 'createMesh':
          addObject({ name: 'New Mesh', type: 'mesh', parentId: targetId })
          break
        case 'createLight':
          addObject({ name: 'New Light', type: 'light', parentId: targetId })
          break
        case 'createCamera':
          addObject({ name: 'New Camera', type: 'camera', parentId: targetId })
          break
        case 'createGroup':
          addObject({ name: 'New Group', type: 'group', parentId: targetId })
          break
        case 'createFolder':
          addObject({ name: 'New Folder', type: 'folder', parentId: targetId })
          break
      }
    },
    [
      contextMenu.targetId,
      objects,
      removeObject,
      duplicateObject,
      selectObject,
      startRename,
      clipboard,
      addObject,
    ]
  )

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection()
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-ue-bg focus:outline-none"
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center h-8 px-3 bg-ue-bg-light border-b border-ue-border flex-shrink-0">
        <Layers size={14} className="mr-2 text-ue-text-secondary" />
        <span className="text-sm font-medium text-ue-text-primary">{t.hierarchy.title}</span>
      </div>

      {/* Search & Filters */}
      <SearchBar
        searchQuery={filter.searchQuery}
        typeFilters={filter.typeFilters}
        onSearchChange={setSearchQuery}
        onTypeToggle={toggleTypeFilter}
        onClear={clearFilters}
      />

      {/* Tree */}
      <div
        className="flex-1 overflow-auto py-1"
        onClick={handleContainerClick}
      >
        {flattenedObjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ue-text-muted text-sm">
            <MousePointer2 size={32} className="mb-2 opacity-50" />
            <span>{t.hierarchy.noObjects}</span>
            <span className="text-xs mt-1">{t.hierarchy.addHint}</span>
          </div>
        ) : (
          flattenedObjects.map(({ object, depth, isParentHidden }) => (
            <HierarchyItem
              key={object.id}
              object={object}
              depth={depth}
              searchQuery={filter.searchQuery}
              isExpanded={expandedIds.has(object.id)}
              dragState={dragState}
              renameState={renameState}
              isParentHidden={isParentHidden}
              onToggleExpand={() => toggleExpanded(object.id)}
              onContextMenu={(e) => openContextMenu(e, object.id)}
              onStartRename={() => startRename(object.id)}
              onRenameChange={updateRenameValue}
              onRenameSubmit={submitRename}
              onRenameCancel={cancelRename}
              onDragStart={(e) => dragHandlers.handleDragStart(e, object.id)}
              onDragOver={(e) => dragHandlers.handleDragOver(e, object.id)}
              onDragLeave={dragHandlers.handleDragLeave}
              onDrop={(e) =>
                dragHandlers.handleDrop(
                  e,
                  object.id,
                  dragState.draggedId!,
                  dragState.dropPosition
                )
              }
              onDragEnd={dragHandlers.handleDragEnd}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.isOpen && contextMenu.targetId && (
        <ContextMenu
          position={contextMenu.position}
          targetId={contextMenu.targetId}
          canPaste={clipboard.canPaste}
          hasChildren={objects[contextMenu.targetId]?.childIds.length > 0}
          onAction={handleContextAction}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}
