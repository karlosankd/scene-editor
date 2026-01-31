export const GIZMO_COLORS = {
  X: '#e63946',  // UE5 style red
  Y: '#6ab04c',  // UE5 style green  
  Z: '#4a90d9',  // UE5 style blue
  HOVER: '#ffff00',
  WHITE: '#ffffff',
  GRAY: '#808080',
  PLANE_X: '#ff444480', // Transparent for planes
  PLANE_Y: '#44ff4480',
  PLANE_Z: '#4444ff80',
}

export const GIZMO_SIZES = {
  // Translate - UE5 style thinner arrows
  ARROW_LENGTH: 1.0,
  ARROW_RADIUS: 0.02,
  CONE_HEIGHT: 0.25,
  CONE_RADIUS: 0.08,
  PLANE_SIZE: 0.25,
  PLANE_OFFSET: 0.35,
  CENTER_BOX: 0.12,

  // Rotate
  RING_RADIUS: 1.2,
  RING_TUBE: 0.03,
  
  // Scale
  SCALE_LINE_LENGTH: 1.0,
  SCALE_BOX_SIZE: 0.1,
  
  // General
  HIT_RADIUS: 0.15, // Increased radius for easier clicking
}

export type Axis = 'X' | 'Y' | 'Z' | 'XY' | 'XZ' | 'YZ' | 'XYZ' | null
