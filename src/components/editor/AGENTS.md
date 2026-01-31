# Editor Components

This directory contains the Unreal Engine-inspired UI and the React Three Fiber Viewport.

## OVERVIEW
Main interface implementation using `react-resizable-panels` and Tailwind CSS.

## STRUCTURE
```
editor/
├── Viewport/  # R3F Canvas, Scene rendering, Gizmos
├── Hierarchy/ # Outliner/Scene tree
├── Inspector/ # Property editing (Transform, Material, Light)
├── Assets/    # Asset browser (Models, Textures)
├── Timeline/  # Animation controls
└── Toolbar/   # Transform modes (Translate/Rotate/Scale)
```

## WHERE TO LOOK
| Component | Responsibility |
| :--- | :--- |
| **Viewport** | Bridge between React state and Three.js scene graph. |
| **Inspector** | Dynamic forms mapping `SceneObject` properties to UI. |
| **Hierarchy** | Recursive rendering of the parent/child object tree. |

## CONVENTIONS
- **UE Theme**: Use `ue-bg`, `ue-text`, and `ue-accent` Tailwind classes.
- **Panel Visibility**: Controlled via `useEditorStore((state) => state.panels)`.
- **3D Selection**: Click-to-select logic is handled in `Viewport/SceneObjects.tsx`.

## ANTI-PATTERNS
- **Z-Index Overuse**: Prefer DOM order or relative positioning for panel layering.
- **Heavy Props**: Avoid passing large store objects as props; select IDs and use local selectors.
