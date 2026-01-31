import { ThreeEvent } from '@react-three/fiber'
import { GIZMO_COLORS, GIZMO_SIZES, Axis } from './constants'
import { HitboxMesh, PriorityMesh } from './gizmoUtils'

interface ScaleGizmoProps {
  hoveredAxis: Axis
  setHoveredAxis: (axis: Axis) => void
  onPointerDown: (e: ThreeEvent<PointerEvent>, axis: Axis) => void
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void
}

export function ScaleGizmo({
  hoveredAxis,
  setHoveredAxis,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ScaleGizmoProps) {
  const { SCALE_LINE_LENGTH, CENTER_BOX } = GIZMO_SIZES

  // UE5 style dimensions
  const LINE_RADIUS = 0.03
  const BOX_SIZE = 0.15
  const TRIANGLE_DIST = 0.55
  const HITBOX_RADIUS = LINE_RADIUS * 4

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

  // Triangle edge line length
  const EDGE_LENGTH = Math.sqrt(2) * TRIANGLE_DIST
  const EDGE_HALF = EDGE_LENGTH / 2

  return (
    <group>
      {/* Center Sphere (Uniform Scale) */}
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

      {/* X Axis (Red) */}
      <group rotation={[0, 0, -Math.PI / 2]}>
        {/* Hitbox */}
        <HitboxMesh
          position={[0, SCALE_LINE_LENGTH / 2, 0]}
          geometry={<cylinderGeometry args={[HITBOX_RADIUS, HITBOX_RADIUS, SCALE_LINE_LENGTH, 8]} />}
          axis="X"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* Visible Line */}
        <mesh position={[0, SCALE_LINE_LENGTH / 2, 0]} raycast={() => null}>
          <cylinderGeometry args={[LINE_RADIUS, LINE_RADIUS, SCALE_LINE_LENGTH, 8]} />
          <meshBasicMaterial
            color={isXHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.X}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Box Tip */}
        <PriorityMesh
          position={[0, SCALE_LINE_LENGTH, 0]}
          geometry={<boxGeometry args={[BOX_SIZE, BOX_SIZE, BOX_SIZE]} />}
          color={isXHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.X}
          axis="X"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      </group>

      {/* Y Axis (Green) */}
      <group>
        {/* Hitbox */}
        <HitboxMesh
          position={[0, SCALE_LINE_LENGTH / 2, 0]}
          geometry={<cylinderGeometry args={[HITBOX_RADIUS, HITBOX_RADIUS, SCALE_LINE_LENGTH, 8]} />}
          axis="Y"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* Visible Line */}
        <mesh position={[0, SCALE_LINE_LENGTH / 2, 0]} raycast={() => null}>
          <cylinderGeometry args={[LINE_RADIUS, LINE_RADIUS, SCALE_LINE_LENGTH, 8]} />
          <meshBasicMaterial
            color={isYHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Y}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Box Tip */}
        <PriorityMesh
          position={[0, SCALE_LINE_LENGTH, 0]}
          geometry={<boxGeometry args={[BOX_SIZE, BOX_SIZE, BOX_SIZE]} />}
          color={isYHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Y}
          axis="Y"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      </group>

      {/* Z Axis (Blue) */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* Hitbox */}
        <HitboxMesh
          position={[0, SCALE_LINE_LENGTH / 2, 0]}
          geometry={<cylinderGeometry args={[HITBOX_RADIUS, HITBOX_RADIUS, SCALE_LINE_LENGTH, 8]} />}
          axis="Z"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
        {/* Visible Line */}
        <mesh position={[0, SCALE_LINE_LENGTH / 2, 0]} raycast={() => null}>
          <cylinderGeometry args={[LINE_RADIUS, LINE_RADIUS, SCALE_LINE_LENGTH, 8]} />
          <meshBasicMaterial
            color={isZHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Z}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Box Tip */}
        <PriorityMesh
          position={[0, SCALE_LINE_LENGTH, 0]}
          geometry={<boxGeometry args={[BOX_SIZE, BOX_SIZE, BOX_SIZE]} />}
          color={isZHovered ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Z}
          axis="Z"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      </group>

      {/* ========== Triangle Edge Lines (Split Color) ========== */}

      {/* XY Plane Edge */}
      <PriorityMesh
        position={[TRIANGLE_DIST * 0.75, TRIANGLE_DIST * 0.25, 0]}
        rotation={[0, 0, Math.PI / 4]}
        geometry={<cylinderGeometry args={[LINE_RADIUS, LINE_RADIUS, EDGE_HALF, 6]} />}
        color={hoveredAxis === 'XY' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.X}
        axis="XY"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      <PriorityMesh
        position={[TRIANGLE_DIST * 0.25, TRIANGLE_DIST * 0.75, 0]}
        rotation={[0, 0, Math.PI / 4]}
        geometry={<cylinderGeometry args={[LINE_RADIUS, LINE_RADIUS, EDGE_HALF, 6]} />}
        color={hoveredAxis === 'XY' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Y}
        axis="XY"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* XZ Plane Edge */}
      <PriorityMesh
        position={[TRIANGLE_DIST * 0.75, 0, TRIANGLE_DIST * 0.25]}
        rotation={[0, Math.PI / 4, Math.PI / 2]}
        geometry={<cylinderGeometry args={[LINE_RADIUS, LINE_RADIUS, EDGE_HALF, 6]} />}
        color={hoveredAxis === 'XZ' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.X}
        axis="XZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      <PriorityMesh
        position={[TRIANGLE_DIST * 0.25, 0, TRIANGLE_DIST * 0.75]}
        rotation={[0, Math.PI / 4, Math.PI / 2]}
        geometry={<cylinderGeometry args={[LINE_RADIUS, LINE_RADIUS, EDGE_HALF, 6]} />}
        color={hoveredAxis === 'XZ' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Z}
        axis="XZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* YZ Plane Edge */}
      <PriorityMesh
        position={[0, TRIANGLE_DIST * 0.75, TRIANGLE_DIST * 0.25]}
        rotation={[-Math.PI / 4, 0, 0]}
        geometry={<cylinderGeometry args={[LINE_RADIUS, LINE_RADIUS, EDGE_HALF, 6]} />}
        color={hoveredAxis === 'YZ' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Y}
        axis="YZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      <PriorityMesh
        position={[0, TRIANGLE_DIST * 0.25, TRIANGLE_DIST * 0.75]}
        rotation={[-Math.PI / 4, 0, 0]}
        geometry={<cylinderGeometry args={[LINE_RADIUS, LINE_RADIUS, EDGE_HALF, 6]} />}
        color={hoveredAxis === 'YZ' ? GIZMO_COLORS.HOVER : GIZMO_COLORS.Z}
        axis="YZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* Invisible Triangle Hit Areas */}
      <HitboxMesh
        position={[TRIANGLE_DIST / 2, TRIANGLE_DIST / 2, 0]}
        geometry={<planeGeometry args={[TRIANGLE_DIST * 0.8, TRIANGLE_DIST * 0.8]} />}
        axis="XY"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      <HitboxMesh
        position={[TRIANGLE_DIST / 2, 0, TRIANGLE_DIST / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={<planeGeometry args={[TRIANGLE_DIST * 0.8, TRIANGLE_DIST * 0.8]} />}
        axis="XZ"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      <HitboxMesh
        position={[0, TRIANGLE_DIST / 2, TRIANGLE_DIST / 2]}
        rotation={[0, Math.PI / 2, 0]}
        geometry={<planeGeometry args={[TRIANGLE_DIST * 0.8, TRIANGLE_DIST * 0.8]} />}
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
