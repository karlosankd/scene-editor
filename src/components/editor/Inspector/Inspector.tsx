import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Settings,
  Move,
  Palette,
  Sun,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
} from 'lucide-react'
import { useEditorStore, useSelectedObject } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import type { MaterialData, LightData } from '@/types'

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-ue-border">
      <button
        className="flex items-center w-full px-3 py-2 text-sm font-medium text-ue-text-primary hover:bg-ue-bg-hover"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
        <span className="mr-2">{icon}</span>
        {title}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  precision?: number
  accentColor?: 'red' | 'green' | 'blue'
  suffix?: string
}

function NumberInput({ value, onChange, step = 0.1, min, max, precision = 1, accentColor = 'blue', suffix }: NumberInputProps) {
  const [localValue, setLocalValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragStartRef = useRef<{ x: number; val: number } | null>(null)

  const accentColors = {
    red: 'border-l-red-500',
    green: 'border-l-green-500',
    blue: 'border-l-blue-500',
  }

  // Sync local value when not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value.toFixed(precision))
    }
  }, [value, isEditing, precision])

  // Parse expression and return new value
  const parseExpression = useCallback((input: string, currentVal: number): number => {
    const trimmed = input.trim()

    // Check for math operators at the start
    if (trimmed.startsWith('+')) {
      const num = parseFloat(trimmed.slice(1))
      return isNaN(num) ? currentVal : currentVal + num
    }
    if (trimmed.startsWith('-')) {
      const num = parseFloat(trimmed.slice(1))
      return isNaN(num) ? currentVal : currentVal - num
    }
    if (trimmed.startsWith('*')) {
      const num = parseFloat(trimmed.slice(1))
      return isNaN(num) ? currentVal : currentVal * num
    }
    if (trimmed.startsWith('/')) {
      const num = parseFloat(trimmed.slice(1))
      return isNaN(num) || num === 0 ? currentVal : currentVal / num
    }

    // Try to parse as a number
    const parsed = parseFloat(trimmed)
    return isNaN(parsed) ? currentVal : parsed
  }, [])

  const commitValue = useCallback(() => {
    let newValue = parseExpression(localValue, value)

    // Clamp to min/max
    if (min !== undefined) newValue = Math.max(min, newValue)
    if (max !== undefined) newValue = Math.min(max, newValue)

    onChange(newValue)
    setIsEditing(false)
    setLocalValue(newValue.toFixed(precision))
  }, [localValue, value, min, max, onChange, parseExpression, precision])

  const handleFocus = () => {
    setIsEditing(true)
    setLocalValue(value.toFixed(precision))
  }

  const handleBlur = () => {
    commitValue()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitValue()
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setLocalValue(value.toFixed(precision))
      inputRef.current?.blur()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newVal = value + step * (e.shiftKey ? 10 : 1)
      onChange(max !== undefined ? Math.min(max, newVal) : newVal)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newVal = value - step * (e.shiftKey ? 10 : 1)
      onChange(min !== undefined ? Math.max(min, newVal) : newVal)
    }
  }

  // Drag to scrub value
  const handleLabelMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, val: value }
    document.body.style.cursor = 'ew-resize'
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current) return

    const delta = e.clientX - dragStartRef.current.x
    const sensitivity = e.shiftKey ? 0.01 : 0.1
    let newVal = dragStartRef.current.val + delta * sensitivity * step

    if (min !== undefined) newVal = Math.max(min, newVal)
    if (max !== undefined) newVal = Math.min(max, newVal)

    onChange(newVal)
  }, [step, min, max, onChange])

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

  return (
    <div 
      className={`flex items-center bg-ue-bg-dark border border-ue-border border-l-2 ${accentColors[accentColor]} focus-within:border-ue-accent-blue focus-within:border-l-2 ${accentColors[accentColor]}`}
    >
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onMouseDown={handleLabelMouseDown}
        className="flex-1 w-full px-2 py-1 text-xs bg-transparent text-ue-text-primary focus:outline-none text-right cursor-ew-resize"
      />
      {suffix && (
        <span className="text-xs text-ue-text-muted pr-1.5">{suffix}</span>
      )}
    </div>
  )
}

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-20 text-xs text-ue-text-secondary">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-6 rounded cursor-pointer bg-transparent"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1 text-xs bg-ue-bg-dark border border-ue-border rounded text-ue-text-primary focus:border-ue-accent-blue focus:outline-none"
      />
    </div>
  )
}

