import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
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

// UE5 风格的行高和缩进常量
const UE5_ROW_HEIGHT = 'h-6' // 24px - 更紧凑
const UE5_INDENT = 12 // 12px per level

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

  // 判断是否因父级隐藏而继承隐藏状态
  const isInheritedHidden = isParentHidden && object.visible
  const isEffectivelyHidden = !object.visible || isParentHidden

  // UE5 风格的类型图标 - 使用 UE5 配色方案
  const getIcon = () => {
    const iconSize = 14
    switch (object.type) {
      case 'light':
        // UE5: 黄色表示灯光
        return <Sun size={iconSize} className="text-yellow-400" />
      case 'camera':
        // UE5: 蓝色表示相机
        return <Camera size={iconSize} className="text-blue-400" />
      case 'group':
        // UE5: 绿色表示组/蓝图
        return <Layers size={iconSize} className="text-green-400" />
      case 'folder':
        // UE5: 黄/橙色文件夹
        return isExpanded ? (
          <FolderOpen size={iconSize} className="text-amber-500" />
        ) : (
          <Folder size={iconSize} className="text-amber-500" />
        )
      case 'particle':
        // UE5: 紫色表示粒子/特效
        return <Sparkles size={iconSize} className="text-purple-400" />
      case 'mesh':
      default:
        // UE5: 青色表示静态网格
        return <Box size={iconSize} className="text-cyan-400" />
    }
  }

  // 获取可见性图标 - 支持继承隐藏状态
  const getVisibilityIcon = () => {
    if (isInheritedHidden) {
      // 父级隐藏导致的继承隐藏 - 灰色眼睛
      return <Eye size={14} className="text-ue-text-muted opacity-40" />
    } else if (!object.visible) {
      // 自身隐藏
      return <EyeOff size={14} className="text-ue-text-muted" />
    } else {
      // 可见
      return <Eye size={14} className="text-ue-text-secondary" />
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectObject(object.id, e.ctrlKey || e.metaKey)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isRenaming) {
      onRenameSubmit()
    }
  }

  const handleToggleVisible = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateObject(object.id, { visible: !object.visible })
  }

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateObject(object.id, { locked: !object.locked })
  }

  const dropIndicatorPosition = isDragTarget ? dragState.dropPosition : null

  // UE5 风格的选中颜色
  const getRowClassName = () => {
    const base = `flex items-center ${UE5_ROW_HEIGHT} cursor-pointer select-none group`
    
    if (isSelected) {
      // UE5 选中色: #005d9e
      return `${base} bg-[#005d9e]`
    }
    if (isDragTarget && dropIndicatorPosition === 'inside') {
      return `${base} bg-[#1a1a1a] ring-1 ring-[#005d9e]`
    }
    // UE5 hover: 更浅的灰色
    return `${base} hover:bg-[#2a2a2a]`
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
        {/* UE5 布局: 左侧固定区域 - 可见性图标 (始终显示) */}
        <button
          className="w-6 h-full flex items-center justify-center flex-shrink-0 hover:bg-[#3a3a3a]"
          onClick={handleToggleVisible}
          title={isInheritedHidden ? 'Hidden by parent' : object.visible ? 'Hide' : 'Show'}
        >
          {getVisibilityIcon()}
        </button>

        {/* 缩进区域 + 展开箭头 */}
        <div 
          className="flex items-center flex-shrink-0"
          style={{ paddingLeft: `${depth * UE5_INDENT}px` }}
        >
          <button
            className="w-4 h-4 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
          >
            {hasChildren && (
              isExpanded ? (
                <ChevronDown size={12} className="text-ue-text-secondary" />
              ) : (
                <ChevronRight size={12} className="text-ue-text-secondary" />
              )
            )}
          </button>
        </div>

        {/* 类型图标 */}
        <span className={`mr-1.5 flex-shrink-0 ${isEffectivelyHidden ? 'opacity-50' : ''}`}>
          {getIcon()}
        </span>

        {/* 名称或重命名输入框 */}
        <div className="flex-1 min-w-0 mr-2">
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
              className={`text-xs truncate ${
                isSelected ? 'text-white' : 'text-[#c8c8c8]'
              } ${isEffectivelyHidden ? 'opacity-50' : ''}`}
            />
          )}
        </div>

        {/* 右侧操作区域 - 锁定图标 (hover 时显示) */}
        <button
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center flex-shrink-0 hover:bg-[#3a3a3a] rounded"
          onClick={handleToggleLock}
          title={object.locked ? 'Unlock' : 'Lock'}
        >
          {object.locked ? (
            <Lock size={12} className="text-amber-400" />
          ) : (
            <Unlock size={12} className="text-ue-text-muted" />
          )}
        </button>
      </div>
    </div>
  )
}
