import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { ThreeEvent, useThree } from '@react-three/fiber'
import { Sky, Cloud } from '@react-three/drei'
import { useEditorStore } from '@/stores/editorStore'
import { MeshRegistry } from '@/stores/meshRegistry'
import type { SceneObject } from '@/types'

function MeshObject({ object }: { object: SceneObject }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const selectObject = useEditorStore((state) => state.selectObject)
  const setHovered = useEditorStore((state) => state.setHovered)
  const viewportSettings = useEditorStore((state) => state.viewportSettings)

  const isSelected = selectedIds.includes(object.id)

  const geometryArgs = useMemo(() => {
    if (!object.geometry) return null
    const g = object.geometry
    switch (g.type) {
      case 'box':
        return { type: 'box', args: [g.width || 1, g.height || 1, g.depth || 1] as [number, number, number] }
      case 'sphere':
        return { type: 'sphere', args: [g.radius || 0.5, g.widthSegments || 32, g.heightSegments || 16] as [number, number, number] }
      case 'cylinder':
        return { type: 'cylinder', args: [g.radiusTop || 0.5, g.radiusBottom || 0.5, g.height || 1] as [number, number, number] }
      case 'cone':
        return { type: 'cone', args: [g.radius || 0.5, g.height || 1] as [number, number] }
      case 'torus':
        return { type: 'torus', args: [g.radius || 0.5, g.tube || 0.2, g.radialSegments || 16, g.tubularSegments || 48] as [number, number, number, number] }
      case 'plane':
        return { type: 'plane', args: [g.width || 10, g.height || 10] as [number, number] }
      default:
        return { type: 'box', args: [1, 1, 1] as [number, number, number] }
    }
  }, [object.geometry])

  const materialProps = useMemo(() => {
    if (!object.material) return null
    const m = object.material
    return {
      color: m.color || '#808080',
      metalness: m.metalness ?? 0,
      roughness: m.roughness ?? 0.5,
      opacity: m.opacity ?? 1,
      transparent: (m.opacity ?? 1) < 1,
      wireframe: viewportSettings.showWireframe || m.wireframe || false,
    }
  }, [object.material, viewportSettings.showWireframe])

  if (!geometryArgs || !materialProps) return null

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    selectObject(object.id, e.nativeEvent.ctrlKey || e.nativeEvent.metaKey)
  }

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(object.id)
  }

  const handlePointerOut = () => {
    setHovered(null)
  }

  // Note: position/rotation/scale are handled by parent SceneObjectRenderer group
  // Do NOT set them here to avoid double-application during gizmo transforms
  return (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {geometryArgs.type === 'box' && <boxGeometry args={geometryArgs.args as [number, number, number]} />}
      {geometryArgs.type === 'sphere' && <sphereGeometry args={geometryArgs.args as [number, number, number]} />}
      {geometryArgs.type === 'cylinder' && <cylinderGeometry args={geometryArgs.args as [number, number, number]} />}
      {geometryArgs.type === 'cone' && <coneGeometry args={geometryArgs.args as [number, number]} />}
      {geometryArgs.type === 'torus' && <torusGeometry args={geometryArgs.args as [number, number, number, number]} />}
      {geometryArgs.type === 'plane' && <planeGeometry args={geometryArgs.args as [number, number]} />}

      <meshStandardMaterial {...materialProps} />

      {isSelected && (
        <lineSegments>
          {geometryArgs.type === 'box' && <edgesGeometry args={[new THREE.BoxGeometry(...(geometryArgs.args as [number, number, number]))]} />}
          {geometryArgs.type === 'sphere' && <edgesGeometry args={[new THREE.SphereGeometry(...(geometryArgs.args as [number, number, number]))]} />}
          {geometryArgs.type === 'cylinder' && <edgesGeometry args={[new THREE.CylinderGeometry(...(geometryArgs.args as [number, number, number]))]} />}
          {geometryArgs.type === 'cone' && <edgesGeometry args={[new THREE.ConeGeometry(...(geometryArgs.args as [number, number]))]} />}
          {geometryArgs.type === 'torus' && <edgesGeometry args={[new THREE.TorusGeometry(...(geometryArgs.args as [number, number, number, number]))]} />}
          {geometryArgs.type === 'plane' && <edgesGeometry args={[new THREE.PlaneGeometry(...(geometryArgs.args as [number, number]))]} />}
          <lineBasicMaterial color="#0d6efd" />
        </lineSegments>
      )}
    </mesh>
  )
}

