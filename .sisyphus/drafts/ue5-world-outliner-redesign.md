# Draft: UE5 World Outliner Redesign

## Requirements (confirmed)
- Redesign Hierarchy component to match UE5 World Outliner visual design
- Maintain all existing functionality (DnD, multi-select, keyboard nav, context menu)
- Add UE5-specific features (column system, inherited visibility, filter dropdown)

## Research Findings

### Current Implementation Analysis
- **Location**: `src/components/editor/Hierarchy/`
- **Pattern**: Flat-list tree (flattened for performance + virtualization)
- **Row Height**: Currently 28px (h-7), UE5 uses ~20-24px for density
- **Indentation**: 16px per level (UE5 uses 10-15px)
- **Icons**: lucide-react (Sun, Camera, Layers, Folder, Box)
- **State Integration**: Uses editorStore selectors (objects, selectedIds, rootObjectIds)
- **DnD**: Native HTML5 with drop zones (before/after/inside)
- **Selection**: Multi-select with Ctrl+Click, Shift for range
- **Keyboard**: Arrows, F2 rename, Delete, Ctrl+D duplicate

### Existing UE Theme Tokens (from tailwind.config.js)
| Token | Value | Usage |
|-------|-------|-------|
| `ue-bg-dark` | #1a1a1a | Main background |
| `ue-bg` | #242424 | Panel background |
| `ue-bg-light` | #2a2a2a | Headers |
| `ue-bg-hover` | #3a3a3a | List item hover |
| `ue-accent-blue` | #0d6efd | Selection |
| `ue-text-primary` | #e0e0e0 | Main text |
| `ue-text-secondary` | #a0a0a0 | Icons, secondary |
| `ue-text-muted` | #707070 | Placeholders |
| `ue-border` | #3a3a3a | Borders |

### SceneObject Types (from src/types/index.ts)
- mesh, light, camera, group, folder, model, particle, ui

### Gap: Inherited Visibility
- Current: Each object has flat `visible: boolean`
- Needed: Computed visibility that checks ancestor chain
- Solution: Add selector/utility for `effectiveVisibility`

## Technical Decisions

### Architecture Choice
- **Keep flat-list pattern** (already optimized, matches UE5 approach)
- **Add column layout** via CSS Grid within each row
- **Consider react-arborist or TanStack Virtual** for advanced virtualization if needed

### Decisions (Defaults Applied)
- [x] **Virtualization**: Defer for v1 - current flat-list is performant for medium scenes (100-500 objects). Can add TanStack Virtual later if needed.
- [x] **Column resizing**: No - use fixed widths for Eye (28px), Type icon (24px), flexible Name column. Simpler implementation.
- [x] **Type icon colors**: Match UE5 exactly - authenticity matters for UE-style editor. Add new color tokens.
- [x] **Filter dropdown**: Inline popover (like UE5) - appears below search bar when filter button clicked.
- [x] **Test strategy**: Manual verification via browser - no test infrastructure detected in project.

## Scope Boundaries
- **INCLUDE**: 
  - Visual redesign (row height, indentation, colors)
  - Column-based layout (Eye | Icon+Name | Type)
  - Color-coded type icons
  - Inherited visibility state (grayed eye)
  - Filter dropdown with type toggles
  - Header bar with sort options
  - Enhanced context menu (Select Children, Select All Descendants)
  
- **EXCLUDE**:
  - Virtualization (future enhancement)
  - Resizable columns (future enhancement)
  - "Pilot actor" camera feature (requires Viewport integration)
  - Level/Layer columns (not applicable to this editor)
  - Exclusion syntax in search (-Light) (future enhancement)
