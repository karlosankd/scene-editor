import { useState, useRef, useCallback } from 'react'
import { useThree, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore, useSelectedObject } from '@/stores/editorStore'
import { transformDragState } from '@/hooks/useTransformDragState'
import { Axis } from './constants'
import { MeshRegistry } from '@/stores/meshRegistry'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface UseGizmoDragProps {
  onDragStart?: () => void
  onDragEnd?: () => void
  orbitRef: React.RefObject<OrbitControlsImpl>
}

export function useGizmoDrag({ onDragStart, onDragEnd, orbitRef }: UseGizmoDragProps) {
  const { camera, raycaster } = useThree()
  const selectedObject = useSelectedObject()
  const transformMode = useEditorStore((state) => state.transformMode)
  const transformSpace = useEditorStore((state) => state.transformSpace)
  const updateTransform = useEditorStore((state) => state.updateTransform)

  const [hoveredAxis, setHoveredAxis] = useState<Axis>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Refs for drag state to avoid re-renders
  const dragRef = useRef({
    active: false,
    axis: null as Axis,
    startPoint: new THREE.Vector3(),
    startObjectPosition: new THREE.Vector3(),
    startObjectRotation: new THREE.Euler(),
    startObjectScale: new THREE.Vector3(),
    startQuaternion: new THREE.Quaternion(),
    planeNormal: new THREE.Vector3(),
    planeConstant: 0,
    offset: new THREE.Vector3(), // Offset from object center to intersection point
    startMouse: new THREE.Vector2(), // For scale/screen-space ops
  })

  // Helper vectors to reduce GC
  const _vec3a = new THREE.Vector3()
  const _vec3b = new THREE.Vector3()
  const _vec3c = new THREE.Vector3()
  const _quat = new THREE.Quaternion()
  const _plane = new THREE.Plane()

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>, axis: Axis) => {
    e.stopPropagation()
    const targetMesh = selectedObject ? MeshRegistry.get(selectedObject.id) : null
    if (!targetMesh || !axis) return

    // Register capture
    ;(e.target as Element).setPointerCapture(e.pointerId)
    
    // Disable controls
    if (orbitRef.current) orbitRef.current.enabled = false
    transformDragState.setDragging(true)
    
    setIsDragging(true)
    if (onDragStart) onDragStart()

    // Initialize drag state
    const state = dragRef.current
    state.active = true
    state.axis = axis
    state.startObjectPosition.copy(targetMesh.position)
    state.startObjectRotation.copy(targetMesh.rotation)
    state.startObjectScale.copy(targetMesh.scale)
    state.startQuaternion.copy(targetMesh.quaternion)
    state.startMouse.set(e.clientX, e.clientY)

    // Calculate intersection point and plane normal
    const intersection = e.point
    state.startPoint.copy(intersection)
    state.offset.subVectors(intersection, targetMesh.position)

    // Set up plane for raycasting based on axis and camera
    const eye = camera.position.clone().sub(targetMesh.position).normalize()
    
    // Determine appropriate plane normal for the axis
    _vec3a.set(0, 0, 0)
    if (transformMode === 'translate' || transformMode === 'scale') {
      if (axis === 'X') {
        // Plane containing X axis and roughly facing camera
        _vec3a.set(1, 0, 0)
        _vec3b.crossVectors(_vec3a, eye).cross(_vec3a).normalize()
        state.planeNormal.copy(_vec3b)
      } else if (axis === 'Y') {
        _vec3a.set(0, 1, 0)
        _vec3b.crossVectors(_vec3a, eye).cross(_vec3a).normalize()
        state.planeNormal.copy(_vec3b)
      } else if (axis === 'Z') {
        _vec3a.set(0, 0, 1)
        _vec3b.crossVectors(_vec3a, eye).cross(_vec3a).normalize()
        state.planeNormal.copy(_vec3b)
      } else if (axis === 'XY') {
        state.planeNormal.set(0, 0, 1)
      } else if (axis === 'XZ') {
        state.planeNormal.set(0, 1, 0)
      } else if (axis === 'YZ') {
        state.planeNormal.set(1, 0, 0)
      } else if (axis === 'XYZ' || axis === 'XYZ') {
        state.planeNormal.copy(eye)
      }
      
      // Transform plane normal to world space if in local mode (unless scaling which is always local)
      if (transformSpace === 'local' && transformMode === 'translate') {
        state.planeNormal.applyQuaternion(targetMesh.quaternion)
      }
    } else if (transformMode === 'rotate') {
      // For rotation, the plane normal IS the axis
       if (axis === 'X') state.planeNormal.set(1, 0, 0)
       else if (axis === 'Y') state.planeNormal.set(0, 1, 0)
       else if (axis === 'Z') state.planeNormal.set(0, 0, 1)
       
       if (transformSpace === 'local') {
         state.planeNormal.applyQuaternion(targetMesh.quaternion)
       }
    }

    // Plane should pass through the object center for accurate translation
    state.planeConstant = -targetMesh.position.dot(state.planeNormal)

    // Recalculate startPoint as the intersection of the ray with the new plane
    // Use e.ray from the event, not raycaster.ray which may not be updated
    _plane.set(state.planeNormal, state.planeConstant)
    const newStart = e.ray.intersectPlane(_plane, _vec3a.clone())
    if (newStart) {
      state.startPoint.copy(newStart)
    }

  }, [camera, selectedObject, transformMode, transformSpace, onDragStart, orbitRef])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const state = dragRef.current
    const targetMesh = selectedObject ? MeshRegistry.get(selectedObject.id) : null
    
    if (!state.active || !targetMesh || !selectedObject) return

    // Update raycaster
    _plane.set(state.planeNormal, state.planeConstant)
    raycaster.ray.intersectPlane(_plane, _vec3a) // _vec3a is the new intersection point
    
    if (!_vec3a) return // No intersection

    if (transformMode === 'translate') {
      // Calculate delta
      _vec3b.subVectors(_vec3a, state.startPoint) // Delta vector

      if (state.axis === 'XYZ') {
        // Free move
        targetMesh.position.copy(state.startObjectPosition).add(_vec3b)
      } else {
        // Constrained move
        const moveAxis = _vec3c.set(0, 0, 0)
        
        if (state.axis === 'X' || state.axis === 'XY' || state.axis === 'XZ') moveAxis.x = 1
        if (state.axis === 'Y' || state.axis === 'XY' || state.axis === 'YZ') moveAxis.y = 1
        if (state.axis === 'Z' || state.axis === 'XZ' || state.axis === 'YZ') moveAxis.z = 1

        // If local space, transform the movement axis
        if (transformSpace === 'local') {
          // Project delta onto local axes
          _vec3b.applyQuaternion(state.startQuaternion.clone().invert())
          _vec3b.multiply(moveAxis)
          _vec3b.applyQuaternion(state.startQuaternion)
          targetMesh.position.copy(state.startObjectPosition).add(_vec3b)
        } else {
          _vec3b.multiply(moveAxis)
          targetMesh.position.copy(state.startObjectPosition).add(_vec3b)
        }
      }
    } else if (transformMode === 'rotate') {
      // Project start and current points onto the rotation plane
      const center = targetMesh.position
      const normal = state.planeNormal

      // Vector from center to start point, projected onto plane
      const startVec = _vec3b.subVectors(state.startPoint, center)
      startVec.sub(normal.clone().multiplyScalar(startVec.dot(normal))).normalize()

      // Vector from center to current point, projected onto plane
      const currentVec = _vec3c.subVectors(_vec3a, center)
      currentVec.sub(normal.clone().multiplyScalar(currentVec.dot(normal))).normalize()

      // Calculate angle using atan2 for full -π to π range
      // Cross product gives sin(angle) * normal, dot gives cos(angle)
      const cross = new THREE.Vector3().crossVectors(startVec, currentVec)
      const sinAngle = cross.dot(normal) // Signed sin based on normal direction
      const cosAngle = startVec.dot(currentVec)
      const angle = Math.atan2(sinAngle, cosAngle)

      // Apply rotation
      _quat.setFromAxisAngle(normal, angle)

      if (transformSpace === 'local') {
        targetMesh.quaternion.copy(state.startQuaternion).multiply(_quat)
      } else {
        // World rotation: q_new = q_rot * q_old
        targetMesh.quaternion.copy(_quat).multiply(state.startQuaternion)
      }
    } else if (transformMode === 'scale') {
      // For scale, we project mouse movement onto the axis line
      // OR simpler: use distance from center
      
      const startDist = state.startPoint.distanceTo(targetMesh.position)
      const currentDist = _vec3a.distanceTo(targetMesh.position)
      
      // Determine sign based on if we are moving away or towards center along the axis
      const dragVec = _vec3b.subVectors(_vec3a, targetMesh.position)
      const axisVec = _vec3c.set(0, 0, 0)
      
      if (state.axis === 'X') axisVec.set(1, 0, 0)
      else if (state.axis === 'Y') axisVec.set(0, 1, 0)
      else if (state.axis === 'Z') axisVec.set(0, 0, 1)
      else if (state.axis === 'XY') axisVec.set(1, 1, 0).normalize()
      else if (state.axis === 'XZ') axisVec.set(1, 0, 1).normalize()
      else if (state.axis === 'YZ') axisVec.set(0, 1, 1).normalize()
      else if (state.axis === 'XYZ') axisVec.set(1, 1, 1).normalize()
      
      if (transformSpace === 'local') axisVec.applyQuaternion(state.startQuaternion)
      
      const dot = dragVec.dot(axisVec)
      const scaleFactor = (dot > 0 ? 1 : -1) * (currentDist / startDist)
      
      // Apply scale
      if (state.axis === 'XYZ') {
        targetMesh.scale.copy(state.startObjectScale).multiplyScalar(scaleFactor)
      } else {
        const s = state.startObjectScale.clone()
        if (state.axis === 'X' || state.axis === 'XY' || state.axis === 'XZ') s.x *= scaleFactor
        if (state.axis === 'Y' || state.axis === 'XY' || state.axis === 'YZ') s.y *= scaleFactor
        if (state.axis === 'Z' || state.axis === 'XZ' || state.axis === 'YZ') s.z *= scaleFactor
        targetMesh.scale.copy(s)
      }
    }

  }, [camera, raycaster, transformMode, transformSpace, selectedObject])

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    const state = dragRef.current
    if (!state.active) return
    
    ;(e.target as Element).releasePointerCapture(e.pointerId)
    state.active = false
    setIsDragging(false)
    
    // Enable controls
    if (orbitRef.current) orbitRef.current.enabled = true
    transformDragState.setDragging(false)
    
    // Commit changes to store
    if (selectedObject && MeshRegistry.get(selectedObject.id)) {
      const mesh = MeshRegistry.get(selectedObject.id)!
      updateTransform(selectedObject.id, {
        position: [mesh.position.x, mesh.position.y, mesh.position.z],
        rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
        scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
      })
    }

    if (onDragEnd) onDragEnd()
  }, [orbitRef, selectedObject, updateTransform, onDragEnd])

  return {
    hoveredAxis,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    setHoveredAxis
  }
}
