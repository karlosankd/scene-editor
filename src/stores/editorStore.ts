import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuidv4 } from 'uuid'
import * as THREE from 'three'
import { MeshRegistry } from './meshRegistry'
import { templates, type LevelTemplate } from '@/data/templates'
import type {
  SceneObject,
  Transform,
  TransformMode,
  TransformSpace,
  CameraMode,
  EditorSettings,
  ViewportSettings,
  PostProcessingSettings,
  MaterialData,
  UIElement,
  AnimationClip,
  Command,
  Project,
} from '@/types'

interface EditorState {
  // Project
  project: Project | null
  isDirty: boolean

  // Scene Objects
  objects: Record<string, SceneObject>
  rootObjectIds: string[]

  // Selection
  selectedIds: string[]
  hoveredId: string | null
  focusTargetId: string | null // ID of object to focus camera on

  // Transform
  transformMode: TransformMode
  transformSpace: TransformSpace

  // Camera
  cameraMode: CameraMode
  cameraSpeed: number

  // Settings
  editorSettings: EditorSettings
  viewportSettings: ViewportSettings
  postProcessing: PostProcessingSettings

  // UI Layer
  uiElements: UIElement[]
  selectedUIIds: string[]
  uiEditorVisible: boolean

  // Animation
  animations: AnimationClip[]
  currentAnimationId: string | null
  animationTime: number
  isPlaying: boolean

  // Command History
  history: Command[]
  historyIndex: number

  // Panels
  panels: {
    hierarchy: boolean
    inspector: boolean
    assets: boolean
    timeline: boolean
  }

  // Actions
  // Objects
  addObject: (object: Partial<SceneObject>) => string
  removeObject: (id: string) => void
  updateObject: (id: string, updates: Partial<SceneObject>) => void
  updateTransform: (id: string, transform: Partial<Transform>) => void
  duplicateObject: (id: string) => string | null
  reparentObject: (id: string, newParentId: string | null) => void
  reorderObject: (id: string, targetId: string, position: 'before' | 'after') => void

  // Selection
  selectObject: (id: string, additive?: boolean) => void
  deselectObject: (id: string) => void
  clearSelection: () => void
  selectAll: () => void
  setHovered: (id: string | null) => void
  focusOnSelected: () => void
  clearFocusTarget: () => void

  // Transform
  setTransformMode: (mode: TransformMode) => void
  setTransformSpace: (space: TransformSpace) => void

  // Camera
  setCameraMode: (mode: CameraMode) => void
  setCameraSpeed: (speed: number) => void

  // Settings
  updateEditorSettings: (settings: Partial<EditorSettings>) => void
  updateViewportSettings: (settings: Partial<ViewportSettings>) => void
  updatePostProcessing: (settings: Partial<PostProcessingSettings>) => void

  // UI Elements
  addUIElement: (element: Partial<UIElement>) => string
  updateUIElement: (id: string, updates: Partial<UIElement>) => void
  removeUIElement: (id: string) => void
  selectUIElement: (id: string, additive?: boolean) => void
  clearUISelection: () => void
  setUIEditorVisible: (visible: boolean) => void

  // Animation
  addAnimation: (clip: Partial<AnimationClip>) => string
  updateAnimation: (id: string, updates: Partial<AnimationClip>) => void
  removeAnimation: (id: string) => void
  setCurrentAnimation: (id: string | null) => void
  setAnimationTime: (time: number) => void
  playAnimation: () => void
  pauseAnimation: () => void
  stopAnimation: () => void

  // Project
  newProject: (name: string, template?: LevelTemplate) => void
  loadProject: (project: Project) => void
  saveProject: () => Project
  exportProject: () => string

  // History
  undo: () => void
  redo: () => void
  pushCommand: (command: Command) => void

  // Panels
  togglePanel: (panel: keyof EditorState['panels']) => void
}

const defaultEditorSettings: EditorSettings = {
  gridSize: 20,
  gridDivisions: 20,
  snapEnabled: false,
  snapValue: 1,
  showGrid: true,
  showAxes: false,
  showStats: false,
  backgroundColor: '#1a1a1a',
}

