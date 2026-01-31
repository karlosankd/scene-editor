import { useRef, useEffect } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { GIZMO_COLORS, GIZMO_SIZES, Axis } from './constants'

// Custom raycast that returns priority distance (very small) so gizmo is always on top
function usePriorityRaycast(ref: React.RefObject<THREE.Mesh>) {
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
  }, [])
}

// Hitbox component with priority raycast
function HitboxMesh({
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
  position: [number, number, number]
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

// Visible mesh with priority raycast (for center sphere and plane handles)
function PriorityMesh({
  position,
  rotation,
  geometry,
  color,
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
  color: string
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
      <meshBasicMaterial color={color} depthTest={false} depthWrite={false} />
    </mesh>
  )
}

interface TranslateGizmoProps {
  hoveredAxis: Axis
  setHoveredAxis: (axis: Axis) => void
  onPointerDown: (e: ThreeEvent<PointerEvent>, axis: Axis) => void
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void
}

export function TranslateGizmo({
  hoveredAxis,
  setHoveredAxis,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: TranslateGizmoProps) {
  const {
    ARROW_LENGTH,
    ARROW_RADIUS,
    CONE_HEIGHT,
    CONE_RADIUS,
    CENTER_BOX,
  } = GIZMO_SIZES

  // L-shaped plane handle dimensions - forms a wall corner (3 faces)
  const HANDLE_DIST = 0.35    // Distance from center where the L starts
  const HANDLE_SIZE = 0.35     // Size of the L (length of each leg)
  const HANDLE_THICKNESS = 0.02

  const handlePointerOver = (e: ThreeEvent<PointerEvent>, axis: Axis) => {
    e.stopPropagation()
    setHoveredAxis(axis)
  }

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredAxis(null)
  }

  // Check if axis or related plane is hovered
  const isXHovered = hoveredAxis === 'X' || hoveredAxis === 'XY' || hoveredAxis === 'XZ'
  const isYHovered = hoveredAxis === 'Y' || hoveredAxis === 'XY' || hoveredAxis === 'YZ'
  const isZHovered = hoveredAxis === 'Z' || hoveredAxis === 'XZ' || hoveredAxis === 'YZ'

  return (
    <group>
      {/* Center Sphere (Free Move) - White ball */}
      <PriorityMesh
        geometry={<sphereGeometry args={[CENTER_BOX, 16, 16]} />}
        color={hoveredAxis === 'XYZ' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.WHITE}
        axis="XYZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* X Axis Arrow (Red) */}
      <group rotation={[0, 0, -Math.PI / 2]}>
        {/* Invisible hitbox for easier hover detection */}
        <HitboxMesh
          position={[0, (ARROW_LENGTH + CONE_HEIGHT) / 2 + CENTER_BOX, 0]}
          geometry={<cylinderGeometry args={[ARROW_RADIUS * 4, ARROW_RADIUS * 4, ARROW_LENGTH + CONE_HEIGHT, 8]} />}
          axis="X"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* Visible arrow shaft - raycast disabled */}
        <mesh position={[0, ARROW_LENGTH / 2 + CENTER_BOX, 0]} raycast={() => null}>
          <cylinderGeometry args={[ARROW_RADIUS, ARROW_RADIUS, ARROW_LENGTH, 8]} />
          <meshBasicMaterial
            color={isXHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.X}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Visible arrow head - raycast disabled */}
        <mesh position={[0, ARROW_LENGTH + CENTER_BOX + CONE_HEIGHT / 2, 0]} raycast={() => null}>
          <coneGeometry args={[CONE_RADIUS, CONE_HEIGHT, 16]} />
          <meshBasicMaterial
            color={isXHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.X}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Y Axis Arrow (Green) */}
      <group>
        {/* Invisible hitbox for easier hover detection */}
        <HitboxMesh
          position={[0, (ARROW_LENGTH + CONE_HEIGHT) / 2 + CENTER_BOX, 0]}
          geometry={<cylinderGeometry args={[ARROW_RADIUS * 4, ARROW_RADIUS * 4, ARROW_LENGTH + CONE_HEIGHT, 8]} />}
          axis="Y"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* Visible arrow shaft - raycast disabled */}
        <mesh position={[0, ARROW_LENGTH / 2 + CENTER_BOX, 0]} raycast={() => null}>
          <cylinderGeometry args={[ARROW_RADIUS, ARROW_RADIUS, ARROW_LENGTH, 8]} />
          <meshBasicMaterial
            color={isYHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Y}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Visible arrow head - raycast disabled */}
        <mesh position={[0, ARROW_LENGTH + CENTER_BOX + CONE_HEIGHT / 2, 0]} raycast={() => null}>
          <coneGeometry args={[CONE_RADIUS, CONE_HEIGHT, 16]} />
          <meshBasicMaterial
            color={isYHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Y}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Z Axis Arrow (Blue) */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* Invisible hitbox for easier hover detection */}
        <HitboxMesh
          position={[0, (ARROW_LENGTH + CONE_HEIGHT) / 2 + CENTER_BOX, 0]}
          geometry={<cylinderGeometry args={[ARROW_RADIUS * 4, ARROW_RADIUS * 4, ARROW_LENGTH + CONE_HEIGHT, 8]} />}
          axis="Z"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* Visible arrow shaft - raycast disabled */}
        <mesh position={[0, ARROW_LENGTH / 2 + CENTER_BOX, 0]} raycast={() => null}>
          <cylinderGeometry args={[ARROW_RADIUS, ARROW_RADIUS, ARROW_LENGTH, 8]} />
          <meshBasicMaterial
            color={isZHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Z}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Visible arrow head - raycast disabled */}
        <mesh position={[0, ARROW_LENGTH + CENTER_BOX + CONE_HEIGHT / 2, 0]} raycast={() => null}>
          <coneGeometry args={[CONE_RADIUS, CONE_HEIGHT, 16]} />
          <meshBasicMaterial
            color={isZHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Z}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ========== PLANE HANDLES - Wall corner (3 L-shapes forming 3 faces) ========== */}
      {/* Each L-shape is made of 2 lines from the same axis, extending toward the other two axes */}
      {/* The lines meet at the corner point (HANDLE_DIST, HANDLE_DIST, HANDLE_DIST) */}

      {/* XY Plane L-shape (on Z=0 plane) - Red line + Green line meeting at corner */}
      {/* Transparent fill plane for XY */}
      <HitboxMesh
        position={[HANDLE_DIST / 2, HANDLE_DIST / 2, 0]}
        geometry={<planeGeometry args={[HANDLE_SIZE, HANDLE_SIZE]} />}
        axis="XY"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {/* Red line: from (HANDLE_DIST, 0, 0) to (HANDLE_DIST, HANDLE_SIZE, 0) along Y */}
      <PriorityMesh
        position={[HANDLE_DIST, HANDLE_SIZE / 2, 0]}
        geometry={<cylinderGeometry args={[HANDLE_THICKNESS, HANDLE_THICKNESS, HANDLE_SIZE, 6]} />}
        color={hoveredAxis === 'XY' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.X}
        axis="XY"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {/* Green line: from (0, HANDLE_DIST, 0) to (HANDLE_SIZE, HANDLE_DIST, 0) along X */}
      <PriorityMesh
        position={[HANDLE_SIZE / 2, HANDLE_DIST, 0]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={<cylinderGeometry args={[HANDLE_THICKNESS, HANDLE_THICKNESS, HANDLE_SIZE, 6]} />}
        color={hoveredAxis === 'XY' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Y}
        axis="XY"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* XZ Plane L-shape (on Y=0 plane) - Red line + Blue line meeting at corner */}
      {/* Transparent fill plane for XZ */}
      <HitboxMesh
        position={[HANDLE_DIST / 2, 0, HANDLE_DIST / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={<planeGeometry args={[HANDLE_SIZE, HANDLE_SIZE]} />}
        axis="XZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {/* Red line: from (HANDLE_DIST, 0, 0) to (HANDLE_DIST, 0, HANDLE_SIZE) along Z */}
      <PriorityMesh
        position={[HANDLE_DIST, 0, HANDLE_SIZE / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={<cylinderGeometry args={[HANDLE_THICKNESS, HANDLE_THICKNESS, HANDLE_SIZE, 6]} />}
        color={hoveredAxis === 'XZ' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.X}
        axis="XZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {/* Blue line: from (0, 0, HANDLE_DIST) to (HANDLE_SIZE, 0, HANDLE_DIST) along X */}
      <PriorityMesh
        position={[HANDLE_SIZE / 2, 0, HANDLE_DIST]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={<cylinderGeometry args={[HANDLE_THICKNESS, HANDLE_THICKNESS, HANDLE_SIZE, 6]} />}
        color={hoveredAxis === 'XZ' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Z}
        axis="XZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* YZ Plane L-shape (on X=0 plane) - Green line + Blue line meeting at corner */}
      {/* Transparent fill plane for YZ */}
      <HitboxMesh
        position={[0, HANDLE_DIST / 2, HANDLE_DIST / 2]}
        rotation={[0, Math.PI / 2, 0]}
        geometry={<planeGeometry args={[HANDLE_SIZE, HANDLE_SIZE]} />}
        axis="YZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {/* Green line: from (0, HANDLE_DIST, 0) to (0, HANDLE_DIST, HANDLE_SIZE) along Z */}
      <PriorityMesh
        position={[0, HANDLE_DIST, HANDLE_SIZE / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={<cylinderGeometry args={[HANDLE_THICKNESS, HANDLE_THICKNESS, HANDLE_SIZE, 6]} />}
        color={hoveredAxis === 'YZ' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Y}
        axis="YZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {/* Blue line: from (0, 0, HANDLE_DIST) to (0, HANDLE_SIZE, HANDLE_DIST) along Y */}
      <PriorityMesh
        position={[0, HANDLE_SIZE / 2, HANDLE_DIST]}
        geometry={<cylinderGeometry args={[HANDLE_THICKNESS, HANDLE_THICKNESS, HANDLE_SIZE, 6]} />}
        color={hoveredAxis === 'YZ' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Z}
        axis="YZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
    </group>
  )
}
