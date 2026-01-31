import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react'
import { Languages } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'

export function MenuBar() {
  const { t, language, toggleLanguage } = useI18n()
  const {
    newProject,
    saveProject,
    exportProject,
    undo,
    redo,
    addObject,
    selectedIds,
    removeObject,
    duplicateObject,
    updateEditorSettings,
    editorSettings,
    togglePanel,
  } = useEditorStore()

  const menuItems = [
    {
      label: t.menu.file,
      items: [
        { label: t.file.newProject, shortcut: 'Ctrl+N', action: 'newProject' },
        { label: t.file.openProject, shortcut: 'Ctrl+O', action: 'openProject' },
        { label: t.file.saveProject, shortcut: 'Ctrl+S', action: 'saveProject' },
        { label: t.file.export, shortcut: 'Ctrl+E', action: 'export' },
      ],
    },
    {
      label: t.menu.edit,
      items: [
        { label: t.edit.undo, shortcut: 'Ctrl+Z', action: 'undo' },
        { label: t.edit.redo, shortcut: 'Ctrl+Y', action: 'redo' },
        { label: t.edit.duplicate, shortcut: 'Ctrl+D', action: 'duplicate' },
        { label: t.edit.delete, shortcut: 'Delete', action: 'delete' },
      ],
    },
    {
      label: t.menu.view,
      items: [
        { label: t.view.toggleGrid, shortcut: 'G', action: 'toggleGrid' },
        { label: t.view.toggleAxes, shortcut: 'A', action: 'toggleAxes' },
        { label: t.view.toggleStats, shortcut: 'S', action: 'toggleStats' },
        { label: t.view.resetCamera, shortcut: 'Home', action: 'resetCamera' },
      ],
    },
    {
      label: t.menu.add,
      items: [
        { label: t.add.cube, action: 'addCube' },
        { label: t.add.sphere, action: 'addSphere' },
        { label: t.add.cylinder, action: 'addCylinder' },
        { label: t.add.plane, action: 'addPlane' },
        { label: t.add.cone, action: 'addCone' },
        { label: t.add.torus, action: 'addTorus' },
      ],
    },
    {
      label: t.menu.light,
      items: [
        { label: t.light.directional, action: 'addDirectionalLight' },
        { label: t.light.point, action: 'addPointLight' },
        { label: t.light.spot, action: 'addSpotLight' },
        { label: t.light.ambient, action: 'addAmbientLight' },
        { label: t.light.hemisphere, action: 'addHemisphereLight' },
      ],
    },
    {
      label: t.menu.window,
      items: [
        { label: t.window.hierarchy, action: 'toggleHierarchy' },
        { label: t.window.inspector, action: 'toggleInspector' },
        { label: t.window.assets, action: 'toggleAssets' },
        { label: t.window.timeline, action: 'toggleTimeline' },
      ],
    },
  ]

  const handleAction = (action: string) => {
    switch (action) {
      case 'newProject':
        newProject('Untitled Project')
        break
      case 'saveProject':
        const project = saveProject()
        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project.name}.json`
        a.click()
        URL.revokeObjectURL(url)
        break
      case 'export':
        const json = exportProject()
        const exportBlob = new Blob([json], { type: 'application/json' })
        const exportUrl = URL.createObjectURL(exportBlob)
        const exportA = document.createElement('a')
        exportA.href = exportUrl
        exportA.download = 'scene-export.json'
        exportA.click()
        URL.revokeObjectURL(exportUrl)
        break
      case 'openProject':
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (ev) => {
              try {
                const project = JSON.parse(ev.target?.result as string)
                useEditorStore.getState().loadProject(project)
              } catch (err) {
                console.error('Failed to load project:', err)
              }
            }
            reader.readAsText(file)
          }
        }
        input.click()
        break
      case 'undo':
        undo()
        break
      case 'redo':
        redo()
        break
      case 'duplicate':
        selectedIds.forEach((id) => duplicateObject(id))
        break
      case 'delete':
        selectedIds.forEach((id) => removeObject(id))
        break
      case 'toggleGrid':
        updateEditorSettings({ showGrid: !editorSettings.showGrid })
        break
      case 'toggleAxes':
        updateEditorSettings({ showAxes: !editorSettings.showAxes })
        break
      case 'toggleStats':
        updateEditorSettings({ showStats: !editorSettings.showStats })
        break
      case 'addCube':
        addObject({
          name: t.add.cube,
          type: 'mesh',
          geometry: { type: 'box', width: 1, height: 1, depth: 1 },
        })
        break
      case 'addSphere':
        addObject({
          name: t.add.sphere,
          type: 'mesh',
          geometry: { type: 'sphere', radius: 0.5, widthSegments: 32, heightSegments: 16 },
        })
        break
      case 'addCylinder':
        addObject({
          name: t.add.cylinder,
          type: 'mesh',
          geometry: { type: 'cylinder', radiusTop: 0.5, radiusBottom: 0.5, height: 1 },
        })
        break
      case 'addPlane':
        addObject({
          name: t.add.plane,
          type: 'mesh',
          geometry: { type: 'plane', width: 10, height: 10 },
          transform: { position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], scale: [1, 1, 1] },
        })
        break
      case 'addCone':
        addObject({
          name: t.add.cone,
          type: 'mesh',
          geometry: { type: 'cone', radius: 0.5, height: 1 },
        })
        break
      case 'addTorus':
        addObject({
          name: t.add.torus,
          type: 'mesh',
          geometry: { type: 'torus', radius: 0.5, tube: 0.2 },
        })
        break
      case 'addDirectionalLight':
        addObject({
          name: t.light.directional,
          type: 'light',
          light: { type: 'directional', color: '#ffffff', intensity: 1, castShadow: true },
          transform: { position: [5, 10, 5], rotation: [0, 0, 0], scale: [1, 1, 1] },
        })
        break
      case 'addPointLight':
        addObject({
          name: t.light.point,
          type: 'light',
          light: { type: 'point', color: '#ffffff', intensity: 1, distance: 10, decay: 2 },
          transform: { position: [0, 3, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        })
        break
      case 'addSpotLight':
        addObject({
          name: t.light.spot,
          type: 'light',
          light: { type: 'spot', color: '#ffffff', intensity: 1, distance: 10, angle: Math.PI / 6, penumbra: 0.1 },
          transform: { position: [0, 5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        })
        break
      case 'addAmbientLight':
        addObject({
          name: t.light.ambient,
          type: 'light',
          light: { type: 'ambient', color: '#404040', intensity: 0.5 },
        })
        break
      case 'addHemisphereLight':
        addObject({
          name: t.light.hemisphere,
          type: 'light',
          light: { type: 'hemisphere', color: '#87ceeb', groundColor: '#362907', intensity: 0.5 },
        })
        break
      case 'toggleHierarchy':
        togglePanel('hierarchy')
        break
      case 'toggleInspector':
        togglePanel('inspector')
        break
      case 'toggleAssets':
        togglePanel('assets')
        break
      case 'toggleTimeline':
        togglePanel('timeline')
        break
    }
  }

  return (
    <div className="flex items-center h-8 px-2 bg-ue-bg border-b border-ue-border">
      {menuItems.map((menu) => (
        <Menu key={menu.label} as="div" className="relative">
          <MenuButton className="px-3 py-1 text-sm text-ue-text-primary hover:bg-ue-bg-hover rounded transition-colors">
            {menu.label}
          </MenuButton>
          <MenuItems className="absolute left-0 mt-1 w-56 bg-ue-bg-light border border-ue-border rounded shadow-lg z-50">
            {menu.items.map((item) => (
              <MenuItem key={item.label}>
                {({ active }) => (
                  <button
                    onClick={() => handleAction(item.action)}
                    className={`${
                      active ? 'bg-ue-bg-hover' : ''
                    } w-full px-4 py-2 text-sm text-left text-ue-text-primary flex justify-between items-center`}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-ue-text-muted text-xs">{item.shortcut}</span>
                    )}
                  </button>
                )}
              </MenuItem>
            ))}
          </MenuItems>
        </Menu>
      ))}

      <div className="flex-1" />

      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1 px-2 py-1 text-xs text-ue-text-secondary hover:bg-ue-bg-hover rounded transition-colors mr-2"
        title={language === 'zh' ? 'Switch to English' : '切换到中文'}
      >
        <Languages size={14} />
        <span>{language === 'zh' ? '中文' : 'EN'}</span>
      </button>

      <span className="text-xs text-ue-text-muted">
        {t.common.version} v1.0
      </span>
    </div>
  )
}
