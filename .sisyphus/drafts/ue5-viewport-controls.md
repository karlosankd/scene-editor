# Draft: UE5 Viewport Controls Implementation

## Requirements (confirmed)

### Core Issues Identified
1. **RMB + drag camera rotation**: User reports it doesn't work properly
2. **Q key behavior**: Currently calls `clearSelection()` but should switch to "select" mode (no transform gizmo)
3. **Keyboard conflict**: Both `useFlyControls` and `useKeyboardShortcuts` handle W/E/R/Q keys

### UE5 Expected Behavior
- **With RMB held**: W/S/A/D/Q/E control camera movement (fly controls)
- **Without RMB**: W/E/R change transform mode, Q enters "select" mode

## Technical Analysis

### Current Implementation Details

#### 1. useFlyControls.ts (Lines 42-85, 110-131)
- Uses `{ capture: true }` on keydown events (line 164)
- Checks `if (!state.current.isRightMouseDown) return` early (line 43)
- Calls `e.preventDefault()` and `e.stopPropagation()` when RMB is held
- Uses pointer lock for mouse capture (line 115)
- **Potential Issue**: Pointer lock condition on line 135 - `document.pointerLockElement === gl.domElement`

#### 2. useKeyboardShortcuts.ts (Lines 19-78)
- Does NOT use capture phase (line 127 - no options)
- Does NOT check if RMB is held before handling W/E/R/Q
- Q key (line 42-46): calls `clearSelection()` instead of switching to select mode

#### 3. Viewport.tsx (Lines 56-118)
- TransformGizmo renders when `selectedObject` exists
- No check for "select" mode - gizmo shows whenever something is selected

#### 4. types/index.ts (Line 128)
- `TransformMode = 'translate' | 'rotate' | 'scale'`
- Missing: `'select'` mode

### Root Cause Analysis

**Issue 1 - RMB Camera Rotation Not Working:**
The pointer lock check on line 135 of useFlyControls.ts:
```typescript
if (state.current.isRightMouseDown && document.pointerLockElement === gl.domElement) {
```
This requires BOTH conditions. If pointer lock fails (browser security, user denial, iframe restrictions), camera won't rotate.

**Issue 2 - Q Key Conflict:**
Both handlers fire for Q:
- `useFlyControls` uses capture phase but only processes when RMB is held
- `useKeyboardShortcuts` doesn't use capture phase, always fires
- Result: Q always calls `clearSelection()` regardless of RMB state

**Issue 3 - Missing Select Mode:**
- `TransformMode` type doesn't include `'select'`
- No logic to hide TransformGizmo in select mode
- Q key behavior is wrong (clears selection vs switches mode)

## Research Findings

### Pointer Lock Fallback Pattern
Need to handle case where pointer lock is unavailable or fails:
- Track last mouse position
- Calculate delta from position difference when not in pointer lock
- Still works for camera rotation, just less smooth

### Event Handling Priority
Using capture phase (`{ capture: true }`) ensures fly controls get first crack at events. The key fix is:
1. Fly controls use capture phase ✓ (already done)
2. Fly controls call `stopPropagation()` when RMB held ✓ (already done)
3. Keyboard shortcuts should verify RMB is NOT held before processing W/E/R/Q

### Solution: Shared RMB State
Export a way to check if fly controls are active from useFlyControls, or use a store flag.

## Proposed Solution

### Changes Required

1. **src/types/index.ts**
   - Add `'select'` to `TransformMode` union type

2. **src/hooks/useFlyControls.ts**
   - Add fallback for non-pointer-lock camera rotation
   - Export `isFlying` state via store or callback
   - Ensure events are properly stopped when RMB held

3. **src/hooks/useKeyboardShortcuts.ts**
   - Check fly controls state before handling W/E/R/Q
   - Change Q to set transform mode to 'select' (not clearSelection)

4. **src/stores/editorStore.ts**
   - Add `isFlying` state to track RMB mode
   - Handle 'select' as valid TransformMode

5. **src/components/editor/Viewport/Viewport.tsx**
   - Only show TransformGizmo when transformMode !== 'select'
   - Update mode label display for 'select' mode

## Open Questions
- None - requirements are clear from user's detailed context

## Scope Boundaries
- **INCLUDE**: Fix keyboard conflicts, add select mode, fix camera rotation
- **EXCLUDE**: Other viewport features, new functionality beyond UE5 parity
