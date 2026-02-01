# UE5-style Level Template System

## TL;DR

> **Quick Summary**: Implement a template system for new projects, offering "Empty" (void) and "Basic" (sky/light/fog) starting states. Refactor the rendering pipeline to move hardcoded environment elements into the scene graph as editable objects.
> 
> **Deliverables**:
> - Template Selection Dialog (UI)
> - New Scene Object Types: `Sky`, `Fog`, `Environment`
> - Refactored Viewport (removes hardcoded lights)
> - `newProject` action with template support
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Types → Rendering Refactor → Store Logic → UI

---

## Context

### Original Request
Implement a "New Project" workflow similar to Unreal Engine 5, allowing users to choose between an **Empty Level** (completely black) and a **Basic Level** (with sky, lights, fog).

### Interview Summary
**Key Decisions**:
- **Data Model**: Treat global elements (Sky, Fog, Environment) as editable `SceneObject`s rather than hidden settings.
- **Default Behavior**: Load "Basic Level" on initial app launch (convenience). Show Dialog only on explicit "New Project" action.
- **Rendering**: Move hardcoded `<ambientLight>` and `<directionalLight>` from `Viewport.tsx` into the dynamic scene graph.

### Metis Review
**Identified Gaps** (addressed):
- **Gap 1**: `Viewport.tsx` has hardcoded lights. **Resolution**: Refactor task included to remove them and spawn them as objects instead.
- **Gap 2**: Missing `Fog` support in engine. **Resolution**: Add `fog` object type and renderer logic.

---

## Work Objectives

### Core Objective
Enable creating new scenes from templates and fully data-driven scene environment rendering.

### Concrete Deliverables
- `src/components/editor/Dialogs/TemplateSelector.tsx`
- `src/data/templates.ts`
- Updated `src/types/index.ts` (New object types)
- Updated `src/components/editor/Viewport/SceneObjects.tsx` (Render support)

### Definition of Done
- [ ] "New Project" menu item opens a modal dialog
- [ ] Selecting "Empty" creates a scene with 0 objects and black background
- [ ] Selecting "Basic" creates a scene with Sky, Directional Light, Fog, and Atmosphere
- [ ] All new objects are visible in the Outliner (Hierarchy)

### Must Have
- Localization (English/Chinese)
- R3F `drei` components for Sky/Environment
- Undo/Redo support for the new object types (inherited from object system)

### Must NOT Have (Guardrails)
- Complex weather simulation (keep it static)
- Custom shaders for sky (use standard Drei components)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (Standard Vite/React setup, no test runner found in initial scan)
- **User wants tests**: NO (Manual verification per "Instructions" style)
- **QA Approach**: Manual Verification via `interactive_bash` and Browser.

### Automated Verification (Agent-Executable)

**1. Type System Verification**
```bash
# Verify new types are exported
grep "export type ObjectType =" src/types/index.ts
# Check for 'sky' | 'fog' in the output
```

