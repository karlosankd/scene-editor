import { useRef, useCallback, useState } from 'react'
import { FolderPlus, Settings, Filter, ChevronDown, Search, X } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import { useHierarchyState, useDragAndDrop, useKeyboardNavigation, useClipboard } from './hooks'
import { HierarchyItem, ContextMenu, HierarchyHeader, FilterMenu, SettingsMenu, defaultHierarchySettings } from './components'
import type { HierarchySettings } from './components'
import { getAllDescendantIds } from './utils'
import type { ContextMenuAction } from './types'

export function Hierarchy() {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)

  const objects = useEditorStore((state) => state.objects)
  const clearSelection = useEditorStore((state) => state.clearSelection)
  const selectObject = useEditorStore((state) => state.selectObject)
  const removeObject = useEditorStore((state) => state.removeObject)
  const duplicateObject = useEditorStore((state) => state.duplicateObject)
  const addObject = useEditorStore((state) => state.addObject)
  const focusOnSelected = useEditorStore((state) => state.focusOnSelected)

  const hierarchyState = useHierarchyState()
  const clipboard = useClipboard()

  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [filterMenuPosition, setFilterMenuPosition] = useState({ x: 0, y: 0 })
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)
  const [settingsMenuPosition, setSettingsMenuPosition] = useState({ x: 0, y: 0 })
  const [hierarchySettings, setHierarchySettings] = useState<HierarchySettings>(defaultHierarchySettings)

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
    expandAll,
    collapseAll,
  } = hierarchyState

  const dragHandlers = useDragAndDrop({ setDragState, resetDragState })

  useKeyboardNavigation({
    hierarchyState,
    containerRef,
  })

  // Helper to generate unique folder name
  const getUniqueFolderName = (baseName: string): string => {
    const existingNames = Object.values(objects).map((obj) => obj.name)
    if (!existingNames.includes(baseName)) {
      return baseName
    }
    let counter = 1
    while (existingNames.includes(`${baseName} ${counter}`)) {
      counter++
    }
    return `${baseName} ${counter}`
  }

  // Wrapper for selectObject that auto-focuses when setting is enabled
  const handleSelectObject = useCallback(
    (id: string, additive?: boolean) => {
      selectObject(id, additive)
      if (hierarchySettings.focusOnSelect && !additive) {
        // Delay slightly to ensure selection is updated
        setTimeout(() => focusOnSelected(), 0)
      }
    },
    [selectObject, focusOnSelected, hierarchySettings.focusOnSelect]
  )

  // Top Toolbar Handlers
  const handleAddClick = () => {
    const folderName = getUniqueFolderName(t.hierarchy.newFolder)
    addObject({ name: folderName, type: 'folder' })
  }

  const handleFilterClick = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect()
      setFilterMenuPosition({
        x: rect.left,
        y: rect.bottom + 4,
      })
      setFilterMenuOpen(!filterMenuOpen)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const handleSettingsClick = () => {
    if (settingsButtonRef.current) {
      const rect = settingsButtonRef.current.getBoundingClientRect()
      setSettingsMenuPosition({
        x: rect.right - 200, // Align to right edge
        y: rect.bottom + 4,
      })
      setSettingsMenuOpen(!settingsMenuOpen)
    }
  }

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
      className="flex flex-col h-full bg-[#1a1a1a] focus:outline-none text-[#d4d4d4]"
      tabIndex={0}
    >
      {/* 1. Top Toolbar */}
      <div className="flex items-center h-[32px] px-2 bg-[#2a2a2a] border-b border-[#3a3a3a] gap-2">
        {/* Left: Filter */}
        <button
          ref={filterButtonRef}
          onClick={handleFilterClick}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
            filter.typeFilters.length > 0
              ? 'text-[#4a9eff] bg-[#0d6efd]/20 hover:bg-[#0d6efd]/30'
              : 'text-[#a0a0a0] hover:bg-[#3a3a3a] hover:text-white'
          }`}
          title={t.hierarchy.filterByType}
        >
          <Filter size={14} />
          {filter.typeFilters.length > 0 && (
            <span className="text-[10px] px-1 bg-[#0d6efd] text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
              {filter.typeFilters.length}
            </span>
          )}
          <ChevronDown size={10} />
        </button>

        {/* Center: Search */}
        <div className="flex-1 relative flex items-center">
          <div className="absolute left-2 text-[#707070] pointer-events-none">
             <Search size={12} />
          </div>
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.hierarchy.search}
            className="w-full bg-[#151515] border border-[#3a3a3a] rounded h-[22px] pl-6 pr-6 text-xs text-[#d4d4d4] placeholder-[#707070] focus:border-[#4a9eff] focus:outline-none"
          />
          {filter.searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 text-[#707070] hover:text-[#d4d4d4] transition-colors"
              title={t.hierarchy.clearSearch}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Right: New Folder & Settings */}
        <button
          onClick={handleAddClick}
          className="p-1 text-[#a0a0a0] hover:bg-[#3a3a3a] rounded hover:text-white hover:text-[#f4b183] transition-colors"
          title={t.hierarchy.newFolder}
        >
          <FolderPlus size={16} />
        </button>
        <button
          ref={settingsButtonRef}
          onClick={handleSettingsClick}
          className={`p-1 rounded transition-colors ${
            settingsMenuOpen
              ? 'text-[#4a9eff] bg-[#0d6efd]/20'
              : 'text-[#a0a0a0] hover:bg-[#3a3a3a] hover:text-white'
          }`}
          title={t.hierarchy.settings}
        >
          <Settings size={16} />
        </button>
      </div>

      {/* 2. Column Header */}
      <HierarchyHeader />

      {/* 3. Tree List */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden bg-[#151515]"
        onClick={handleContainerClick}
      >
        {flattenedObjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#707070] text-sm opacity-50">
            <span>{t.hierarchy.emptyScene}</span>
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
              onSelect={handleSelectObject}
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

      {/* Filter Menu */}
      <FilterMenu
        isOpen={filterMenuOpen}
        onClose={() => setFilterMenuOpen(false)}
        position={filterMenuPosition}
        activeFilters={filter.typeFilters}
        onToggleFilter={toggleTypeFilter}
        onClearFilters={() => {
          clearFilters()
          setFilterMenuOpen(false)
        }}
      />

      {/* Settings Menu */}
      <SettingsMenu
        isOpen={settingsMenuOpen}
        onClose={() => setSettingsMenuOpen(false)}
        position={settingsMenuPosition}
        settings={hierarchySettings}
        onSettingsChange={setHierarchySettings}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />
    </div>
  )
}
