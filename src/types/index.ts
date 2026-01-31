import * as THREE from 'three'

// Scene Object Types
export type ObjectType =
  | 'mesh'
  | 'light'
  | 'camera'
  | 'group'
  | 'model'
  | 'particle'
  | 'ui'

export type LightType =
  | 'ambient'
  | 'directional'
  | 'point'
  | 'spot'
  | 'hemisphere'

export type GeometryType =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'plane'

// Transform
export interface Transform {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

// Material
export interface MaterialData {
  type: 'standard' | 'physical' | 'basic' | 'phong' | 'lambert'
  color: string
  metalness?: number
  roughness?: number
  emissive?: string
  emissiveIntensity?: number
  opacity?: number
  transparent?: boolean
  wireframe?: boolean
  side?: 'front' | 'back' | 'double'
  map?: string
  normalMap?: string
  roughnessMap?: string
  metalnessMap?: string
  aoMap?: string
  envMap?: string
  envMapIntensity?: number
}

// Light Data
export interface LightData {
  type: LightType
  color: string
  intensity: number
  castShadow?: boolean
  shadowMapSize?: number
  // Directional/Spot
  target?: [number, number, number]
  // Point/Spot
  distance?: number
  decay?: number
  // Spot
  angle?: number
  penumbra?: number
  // Hemisphere
  groundColor?: string
}

// Geometry Data
export interface GeometryData {
  type: GeometryType
  // Box
  width?: number
  height?: number
  depth?: number
  // Sphere
  radius?: number
  widthSegments?: number
  heightSegments?: number
  // Cylinder/Cone
  radiusTop?: number
  radiusBottom?: number
  // Torus
  tube?: number
  radialSegments?: number
  tubularSegments?: number
  arc?: number
}

// Component System
export interface Component {
  id: string
  type: string
  enabled: boolean
  data: Record<string, unknown>
}

// Scene Object
export interface SceneObject {
  id: string
  name: string
  type: ObjectType
  visible: boolean
  locked: boolean
  transform: Transform
  parentId: string | null
  childIds: string[]
  // Mesh specific
  geometry?: GeometryData
  material?: MaterialData
  // Light specific
  light?: LightData
  // Model specific
  modelUrl?: string
  // Components
  components: Component[]
  // Metadata
  userData: Record<string, unknown>
}

// Editor State
export type TransformMode = 'translate' | 'rotate' | 'scale'
export type TransformSpace = 'world' | 'local'
export type CameraMode = 'orbit' | 'fly' | 'firstPerson'
export type SnapMode = 'none' | 'grid' | 'vertex'

export interface EditorSettings {
  gridSize: number
  gridDivisions: number
  snapEnabled: boolean
  snapValue: number
  showGrid: boolean
  showAxes: boolean
  showStats: boolean
  backgroundColor: string
}

export interface ViewportSettings {
  showWireframe: boolean
  showNormals: boolean
  showBoundingBox: boolean
  enableShadows: boolean
  enablePostProcessing: boolean
  ambientOcclusion: boolean
  bloom: boolean
  depthOfField: boolean
}

// Post Processing Settings
export interface PostProcessingSettings {
  enabled: boolean
  bloom: {
    enabled: boolean
    intensity: number
    threshold: number
    smoothing: number
  }
  ssao: {
    enabled: boolean
    radius: number
    intensity: number
    bias: number
  }
  dof: {
    enabled: boolean
    focusDistance: number
    focalLength: number
    bokehScale: number
  }
  vignette: {
    enabled: boolean
    offset: number
    darkness: number
  }
  chromaticAberration: {
    enabled: boolean
    offset: number
  }
}

// Particle System
export interface ParticleEmitter {
  id: string
  name: string
  enabled: boolean
  // Emission
  rate: number
  burst: number
  duration: number
  loop: boolean
  // Shape
  shape: 'point' | 'sphere' | 'box' | 'cone' | 'circle'
  shapeRadius: number
  shapeAngle: number
  // Particles
  lifetime: [number, number]
  startSpeed: [number, number]
  startSize: [number, number]
  startColor: string
  endColor: string
  startOpacity: number
  endOpacity: number
  // Forces
  gravity: [number, number, number]
  // Rendering
  texture?: string
  blending: 'normal' | 'additive' | 'multiply'
}

// Animation
export interface Keyframe {
  time: number
  value: number | number[]
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

export interface AnimationTrack {
  id: string
  objectId: string
  property: string
  keyframes: Keyframe[]
}

export interface AnimationClip {
  id: string
  name: string
  duration: number
  tracks: AnimationTrack[]
}

// UI Layer
export interface UIElement {
  id: string
  type: 'text' | 'image' | 'button' | 'chart' | 'hotspot' | 'panel'
  name: string
  visible: boolean
  // Position & Size
  x: number
  y: number
  width: number
  height: number
  anchor: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  // Style
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  opacity?: number
  // Content
  content?: string
  fontSize?: number
  fontColor?: string
  imageSrc?: string
  chartData?: ChartData
  // Interaction
  onClick?: string
  linkedObjectId?: string
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'scatter'
  title?: string
  data: Array<{ name: string; value: number }>
  options?: Record<string, unknown>
}

// Project
export interface Project {
  id: string
  name: string
  version: string
  created: string
  modified: string
  settings: EditorSettings
  viewport: ViewportSettings
  postProcessing: PostProcessingSettings
  objects: Record<string, SceneObject>
  rootObjectIds: string[]
  animations: AnimationClip[]
  uiElements: UIElement[]
  assets: Asset[]
}

export interface Asset {
  id: string
  name: string
  type: 'model' | 'texture' | 'hdri' | 'audio'
  url: string
  thumbnail?: string
}

// Command System
export interface Command {
  id: string
  type: string
  timestamp: number
  data: unknown
  undo: () => void
  redo: () => void
}

// Selection
export interface Selection {
  objectIds: string[]
  uiElementIds: string[]
}

// Three.js References
export interface ThreeRefs {
  scene: THREE.Scene | null
  camera: THREE.Camera | null
  renderer: THREE.WebGLRenderer | null
  controls: unknown | null
  transformControls: unknown | null
}
