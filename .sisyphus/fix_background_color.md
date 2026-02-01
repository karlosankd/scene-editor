# Fix: Empty Scene Should Be Black

## Issue
- User deleted all components, but the scene background is still blue.
- This is because the `basic` template sets `editorSettings.backgroundColor` to `#87ceeb` (Sky Blue), and this persists even when objects are deleted.
- In UE5/Three.js engines, the "sky" is usually an object. The base "void" color should be black or dark gray.

## Solution Plan
1.  **Modify `src/data/templates.ts`**:
    - Change `basic` template's `backgroundColor` to `#000000` or `#1a1a1a` (Dark Void).
    - The Blue Sky is already provided by the `SkyAtmosphere` object. When that object is present, it covers the black void. When deleted, the black void should show.

2.  **Verify `Viewport.tsx`**:
    - Ensure `<Canvas style={{ background: editorSettings.backgroundColor }}>` is how the background is set.
    - If `Sky` object is present, it renders ON TOP of this background.
    - If `Sky` is deleted, this background shows.

## Action
- Update `src/data/templates.ts`: Set `basic` template `backgroundColor` to `#000000`.
