import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore, useSelectedObject } from '@/stores/editorStore'
import { MeshRegistry } from '@/stores/meshRegistry'
import { TranslateGizmo } from './TranslateGizmo'
import { RotateGizmo } from './RotateGizmo'
import { ScaleGizmo } from './ScaleGizmo'
import { useGizmoDrag } from './useGizmoDrag'

// Gizmo uses layer 1 for priority raycasting
const GIZMO_LAYER = 1

interface TransformGizmoProps {
  orbitRef: React.RefObject<any>
}

export function TransformGizmo({ orbitRef }: TransformGizmoProps) {
  const { camera, raycaster } = useThree()
  const selectedObject = useSelectedObject()
  const transformMode = useEditorStore((state) => state.transformMode)
  const transformSpace = useEditorStore((state) => state.transformSpace)

  const groupRef = useRef<THREE.Group>(null)

  // Enable gizmo layer on raycaster so it can detect gizmo objects
  useEffect(() => {
    raycaster.layers.enable(GIZMO_LAYER)
  }, [raycaster])

  // Set gizmo layer on all children
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        child.layers.enable(GIZMO_LAYER)
      })
    }
  })

  const {
    hoveredAxis,
    setHoveredAxis,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useGizmoDrag({ orbitRef })

  // Update gizmo position and rotation every frame
  useFrame(() => {
    if (!selectedObject || !groupRef.current) return

    const targetMesh = MeshRegistry.get(selectedObject.id)
    if (!targetMesh) return

    // Position matches target's world position (important for child objects)
    targetMesh.getWorldPosition(groupRef.current.position)
    
    // Rotation depends on space
    if (transformMode === 'scale') {
      // Scale is always local-aligned visually usually, or aligned with object rotation
      groupRef.current.quaternion.copy(targetMesh.quaternion)
    } else if (transformMode === 'translate') {
      if (transformSpace === 'local') {
        groupRef.current.quaternion.copy(targetMesh.quaternion)
      } else {
        groupRef.current.quaternion.set(0, 0, 0, 1) // World aligned
      }
    } else if (transformMode === 'rotate') {
      if (transformSpace === 'local') {
        groupRef.current.quaternion.copy(targetMesh.quaternion)
      } else {
        groupRef.current.quaternion.set(0, 0, 0, 1)
      }
    }

    // Scale gizmo to maintain constant screen size
    const distance = camera.position.distanceTo(groupRef.current.position)
    const fov = (camera as THREE.PerspectiveCamera).fov
    // Scale factor to keep gizmo roughly same size on screen
    const s = Math.tan((fov * Math.PI) / 360) * distance * 0.15
    groupRef.current.scale.set(s, s, s)
  })

  if (!selectedObject || transformMode === 'select') return null

  return (
    <group ref={groupRef} renderOrder={999}>
      {transformMode === 'translate' && (
        <TranslateGizmo
          hoveredAxis={hoveredAxis}
          setHoveredAxis={setHoveredAxis}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}
      {transformMode === 'rotate' && (
        <RotateGizmo
          hoveredAxis={hoveredAxis}
          setHoveredAxis={setHoveredAxis}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}
      {transformMode === 'scale' && (
        <ScaleGizmo
          hoveredAxis={hoveredAxis}
          setHoveredAxis={setHoveredAxis}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}
    </group>
  )
}
