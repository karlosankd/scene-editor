import { useEffect, useRef } from 'react'

interface InlineRenameInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export function InlineRenameInput({
  value,
  onChange,
  onSubmit,
  onCancel,
}: InlineRenameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      onSubmit()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onSubmit}
      className="flex-1 px-1 py-0 text-sm bg-ue-bg-dark border border-ue-accent-blue rounded text-ue-text-primary focus:outline-none min-w-0"
      onClick={(e) => e.stopPropagation()}
    />
  )
}
