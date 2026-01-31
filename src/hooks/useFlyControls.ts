import { useRef, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rightMouseState } from './useRightMouseState'
import { useEditorStore } from '@/stores/editorStore'

interface FlyControlsState {
  moveForward: boolean
  moveBackward: boolean
  moveLeft: boolean
  moveRight: boolean
  moveUp: boolean
  moveDown: boolean
  isRightMouseDown: boolean
  mouseDeltaX: number
  mouseDeltaY: number
  speed: number
  lookSpeed: number
  // For pointer lock fallback
  lastMouseX: number
  lastMouseY: number
  usePointerLock: boolean
}

// Store speed globally so it persists
let globalSpeed = 5

export function useFlyControls(enabled: boolean = true, orbitRef?: React.RefObject<any>) {
  const { camera, gl } = useThree()
  const setCameraSpeed = useEditorStore((state) => state.setCameraSpeed)
  const cameraSpeed = useEditorStore((state) => state.cameraSpeed)

  const state = useRef<FlyControlsState>({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    isRightMouseDown: false,
    mouseDeltaX: 0,
    mouseDeltaY: 0,
    speed: globalSpeed,
    lookSpeed: 0.002,
    lastMouseX: 0,
    lastMouseY: 0,
    usePointerLock: true,
  })

  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const vec = useRef(new THREE.Vector3())

  // Sync speed from store (e.g. when changed via UI)
  useEffect(() => {
    state.current.speed = cameraSpeed
    globalSpeed = cameraSpeed
  }, [cameraSpeed])

  // Handle keyboard events - only when RMB is held
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (!state.current.isRightMouseDown) return

    // Ignore if typing in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return
    }

    switch (e.key.toLowerCase()) {
      case 'w':
        state.current.moveForward = true
        e.preventDefault()
        e.stopPropagation()
        break
      case 's':
        state.current.moveBackward = true
        e.preventDefault()
        e.stopPropagation()
        break
      case 'a':
        state.current.moveLeft = true
        e.preventDefault()
        e.stopPropagation()
        break
      case 'd':
        state.current.moveRight = true
        e.preventDefault()
        e.stopPropagation()
        break
      case 'q':
        state.current.moveDown = true
        e.preventDefault()
        e.stopPropagation()
        break
      case 'e':
        state.current.moveUp = true
        e.preventDefault()
        e.stopPropagation()
        break
    }
  }, [])

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case 'w':
        state.current.moveForward = false
        break
      case 's':
        state.current.moveBackward = false
        break
      case 'a':
        state.current.moveLeft = false
        break
      case 'd':
        state.current.moveRight = false
        break
      case 'q':
        state.current.moveDown = false
        break
      case 'e':
        state.current.moveUp = false
        break
    }
  }, [])

  // Handle mouse events
  const onMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 2) { // Right mouse button
      state.current.isRightMouseDown = true
      rightMouseState.setDown(true) // Update shared state

      // Disable OrbitControls while flying
      if (orbitRef?.current) {
        orbitRef.current.enabled = false
      }

      // Store initial mouse position for fallback
      state.current.lastMouseX = e.clientX
      state.current.lastMouseY = e.clientY

      // Try to request pointer lock for better mouse control
      try {
        gl.domElement.requestPointerLock()
        state.current.usePointerLock = true
      } catch {
        // Pointer lock not available, use fallback
        state.current.usePointerLock = false
      }
    }
  }, [gl, orbitRef])

  const onMouseUp = useCallback((e: MouseEvent) => {
    if (e.button === 2) {
      state.current.isRightMouseDown = false
      rightMouseState.setDown(false) // Update shared state

      // Update OrbitControls target to match new camera orientation before re-enabling
      if (orbitRef?.current) {
        // Calculate new target: camera position + camera forward direction
        const forward = new THREE.Vector3()
        camera.getWorldDirection(forward)
        const newTarget = camera.position.clone().add(forward.multiplyScalar(10))
        orbitRef.current.target.copy(newTarget)
        orbitRef.current.update()
        orbitRef.current.enabled = true
      }

      // Reset all movement states
      state.current.moveForward = false
      state.current.moveBackward = false
      state.current.moveLeft = false
      state.current.moveRight = false
      state.current.moveUp = false
      state.current.moveDown = false

      // Exit pointer lock if we were using it
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock()
      }
    }
  }, [gl, orbitRef, camera])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!state.current.isRightMouseDown) return

    // Check if pointer lock is active
    if (document.pointerLockElement === gl.domElement) {
      // Pointer lock mode - use movementX/Y
      state.current.mouseDeltaX += e.movementX
      state.current.mouseDeltaY += e.movementY
    } else {
      // Fallback mode - calculate delta from last position
      const deltaX = e.clientX - state.current.lastMouseX
      const deltaY = e.clientY - state.current.lastMouseY
      
      state.current.mouseDeltaX += deltaX
      state.current.mouseDeltaY += deltaY
      
      state.current.lastMouseX = e.clientX
      state.current.lastMouseY = e.clientY
    }
  }, [gl])

  // Handle pointer lock change - detect if it failed or was exited
  const onPointerLockChange = useCallback(() => {
    if (document.pointerLockElement !== gl.domElement && state.current.isRightMouseDown) {
      // Pointer lock was exited but we're still holding RMB - switch to fallback
      state.current.usePointerLock = false
    }
  }, [gl])

  // Handle pointer lock error
  const onPointerLockError = useCallback(() => {
    // Pointer lock failed, use fallback mode
    state.current.usePointerLock = false
  }, [])

  // Handle scroll for speed adjustment (only when RMB is held)
  const onWheel = useCallback((e: WheelEvent) => {
    if (state.current.isRightMouseDown) {
      e.preventDefault()
      e.stopPropagation()
      // Scroll up = faster, scroll down = slower
      const delta = e.deltaY > 0 ? 0.8 : 1.25
      state.current.speed = Math.max(0.1, Math.min(50, state.current.speed * delta))
      globalSpeed = state.current.speed
      setCameraSpeed(state.current.speed)
    }
  }, [setCameraSpeed])

  // Prevent context menu on right click
  const onContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault()
  }, [])

  useEffect(() => {
    if (!enabled) return

    const domElement = gl.domElement

    // Use capture phase to intercept keys before other handlers
    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('keyup', onKeyUp, { capture: true })
    domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    domElement.addEventListener('wheel', onWheel, { passive: false })
    domElement.addEventListener('contextmenu', onContextMenu)
    
    // Pointer lock event listeners for fallback handling
    document.addEventListener('pointerlockchange', onPointerLockChange)
    document.addEventListener('pointerlockerror', onPointerLockError)

    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('keyup', onKeyUp, { capture: true })
      domElement.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      domElement.removeEventListener('wheel', onWheel)
      domElement.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      document.removeEventListener('pointerlockerror', onPointerLockError)
      
      // Ensure shared state is reset when unmounting
      rightMouseState.setDown(false)
    }
  }, [enabled, gl, onKeyDown, onKeyUp, onMouseDown, onMouseUp, onMouseMove, onWheel, onContextMenu, onPointerLockChange, onPointerLockError])

  useFrame((_, delta) => {
    if (!enabled || !state.current.isRightMouseDown) return

    // Clamp delta to avoid huge jumps
    const dt = Math.min(delta, 0.1)

    // Update camera rotation based on mouse movement (like turning head in game)
    if (state.current.mouseDeltaX !== 0 || state.current.mouseDeltaY !== 0) {
      euler.current.setFromQuaternion(camera.quaternion)

      // Yaw (left/right) - around world Y axis
      euler.current.y -= state.current.mouseDeltaX * state.current.lookSpeed

      // Pitch (up/down) - clamped to prevent flipping
      euler.current.x -= state.current.mouseDeltaY * state.current.lookSpeed
      euler.current.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, euler.current.x))

      // No roll
      euler.current.z = 0

      camera.quaternion.setFromEuler(euler.current)

      // Reset mouse delta
      state.current.mouseDeltaX = 0
      state.current.mouseDeltaY = 0
    }

    // Calculate movement
    const speed = state.current.speed * dt

    // Get camera direction vectors
    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()

    // Get the camera's forward direction (where it's looking)
    camera.getWorldDirection(forward)

    // Get right vector (perpendicular to forward on XZ plane)
    right.crossVectors(forward, camera.up).normalize()

    // W/S - Move forward/backward in camera look direction
    if (state.current.moveForward) {
      vec.current.copy(forward).multiplyScalar(speed)
      camera.position.add(vec.current)
    }
    if (state.current.moveBackward) {
      vec.current.copy(forward).multiplyScalar(-speed)
      camera.position.add(vec.current)
    }

    // A/D - Strafe left/right
    if (state.current.moveLeft) {
      vec.current.copy(right).multiplyScalar(-speed)
      camera.position.add(vec.current)
    }
    if (state.current.moveRight) {
      vec.current.copy(right).multiplyScalar(speed)
      camera.position.add(vec.current)
    }

    // Q/E - Move down/up (world space vertical)
    if (state.current.moveUp) {
      camera.position.y += speed
    }
    if (state.current.moveDown) {
      camera.position.y -= speed
    }
  })

  return {
    isFlying: state.current.isRightMouseDown,
    speed: state.current.speed,
  }
}
