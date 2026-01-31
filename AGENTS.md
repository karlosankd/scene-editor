# Scene Editor - Agent Guidelines

A 3D scene editor built with React Three Fiber, providing an Unreal Engine-inspired interface for building and manipulating 3D scenes.

## Project Overview

**Purpose**: Web-based 3D scene editor with real-time viewport, hierarchy management, transform controls, and post-processing effects.

**Tech Stack**:
- **Framework**: React 18 + Vite 5
- **Language**: TypeScript (strict mode)
- **3D Rendering**: React Three Fiber + drei + Rapier (physics)
- **State Management**: Zustand 5 with Immer middleware
- **Styling**: Tailwind CSS 3
- **Build**: Vite with TypeScript checking

## Commands

```bash
# Development
npm run dev          # Start development server (Vite)

# Build
npm run build        # Type-check (tsc -b) then build (vite build)

# Lint
npm run lint         # ESLint (v9 flat config)

# Preview
npm run preview      # Preview production build
```

**Note**: No test script configured. Testing infrastructure not yet set up.

## Project Structure

```
src/
├── App.tsx                    # Application root
├── main.tsx                   # Entry point
├── stores/
│   └── editorStore.ts         # Central Zustand store with Immer
├── types/
│   └── index.ts               # TypeScript type definitions
├── components/
│   └── editor/
│       ├── EditorLayout.tsx   # Main layout with resizable panels
│       ├── Viewport/          # 3D canvas and scene rendering
│       ├── Hierarchy/         # Scene object tree
│       ├── Inspector/         # Property editor
│       ├── Assets/            # Asset browser
│       ├── Timeline/          # Animation timeline
│       ├── Toolbar/           # Transform mode controls
│       └── MenuBar/           # Application menu
├── hooks/
│   ├── index.ts
│   ├── useKeyboardShortcuts.ts
│   └── useFlyControls.ts      # WASD camera controls
└── i18n/                      # Internationalization (en/zh)
```

## Coding Standards

### TypeScript

- **Strict mode** enabled (`strict: true` in tsconfig)
- Use explicit types for function parameters and return values
- Prefer `interface` over `type` for object shapes
- Use type imports: `import type { ... } from '@/types'`
- Path alias `@/*` maps to `src/*`

```typescript
// Good
import type { SceneObject, Transform } from '@/types'

function updateTransform(id: string, transform: Partial<Transform>): void {
  // ...
}

// Avoid
function updateTransform(id, transform) { // Missing types
  // ...
}
```

### React Components

- Use functional components with explicit props interfaces
- Destructure props in function signature
- Co-locate component-specific types

```typescript
interface ViewportProps {
  onObjectSelect?: (id: string) => void
}

export function Viewport({ onObjectSelect }: ViewportProps) {
  // ...
}
```

### State Management (Zustand + Immer)

The central store is in `src/stores/editorStore.ts`. Uses Immer for immutable updates.

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    // State
    objects: {},
    selectedIds: [],
    
    // Actions - mutate draft directly (Immer handles immutability)
    addObject: (partial) => {
      set((state) => {
        state.objects[id] = newObject
        state.isDirty = true
      })
    },
  }))
)
```

**Patterns**:
- Access state via selectors: `useEditorStore((state) => state.selectedIds)`
- Create derived selectors for common patterns (see `useSelectedObject`, `useRootObjects`)
- Group related state and actions together

### React Three Fiber Patterns

#### Canvas Setup

```tsx
<Canvas
  shadows={viewportSettings.enableShadows}
  gl={{
    antialias: true,
    toneMapping: THREE.ACESFilmicToneMapping,
  }}
>
  <Suspense fallback={null}>
    <Scene />
  </Suspense>
</Canvas>
```

#### Component Organization

- Separate 3D logic from React state
- Use `useFrame` for animations, not `useEffect` with intervals
- Wrap heavy components in `Suspense`

```typescript
// Good - inside Canvas
function AnimatedMesh() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta
    }
  })
  
  return <mesh ref={meshRef}>...</mesh>
}
```

#### drei Components

Prefer drei abstractions over raw Three.js:
- `<OrbitControls>` for camera control
- `<TransformControls>` for object manipulation
- `<Grid>`, `<Environment>` for scene setup
- `<GizmoHelper>` for viewport navigation

### Styling (Tailwind CSS)

Use Tailwind utility classes. Custom colors follow UE theme:
- `ue-bg`, `ue-bg-dark`, `ue-bg-light` - Background variants
- `ue-text`, `ue-text-secondary`, `ue-text-muted` - Text colors
- `ue-accent`, `ue-border` - Accent and borders

```tsx
<div className="w-full h-full bg-ue-bg-dark relative">
  <span className="text-xs text-ue-text-muted">Info</span>
</div>
```

### Import Conventions

```typescript
// 1. External libraries
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// 2. Internal modules with path alias
import { useEditorStore } from '@/stores/editorStore'
import type { SceneObject } from '@/types'

// 3. Relative imports for nearby files
import { SceneObjects } from './SceneObjects'
```

## Architecture Guidelines

### Scene Object Model

Objects stored in flat map with parent/child references:

```typescript
interface SceneObject {
  id: string
  name: string
  type: 'mesh' | 'light' | 'camera' | 'group' | 'model'
  visible: boolean
  locked: boolean
  transform: Transform
  parentId: string | null
  childIds: string[]
  geometry?: GeometryData
  material?: MaterialData
  light?: LightData
  components: Component[]
}
```

### Transform System

Transforms stored as tuples for Three.js compatibility:

```typescript
interface Transform {
  position: [number, number, number]
  rotation: [number, number, number]  // Euler angles
  scale: [number, number, number]
}
```

### Command Pattern (Undo/Redo)

History managed via Command objects:

```typescript
interface Command {
  id: string
  type: string
  undo: () => void
  redo: () => void
}
```

### Post-Processing

Effects managed through `@react-three/postprocessing`:
- Bloom, SSAO, DoF, Vignette, Chromatic Aberration
- Toggle via `postProcessing.enabled` in store

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@react-three/fiber` | React renderer for Three.js |
| `@react-three/drei` | Useful R3F helpers and controls |
| `@react-three/postprocessing` | Post-processing effects |
| `@react-three/rapier` | Physics engine |
| `zustand` | State management |
| `immer` | Immutable state updates |
| `three` | 3D graphics library |
| `lucide-react` | Icons |
| `react-resizable-panels` | Resizable layout panels |

## Common Tasks

### Adding a New Object Type

1. Add type to `ObjectType` in `src/types/index.ts`
2. Update `addObject` in `editorStore.ts` to handle defaults
3. Add rendering logic in `SceneObjects.tsx`
4. Update `Inspector` for property editing

### Adding a New Panel

1. Create component in `src/components/editor/`
2. Add to `panels` state in `editorStore.ts`
3. Integrate into `EditorLayout.tsx`
4. Add toggle in `MenuBar.tsx`

### Adding Keyboard Shortcuts

Edit `src/hooks/useKeyboardShortcuts.ts`:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'w') setTransformMode('translate')
    // ...
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

## Do's and Don'ts

### Do

- Use Zustand selectors to minimize re-renders
- Wrap 3D components in Suspense
- Use `useFrame` for per-frame updates
- Keep Three.js objects in refs, not state
- Type all function parameters

### Don't

- Don't mutate state directly outside Immer
- Don't use `setInterval` for animations (use `useFrame`)
- Don't create Three.js objects in render (use useMemo/refs)
- Don't store Three.js objects in Zustand state
- Don't use `any` - prefer `unknown` with type guards