**2. Template Logic Verification**
```typescript
// Create a temporary test script
const { templates } = require('./src/data/templates');
console.log(JSON.stringify(templates.basic.objects.length > 0)); // Expect true
console.log(JSON.stringify(templates.empty.objects.length === 0)); // Expect true
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Core Infrastructure):
├── Task 1: Define New Object Types (Types)
├── Task 2: Create Template Data Definitions (Data)
└── Task 3: Build Template Selector UI (Frontend)

Wave 2 (Integration & Rendering):
├── Task 4: Refactor Viewport Rendering (R3F)
└── Task 5: Connect Store & Menu Actions (Logic)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 4 | 3 |
| 2 | 1 | 5 | 3 |
| 3 | None | 5 | 1, 2 |
| 4 | 1 | None | 5 |
| 5 | 2, 3 | None | 4 |

---

## TODOs

- [ ] 1. [Types] Define Environment Object Types

  **What to do**:
  - Update `src/types/index.ts`:
    - Add `'sky' | 'fog' | 'environment'` to `ObjectType`.
    - Create interfaces `SkyData`, `FogData`, `EnvironmentData`.
    - Update `SceneObject` to include these optional data fields.
  - Define properties matching R3F props (e.g., Sky: `sunPosition`, `turbidity`; Fog: `color`, `density`).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `typescript`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1

  **References**:
  - `src/types/index.ts` (Existing types)
  - `node_modules/@types/three/index.d.ts` (Three.js types)

  **Acceptance Criteria**:
  - `grep "type ObjectType" src/types/index.ts` contains 'sky'
  - `grep "interface SkyData" src/types/index.ts` exists

- [ ] 2. [Data] Implement Template Configuration

  **What to do**:
  - Create `src/data/templates.ts`.
  - Define `Template` interface.
  - Export `templates` object containing:
    - `empty`: Background #000000, no objects.
    - `basic`: Background #1a1a1a (or sky color), includes Sky, DirectionalLight, FogExp2, Environment objects.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `typescript`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 5

  **References**:
  - `src/types/index.ts` (Use the types defined in Task 1)
  - `src/stores/editorStore.ts` (For SceneObject structure)

  **Acceptance Criteria**:
  - `src/data/templates.ts` exists and exports `basic` and `empty` configurations.

- [ ] 3. [UI] Create Template Selection Dialog

  **What to do**:
  - Create `src/components/editor/Dialogs/TemplateSelector.tsx`.
  - Use `radix-ui` primitives or existing modal patterns if available (check `src/components/ui` or similar, otherwise simple Tailwind modal).
  - Display cards for "Empty Level" and "Basic Level".
  - Add i18n support (`src/i18n/translations.ts` updates).

  **Recommended Agent Profile**:
  - **Category**: `frontend-ui-ux`
  - **Skills**: `react`, `tailwind`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1

  **References**:
  - `src/i18n/translations.ts` (Add keys: `template.title`, `template.empty`, `template.basic`)

  **Acceptance Criteria**:
  - Component exports `TemplateSelector`.
  - Translations added to both `en` and `zh` sections.

- [ ] 4. [R3F] Refactor Viewport for Dynamic Environment

  **What to do**:
  - Modify `src/components/editor/Viewport/SceneObjects.tsx`:
    - Add renderers for `sky`, `fog`, `environment`.
    - Map `SkyData` to `<Sky />`, `FogData` to `<fogExp2 />` (using `<primitive object={...} attach="fog" />`), etc.
  - Modify `src/components/editor/Viewport/Viewport.tsx`:
    - **REMOVE** hardcoded `<ambientLight>`, `<directionalLight>`, `<Environment>`.
    - Ensure `SceneObjects` component is placed such that Fog/Sky render correctly (usually direct children of Scene).

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `react-three-fiber`

  **Parallelization**:
  - **Can Run In Parallel**: YES (After Task 1)
  - **Parallel Group**: Wave 2

  **References**:
  - `src/components/editor/Viewport/Viewport.tsx` (Current implementation)
  - R3F Drei Docs: `https://github.com/pmndrs/drei`

  **Acceptance Criteria**:
  - Hardcoded lights are gone from `Viewport.tsx`.
  - `SceneObjects` handles `case 'sky': return <Sky ... />`.

- [ ] 5. [Logic] Connect New Project Action

  **What to do**:
  - Modify `src/stores/editorStore.ts`:
    - Update `newProject` to accept `template: Template` (from Task 2).
    - Populate `objects`, `rootObjectIds` based on template data.
    - Set `editorSettings.backgroundColor` from template.
  - Modify `src/components/editor/MenuBar/MenuBar.tsx`:
    - "New Project" click -> Open `TemplateSelector` (controlled by local state or store).
  - Modify `src/components/editor/EditorLayout.tsx`:
    - On mount: Call `newProject(templates.basic)` (default startup).

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: `zustand`, `react`

  **Parallelization**:
  - **Can Run In Parallel**: YES (After Task 2 & 3)
  - **Parallel Group**: Wave 2

  **References**:
  - `src/stores/editorStore.ts:newProject`

  **Acceptance Criteria**:
  - `newProject` action correctly populates store with template objects.
  - Menu bar triggers the UI dialog.

---

## Success Criteria

### Final Checklist
- [ ] User sees "New Project" -> Dialog appears
- [ ] "Empty" template results in a black void (no objects in Outliner)
- [ ] "Basic" template results in a visible scene with Sky/Sun/Fog objects in Outliner
- [ ] Environment objects (Sky/Fog) can be selected/deleted/modified (via Inspector)
