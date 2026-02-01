# Plan: Enhance Visual Fidelity to Match UE5

## User Feedback
- "Not transparent/clear enough" (通透).
- Reference image shows:
  - Deep blue sky gradient.
  - Distinct white fluffy clouds (volumetric-like).
  - Clean horizon blending.
  - Infinite grid with blueish tint.

## Proposed Changes

1.  **Extend `SceneObject` Type**:
    - Add `type: 'cloud'` to support `@react-three/drei`'s `<Cloud />`.
    - Add `CloudData` interface (opacity, speed, width, depth, segments).

2.  **Update `SceneObjects.tsx`**:
    - Implement `CloudObject` renderer using `<Cloud />`.

3.  **Refine `templates.ts`**:
    - Add a `Cloud` object to the Basic template.
    - **Crucial**: Tune `Sky` parameters. The previous "turbidity: 10" (haze) might be the OPPOSITE of "transparent/clear". Lower turbidity = clearer air.
    - Reduce `Fog` density further or change color to match the deep blue sky.

4.  **Update `Viewport.tsx`**:
    - Check Tone Mapping exposure. Maybe slightly higher exposure for that "bright" look.

## Technical Details
- `Sky` component: Lower `turbidity` (0.1 - 2) for clear sky. Lower `rayleigh` (0.5 - 1) for deep blue.
- `Cloud` component: `opacity: 0.5`, `speed: 0.4`, `width: 10`, `depth: 1.5`, `segments: 20`.
