import { v4 as uuidv4 } from 'uuid'
import type { SceneObject, SkyData, FogData, LightData } from '@/types'

export interface LevelTemplate {
  id: string
  nameKey: string // i18n key
  descriptionKey: string // i18n key
  backgroundColor: string
  objects: () => SceneObject[] // Factory function to generate fresh IDs
}

// Default Sky configuration
const defaultSkyData: SkyData = {
  sunPosition: [100, 100, 100],
  turbidity: 8,
  rayleigh: 2,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.8,
  inclination: 0.49,
  azimuth: 0.25,
}

// Default Fog configuration
const defaultFogData: FogData = {
  type: 'exponential',
  color: '#c9e2ff',
  density: 0.002,
}

// Default Directional Light (Sun) configuration
const defaultSunLightData: LightData = {
  type: 'directional',
  color: '#ffffff',
  intensity: 1.5,
  castShadow: true,
  shadowMapSize: 2048,
  target: [0, 0, 0],
}

// Helper to create a SceneObject with defaults
function createSceneObject(partial: Partial<SceneObject> & { id: string; name: string; type: SceneObject['type'] }): SceneObject {
  return {
    visible: true,
    locked: false,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    parentId: null,
    childIds: [],
    components: [],
    userData: {},
    ...partial,
  }
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
    backgroundColor: '#87ceeb', // Sky blue
    objects: () => {
      const skyId = uuidv4()
      const sunId = uuidv4()
      const fogId = uuidv4()

      return [
        // Sky
        createSceneObject({
          id: skyId,
          name: 'Sky',
          type: 'sky',
          sky: { ...defaultSkyData },
        }),

        // Directional Light (Sun)
        createSceneObject({
          id: sunId,
          name: 'DirectionalLight',
          type: 'light',
          transform: {
            position: [50, 50, 50],
            rotation: [-Math.PI / 4, Math.PI / 4, 0],
            scale: [1, 1, 1],
          },
          light: { ...defaultSunLightData },
        }),

        // Exponential Height Fog
        createSceneObject({
          id: fogId,
          name: 'ExponentialHeightFog',
          type: 'fog',
          fog: { ...defaultFogData },
        }),
      ]
    },
  },
}

export const templateList = Object.values(templates)