const defaultViewportSettings: ViewportSettings = {
  showWireframe: false,
  showNormals: false,
  showBoundingBox: false,
  enableShadows: true,
  enablePostProcessing: false,
  ambientOcclusion: false,
  bloom: false,
  depthOfField: false,
}

const defaultPostProcessing: PostProcessingSettings = {
  enabled: false,
  bloom: {
    enabled: false,
    intensity: 1,
    threshold: 0.9,
    smoothing: 0.025,
  },
  ssao: {
    enabled: false,
    radius: 0.5,
    intensity: 1,
    bias: 0.025,
  },
  dof: {
    enabled: false,
    focusDistance: 10,
    focalLength: 50,
    bokehScale: 2,
  },
  vignette: {
    enabled: false,
    offset: 0.5,
    darkness: 0.5,
  },
  chromaticAberration: {
    enabled: false,
    offset: 0.002,
  },
}

const defaultMaterial: MaterialData = {
  type: 'standard',
  color: '#808080',
  metalness: 0,
  roughness: 0.5,
  opacity: 1,
  transparent: false,
  wireframe: false,
  side: 'front',
}

const defaultTransform: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    // Initial State
    project: null,
    isDirty: false,
    objects: {},
    rootObjectIds: [],
    selectedIds: [],
    hoveredId: null,
    focusTargetId: null,
    transformMode: 'translate',
    transformSpace: 'world',
    cameraMode: 'orbit',
    cameraSpeed: 1,
    editorSettings: defaultEditorSettings,
    viewportSettings: defaultViewportSettings,
    postProcessing: defaultPostProcessing,
    uiElements: [],
    selectedUIIds: [],
    uiEditorVisible: false,
    animations: [],
    currentAnimationId: null,
    animationTime: 0,
    isPlaying: false,
    history: [],
    historyIndex: -1,
    panels: {
      hierarchy: true,
      inspector: true,
      assets: false, // Disabled by default
      timeline: false,
    },

    // Object Actions
    addObject: (partial) => {
      const id = uuidv4()
      const object: SceneObject = {
        id,
        name: partial.name || 'Object',
        type: partial.type || 'mesh',
        visible: partial.visible ?? true,
        locked: partial.locked ?? false,
        transform: partial.transform || { ...defaultTransform },
        parentId: partial.parentId || null,
        childIds: partial.childIds || [],
        geometry: partial.geometry,
        material: partial.material || { ...defaultMaterial },
        light: partial.light,
        modelUrl: partial.modelUrl,
        components: partial.components || [],
        userData: partial.userData || {},
      }

      set((state) => {
        state.objects[id] = object
        if (!object.parentId) {
          state.rootObjectIds.push(id)
        } else {
          const parent = state.objects[object.parentId]
          if (parent) {
            parent.childIds.push(id)
          }
        }
        state.isDirty = true
      })

      return id
    },

    removeObject: (id) => {
      set((state) => {
        const object = state.objects[id]
        if (!object) return

        // Remove from parent
        if (object.parentId) {
          const parent = state.objects[object.parentId]
          if (parent) {
            parent.childIds = parent.childIds.filter((cid) => cid !== id)
          }
        } else {
          state.rootObjectIds = state.rootObjectIds.filter((rid) => rid !== id)
        }

        // Remove children recursively
        const removeChildren = (objId: string) => {
          const obj = state.objects[objId]
          if (obj) {
            obj.childIds.forEach(removeChildren)
            delete state.objects[objId]
          }
        }
        removeChildren(id)

        // Clear selection
        state.selectedIds = state.selectedIds.filter((sid) => sid !== id)
        state.isDirty = true
      })
    },

    updateObject: (id, updates) => {
      set((state) => {
        const object = state.objects[id]
        if (object) {
          Object.assign(object, updates)
          state.isDirty = true
        }
      })
    },

    updateTransform: (id, transform) => {
      set((state) => {
        const object = state.objects[id]
        if (object) {
          Object.assign(object.transform, transform)
          state.isDirty = true
        }
      })
    },

    duplicateObject: (id) => {
      const state = get()
      const object = state.objects[id]
      if (!object) return null

      const newId = state.addObject({
        ...object,
        id: undefined,
        name: `${object.name} Copy`,
        childIds: [],
      })

      return newId
    },

    reparentObject: (id, newParentId) => {
      // Get world position before reparenting
      const mesh = MeshRegistry.get(id)
      const worldPosition = new THREE.Vector3()
      const worldQuaternion = new THREE.Quaternion()
      const worldScale = new THREE.Vector3()

      if (mesh) {
        mesh.getWorldPosition(worldPosition)
        mesh.getWorldQuaternion(worldQuaternion)
        mesh.getWorldScale(worldScale)
      }

      set((state) => {
        const object = state.objects[id]
        if (!object) return

        // Remove from old parent
        if (object.parentId) {
          const oldParent = state.objects[object.parentId]
          if (oldParent) {
            oldParent.childIds = oldParent.childIds.filter((cid) => cid !== id)
          }
        } else {
          state.rootObjectIds = state.rootObjectIds.filter((rid) => rid !== id)
        }

        // Add to new parent
        object.parentId = newParentId
        if (newParentId) {
          const newParent = state.objects[newParentId]
          if (newParent) {
            newParent.childIds.push(id)
          }
        } else {
          state.rootObjectIds.push(id)
        }

        // Calculate new local transform to preserve world position
        if (mesh) {
          const newParentMesh = newParentId ? MeshRegistry.get(newParentId) : null

          if (newParentMesh) {
            // Get new parent's world transform
            const parentWorldPosition = new THREE.Vector3()
            const parentWorldQuaternion = new THREE.Quaternion()
            const parentWorldScale = new THREE.Vector3()
            newParentMesh.getWorldPosition(parentWorldPosition)
            newParentMesh.getWorldQuaternion(parentWorldQuaternion)
            newParentMesh.getWorldScale(parentWorldScale)

            // Calculate local position relative to new parent
            const localPosition = worldPosition.clone().sub(parentWorldPosition)
            const parentQuatInverse = parentWorldQuaternion.clone().invert()
            localPosition.applyQuaternion(parentQuatInverse)
            localPosition.divide(parentWorldScale)

            // Calculate local rotation relative to new parent
            const localQuaternion = parentQuatInverse.multiply(worldQuaternion)
            const localEuler = new THREE.Euler().setFromQuaternion(localQuaternion)

            // Calculate local scale relative to new parent
            const localScale = worldScale.clone().divide(parentWorldScale)

            object.transform.position = [localPosition.x, localPosition.y, localPosition.z]
            object.transform.rotation = [localEuler.x, localEuler.y, localEuler.z]
            object.transform.scale = [localScale.x, localScale.y, localScale.z]
          } else {
            // No new parent, world position becomes local position
            const euler = new THREE.Euler().setFromQuaternion(worldQuaternion)
            object.transform.position = [worldPosition.x, worldPosition.y, worldPosition.z]
            object.transform.rotation = [euler.x, euler.y, euler.z]
            object.transform.scale = [worldScale.x, worldScale.y, worldScale.z]
          }
        }

        state.isDirty = true
      })
    },

    reorderObject: (id, targetId, position) => {
      set((state) => {
        const obj = state.objects[id]
        const targetObj = state.objects[targetId]
        if (!obj || !targetObj) return
        if (obj.parentId !== targetObj.parentId) return

        const siblingList = obj.parentId
          ? state.objects[obj.parentId].childIds
          : state.rootObjectIds

        // Remove from current position
        const filtered = siblingList.filter((cid) => cid !== id)

        // Find target index and insert
        const targetIndex = filtered.indexOf(targetId)
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
        filtered.splice(insertIndex, 0, id)

        // Update the list
        if (obj.parentId) {
          state.objects[obj.parentId].childIds = filtered
        } else {
          state.rootObjectIds = filtered
        }
        state.isDirty = true
      })
    },

    // Selection Actions
    selectObject: (id, additive = false) => {
      set((state) => {
        if (additive) {
          if (!state.selectedIds.includes(id)) {
            state.selectedIds.push(id)
          }
        } else {
          state.selectedIds = [id]
        }
      })
    },

    deselectObject: (id) => {
      set((state) => {
        state.selectedIds = state.selectedIds.filter((sid) => sid !== id)
      })
    },

    clearSelection: () => {
      set((state) => {
        state.selectedIds = []
      })
    },

    selectAll: () => {
      set((state) => {
        state.selectedIds = Object.keys(state.objects)
      })
    },

    setHovered: (id) => {
      set((state) => {
        state.hoveredId = id
      })
    },

    focusOnSelected: () => {
      set((state) => {
        if (state.selectedIds.length > 0) {
          state.focusTargetId = state.selectedIds[0]
        }
      })
    },

    clearFocusTarget: () => {
      set((state) => {
        state.focusTargetId = null
      })
    },

    // Transform Actions
    setTransformMode: (mode) => {
      set((state) => {
        state.transformMode = mode
      })
    },

    setTransformSpace: (space) => {
      set((state) => {
        state.transformSpace = space
      })
    },

    // Camera Actions
    setCameraMode: (mode) => {
      set((state) => {
        state.cameraMode = mode
      })
    },

    setCameraSpeed: (speed) => {
      set((state) => {
        state.cameraSpeed = speed
      })
    },

    // Settings Actions
    updateEditorSettings: (settings) => {
      set((state) => {
        Object.assign(state.editorSettings, settings)
      })
    },

    updateViewportSettings: (settings) => {
      set((state) => {
        Object.assign(state.viewportSettings, settings)
      })
    },

    updatePostProcessing: (settings) => {
      set((state) => {
        if (settings.bloom) Object.assign(state.postProcessing.bloom, settings.bloom)
        if (settings.ssao) Object.assign(state.postProcessing.ssao, settings.ssao)
        if (settings.dof) Object.assign(state.postProcessing.dof, settings.dof)
        if (settings.vignette) Object.assign(state.postProcessing.vignette, settings.vignette)
        if (settings.chromaticAberration) Object.assign(state.postProcessing.chromaticAberration, settings.chromaticAberration)
        if (settings.enabled !== undefined) state.postProcessing.enabled = settings.enabled
      })
    },

    // UI Element Actions
    addUIElement: (partial) => {
      const id = uuidv4()
      const element: UIElement = {
        id,
        type: partial.type || 'text',
        name: partial.name || 'UI Element',
        visible: partial.visible ?? true,
        x: partial.x ?? 0,
        y: partial.y ?? 0,
        width: partial.width ?? 100,
        height: partial.height ?? 50,
        anchor: partial.anchor || 'top-left',
        ...partial,
      }

      set((state) => {
        state.uiElements.push(element)
        state.isDirty = true
      })

      return id
    },

    updateUIElement: (id, updates) => {
      set((state) => {
        const index = state.uiElements.findIndex((el) => el.id === id)
        if (index !== -1) {
          Object.assign(state.uiElements[index], updates)
          state.isDirty = true
        }
      })
    },

    removeUIElement: (id) => {
      set((state) => {
        state.uiElements = state.uiElements.filter((el) => el.id !== id)
        state.selectedUIIds = state.selectedUIIds.filter((sid) => sid !== id)
        state.isDirty = true
      })
    },

    selectUIElement: (id, additive = false) => {
      set((state) => {
        if (additive) {
          if (!state.selectedUIIds.includes(id)) {
            state.selectedUIIds.push(id)
          }
        } else {
          state.selectedUIIds = [id]
        }
      })
    },

    clearUISelection: () => {
      set((state) => {
        state.selectedUIIds = []
      })
    },

    setUIEditorVisible: (visible) => {
      set((state) => {
        state.uiEditorVisible = visible
      })
    },

    // Animation Actions
    addAnimation: (partial) => {
      const id = uuidv4()
      const clip: AnimationClip = {
        id,
        name: partial.name || 'Animation',
        duration: partial.duration || 1,
        tracks: partial.tracks || [],
      }

      set((state) => {
        state.animations.push(clip)
        state.isDirty = true
      })

      return id
    },

    updateAnimation: (id, updates) => {
      set((state) => {
        const index = state.animations.findIndex((a) => a.id === id)
        if (index !== -1) {
          Object.assign(state.animations[index], updates)
          state.isDirty = true
        }
      })
    },

    removeAnimation: (id) => {
      set((state) => {
        state.animations = state.animations.filter((a) => a.id !== id)
        if (state.currentAnimationId === id) {
          state.currentAnimationId = null
        }
        state.isDirty = true
      })
    },

    setCurrentAnimation: (id) => {
      set((state) => {
        state.currentAnimationId = id
        state.animationTime = 0
      })
    },

    setAnimationTime: (time) => {
      set((state) => {
        state.animationTime = time
      })
    },

    playAnimation: () => {
      set((state) => {
        state.isPlaying = true
      })
    },

    pauseAnimation: () => {
      set((state) => {
        state.isPlaying = false
      })
    },

    stopAnimation: () => {
      set((state) => {
        state.isPlaying = false
        state.animationTime = 0
      })
    },

    // Project Actions
    newProject: (name, template) => {
      // Use provided template or default to basic
      const selectedTemplate = template || templates.basic
      const templateObjects = selectedTemplate.objects()
      
      // Build objects map and root IDs from template
      const objectsMap: Record<string, SceneObject> = {}
      const rootIds: string[] = []
      
      for (const obj of templateObjects) {
        objectsMap[obj.id] = obj
        if (!obj.parentId) {
          rootIds.push(obj.id)
        }
      }

      const project: Project = {
        id: uuidv4(),
        name,
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        settings: {
          ...defaultEditorSettings,
          backgroundColor: selectedTemplate.backgroundColor,
        },
        viewport: defaultViewportSettings,
        postProcessing: defaultPostProcessing,
        objects: objectsMap,
        rootObjectIds: rootIds,
        animations: [],
        uiElements: [],
        assets: [],
      }

      set((state) => {
        state.project = project
        state.objects = objectsMap
        state.rootObjectIds = rootIds
        state.selectedIds = []
        state.uiElements = []
        state.animations = []
        state.isDirty = false
        state.history = []
        state.historyIndex = -1
        state.editorSettings = {
          ...state.editorSettings,
          backgroundColor: selectedTemplate.backgroundColor,
        }
      })
    },

    loadProject: (project) => {
      set((state) => {
        state.project = project
        state.objects = project.objects
        state.rootObjectIds = project.rootObjectIds
        state.editorSettings = project.settings
        state.viewportSettings = project.viewport
        state.postProcessing = project.postProcessing
        state.uiElements = project.uiElements
        state.animations = project.animations
        state.selectedIds = []
        state.isDirty = false
        state.history = []
        state.historyIndex = -1
      })
    },

    saveProject: () => {
      const state = get()
      const project: Project = {
        id: state.project?.id || uuidv4(),
        name: state.project?.name || 'Untitled',
        version: '1.0.0',
        created: state.project?.created || new Date().toISOString(),
        modified: new Date().toISOString(),
        settings: state.editorSettings,
        viewport: state.viewportSettings,
        postProcessing: state.postProcessing,
        objects: state.objects,
        rootObjectIds: state.rootObjectIds,
        animations: state.animations,
        uiElements: state.uiElements,
        assets: state.project?.assets || [],
      }

      set((s) => {
        s.project = project
        s.isDirty = false
      })

      return project
    },

    exportProject: () => {
      const project = get().saveProject()
      return JSON.stringify(project, null, 2)
    },

    // History Actions
    undo: () => {
      set((state) => {
        if (state.historyIndex >= 0) {
          const command = state.history[state.historyIndex]
          command.undo()
          state.historyIndex--
        }
      })
    },

    redo: () => {
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++
          const command = state.history[state.historyIndex]
          command.redo()
        }
      })
    },

    pushCommand: (command) => {
      set((state) => {
        // Remove any commands after current index
        state.history = state.history.slice(0, state.historyIndex + 1)
        state.history.push(command)
        state.historyIndex = state.history.length - 1
      })
    },

    // Panel Actions
    togglePanel: (panel) => {
      set((state) => {
        state.panels[panel] = !state.panels[panel]
      })
    },
  }))
)

// Selectors


export const useSelectedObject = () => {
  const objects = useEditorStore((state) => state.objects)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  if (selectedIds.length !== 1) return null
  return objects[selectedIds[0]] || null
}

export const useObject = (id: string) => {
  return useEditorStore((state) => state.objects[id])
}


