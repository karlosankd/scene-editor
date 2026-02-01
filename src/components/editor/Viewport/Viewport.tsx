import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Stats, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Bloom, SSAO, Vignette, DepthOfField, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import { useFlyControls } from '@/hooks/useFlyControls'
import { CameraSpeedControl } from './CameraSpeedControl'
import { CameraFocusHandler } from './CameraFocusHandler'
import { SceneObjects } from './SceneObjects'
import { TransformGizmo } from './TransformGizmo'

function PostProcessingEffects() {
  const postProcessing = useEditorStore((state) => state.postProcessing)

  if (!postProcessing.enabled) return null

  const effects: React.ReactElement[] = []
  
  if (postProcessing.bloom.enabled) {
    effects.push(
      <Bloom
        key="bloom"
        intensity={postProcessing.bloom.intensity}
        luminanceThreshold={postProcessing.bloom.threshold}
        luminanceSmoothing={postProcessing.bloom.smoothing}
      />
    )
  }
  
  if (postProcessing.ssao.enabled) {
    effects.push(
      <SSAO
        key="ssao"
        radius={postProcessing.ssao.radius}
        intensity={postProcessing.ssao.intensity}
        bias={postProcessing.ssao.bias}
        worldDistanceThreshold={1}
        worldDistanceFalloff={0.1}
        worldProximityThreshold={0.5}
        worldProximityFalloff={0.1}
      />
    )
  }
  
  if (postProcessing.dof.enabled) {
    effects.push(
      <DepthOfField
        key="dof"
        focusDistance={postProcessing.dof.focusDistance}
        focalLength={postProcessing.dof.focalLength}
        bokehScale={postProcessing.dof.bokehScale}
      />
    )
  }
  
  if (postProcessing.vignette.enabled) {
    effects.push(
      <Vignette
        key="vignette"
        offset={postProcessing.vignette.offset}
        darkness={postProcessing.vignette.darkness}
      />
    )
  }
  
  if (postProcessing.chromaticAberration.enabled) {
    effects.push(
      <ChromaticAberration
        key="chromatic"
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(postProcessing.chromaticAberration.offset, postProcessing.chromaticAberration.offset)}
        radialModulation={false}
        modulationOffset={0}
      />
    )
  }

  if (effects.length === 0) return null

  return <EffectComposer>{effects}</EffectComposer>
}

function FlyControlsHandler({ orbitRef }: { orbitRef: React.RefObject<any> }) {
  useFlyControls(true, orbitRef)
  return null
}

function Scene({ orbitRef }: { orbitRef: React.RefObject<any> }) {
  const editorSettings = useEditorStore((state) => state.editorSettings)

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
      <FlyControlsHandler orbitRef={orbitRef} />

      {/* Camera Focus Handler (F key) */}
      <CameraFocusHandler orbitRef={orbitRef} />

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

      {/* Scene Objects (includes Sky, Fog, Lights, Meshes) */}
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
  const orbitRef = useRef<any>(null)

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

      {/* Camera Speed Control */}
      <CameraSpeedControl />

      {/* Viewport Info */}
      <div className="absolute bottom-2 left-2 text-xs text-ue-text-muted flex items-center gap-3">
        <span>{t.common.perspective}</span>
      </div>

      {/* Controls Help */}
      <div className="absolute bottom-2 right-2 text-xs text-ue-text-muted bg-ue-bg/80 px-2 py-1 rounded">
        <span>RMB + WASD/QE: 飞行 | 滚轮: 速度 | Q: 选择 | W/E/R: 移动/旋转/缩放</span>
      </div>
    </div>
  )
}
