import { useRef, useEffect } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Axis } from './constants'

// Custom raycast that returns priority distance (very small) so gizmo is always on top
export function usePriorityRaycast(ref: React.RefObject<THREE.Mesh>) {
  useEffect(() => {
    if (!ref.current) return
    const mesh = ref.current
    const originalRaycast = mesh.raycast.bind(mesh)
    mesh.raycast = (raycaster, intersects) => {
      const startLen = intersects.length
      originalRaycast(raycaster, intersects)
      // Set priority distance for gizmo to always be selected first
      for (let i = startLen; i < intersects.length; i++) {
        intersects[i].distance = 0
      }
    }
  }, [ref])
}

// Hitbox component with priority raycast (invisible, for hit detection)
export function HitboxMesh({
  position,
  rotation,
  geometry,
  axis,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerOver,
  onPointerOut,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  geometry: React.ReactNode
  axis: Axis
  onPointerDown: (e: ThreeEvent<PointerEvent>, axis: Axis) => void
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void
  onPointerOver: (e: ThreeEvent<PointerEvent>, axis: Axis) => void
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  usePriorityRaycast(meshRef)

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onPointerDown={(e) => onPointerDown(e, axis)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={(e) => onPointerOver(e, axis)}
      onPointerOut={onPointerOut}
    >
      {geometry}
      <meshBasicMaterial transparent opacity={0.001} depthTest={false} depthWrite={false} />
    </mesh>
  )
}

// Visible mesh with priority raycast (for center sphere and visible handles)
export function PriorityMesh({
  position,
  rotation,
  geometry,
  color,
  axis,
  transparent,
  opacity,
  side,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerOver,
  onPointerOut,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  geometry: React.ReactNode
  color: string
  axis: Axis
  transparent?: boolean
  opacity?: number
  side?: THREE.Side
  onPointerDown: (e: ThreeEvent<PointerEvent>, axis: Axis) => void
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void
  onPointerOver: (e: ThreeEvent<PointerEvent>, axis: Axis) => void
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  usePriorityRaycast(meshRef)

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      renderOrder={999}
      onPointerDown={(e) => onPointerDown(e, axis)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={(e) => onPointerOver(e, axis)}
      onPointerOut={onPointerOut}
    >
      {geometry}
      <meshBasicMaterial
        color={color}
        transparent={transparent}
        opacity={opacity}
        side={side}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