interface SliderInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

function SliderInput({ label, value, onChange, min = 0, max = 1, step = 0.01 }: SliderInputProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-20 text-xs text-ue-text-secondary">{label}</label>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="flex-1 h-1 bg-ue-bg-dark rounded-lg appearance-none cursor-pointer accent-ue-accent-blue"
      />
      <span className="w-12 text-xs text-ue-text-secondary text-right">{value.toFixed(2)}</span>
    </div>
  )
}

type TransformLocationType = 'relative' | 'world'

interface TransformLabelDropdownProps {
  label: string
  locationType: TransformLocationType
  onLocationTypeChange: (type: TransformLocationType) => void
}

function TransformLabelDropdown({ label, locationType, onLocationTypeChange }: TransformLabelDropdownProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 min-w-[72px] px-2 py-1 text-xs text-ue-text-secondary bg-ue-bg-dark border border-ue-border hover:bg-ue-bg-hover"
      >
        <span>{label}</span>
        <ChevronDown size={12} className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 w-[120px] bg-[#2a2a2a] border border-ue-border shadow-lg">
          {/* Header */}
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-ue-border">
            <span className="text-xs text-ue-text-muted whitespace-nowrap">{label} {t.inspector.locationType}</span>
            <div className="flex-1 border-t border-ue-border" />
          </div>
          
          {/* Options */}
          <div className="py-1">
            <button
              onClick={() => { onLocationTypeChange('relative'); setIsOpen(false) }}
              className="flex items-center gap-2 w-full px-2 py-1 text-xs text-ue-text-primary hover:bg-ue-bg-hover"
            >
              <span className={`w-2 h-2 rounded-full ${locationType === 'relative' ? 'bg-white' : 'border border-ue-text-muted'}`} />
              <span>{t.inspector.relative}</span>
            </button>
            <button
              onClick={() => { onLocationTypeChange('world'); setIsOpen(false) }}
              className="flex items-center gap-2 w-full px-2 py-1 text-xs text-ue-text-primary hover:bg-ue-bg-hover"
            >
              <span className={`w-2 h-2 rounded-full ${locationType === 'world' ? 'bg-white' : 'border border-ue-text-muted'}`} />
              <span>{t.inspector.worldScene}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TransformEditor() {
  const { t } = useI18n()
  const selectedObject = useSelectedObject()
  const updateTransform = useEditorStore((state) => state.updateTransform)
  const [scaleLocked, setScaleLocked] = useState(true)
  const [positionType, setPositionType] = useState<TransformLocationType>('relative')
  const [rotationType, setRotationType] = useState<TransformLocationType>('relative')
  const [scaleType, setScaleType] = useState<TransformLocationType>('relative')

  if (!selectedObject) return null

  const { transform } = selectedObject

  const handlePositionChange = (axis: number, value: number) => {
    const newPosition = [...transform.position] as [number, number, number]
    newPosition[axis] = value
    updateTransform(selectedObject.id, { position: newPosition })
  }

  const handleRotationChange = (axis: number, value: number) => {
    const newRotation = [...transform.rotation] as [number, number, number]
    newRotation[axis] = value * (Math.PI / 180)
    updateTransform(selectedObject.id, { rotation: newRotation })
  }

  const handleScaleChange = (axis: number, value: number) => {
    if (scaleLocked) {
      // Uniform scale: apply same value to all axes
      updateTransform(selectedObject.id, { scale: [value, value, value] })
    } else {
      const newScale = [...transform.scale] as [number, number, number]
      newScale[axis] = value
      updateTransform(selectedObject.id, { scale: newScale })
    }
  }

  const axisColors: ('red' | 'green' | 'blue')[] = ['red', 'green', 'blue']

  return (
    <CollapsibleSection title={t.inspector.transform} icon={<Move size={14} />}>
      <div className="space-y-2">
        {/* Position */}
        <div className="flex items-center gap-2">
          <TransformLabelDropdown
            label={t.inspector.position}
            locationType={positionType}
            onLocationTypeChange={setPositionType}
          />
          <div className="flex-1 grid grid-cols-3 gap-1">
            {[0, 1, 2].map((i) => (
              <NumberInput
                key={i}
                value={transform.position[i]}
                onChange={(v) => handlePositionChange(i, v)}
                accentColor={axisColors[i]}
              />
            ))}
          </div>
        </div>

        {/* Rotation */}
        <div className="flex items-center gap-2">
          <TransformLabelDropdown
            label={t.inspector.rotation}
            locationType={rotationType}
            onLocationTypeChange={setRotationType}
          />
          <div className="flex-1 grid grid-cols-3 gap-1">
            {[0, 1, 2].map((i) => (
              <NumberInput
                key={i}
                value={transform.rotation[i] * (180 / Math.PI)}
                onChange={(v) => handleRotationChange(i, v)}
                accentColor={axisColors[i]}
                suffix="°"
                step={1}
              />
            ))}
          </div>
        </div>

        {/* Scale */}
        <div className="flex items-center gap-2">
          <TransformLabelDropdown
            label={t.inspector.scale}
            locationType={scaleType}
            onLocationTypeChange={setScaleType}
          />
          <button
            onClick={() => setScaleLocked(!scaleLocked)}
            className="p-1 text-ue-text-muted hover:text-ue-text-primary"
            title={scaleLocked ? '解锁统一缩放' : '锁定统一缩放'}
          >
            {scaleLocked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          <div className="flex-1 grid grid-cols-3 gap-1">
            {[0, 1, 2].map((i) => (
              <NumberInput
                key={i}
                value={transform.scale[i]}
                onChange={(v) => handleScaleChange(i, v)}
                accentColor={axisColors[i]}
                step={0.1}
              />
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

function MaterialEditor() {
  const { t } = useI18n()
  const selectedObject = useSelectedObject()
  const updateObject = useEditorStore((state) => state.updateObject)

  // Type guard: only show for mesh objects
  if (!selectedObject || selectedObject.type !== 'mesh') return null

  const { material } = selectedObject

  const handleMaterialChange = (updates: Partial<MaterialData>) => {
    updateObject(selectedObject.id, {
      material: { ...material, ...updates },
    })
  }

  return (
    <CollapsibleSection title={t.inspector.material} icon={<Palette size={14} />}>
      <div className="space-y-3">
        <ColorInput
          label={t.inspector.color}
          value={material.color}
          onChange={(color) => handleMaterialChange({ color })}
        />

        <SliderInput
          label={t.inspector.metalness}
          value={material.metalness ?? 0}
          onChange={(metalness) => handleMaterialChange({ metalness })}
        />

        <SliderInput
          label={t.inspector.roughness}
          value={material.roughness ?? 0.5}
          onChange={(roughness) => handleMaterialChange({ roughness })}
        />

        <SliderInput
          label={t.inspector.opacity}
          value={material.opacity ?? 1}
          onChange={(opacity) => handleMaterialChange({ opacity, transparent: opacity < 1 })}
        />

        {material.emissive !== undefined && (
          <>
            <ColorInput
              label={t.inspector.emissive}
              value={material.emissive || '#000000'}
              onChange={(emissive) => handleMaterialChange({ emissive })}
            />
            <SliderInput
              label={t.inspector.emissiveIntensity}
              value={material.emissiveIntensity ?? 0}
              onChange={(emissiveIntensity) => handleMaterialChange({ emissiveIntensity })}
              max={10}
            />
          </>
        )}

        <div className="flex items-center gap-2">
          <label className="w-20 text-xs text-ue-text-secondary">{t.inspector.wireframe}</label>
          <input
            type="checkbox"
            checked={material.wireframe ?? false}
            onChange={(e) => handleMaterialChange({ wireframe: e.target.checked })}
            className="accent-ue-accent-blue"
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

function LightEditor() {
  const { t } = useI18n()
  const selectedObject = useSelectedObject()
  const updateObject = useEditorStore((state) => state.updateObject)

  // Type guard: only show for light objects
  if (!selectedObject || selectedObject.type !== 'light') return null

  const { light } = selectedObject

  const handleLightChange = (updates: Partial<LightData>) => {
    updateObject(selectedObject.id, {
      light: { ...light, ...updates },
    })
  }

  return (
    <CollapsibleSection title={t.inspector.light} icon={<Sun size={14} />}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="w-20 text-xs text-ue-text-secondary">{t.inspector.type}</label>
          <span className="text-xs text-ue-text-primary capitalize">{light.type}</span>
        </div>

        <ColorInput
          label={t.inspector.color}
          value={light.color}
          onChange={(color) => handleLightChange({ color })}
        />

        <SliderInput
          label={t.inspector.intensity}
          value={light.intensity}
          onChange={(intensity) => handleLightChange({ intensity })}
          max={10}
        />

        {(light.type === 'point' || light.type === 'spot') && (
          <>
            <SliderInput
              label={t.inspector.distance}
              value={light.distance ?? 0}
              onChange={(distance) => handleLightChange({ distance })}
              max={100}
            />
            <SliderInput
              label={t.inspector.decay}
              value={light.decay ?? 2}
              onChange={(decay) => handleLightChange({ decay })}
              max={5}
            />
          </>
        )}

        {light.type === 'spot' && (
          <>
            <SliderInput
              label={t.inspector.angle}
              value={(light.angle ?? Math.PI / 6) * (180 / Math.PI)}
              onChange={(angle) => handleLightChange({ angle: angle * (Math.PI / 180) })}
              max={90}
            />
            <SliderInput
              label={t.inspector.penumbra}
              value={light.penumbra ?? 0}
              onChange={(penumbra) => handleLightChange({ penumbra })}
            />
          </>
        )}

        {light.type === 'hemisphere' && (
          <ColorInput
            label={t.inspector.groundColor}
            value={light.groundColor ?? '#000000'}
            onChange={(groundColor) => handleLightChange({ groundColor })}
          />
        )}

        {(light.type === 'directional' || light.type === 'point' || light.type === 'spot') && (
          <div className="flex items-center gap-2">
            <label className="w-20 text-xs text-ue-text-secondary">{t.inspector.castShadow}</label>
            <input
              type="checkbox"
              checked={light.castShadow ?? false}
              onChange={(e) => handleLightChange({ castShadow: e.target.checked })}
              className="accent-ue-accent-blue"
            />
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

function PostProcessingEditor() {
  const { t } = useI18n()
  const postProcessing = useEditorStore((state) => state.postProcessing)
  const updatePostProcessing = useEditorStore((state) => state.updatePostProcessing)

  return (
    <CollapsibleSection title={t.inspector.postProcessing} icon={<Sparkles size={14} />} defaultOpen={false}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="w-20 text-xs text-ue-text-secondary">{t.inspector.enabled}</label>
          <input
            type="checkbox"
            checked={postProcessing.enabled}
            onChange={(e) => updatePostProcessing({ enabled: e.target.checked })}
            className="accent-ue-accent-blue"
          />
        </div>

        {postProcessing.enabled && (
          <>
            {/* Bloom */}
            <div className="pl-2 border-l-2 border-ue-border">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={postProcessing.bloom.enabled}
                  onChange={(e) => updatePostProcessing({ bloom: { ...postProcessing.bloom, enabled: e.target.checked } })}
                  className="accent-ue-accent-blue"
                />
                <span className="text-xs text-ue-text-primary">{t.inspector.bloom}</span>
              </div>
              {postProcessing.bloom.enabled && (
                <div className="space-y-2">
                  <SliderInput
                    label={t.inspector.intensity}
                    value={postProcessing.bloom.intensity}
                    onChange={(intensity) => updatePostProcessing({ bloom: { ...postProcessing.bloom, intensity } })}
                    max={5}
                  />
                  <SliderInput
                    label={t.inspector.threshold}
                    value={postProcessing.bloom.threshold}
                    onChange={(threshold) => updatePostProcessing({ bloom: { ...postProcessing.bloom, threshold } })}
                  />
                </div>
              )}
            </div>

            {/* SSAO */}
            <div className="pl-2 border-l-2 border-ue-border">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={postProcessing.ssao.enabled}
                  onChange={(e) => updatePostProcessing({ ssao: { ...postProcessing.ssao, enabled: e.target.checked } })}
                  className="accent-ue-accent-blue"
                />
                <span className="text-xs text-ue-text-primary">{t.inspector.ssao}</span>
              </div>
              {postProcessing.ssao.enabled && (
                <div className="space-y-2">
                  <SliderInput
                    label={t.inspector.radius}
                    value={postProcessing.ssao.radius}
                    onChange={(radius) => updatePostProcessing({ ssao: { ...postProcessing.ssao, radius } })}
                    max={2}
                  />
                  <SliderInput
                    label={t.inspector.intensity}
                    value={postProcessing.ssao.intensity}
                    onChange={(intensity) => updatePostProcessing({ ssao: { ...postProcessing.ssao, intensity } })}
                    max={5}
                  />
                </div>
              )}
            </div>

            {/* DOF */}
            <div className="pl-2 border-l-2 border-ue-border">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={postProcessing.dof.enabled}
                  onChange={(e) => updatePostProcessing({ dof: { ...postProcessing.dof, enabled: e.target.checked } })}
                  className="accent-ue-accent-blue"
                />
                <span className="text-xs text-ue-text-primary">{t.inspector.dof}</span>
              </div>
              {postProcessing.dof.enabled && (
                <div className="space-y-2">
                  <SliderInput
                    label={t.inspector.focusDistance}
                    value={postProcessing.dof.focusDistance}
                    onChange={(focusDistance) => updatePostProcessing({ dof: { ...postProcessing.dof, focusDistance } })}
                    max={50}
                  />
                  <SliderInput
                    label={t.inspector.focalLength}
                    value={postProcessing.dof.focalLength}
                    onChange={(focalLength) => updatePostProcessing({ dof: { ...postProcessing.dof, focalLength } })}
                    max={100}
                  />
                </div>
              )}
            </div>

            {/* Vignette */}
            <div className="pl-2 border-l-2 border-ue-border">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={postProcessing.vignette.enabled}
                  onChange={(e) => updatePostProcessing({ vignette: { ...postProcessing.vignette, enabled: e.target.checked } })}
                  className="accent-ue-accent-blue"
                />
                <span className="text-xs text-ue-text-primary">{t.inspector.vignette}</span>
              </div>
              {postProcessing.vignette.enabled && (
                <div className="space-y-2">
                  <SliderInput
                    label={t.inspector.offset}
                    value={postProcessing.vignette.offset}
                    onChange={(offset) => updatePostProcessing({ vignette: { ...postProcessing.vignette, offset } })}
                  />
                  <SliderInput
                    label={t.inspector.darkness}
                    value={postProcessing.vignette.darkness}
                    onChange={(darkness) => updatePostProcessing({ vignette: { ...postProcessing.vignette, darkness } })}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </CollapsibleSection>
  )
}

export function Inspector() {
  const { t } = useI18n()
  const selectedObject = useSelectedObject()

  return (
    <div className="flex flex-col h-full bg-ue-bg">
      {/* Header */}
      <div className="flex items-center h-8 px-3 bg-ue-bg-light border-b border-ue-border">
        <Settings size={14} className="mr-2 text-ue-text-secondary" />
        <span className="text-sm font-medium text-ue-text-primary">{t.inspector.title}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {selectedObject ? (
          <>
            {/* Object Header */}
            <div className="px-3 py-2 border-b border-ue-border">
              <input
                type="text"
                value={selectedObject.name}
                onChange={(e) => {
                  useEditorStore.getState().updateObject(selectedObject.id, { name: e.target.value })
                }}
                className="w-full px-2 py-1 text-sm bg-ue-bg-dark border border-ue-border rounded text-ue-text-primary focus:border-ue-accent-blue focus:outline-none"
              />
              <div className="mt-1 text-xs text-ue-text-muted capitalize">
                {t.inspector.type}: {selectedObject.type}
              </div>
            </div>

            {/* Editors */}
            <TransformEditor />
            {selectedObject.type === 'mesh' && <MaterialEditor />}
            {selectedObject.type === 'light' && <LightEditor />}
            <PostProcessingEditor />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-ue-text-muted text-sm">
            <Settings size={32} className="mb-2 opacity-50" />
            <span>{t.inspector.noSelection}</span>
          </div>
        )}
      </div>
    </div>
  )
}
