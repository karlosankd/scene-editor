import * as THREE from 'three'

// Global registry to store mesh references by object ID
const meshRegistry = new Map<string, THREE.Object3D>()

export const MeshRegistry = {
  register(id: string, mesh: THREE.Object3D) {
    meshRegistry.set(id, mesh)
  },

  unregister(id: string) {
    meshRegistry.delete(id)
  },

  get(id: string): THREE.Object3D | undefined {
    return meshRegistry.get(id)
  },
}
