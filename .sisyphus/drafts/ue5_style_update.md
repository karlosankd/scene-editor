# Draft: UE5 Visual Style Update

## Context
- User provided reference image of UE5 default level.
- Goal: Prepare to update the current scene to match this visual style (when instructed).

## Visual Analysis (UE5 Default Level)
1.  **Atmosphere/Sky**:
    -   Dynamic blue sky with volumetric clouds.
    -   Horizon line with atmospheric fog.
2.  **Lighting**:
    -   Directional Light (Sun) icon visible.
    -   Sky Light icon visible.
    -   Soft, realistic shadowing.
3.  **Floor/Grid**:
    -   Infinite checkered floor (World Partition Grid).
    -   Light gray/Dark gray checker pattern.
    -   Grid fades into distance/fog.
4.  **Icons/Billboards**:
    -   Sprite icons for non-mesh objects (Lights, Player Start, Atmospheric Fog).
    -   "Player Start" icon (gamepad/flag symbol).

## Current Codebase Mapping
-   **Store (`editorStore.ts`)**:
    -   Defaults: `backgroundColor: '#1a1a1a'` (Dark gray void) vs UE5 Sky.
    -   `gridSize: 20`, `gridDivisions: 20` vs UE5 Infinite Grid.
-   **Viewport (`Viewport.tsx`)**:
    -   Currently uses `<color attach="background" />` (solid color).
    -   Uses `<gridHelper>` (basic wireframe grid) vs UE5 Checkered Shader.
    -   Lighting: Standard ambient/point lights might be present, but UE5 needs specific Directional + Hemisphere setup.
-   **Objects (`SceneObjects.tsx`)**:
    -   Need to check if "icons" are implemented for non-mesh objects.
    -   Currently likely renders generic meshes or nothing for abstract objects.

## Implementation Plan Strategy (Pre-computation)
-   **Sky**: Replace `background` color with `@react-three/drei` `<Sky />` or `<Environment />` or a custom shader.
-   **Floor**: Replace `<gridHelper>` with `<Grid>` from drei (configurable infinite grid) or custom checkerboard shader.
-   **Icons**: Implement `Billboard` components for Light/Camera/PlayerStart objects using standard icons.
