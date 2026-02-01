import React from 'react'
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Box,
  Sun,
  Camera,
  Layers,
  Sparkles,
  Folder,
  FolderOpen,
} from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import type { SceneObject } from '@/types'
import type { DragState, RenameState } from '../types'
import { HighlightedText } from './HighlightedText'
import { InlineRenameInput } from './InlineRenameInput'
import { DropIndicator } from './DropIndicator'
import { UE5_COLORS, UE5_INDENT, UE5_ROW_HEIGHT } from '../constants'

interface HierarchyItemProps {
  object: SceneObject
  depth: number
  searchQuery: string
  isExpanded: boolean
  dragState: DragState
  renameState: RenameState
  isParentHidden?: boolean
  onToggleExpand: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onStartRename: () => void
  onRenameChange: (value: string) => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
}

export function HierarchyItem({
  object,
  depth,
  searchQuery,
  isExpanded,
  dragState,
  renameState,
  isParentHidden = false,
  onToggleExpand,
  onContextMenu,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: HierarchyItemProps) {
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const selectObject = useEditorStore((state) => state.selectObject)
  const updateObject = useEditorStore((state) => state.updateObject)
  const objects = useEditorStore((state) => state.objects)

  const children = object.childIds.map((id) => objects[id]).filter(Boolean)
  const hasChildren = children.length > 0
  const isSelected = selectedIds.includes(object.id)
  const isRenaming = renameState.isRenaming && renameState.targetId === object.id
  const isDragTarget = dragState.dropTargetId === object.id
  const isDragging = dragState.draggedId === object.id

  // Inherited visibility logic
  const isInheritedHidden = isParentHidden && object.visible
  const isEffectivelyHidden = !object.visible || isParentHidden

  // UE5 Type Icons & Colors
  const getIcon = () => {
    const size = 14 // 18px in prompt might be too big for 24px row, scaling down slightly for Lucide
    const className = "flex-shrink-0"
    
    switch (object.type) {
      case 'light':
        return <Sun size={size} color={UE5_COLORS.light} className={className} />
      case 'camera':
        return <Camera size={size} color={UE5_COLORS.camera} className={className} />
      case 'group':
        return <Layers size={size} color={UE5_COLORS.group} className={className} />
      case 'folder':
        return isExpanded ? (
          <FolderOpen size={size} color={UE5_COLORS.folder} className={className} />
        ) : (
          <Folder size={size} color={UE5_COLORS.folder} className={className} />
        )
      case 'particle':
        return <Sparkles size={size} color={UE5_COLORS.particle} className={className} />
      case 'mesh':
      default:
        // Use Box for mesh
        return <Box size={size} color={UE5_COLORS.mesh} className={className} />
    }
  }

  const getVisibilityIcon = () => {
    if (isInheritedHidden) {
      return <Eye size={14} className="text-[#707070] opacity-50" />
    } else if (!object.visible) {
      return <EyeOff size={14} className="text-[#707070]" />
    } else {
      // Only show on hover or if hidden (handled by parent CSS group-hover)
      return <Eye size={14} className="text-[#a0a0a0] opacity-0 group-hover:opacity-100 transition-opacity" />
    }
  }

  // Event Handlers
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectObject(object.id, e.ctrlKey || e.metaKey)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isRenaming) {
      onRenameSubmit() // Or focus/frame object in viewport (not implemented here)
    }
  }

  const handleToggleVisible = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateObject(object.id, { visible: !object.visible })
  }

  const dropIndicatorPosition = isDragTarget ? dragState.dropPosition : null

  // Row Styling
  const getRowClassName = () => {
    const base = `flex items-center w-full ${UE5_ROW_HEIGHT} cursor-pointer select-none group text-[12px]`
    
    if (isSelected) {
      return `${base} bg-[#0d6efd] text-white`
    }
    if (isDragTarget && dropIndicatorPosition === 'inside') {
      return `${base} bg-[#1a1a1a] ring-1 ring-[#0d6efd]`
    }
    return `${base} hover:bg-[#3a3a3a] text-[#d4d4d4]`
  }

  return (
    <div
      className={`relative ${isDragging ? 'opacity-50' : ''}`}
      draggable={!isRenaming}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {dropIndicatorPosition && dropIndicatorPosition !== 'inside' && (
        <DropIndicator position={dropIndicatorPosition} depth={depth} />
      )}

      <div
        className={getRowClassName()}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={onContextMenu}
      >
        {/* Column 1: Visibility (24px fixed) */}
        <div 
          className="w-[24px] h-full flex items-center justify-center flex-shrink-0"
          onClick={handleToggleVisible}
        >
          {/* Always show if hidden/inherited, else show on group-hover */}
          {(!object.visible || isInheritedHidden) ? (
             <span className="flex items-center justify-center w-full h-full">
               {getVisibilityIcon()}
             </span>
          ) : (
            <span className="flex items-center justify-center w-full h-full hover:bg-white/10 rounded-sm">
              {getVisibilityIcon()}
            </span>
          )}
        </div>

        {/* Column 2: Name (Flex) */}
        <div className="flex-1 flex items-center h-full min-w-0 pr-2">
          {/* Indentation */}
          <div style={{ width: `${depth * UE5_INDENT}px` }} className="flex-shrink-0 h-full" />
          
          {/* Expand Arrow (16px) */}
          <div 
            className="w-[16px] h-full flex items-center justify-center flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
          >
            {hasChildren && (
              isExpanded ? (
                <ChevronDown size={10} className={isSelected ? "text-white" : "text-[#a0a0a0]"} />
              ) : (
                <ChevronRight size={10} className={isSelected ? "text-white" : "text-[#a0a0a0]"} />
              )
            )}
          </div>

          {/* Type Icon (18px container) */}
          <div className="w-[20px] h-full flex items-center justify-center flex-shrink-0 mr-1">
            {getIcon()}
          </div>

          {/* Name Text */}
          <div className="flex-1 min-w-0 truncate">
            {isRenaming ? (
              <InlineRenameInput
                value={renameState.value}
                onChange={onRenameChange}
                onSubmit={onRenameSubmit}
                onCancel={onRenameCancel}
              />
            ) : (
              <HighlightedText
                text={object.name}
                searchQuery={searchQuery}
                className={`truncate ${isEffectivelyHidden ? 'opacity-50' : ''}`}
              />
            )}
          </div>
        </div>

        {/* Column 3: Type Text (120px fixed) */}
        <div className={`w-[120px] h-full flex items-center px-2 flex-shrink-0 border-l border-transparent group-hover:border-[#4a4a4a] ${isSelected ? 'text-blue-100' : 'text-[#707070]'}`}>
          <span className="truncate capitalize">{object.type}</span>
        </div>
      </div>
    </div>
  )
}
