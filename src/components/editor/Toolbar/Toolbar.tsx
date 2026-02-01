import {
  MousePointer2,
  Move,
  RotateCcw,
  Maximize2,
  Grid3X3,
  Globe,
  Box,
  Play,
  Pause,
  Square,
  Camera,
  Magnet,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import type { TransformMode } from '@/types'

import { AddObjectMenu } from './AddObjectMenu'

export function Toolbar() {
  const { t } = useI18n()
  const {
    transformMode,
    setTransformMode,
    transformSpace,
    setTransformSpace,
    editorSettings,
    updateEditorSettings,
    viewportSettings,
    updateViewportSettings,
    postProcessing,
    updatePostProcessing,
    isPlaying,
    playAnimation,
    pauseAnimation,
    stopAnimation,
  } = useEditorStore()

  const transformTools: { mode: TransformMode; icon: typeof Move; labelKey: keyof typeof t.toolbar; shortcut: string }[] = [
    { mode: 'select', icon: MousePointer2, labelKey: 'select', shortcut: 'Q' },
    { mode: 'translate', icon: Move, labelKey: 'move', shortcut: 'W' },
    { mode: 'rotate', icon: RotateCcw, labelKey: 'rotate', shortcut: 'E' },
    { mode: 'scale', icon: Maximize2, labelKey: 'scale', shortcut: 'R' },
  ]

  return (
    <div className="flex items-center h-10 px-2 bg-ue-bg border-b border-ue-border gap-1">
      {/* Add Object Menu (Place Actors) */}
      <div className="flex items-center pr-2 border-r border-ue-border mr-1">
        <AddObjectMenu />
      </div>

      {/* Transform Tools */}
      <div className="flex items-center gap-1 pr-2 border-r border-ue-border">
        {transformTools.map(({ mode, icon: Icon, labelKey, shortcut }) => (
          <button
            key={mode}
            onClick={() => setTransformMode(mode)}
            className={`p-2 rounded transition-colors ${
              transformMode === mode
                ? 'bg-ue-accent-blue text-white'
                : 'text-ue-text-secondary hover:bg-ue-bg-hover hover:text-ue-text-primary'
            }`}
            title={`${t.toolbar[labelKey]} (${shortcut})`}
          >
            <Icon size={18} />
          </button>
        ))}
      </div>

      {/* Transform Space */}
      <div className="flex items-center gap-1 pr-2 border-r border-ue-border">
        <button
          onClick={() => setTransformSpace(transformSpace === 'world' ? 'local' : 'world')}
          className={`p-2 rounded transition-colors text-ue-text-secondary hover:bg-ue-bg-hover hover:text-ue-text-primary`}
          title={`${transformSpace === 'world' ? t.toolbar.world : t.toolbar.local} (Q)`}
        >
          {transformSpace === 'world' ? <Globe size={18} /> : <Box size={18} />}
        </button>
      </div>

      {/* Grid & Snap */}
      <div className="flex items-center gap-1 pr-2 border-r border-ue-border">
        <button
          onClick={() => updateEditorSettings({ showGrid: !editorSettings.showGrid })}
          className={`p-2 rounded transition-colors ${
            editorSettings.showGrid
              ? 'bg-ue-bg-hover text-ue-text-primary'
              : 'text-ue-text-muted hover:bg-ue-bg-hover hover:text-ue-text-primary'
          }`}
          title={`${t.toolbar.grid} (G)`}
        >
          <Grid3X3 size={18} />
        </button>
        <button
          onClick={() => updateEditorSettings({ snapEnabled: !editorSettings.snapEnabled })}
          className={`p-2 rounded transition-colors ${
            editorSettings.snapEnabled
              ? 'bg-ue-accent-blue text-white'
              : 'text-ue-text-secondary hover:bg-ue-bg-hover hover:text-ue-text-primary'
          }`}
          title={t.toolbar.snap}
        >
          <Magnet size={18} />
        </button>
      </div>

      {/* Viewport Options */}
      <div className="flex items-center gap-1 pr-2 border-r border-ue-border">
        <button
          onClick={() => updateViewportSettings({ showWireframe: !viewportSettings.showWireframe })}
          className={`p-2 rounded transition-colors ${
            viewportSettings.showWireframe
              ? 'bg-ue-bg-hover text-ue-text-primary'
              : 'text-ue-text-secondary hover:bg-ue-bg-hover hover:text-ue-text-primary'
          }`}
          title={t.toolbar.wireframe}
        >
          <Box size={18} strokeWidth={1} />
        </button>
        <button
          onClick={() => updateViewportSettings({ enableShadows: !viewportSettings.enableShadows })}
          className={`p-2 rounded transition-colors ${
            viewportSettings.enableShadows
              ? 'bg-ue-bg-hover text-ue-text-primary'
              : 'text-ue-text-muted hover:bg-ue-bg-hover hover:text-ue-text-primary'
          }`}
          title={t.toolbar.shadows}
        >
          {viewportSettings.enableShadows ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
        <button
          onClick={() => updatePostProcessing({ enabled: !postProcessing.enabled })}
          className={`p-2 rounded transition-colors ${
            postProcessing.enabled
              ? 'bg-ue-accent-purple text-white'
              : 'text-ue-text-secondary hover:bg-ue-bg-hover hover:text-ue-text-primary'
          }`}
          title={t.toolbar.postProcessing}
        >
          <Sparkles size={18} />
        </button>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-1 pr-2 border-r border-ue-border">
        <button
          onClick={() => (isPlaying ? pauseAnimation() : playAnimation())}
          className="p-2 rounded text-ue-text-secondary hover:bg-ue-bg-hover hover:text-ue-text-primary transition-colors"
          title={isPlaying ? t.toolbar.pause : t.toolbar.play}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={stopAnimation}
          className="p-2 rounded text-ue-text-secondary hover:bg-ue-bg-hover hover:text-ue-text-primary transition-colors"
          title={t.toolbar.stop}
        >
          <Square size={18} />
        </button>
      </div>

      <div className="flex-1" />

      {/* Camera */}
      <button
        className="p-2 rounded text-ue-text-secondary hover:bg-ue-bg-hover hover:text-ue-text-primary transition-colors"
        title={t.toolbar.camera}
      >
        <Camera size={18} />
      </button>
    </div>
  )
}
