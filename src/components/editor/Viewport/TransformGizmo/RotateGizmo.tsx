import { useMemo, useRef, useEffect } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { GIZMO_COLORS, GIZMO_SIZES, Axis } from './constants'

// Custom raycast that returns priority distance so gizmo is always on top
function usePriorityRaycast(ref: React.RefObject<THREE.Mesh>) {
  useEffect(() => {
    if (!ref.current) return
    const mesh = ref.current
    const originalRaycast = mesh.raycast.bind(mesh)
    mesh.raycast = (raycaster, intersects) => {
      const startLen = intersects.length
      originalRaycast(raycaster, intersects)
      for (let i = startLen; i < intersects.length; i++) {
        intersects[i].distance = 0
      }
    }
  }, [])
}

// Create a 90° sector with square grid pattern (UE5 style)
function createSectorWithSquareGrid(radius: number, gridSize: number = 0.15, arcBandWidth: number = 0.08): {
  sectorGeometry: THREE.BufferGeometry
  gridGeometry: THREE.BufferGeometry
  arcBandGeometry: THREE.BufferGeometry
} {
  const arcSegments = 48
  const angleStep = (Math.PI / 2) / arcSegments
  
  // Inner radius for the grid/sector (leave room for arc band)
  const innerRadius = radius - arcBandWidth

  // Sector geometry (solid fill) - up to innerRadius
  const sectorGeometry = new THREE.BufferGeometry()
  const sectorVertices: number[] = []
  const sectorIndices: number[] = []

  // Center point
  sectorVertices.push(0, 0, 0)

  // Arc points at inner radius
  for (let i = 0; i <= arcSegments; i++) {
    const angle = i * angleStep
    sectorVertices.push(
      Math.cos(angle) * innerRadius,
      Math.sin(angle) * innerRadius,
      0
    )
  }

  // Create triangles
  for (let i = 0; i < arcSegments; i++) {
    sectorIndices.push(0, i + 1, i + 2)
  }

  sectorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(sectorVertices, 3))
  sectorGeometry.setIndex(sectorIndices)
  sectorGeometry.computeVertexNormals()

  // Arc band geometry (ring from innerRadius to radius) - flat, no 3D thickness
  const arcBandVertices: number[] = []
  const arcBandIndices: number[] = []
  
  for (let i = 0; i <= arcSegments; i++) {
    const angle = i * angleStep
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    // Inner vertex
    arcBandVertices.push(cos * innerRadius, sin * innerRadius, 0)
    // Outer vertex
    arcBandVertices.push(cos * radius, sin * radius, 0)
  }
  
  // Create quads (2 triangles each)
  for (let i = 0; i < arcSegments; i++) {
    const i0 = i * 2
    const i1 = i * 2 + 1
    const i2 = (i + 1) * 2
    const i3 = (i + 1) * 2 + 1
    // Triangle 1
    arcBandIndices.push(i0, i2, i1)
    // Triangle 2
    arcBandIndices.push(i1, i2, i3)
  }
  
  const arcBandGeometry = new THREE.BufferGeometry()
  arcBandGeometry.setAttribute('position', new THREE.Float32BufferAttribute(arcBandVertices, 3))
  arcBandGeometry.setIndex(arcBandIndices)
  arcBandGeometry.computeVertexNormals()

  // Square grid lines geometry - up to innerRadius
  const gridVertices: number[] = []
  const gridExtent = innerRadius * 1.1
  const step = gridSize

  const isInSector = (x: number, y: number): boolean => {
    if (x < 0 || y < 0) return false
    const dist = Math.sqrt(x * x + y * y)
    return dist <= innerRadius
  }

  const clipToSector = (x1: number, y1: number, x2: number, y2: number): [number, number, number, number] | null => {
    const in1 = isInSector(x1, y1)
    const in2 = isInSector(x2, y2)

    if (!in1 && !in2) return null

    let startX = x1, startY = y1, endX = x2, endY = y2

    if (!in1 || !in2) {
      const dx = x2 - x1
      const dy = y2 - y1
      const a = dx * dx + dy * dy
      const b = 2 * (x1 * dx + y1 * dy)
      const c = x1 * x1 + y1 * y1 - innerRadius * innerRadius
      const discriminant = b * b - 4 * a * c

      if (discriminant >= 0) {
        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a)
        const t2 = (-b + Math.sqrt(discriminant)) / (2 * a)

        if (!in1 && t1 >= 0 && t1 <= 1) {
          startX = x1 + t1 * dx
          startY = y1 + t1 * dy
        }
        if (!in2 && t2 >= 0 && t2 <= 1) {
          endX = x1 + t2 * dx
          endY = y1 + t2 * dy
        }
      }
    }

    if (startX < 0) startX = 0
    if (startY < 0) startY = 0
    if (endX < 0) endX = 0
    if (endY < 0) endY = 0

    if (!isInSector(startX, startY) && !isInSector(endX, endY)) return null
    if (startX === endX && startY === endY) return null

    return [startX, startY, endX, endY]
  }

  for (let x = 0; x <= gridExtent; x += step) {
    const clipped = clipToSector(x, 0, x, gridExtent)
    if (clipped) {
      gridVertices.push(clipped[0], clipped[1], 0)
      gridVertices.push(clipped[2], clipped[3], 0)
    }
  }

  for (let y = 0; y <= gridExtent; y += step) {
    const clipped = clipToSector(0, y, gridExtent, y)
    if (clipped) {
      gridVertices.push(clipped[0], clipped[1], 0)
      gridVertices.push(clipped[2], clipped[3], 0)
    }
  }

  const gridGeometry = new THREE.BufferGeometry()
  gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3))

  return { sectorGeometry, gridGeometry, arcBandGeometry }
}

