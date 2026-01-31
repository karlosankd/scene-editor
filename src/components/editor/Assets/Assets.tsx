import { useState } from 'react'
import {
  FolderOpen,
  Box,
  Image,
  Sun,
  Upload,
  Grid3X3,
  List,
  Search,
} from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'

export function Assets() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'primitives' | 'lights' | 'models' | 'textures'>('primitives')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const addObject = useEditorStore((state) => state.addObject)

  const primitives = [
    { name: t.add.cube, geometry: { type: 'box' as const, width: 1, height: 1, depth: 1 } },
    { name: t.add.sphere, geometry: { type: 'sphere' as const, radius: 0.5, widthSegments: 32, heightSegments: 16 } },
    { name: t.add.cylinder, geometry: { type: 'cylinder' as const, radiusTop: 0.5, radiusBottom: 0.5, height: 1 } },
    { name: t.add.cone, geometry: { type: 'cone' as const, radius: 0.5, height: 1 } },
    { name: t.add.torus, geometry: { type: 'torus' as const, radius: 0.5, tube: 0.2 } },
    { name: t.add.plane, geometry: { type: 'plane' as const, width: 10, height: 10 } },
  ]

  const lights = [
    { name: t.light.directional, type: 'directional' as const, color: '#ffffff', intensity: 1 },
    { name: t.light.point, type: 'point' as const, color: '#ffffff', intensity: 1, distance: 10 },
    { name: t.light.spot, type: 'spot' as const, color: '#ffffff', intensity: 1, distance: 10, angle: Math.PI / 6 },
    { name: t.light.ambient, type: 'ambient' as const, color: '#404040', intensity: 0.5 },
    { name: t.light.hemisphere, type: 'hemisphere' as const, color: '#87ceeb', groundColor: '#362907', intensity: 0.5 },
  ]

  const handleAddPrimitive = (primitive: typeof primitives[0]) => {
    addObject({
      name: primitive.name,
      type: 'mesh',
      geometry: primitive.geometry,
    })
  }

  const handleAddLight = (light: typeof lights[0]) => {
    addObject({
      name: light.name,
      type: 'light',
      light: light,
      transform: {
        position: [0, 3, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    })
  }

  const handleImportModel = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.glb,.gltf,.fbx,.obj'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const url = URL.createObjectURL(file)
        addObject({
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: 'model',
          modelUrl: url,
        })
      }
    }
    input.click()
  }

  const tabs = [
    { id: 'primitives' as const, label: t.assets.primitives },
    { id: 'lights' as const, label: t.assets.lights },
    { id: 'models' as const, label: t.assets.models },
    { id: 'textures' as const, label: t.assets.textures },
  ]

  return (
    <div className="flex flex-col h-full bg-ue-bg">
      {/* Header */}
      <div className="flex items-center h-8 px-3 bg-ue-bg-light border-b border-ue-border">
        <FolderOpen size={14} className="mr-2 text-ue-text-secondary" />
        <span className="text-sm font-medium text-ue-text-primary">{t.assets.title}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ue-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-ue-text-primary border-b-2 border-ue-accent-blue'
                : 'text-ue-text-secondary hover:text-ue-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & View Toggle */}
      <div className="flex items-center gap-2 p-2 border-b border-ue-border">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-ue-text-muted" />
          <input
            type="text"
            placeholder={t.assets.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-ue-bg-dark border border-ue-border rounded text-ue-text-primary focus:border-ue-accent-blue focus:outline-none"
          />
        </div>
        <button
          onClick={() => setViewMode('grid')}
          className={`p-1 rounded ${viewMode === 'grid' ? 'bg-ue-bg-hover' : ''}`}
        >
          <Grid3X3 size={14} className="text-ue-text-secondary" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-1 rounded ${viewMode === 'list' ? 'bg-ue-bg-hover' : ''}`}
        >
          <List size={14} className="text-ue-text-secondary" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        {activeTab === 'primitives' && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-1'}>
            {primitives
              .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((primitive) => (
                <button
                  key={primitive.name}
                  onClick={() => handleAddPrimitive(primitive)}
                  className={`${
                    viewMode === 'grid'
                      ? 'flex flex-col items-center justify-center p-3 aspect-square'
                      : 'flex items-center gap-2 w-full px-3 py-2'
                  } bg-ue-bg-light hover:bg-ue-bg-hover rounded transition-colors`}
                >
                  <Box size={viewMode === 'grid' ? 24 : 16} className="text-ue-text-secondary" />
                  <span className="text-xs text-ue-text-primary mt-1">{primitive.name}</span>
                </button>
              ))}
          </div>
        )}

        {activeTab === 'lights' && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-1'}>
            {lights
              .filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((light) => (
                <button
                  key={light.name}
                  onClick={() => handleAddLight(light)}
                  className={`${
                    viewMode === 'grid'
                      ? 'flex flex-col items-center justify-center p-3 aspect-square'
                      : 'flex items-center gap-2 w-full px-3 py-2'
                  } bg-ue-bg-light hover:bg-ue-bg-hover rounded transition-colors`}
                >
                  <Sun size={viewMode === 'grid' ? 24 : 16} className="text-yellow-400" />
                  <span className="text-xs text-ue-text-primary mt-1">{light.name}</span>
                </button>
              ))}
          </div>
        )}

        {activeTab === 'models' && (
          <div className="flex flex-col items-center justify-center h-full">
            <button
              onClick={handleImportModel}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-ue-border rounded-lg hover:border-ue-accent-blue transition-colors"
            >
              <Upload size={32} className="text-ue-text-muted mb-2" />
              <span className="text-sm text-ue-text-secondary">{t.assets.importModel}</span>
              <span className="text-xs text-ue-text-muted mt-1">GLB, GLTF, FBX, OBJ</span>
            </button>
          </div>
        )}

        {activeTab === 'textures' && (
          <div className="flex flex-col items-center justify-center h-full">
            <button
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-ue-border rounded-lg hover:border-ue-accent-blue transition-colors"
            >
              <Upload size={32} className="text-ue-text-muted mb-2" />
              <span className="text-sm text-ue-text-secondary">{t.assets.importTexture}</span>
              <span className="text-xs text-ue-text-muted mt-1">PNG, JPG, HDR, EXR</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
