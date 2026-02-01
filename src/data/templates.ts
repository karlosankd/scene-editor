import { v4 as uuidv4 } from 'uuid'
import type { SceneObject, SceneObjectBase, SkyData, FogData, LightData, CloudData, GeometryData, MaterialData } from '@/types'

export interface LevelTemplate {
  id: string
  nameKey: string // i18n key
  descriptionKey: string // i18n key
  backgroundColor: string
  objects: () => SceneObject[] // Factory function to generate fresh IDs
}

// Default Sky configuration - UE5-like clear blue sky
const defaultSkyData: SkyData = {
  sunPosition: [100, 20, 100],
  turbidity: 0.5,             // Very low turbidity for clear air (UE5 style)
  rayleigh: 0.5,              // Lower rayleigh for deep blue
  mieCoefficient: 0.003,      // Lower scattering
  mieDirectionalG: 0.8,
  inclination: 0.49,
  azimuth: 0.25,
}

// Default Fog configuration - very subtle distance fog
const defaultFogData: FogData = {
  type: 'exponential',
  color: '#87ceeb',          // Match sky color for seamless blending
  density: 0.0002,           // Very low density for "transparent/clear" look
}

// Default Cloud configuration
const defaultCloudData: CloudData = {
  opacity: 0.5,
  speed: 0.4,
  width: 20,
  depth: 5,
  segments: 20,
  color: '#ffffff',
}

// Default Directional Light (Sun) configuration
const defaultSunLightData: LightData = {
  type: 'directional',
  color: '#fffaf0',   // Slightly warm sun color like UE5
  intensity: 2,       // Stronger sun for outdoor scene
  castShadow: true,
  shadowMapSize: 2048,
  target: [0, 0, 0],
}

// Sky Light (Hemisphere Light) - provides ambient illumination from sky dome
const defaultSkyLightData: LightData = {
  type: 'hemisphere',
  color: '#87ceeb',      // Sky blue from above
  groundColor: '#3d3d3d', // Dark ground reflection
  intensity: 0.6,
}

// Base object properties shared by all types
function createBaseObject(id: string, name: string): Omit<SceneObjectBase, 'type'> {
  return {
    id,
    name,
    visible: true,
    locked: false,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    parentId: null,
    childIds: [],
    components: [],
    userData: {},
  }
}

// Type-safe factory functions for each object type
function createSkyObject(id: string, name: string, sky: SkyData): SceneObject {
  return { ...createBaseObject(id, name), type: 'sky', sky }
}

function createLightObject(id: string, name: string, light: LightData, transform?: SceneObjectBase['transform']): SceneObject {
  const base = createBaseObject(id, name)
  if (transform) base.transform = transform
  return { ...base, type: 'light', light }
}

function createFogObject(id: string, name: string, fog: FogData): SceneObject {
  return { ...createBaseObject(id, name), type: 'fog', fog }
}

function createCloudObject(id: string, name: string, cloud: CloudData, transform?: SceneObjectBase['transform']): SceneObject {
  const base = createBaseObject(id, name)
  if (transform) base.transform = transform
  return { ...base, type: 'cloud', cloud }
}

// Factory functions for creating type-safe scene objects
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createMeshObject(id: string, name: string, geometry: GeometryData, material: MaterialData, transform?: SceneObjectBase['transform']): SceneObject {
  const base = createBaseObject(id, name)
  if (transform) base.transform = transform
  return { ...base, type: 'mesh', geometry, material }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createGroupObject(id: string, name: string): SceneObject {
  return { ...createBaseObject(id, name), type: 'group' }
}

export const templates: Record<string, LevelTemplate> = {
  empty: {
    id: 'empty',
    nameKey: 'template.emptyLevel',
    descriptionKey: 'template.emptyLevelDesc',
    backgroundColor: '#000000',
    objects: () => [],
  },

  basic: {
    id: 'basic',
    nameKey: 'template.basicLevel',
    descriptionKey: 'template.basicLevelDesc',
    backgroundColor: '#000000', // Default void color (black) - Sky object provides blue sky
    objects: () => {
      const skyId = uuidv4()
      const sunId = uuidv4()
      const skyLightId = uuidv4()
      const fogId = uuidv4()
      const cloudId = uuidv4()

      return [
        // Sky Atmosphere
        createSkyObject(skyId, 'SkyAtmosphere', { ...defaultSkyData }),

        // Volumetric Clouds
        createCloudObject(cloudId, 'VolumetricClouds', { ...defaultCloudData }, {
          position: [0, 50, 0], // Clouds high up
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        }),

        // Directional Light (Sun)
        createLightObject(sunId, 'DirectionalLight', { ...defaultSunLightData }, {
          position: [50, 50, 50],
          rotation: [-Math.PI / 4, Math.PI / 4, 0],
          scale: [1, 1, 1],
        }),

        // Sky Light (Hemisphere Light for ambient)
        createLightObject(skyLightId, 'SkyLight', { ...defaultSkyLightData }, {
          position: [0, 50, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        }),

        // Exponential Height Fog
        createFogObject(fogId, 'ExponentialHeightFog', { ...defaultFogData }),
      ]
    },
  },
}

export const templateList = Object.values(templates)