// Priority mesh for sector fill (clickable)
function SectorMesh({
  geometry,
  axis,
  isHovered,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerOver,
  onPointerOut,
}: {
  geometry: THREE.BufferGeometry
  axis: Axis
  isHovered: boolean
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
      geometry={geometry}
      onPointerDown={(e) => onPointerDown(e, axis)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={(e) => onPointerOver(e, axis)}
      onPointerOut={onPointerOut}
    >
      {/* Transparent fill - darker when hovered */}
      <meshBasicMaterial
        color="#666666"
        transparent
        opacity={isHovered ? 0.25 : 0.08}
        side={THREE.DoubleSide}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

// Priority torus for arc hitbox
function ArcHitbox({
  radius,
  tube,
  arc,
  axis,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerOver,
  onPointerOut,
}: {
  radius: number
  tube: number
  arc: number
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
      onPointerDown={(e) => onPointerDown(e, axis)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={(e) => onPointerOver(e, axis)}
      onPointerOut={onPointerOut}
    >
      <torusGeometry args={[radius, tube, 8, 48, arc]} />
      <meshBasicMaterial
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

interface RotateGizmoProps {
  hoveredAxis: Axis
  setHoveredAxis: (axis: Axis) => void
  onPointerDown: (e: ThreeEvent<PointerEvent>, axis: Axis) => void
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void
}

export function RotateGizmo({
  hoveredAxis,
  setHoveredAxis,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: RotateGizmoProps) {
  const { RING_RADIUS } = GIZMO_SIZES

  // UE5 style dimensions
  const ARC_BAND_WIDTH = 0.1      // Width of the colored arc band
  const ARC_ANGLE = Math.PI / 2   // 90 degree arc
  const HITBOX_TUBE = 0.12        // Larger invisible hitbox

  const { sectorGeometry, gridGeometry, arcBandGeometry } = useMemo(
    () => createSectorWithSquareGrid(RING_RADIUS, RING_RADIUS / 12, ARC_BAND_WIDTH),
    [RING_RADIUS, ARC_BAND_WIDTH]
  )

  const handlePointerOver = (e: ThreeEvent<PointerEvent>, axis: Axis) => {
    e.stopPropagation()
    setHoveredAxis(axis)
  }

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredAxis(null)
  }

  return (
    <group>
      {/* X Axis Arc (Red) - rotates around X axis, in YZ plane */}
      <group rotation={[0, Math.PI / 2, Math.PI / 2]}>
        {/* Invisible hitbox for arc */}
        <ArcHitbox
          radius={RING_RADIUS}
          tube={HITBOX_TUBE}
          arc={ARC_ANGLE}
          axis="X"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* Visible arc band - flat with width */}
        <mesh geometry={arcBandGeometry} raycast={() => null}>
          <meshBasicMaterial
            color={hoveredAxis === 'X' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.X}
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Transparent gray sector fill */}
        <SectorMesh
          geometry={sectorGeometry}
          axis="X"
          isHovered={hoveredAxis === 'X'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* White grid lines */}
        <lineSegments geometry={gridGeometry} raycast={() => null}>
          <lineBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.12}
            depthTest={false}
            depthWrite={false}
          />
        </lineSegments>
      </group>

      {/* Y Axis Arc (Green) - rotates around Y axis, in XZ plane */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* Invisible hitbox for arc */}
        <ArcHitbox
          radius={RING_RADIUS}
          tube={HITBOX_TUBE}
          arc={ARC_ANGLE}
          axis="Y"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* Visible arc band - flat with width */}
        <mesh geometry={arcBandGeometry} raycast={() => null}>
          <meshBasicMaterial
            color={hoveredAxis === 'Y' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Y}
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Transparent gray sector fill */}
        <SectorMesh
          geometry={sectorGeometry}
          axis="Y"
          isHovered={hoveredAxis === 'Y'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* White grid lines */}
        <lineSegments geometry={gridGeometry} raycast={() => null}>
          <lineBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.12}
            depthTest={false}
            depthWrite={false}
          />
        </lineSegments>
      </group>

      {/* Z Axis Arc (Blue) - rotates around Z axis, in XY plane */}
      <group rotation={[0, 0, 0]}>
        {/* Invisible hitbox for arc */}
        <ArcHitbox
          radius={RING_RADIUS}
          tube={HITBOX_TUBE}
          arc={ARC_ANGLE}
          axis="Z"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* Visible arc band - flat with width */}
        <mesh geometry={arcBandGeometry} raycast={() => null}>
          <meshBasicMaterial
            color={hoveredAxis === 'Z' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Z}
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Transparent gray sector fill */}
        <SectorMesh
          geometry={sectorGeometry}
          axis="Z"
          isHovered={hoveredAxis === 'Z'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* White grid lines */}
        <lineSegments geometry={gridGeometry} raycast={() => null}>
          <lineBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.12}
            depthTest={false}
            depthWrite={false}
          />
        </lineSegments>
      </group>
    </group>
  )
}
