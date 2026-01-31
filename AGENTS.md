# Scene Editor - Agent Guidelines

A 3D scene editor built with React Three Fiber, providing an Unreal Engine-inspired interface.

## PROJECT OVERVIEW
- **Core Stack**: React 18, Vite 5, Three.js (R3F/drei).
- **State**: Zustand 5 + Immer for immutable scene graph mutations.
- **Physics**: Rapier via `@react-three/rapier`.

## STRUCTURE
```
.
├── src/
│   ├── components/editor/ # Main Editor UI & Viewport
│   ├── stores/            # Central editorStore.ts (400+ lines)
│   ├── hooks/             # useFlyControls, useKeyboardShortcuts
│   ├── types/             # SceneObject, Transform, Project types
│   └── i18n/              # en/zh translations
└── public/                # Static assets & models
```

## WHERE TO LOOK
| Task | Location | Notes |
| :--- | :--- | :--- |
| **Scene Logic** | `src/stores/editorStore.ts` | Centralized state for objects, selection, history. |
| **3D Rendering** | `src/components/editor/Viewport/` | Canvas setup, lights, and object rendering. |
| **UI Layout** | `src/components/editor/EditorLayout.tsx`| Resizable panels and UE-themed styles. |
| **Controls** | `src/hooks/useFlyControls.ts` | WASD/Fly navigation logic. |

## CONVENTIONS
- **Path Aliases**: Always use `@/` for `src/`.
- **State Access**: Use narrow selectors with Zustand to prevent re-renders.
- **Transforms**: Stored as tuples `[x, y, z]` for direct Three.js compatibility.
- **Strict Types**: Interfaces preferred over types; no `any`.

## ANTI-PATTERNS
- **Direct Mutation**: Never mutate store state outside of Immer `set` calls.
- **Three.js in Render**: Do not create Three.js objects inside the render loop; use `useMemo` or `refs`.
- **Intervals**: Use `useFrame` for animations, never `setInterval`.

## COMMANDS
```bash
npm run dev     # Dev server
npm run build   # Type-check + Build
npm run lint    # ESLint v9
```
