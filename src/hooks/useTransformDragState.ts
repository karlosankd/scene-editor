/**
 * Shared Transform Drag state for coordination between TransformControls and fly controls.
 * When TransformControls is dragging an object, we should not enter camera navigation mode.
 */

// Global state - shared across all hook instances
let isTransformDragging = false

export const transformDragState = {
  /**
   * Check if TransformControls is currently dragging
   */
  get isDragging(): boolean {
    return isTransformDragging
  },

  /**
   * Set the dragging state (called by TransformGizmo)
   */
  setDragging(value: boolean): void {
    isTransformDragging = value
  },
}
