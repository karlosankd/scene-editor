import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore } from '@/stores/editorStore'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface CameraFocusHandlerProps {
  orbitRef: React.RefObject<OrbitControlsImpl>
}

export function CameraFocusHandler({ orbitRef }: CameraFocusHandlerProps) {
  const { scene, camera } = useThree()
  const focusTargetId = useEditorStore((state) => state.focusTargetId)
  const objects = useEditorStore((state) => state.objects)
  const clearFocusTarget = useEditorStore((state) => state.clearFocusTarget)

  useEffect(() => {
    if (!focusTargetId || !orbitRef.current) return

    const controls = orbitRef.current
    const targetObject = objects[focusTargetId]
    if (!targetObject) {
      clearFocusTarget()
      return
    }

    // Find the Three.js object in the scene
    const threeObject = scene.getObjectByName(focusTargetId)

    if (threeObject) {
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(threeObject)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      // Calculate the distance needed to fit the object in view
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
      let distance = maxDim / (2 * Math.tan(fov / 2))

      // Add some padding
      distance *= 2.5

      // Minimum distance
      distance = Math.max(distance, 3)

      // Get current camera direction
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)

      // Calculate new camera position
      const newPosition = center.clone().sub(direction.multiplyScalar(distance))

      // Animate camera to new position
      const startPosition = camera.position.clone()
      const startTarget = controls.target.clone()
      const duration = 500 // ms
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const t = Math.min(elapsed / duration, 1)

        // Ease out cubic
        const easeT = 1 - Math.pow(1 - t, 3)

        // Interpolate position
        camera.position.lerpVectors(startPosition, newPosition, easeT)

        // Interpolate target
        controls.target.lerpVectors(startTarget, center, easeT)
        controls.update()

        if (t < 1) {
          requestAnimationFrame(animate)
        }
      }

      animate()
    } else {
      // If no Three.js object found, use transform position
      const position = new THREE.Vector3(...targetObject.transform.position)

      // Get current camera direction
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)

      // Calculate new camera position (5 units away from target)
      const newPosition = position.clone().sub(direction.multiplyScalar(5))

      // Animate camera
      const startPosition = camera.position.clone()
      const startTarget = controls.target.clone()
      const duration = 500
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const t = Math.min(elapsed / duration, 1)
        const easeT = 1 - Math.pow(1 - t, 3)

        camera.position.lerpVectors(startPosition, newPosition, easeT)
        controls.target.lerpVectors(startTarget, position, easeT)
        controls.update()

        if (t < 1) {
          requestAnimationFrame(animate)
        }
      }

      animate()
    }

    // Clear the focus target after processing
    clearFocusTarget()
  }, [focusTargetId, objects, scene, camera, orbitRef, clearFocusTarget])

  return null
}