function LightHelper({ object }: { object: SceneObject }) {
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const selectObject = useEditorStore((state) => state.selectObject)
  const isSelected = selectedIds.includes(object.id)

  if (!object.light) return null

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    selectObject(object.id, e.nativeEvent.ctrlKey || e.nativeEvent.metaKey)
  }

  return (
    <mesh position={object.transform.position} onClick={handleClick}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color={object.light.color} transparent opacity={0.8} />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.SphereGeometry(0.25, 8, 8)]} />
          <lineBasicMaterial color="#0d6efd" />
        </lineSegments>
      )}
    </mesh>
  )
}

function LightObject({ object }: { object: SceneObject }) {
  if (!object.light) return null

  const { light, transform } = object
  const position = transform.position as [number, number, number]

  return (
    <>
      <LightHelper object={object} />
      {light.type === 'directional' && (
        <directionalLight
          position={position}
          color={light.color}
          intensity={light.intensity}
          castShadow={light.castShadow}
          visible={object.visible}
        />
      )}
      {light.type === 'point' && (
        <pointLight
          position={position}
          color={light.color}
          intensity={light.intensity}
          distance={light.distance}
          decay={light.decay}
          castShadow={light.castShadow}
          visible={object.visible}
        />
      )}
      {light.type === 'spot' && (
        <spotLight
          position={position}
          color={light.color}
          intensity={light.intensity}
          distance={light.distance}
          angle={light.angle}
          penumbra={light.penumbra}
          decay={light.decay}
          castShadow={light.castShadow}
          visible={object.visible}
        />
      )}
      {light.type === 'ambient' && (
        <ambientLight
          color={light.color}
          intensity={light.intensity}
          visible={object.visible}
        />
      )}
      {light.type === 'hemisphere' && (
        <hemisphereLight
          color={light.color}
          groundColor={light.groundColor}
          intensity={light.intensity}
          visible={object.visible}
        />
      )}
    </>
  )
}

// Sky Object Renderer
function SkyObject({ object }: { object: SceneObject }) {
  if (!object.sky || !object.visible) return null

  const { sky } = object

  return (
    <Sky
      distance={450000}
      sunPosition={sky.sunPosition}
      turbidity={sky.turbidity}
      rayleigh={sky.rayleigh}
      mieCoefficient={sky.mieCoefficient}
      mieDirectionalG={sky.mieDirectionalG}
    />
  )
}

// Cloud Object Renderer
function CloudObject({ object }: { object: SceneObject }) {
  if (!object.cloud || !object.visible) return null

  const { cloud } = object

  return (
    <Cloud
      opacity={cloud.opacity ?? 0.5}
      speed={cloud.speed ?? 0.4}
      segments={cloud.segments ?? 20}
      color={cloud.color}
    />
  )
}

// Fog Object Renderer - applies fog to scene
function FogObject({ object }: { object: SceneObject }) {
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    if (!object.fog || !object.visible) {
      scene.fog = null
      return
    }

    const { fog } = object
    const color = new THREE.Color(fog.color)

    if (fog.type === 'exponential') {
      scene.fog = new THREE.FogExp2(color.getHex(), fog.density || 0.002)
    } else {
      scene.fog = new THREE.Fog(color.getHex(), fog.near || 1, fog.far || 100)
    }

    return () => {
      scene.fog = null
    }
  }, [scene, object.fog, object.visible])

  return null
}

function SceneObjectRenderer({ object }: { object: SceneObject }) {
  const groupRef = useRef<THREE.Group>(null)
  const objects = useEditorStore((state) => state.objects)
  const children = object.childIds.map((id) => objects[id]).filter(Boolean)

  // Register the group (not mesh) so gizmo transforms the correct node
  useEffect(() => {
    if (groupRef.current) {
      MeshRegistry.register(object.id, groupRef.current)
    }
    return () => {
      MeshRegistry.unregister(object.id)
    }
  }, [object.id])

  return (
    <group
      ref={groupRef}
      position={object.transform.position}
      rotation={object.transform.rotation}
      scale={object.transform.scale}
      visible={object.visible}
    >
      {object.type === 'mesh' && <MeshObject object={object} />}
      {object.type === 'light' && <LightObject object={object} />}
      {object.type === 'sky' && <SkyObject object={object} />}
      {object.type === 'cloud' && <CloudObject object={object} />}
      {object.type === 'fog' && <FogObject object={object} />}

      {children.map((child) => (
        <SceneObjectRenderer key={child.id} object={child} />
      ))}
    </group>
  )
}

export function SceneObjects() {
  const objects = useEditorStore((state) => state.objects)
  const rootObjectIds = useEditorStore((state) => state.rootObjectIds)

  const rootObjects = rootObjectIds.map((id) => objects[id]).filter(Boolean)

  return (
    <group>
      {rootObjects.map((object) => (
        <SceneObjectRenderer key={object.id} object={object} />
      ))}
    </group>
  )
}
