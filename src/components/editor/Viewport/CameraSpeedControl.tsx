import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'

export function CameraSpeedControl() {
  const cameraSpeed = useEditorStore((state) => state.cameraSpeed)
  const setCameraSpeed = useEditorStore((state) => state.setCameraSpeed)

  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const dragStartRef = useRef<{ x: number, val: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Format speed for display
  const displaySpeed = cameraSpeed >= 10 ? cameraSpeed.toFixed(0) : cameraSpeed.toFixed(1)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return

    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, val: cameraSpeed }

    document.body.style.cursor = 'ew-resize'
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current) return

    const delta = e.clientX - dragStartRef.current.x
    // Sensitivity: move 100px to double or half the speed
    const sensitivity = 0.05
    const newVal = Math.max(0.1, Math.min(100, dragStartRef.current.val + delta * sensitivity))

    setCameraSpeed(Number(newVal.toFixed(1)))
  }, [setCameraSpeed])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    dragStartRef.current = null
    document.body.style.cursor = ''
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleClick = () => {
    if (!isDragging) {
      setIsEditing(true)
      setInputValue(String(cameraSpeed))
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }

  const handleInputBlur = () => {
    setIsEditing(false)
    let val = parseFloat(inputValue)
    if (isNaN(val)) val = cameraSpeed
    val = Math.max(0.1, Math.min(100, val))
    setCameraSpeed(val)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  return (
    <div className="absolute top-2 right-2 flex items-center gap-1">
      <div
        className="flex items-center bg-ue-bg/90 rounded border border-ue-border backdrop-blur-sm overflow-hidden transition-colors hover:border-ue-text-muted"
        title="拖动调整速度，点击输入数值"
      >
        <div className="px-2 py-1 border-r border-ue-border text-ue-text-secondary bg-ue-bg-light/50">
          <Camera size={14} />
        </div>

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="w-12 px-2 py-0.5 bg-ue-bg text-xs text-ue-text-primary outline-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div
            className="w-12 px-2 py-0.5 text-xs text-ue-text-primary cursor-ew-resize select-none text-center hover:text-ue-accent"
            onMouseDown={handleMouseDown}
            onClick={handleClick}
          >
            {displaySpeed}
          </div>
        )}
      </div>
    </div>
  )
}
