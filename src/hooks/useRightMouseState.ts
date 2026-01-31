/**
 * Shared Right Mouse Button state for coordination between fly controls and keyboard shortcuts.
 * This module provides a global state that both useFlyControls and useKeyboardShortcuts can access
 * to determine if RMB is currently held, allowing proper UE5-style control behavior:
 * - When RMB is held: WASD/QE control camera movement
 * - When RMB is not held: W/E/R/Q switch transform modes
 */

// Global state - shared across all hook instances
let isRightMouseDown = false

// Subscribers for state changes
type Subscriber = (isDown: boolean) => void
const subscribers: Set<Subscriber> = new Set()

export const rightMouseState = {
  /**
   * Check if right mouse button is currently held
   */
  get isDown(): boolean {
    return isRightMouseDown
  },

  /**
   * Set the right mouse button state (called by useFlyControls)
   */
  setDown(value: boolean): void {
    if (isRightMouseDown !== value) {
      isRightMouseDown = value
      // Notify all subscribers
      subscribers.forEach((callback) => callback(value))
    }
  },

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(callback: Subscriber): () => void {
    subscribers.add(callback)
    return () => {
      subscribers.delete(callback)
    }
  },
}
