import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Settings,
  Move,
  Palette,
  Sun,
  Sparkles,
  ChevronDown,
  ChevronRight,
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
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  precision?: number
}

function NumberInput({ label, value, onChange, step = 0.1, min, max, precision = 3 }: NumberInputProps) {
  const [localValue, setLocalValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragStartRef = useRef<{ x: number; val: number } | null>(null)

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
    setTimeout(() => inputRef.current?.select(), 0)
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
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return

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
    <div className="flex items-center gap-1">
      <label
        className="w-6 text-xs text-ue-text-secondary cursor-ew-resize select-none hover:text-ue-accent"
        onMouseDown={handleMouseDown}
        title="拖动调整数值"
      >
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full px-1.5 py-0.5 text-xs bg-ue-bg-dark border border-ue-border rounded text-ue-text-primary focus:border-ue-accent-blue focus:outline-none text-center"
      />
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

function TransformEditor() {
  const { t } = useI18n()
  const selectedObject = useSelectedObject()
  const updateTransform = useEditorStore((state) => state.updateTransform)

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
    const newScale = [...transform.scale] as [number, number, number]
    newScale[axis] = value
    updateTransform(selectedObject.id, { scale: newScale })
  }

  return (
    <CollapsibleSection title={t.inspector.transform} icon={<Move size={14} />}>
      <div className="space-y-3">
        {/* Position */}
        <div>
          <div className="text-xs text-ue-text-muted mb-1">{t.inspector.position}</div>
          <div className="grid grid-cols-3 gap-1">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <NumberInput
                key={axis}
                label={axis}
                value={transform.position[i]}
                onChange={(v) => handlePositionChange(i, v)}
              />
            ))}
          </div>
        </div>

        {/* Rotation */}
        <div>
          <div className="text-xs text-ue-text-muted mb-1">{t.inspector.rotation}</div>
          <div className="grid grid-cols-3 gap-1">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <NumberInput
                key={axis}
                label={axis}
                value={transform.rotation[i] * (180 / Math.PI)}
                onChange={(v) => handleRotationChange(i, v)}
              />
            ))}
          </div>
        </div>

        {/* Scale */}
        <div>
          <div className="text-xs text-ue-text-muted mb-1">{t.inspector.scale}</div>
          <div className="grid grid-cols-3 gap-1">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <NumberInput
                key={axis}
                label={axis}
                value={transform.scale[i]}
                onChange={(v) => handleScaleChange(i, v)}
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

  if (!selectedObject || !selectedObject.material) return null

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

  if (!selectedObject || !selectedObject.light) return null

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
