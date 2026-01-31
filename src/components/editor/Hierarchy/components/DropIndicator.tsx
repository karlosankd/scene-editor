interface DropIndicatorProps {
  position: 'before' | 'after' | 'inside'
  depth: number
}

export function DropIndicator({ position, depth }: DropIndicatorProps) {
  if (position === 'inside') {
    return null // Inside indicator is handled by HierarchyItem border
  }

  const leftOffset = depth * 16 + 4

  return (
    <div
      className={`absolute left-0 right-0 h-0.5 bg-ue-accent-blue pointer-events-none z-10 ${
        position === 'before' ? 'top-0' : 'bottom-0'
      }`}
      style={{ marginLeft: `${leftOffset}px` }}
    />
  )
}
