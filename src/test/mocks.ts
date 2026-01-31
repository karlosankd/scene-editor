import type { SceneObject } from '@/types'

/**
 * Creates a mock SceneObject for testing
 */
export function createMockObject(overrides: Partial<SceneObject> = {}): SceneObject {
  return {
    id: overrides.id ?? `object-${Math.random().toString(36).substr(2, 9)}`,
    name: overrides.name ?? 'Test Object',
    type: overrides.type ?? 'mesh',
    visible: overrides.visible ?? true,
    locked: overrides.locked ?? false,
    transform: overrides.transform ?? {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    parentId: overrides.parentId ?? null,
    childIds: overrides.childIds ?? [],
    components: overrides.components ?? [],
    userData: overrides.userData ?? {},
    geometry: overrides.geometry,
    material: overrides.material,
    light: overrides.light,
    modelUrl: overrides.modelUrl,
  }
}

/**
 * Creates a mock object hierarchy for testing
 */
export function createMockHierarchy(): {
  objects: Record<string, SceneObject>
  rootIds: string[]
} {
  const parent = createMockObject({
    id: 'parent-1',
    name: 'Parent Object',
    type: 'group',
    childIds: ['child-1', 'child-2'],
  })

  const child1 = createMockObject({
    id: 'child-1',
    name: 'Child One',
    type: 'mesh',
    parentId: 'parent-1',
    childIds: ['grandchild-1'],
  })

  const child2 = createMockObject({
    id: 'child-2',
    name: 'Child Two',
    type: 'light',
    parentId: 'parent-1',
  })

  const grandchild = createMockObject({
    id: 'grandchild-1',
    name: 'Grandchild',
    type: 'camera',
    parentId: 'child-1',
  })

  const standalone = createMockObject({
    id: 'standalone-1',
    name: 'Standalone Mesh',
    type: 'mesh',
  })

  const particle = createMockObject({
    id: 'particle-1',
    name: 'Particle Effect',
    type: 'particle',
  })

  return {
    objects: {
      'parent-1': parent,
      'child-1': child1,
      'child-2': child2,
      'grandchild-1': grandchild,
      'standalone-1': standalone,
      'particle-1': particle,
    },
    rootIds: ['parent-1', 'standalone-1', 'particle-1'],
  }
}

/**
 * Creates an initial editor store state for testing
 */
export function createMockStoreState() {
  const { objects, rootIds } = createMockHierarchy()

  return {
    objects,
    rootObjectIds: rootIds,
    selectedIds: [] as string[],
    hoveredId: null as string | null,
  }
}
