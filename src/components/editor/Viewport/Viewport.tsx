import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Environment, Stats, PerspectiveCamera, TransformControls } from '@react-three/drei'
import { EffectComposer, Bloom, SSAO, Vignette, DepthOfField, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useEditorStore, useSelectedObject } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import { useFlyControls } from '@/hooks/useFlyControls'
import { SceneObjects } from './SceneObjects'

function PostProcessingEffects() {
  const postProcessing = useEditorStore((state) => state.postProcessing)

  if (!postProcessing.enabled) return null

  return (
    <EffectComposer>
      {postProcessing.bloom.enabled && (
        <Bloom
          intensity={postProcessing.bloom.intensity}
          luminanceThreshold={postProcessing.bloom.threshold}
          luminanceSmoothing={postProcessing.bloom.smoothing}
        />
      )}
      {postProcessing.ssao.enabled && (
        <SSAO
          radius={postProcessing.ssao.radius}
          intensity={postProcessing.ssao.intensity}
          bias={postProcessing.ssao.bias}
        />
      )}
      {postProcessing.dof.enabled && (
        <DepthOfField
          focusDistance={postProcessing.dof.focusDistance}
          focalLength={postProcessing.dof.focalLength}
          bokehScale={postProcessing.dof.bokehScale}
        />
      )}
      {postProcessing.vignette.enabled && (
        <Vignette
          offset={postProcessing.vignette.offset}
          darkness={postProcessing.vignette.darkness}
        />
      )}
      {postProcessing.chromaticAberration.enabled && (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(postProcessing.chromaticAberration.offset, postProcessing.chromaticAberration.offset)}
        />
      )}
    </EffectComposer>
  )
}

function TransformGizmo({ orbitRef }: { orbitRef: React.RefObject<any> }) {
  const selectedObject = useSelectedObject()
  const transformMode = useEditorStore((state) => state.transformMode)
  const transformSpace = useEditorStore((state) => state.transformSpace)
  const updateTransform = useEditorStore((state) => state.updateTransform)

  const transformRef = useRef<any>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const isDragging = useRef(false)

  // Sync mesh position with selected object when selection changes
  useEffect(() => {
    if (meshRef.current && selectedObject) {
      meshRef.current.position.set(...selectedObject.transform.position)
      meshRef.current.rotation.set(...selectedObject.transform.rotation)
      meshRef.current.scale.set(...selectedObject.transform.scale)
    }
  }, [selectedObject?.id, selectedObject?.transform.position, selectedObject?.transform.rotation, selectedObject?.transform.scale])

  const handleDragStart = useCallback(() => {
    isDragging.current = true
    if (orbitRef.current) {
      orbitRef.current.enabled = false
    }
  }, [orbitRef])

  const handleDragEnd = useCallback(() => {
    isDragging.current = false
    if (orbitRef.current) {
      orbitRef.current.enabled = true
    }

    // Update store only when drag ends
    if (meshRef.current && selectedObject) {
      const pos = meshRef.current.position
      const rot = meshRef.current.rotation
      const scl = meshRef.current.scale

      updateTransform(selectedObject.id, {
        position: [pos.x, pos.y, pos.z],
        rotation: [rot.x, rot.y, rot.z],
        scale: [scl.x, scl.y, scl.z],
      })
    }
  }, [selectedObject, updateTransform, orbitRef])

  if (!selectedObject) return null

  return (
    <TransformControls
      ref={transformRef}
      object={meshRef.current || undefined}
      mode={transformMode}
      space={transformSpace}
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
    >
      <mesh ref={meshRef}>
        <boxGeometry args={[0.001, 0.001, 0.001]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </TransformControls>
  )
}

function FlyControlsHandler() {
  useFlyControls(true)
  return null
}

function Scene({ orbitRef }: { orbitRef: React.RefObject<any> }) {
  const editorSettings = useEditorStore((state) => state.editorSettings)
  const viewportSettings = useEditorStore((state) => state.viewportSettings)

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={60} />

      {/* Orbit Controls - disabled when flying */}
      <OrbitControls
        ref={orbitRef}
        makeDefault
        mouseButtons={{
          LEFT: THREE.MOUSE.LEFT,
          MIDDLE: THREE.MOUSE.MIDDLE,
          RIGHT: undefined,
        }}
      />

      {/* Fly Controls */}
      <FlyControlsHandler />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow={viewportSettings.enableShadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Grid */}
      {editorSettings.showGrid && (
        <Grid
          args={[editorSettings.gridSize, editorSettings.gridSize]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#3a3a3a"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#4a4a4a"
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}

      {/* Axes Helper */}
      {editorSettings.showAxes && (
        <axesHelper args={[5]} />
      )}

      {/* Environment */}
      <Environment preset="city" background={false} />

      {/* Scene Objects */}
      <SceneObjects />

      {/* Transform Gizmo */}
      <TransformGizmo orbitRef={orbitRef} />

      {/* Gizmo Helper */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={['#ff4444', '#44ff44', '#4444ff']}
          labelColor="white"
        />
      </GizmoHelper>

      {/* Post Processing */}
      <PostProcessingEffects />
    </>
  )
}

export function Viewport() {
  const { t } = useI18n()
  const editorSettings = useEditorStore((state) => state.editorSettings)
  const viewportSettings = useEditorStore((state) => state.viewportSettings)
  const transformMode = useEditorStore((state) => state.transformMode)
  const orbitRef = useRef<any>(null)

  const getModeLabel = () => {
    switch (transformMode) {
      case 'translate': return 'W'
      case 'rotate': return 'E'
      case 'scale': return 'R'
      default: return ''
    }
  }

  return (
    <div className="w-full h-full bg-ue-bg-dark relative">
      <Canvas
        shadows={viewportSettings.enableShadows}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
        style={{ background: editorSettings.backgroundColor }}
      >
        <Suspense fallback={null}>
          <Scene orbitRef={orbitRef} />
        </Suspense>
      </Canvas>

      {/* Stats Overlay */}
      {editorSettings.showStats && (
        <div className="absolute top-2 left-2">
          <Stats className="!absolute !top-0 !left-0" />
        </div>
      )}

      {/* Viewport Info */}
      <div className="absolute bottom-2 left-2 text-xs text-ue-text-muted flex items-center gap-3">
        <span>{t.common.perspective}</span>
        <span className="px-1.5 py-0.5 bg-ue-bg-light rounded text-ue-text-secondary">
          {getModeLabel()}
        </span>
      </div>

      {/* Controls Help */}
      <div className="absolute bottom-2 right-2 text-xs text-ue-text-muted bg-ue-bg/80 px-2 py-1 rounded">
        <span>RMB + WASD/QE: 飞行 | 滚轮: 速度 | Q: 空间切换 | W/E/R: 移动/旋转/缩放</span>
      </div>
    </div>
  )
}
