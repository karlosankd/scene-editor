# Draft: TransformControls & Model Rendering Fix

## Requirements (confirmed)

- **Issue 1**: TransformGizmo uses a hidden "dummy" mesh pattern that makes dragging invisible until release
- **Issue 2**: SceneObjectRenderer lacks a 'model' case - GLTF/GLB models aren't rendered
- **Issue 3**: No real-time visual feedback during transform operations

## Success Criteria

- Imported models are visible in the viewport
- Dragging TransformControls provides immediate visual feedback (object moves with gizmo)
- Store is updated correctly at drag end (or real-time if performance allows)

## Technical Decisions

### Current Architecture (Problem)

**TransformGizmo (Viewport.tsx:84-147)**:
```tsx
// Current problematic pattern:
<TransformControls
  ref={transformRef}
  object={meshRef.current || undefined}  // Attached to invisible dummy mesh!
  mode={transformMode}
  space={transformSpace}
  onMouseDown={handleDragStart}
  onMouseUp={handleDragEnd}  // Store only updated here
>
  <mesh ref={meshRef}>
    <boxGeometry args={[0.001, 0.001, 0.001]} />  // Tiny invisible mesh
    <meshBasicMaterial visible={false} />
  </mesh>
</TransformControls>
```

**Problem**: The gizmo is attached to a dummy mesh, not the actual scene object. During drag:
1. The dummy mesh moves (invisible)
2. The actual rendered object doesn't move
3. Only at mouseUp does the store update
4. Then the actual object jumps to the new position

**SceneObjectRenderer (SceneObjects.tsx:190-203)**:
```tsx
{object.type === 'mesh' && <MeshObject object={object} />}
{object.type === 'light' && <LightObject object={object} />}
// 'model' case is MISSING!
```

### Solution Architecture

**Approach A: Direct Ref Binding (Recommended)**
- Pass refs from rendered objects to TransformGizmo
- Attach TransformControls directly to the actual 3D object
- Use `onObjectChange` for real-time visual updates
- Update store on `onMouseUp` for persistence

**Approach B: onChange with Real-time Store Updates**
- Keep current pattern but update store in `onChange`/`onObjectChange`
- Performance concern: Zustand updates every frame during drag

**Decision**: Approach A (Direct Ref Binding)
- Better performance (no store updates during drag)
- More natural Three.js pattern
- Cleaner separation of visual feedback vs state persistence

### Implementation Strategy

1. **Create ObjectRefRegistry**: A registry to store refs to rendered objects by ID
2. **Modify SceneObjectRenderer components**: Expose refs via registry
3. **Add ModelObject component**: New component using `useGLTF` from drei
4. **Refactor TransformGizmo**: Attach to actual object ref, not dummy mesh
5. **Use `onObjectChange`**: For visual feedback during drag
6. **Keep `onMouseUp`**: For final store persistence

## Research Findings

### TransformControls API (from drei source)
```tsx
// Key props:
- object?: THREE.Object3D | React.RefObject<THREE.Object3D>  // Direct object attachment!
- onChange?: (e?: THREE.Event) => void  // Fires on any change (camera, etc.)
- onObjectChange?: (e?: THREE.Event) => void  // Fires specifically when object changes
- onMouseDown?: (e?: THREE.Event) => void
- onMouseUp?: (e?: THREE.Event) => void
```

### Key Insight from drei Implementation
- TransformControls can accept an external `object` prop directly
- If `object` prop provided, it attaches to that object
- If children provided, it wraps them in a group and attaches to that
- The `onObjectChange` event fires during dragging for real-time feedback

### useGLTF Pattern (for ModelObject)
```tsx
import { useGLTF } from '@react-three/drei'

function ModelObject({ url, ...props }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene.clone()} {...props} />
}
```

## Open Questions

- ~~Should we use a context/registry for refs, or pass them via props?~~ 
  **Decision**: Use a simple Map-based registry via Zustand store slice or ref
- ~~Real-time store updates vs only on mouseUp?~~
  **Decision**: mouseUp only for performance (visual feedback is from direct object manipulation)

## Scope Boundaries

### INCLUDE
- Fix TransformGizmo to attach to actual rendered objects
- Add ModelObject component for GLTF/GLB rendering
- Add 'model' case to SceneObjectRenderer
- Real-time visual feedback during transform operations
- Proper cleanup on selection change

### EXCLUDE
- Animation/skeletal animation support for models
- Model material override system
- Model LOD support
- FBX/OBJ loaders (only GLTF/GLB for now)
- Multi-selection transform (out of scope)
