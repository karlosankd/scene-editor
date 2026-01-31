import { useState } from 'react'
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
  MousePointer2,
} from 'lucide-react'
import { useEditorStore, useRootObjects } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import type { SceneObject } from '@/types'

function ObjectTreeItem({ object, depth = 0 }: { object: SceneObject; depth?: number }) {
  const [expanded, setExpanded] = useState(true)
  const {
    objects,
    selectedIds,
    selectObject,
    updateObject,
  } = useEditorStore()

  const children = object.childIds.map((id) => objects[id]).filter(Boolean)
  const hasChildren = children.length > 0
  const isSelected = selectedIds.includes(object.id)

  const getIcon = () => {
    switch (object.type) {
      case 'light':
        return <Sun size={14} className="text-yellow-400" />
      case 'camera':
        return <Camera size={14} className="text-blue-400" />
      case 'group':
        return <Layers size={14} className="text-green-400" />
      case 'particle':
        return <Sparkles size={14} className="text-purple-400" />
      default:
        return <Box size={14} className="text-ue-text-secondary" />
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectObject(object.id, e.ctrlKey || e.metaKey)
  }

  const handleToggleVisible = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateObject(object.id, { visible: !object.visible })
  }

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateObject(object.id, { locked: !object.locked })
  }

  return (
    <div>
      <div
        className={`flex items-center h-7 pr-2 cursor-pointer select-none group ${
          isSelected ? 'bg-ue-accent-blue' : 'hover:bg-ue-bg-hover'
        }`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse */}
        <button
          className="w-4 h-4 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
        >
          {hasChildren && (
            expanded ? (
              <ChevronDown size={12} className="text-ue-text-secondary" />
            ) : (
              <ChevronRight size={12} className="text-ue-text-secondary" />
            )
          )}
        </button>

        {/* Icon */}
        <span className="mr-2">{getIcon()}</span>

        {/* Name */}
        <span
          className={`flex-1 text-sm truncate ${
            isSelected ? 'text-white' : 'text-ue-text-primary'
          } ${!object.visible ? 'opacity-50' : ''}`}
        >
          {object.name}
        </span>

        {/* Visibility Toggle */}
        <button
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-ue-bg-lighter rounded"
          onClick={handleToggleVisible}
        >
          {object.visible ? (
            <Eye size={12} className="text-ue-text-secondary" />
          ) : (
            <EyeOff size={12} className="text-ue-text-muted" />
          )}
        </button>

        {/* Lock Toggle */}
        <button
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-ue-bg-lighter rounded"
          onClick={handleToggleLock}
        >
          {object.locked ? (
            <Lock size={12} className="text-ue-accent-yellow" />
          ) : (
            <Unlock size={12} className="text-ue-text-secondary" />
          )}
        </button>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <ObjectTreeItem key={child.id} object={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Hierarchy() {
  const { t } = useI18n()
  const rootObjects = useRootObjects()
  const clearSelection = useEditorStore((state) => state.clearSelection)

  return (
    <div className="flex flex-col h-full bg-ue-bg">
      {/* Header */}
      <div className="flex items-center h-8 px-3 bg-ue-bg-light border-b border-ue-border">
        <Layers size={14} className="mr-2 text-ue-text-secondary" />
        <span className="text-sm font-medium text-ue-text-primary">{t.hierarchy.title}</span>
      </div>

      {/* Tree */}
      <div
        className="flex-1 overflow-auto py-1"
        onClick={() => clearSelection()}
      >
        {rootObjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ue-text-muted text-sm">
            <MousePointer2 size={32} className="mb-2 opacity-50" />
            <span>{t.hierarchy.noObjects}</span>
            <span className="text-xs mt-1">{t.hierarchy.addHint}</span>
          </div>
        ) : (
          rootObjects.map((object) => (
            <ObjectTreeItem key={object.id} object={object} />
          ))
        )}
      </div>
    </div>
  )
}
