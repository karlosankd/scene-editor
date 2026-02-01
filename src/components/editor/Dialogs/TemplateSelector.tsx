import { useState } from 'react'
import { X, FileBox, Sun } from 'lucide-react'
import { useI18n } from '@/i18n'
import { templates, templateList, type LevelTemplate } from '@/data/templates'

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: LevelTemplate) => void
}

export function TemplateSelector({ isOpen, onClose, onSelect }: TemplateSelectorProps) {
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string>('basic')

  if (!isOpen) return null

  const handleCreate = () => {
    const template = templates[selectedId]
    if (template) {
      onSelect(template)
      onClose()
    }
  }

  const getTemplateIcon = (id: string) => {
    switch (id) {
      case 'empty':
        return <FileBox size={48} className="text-ue-text-muted" />
      case 'basic':
        return <Sun size={48} className="text-yellow-400" />
      default:
        return <FileBox size={48} className="text-ue-text-muted" />
    }
  }

  const getTemplateName = (template: LevelTemplate) => {
    if (template.id === 'empty') return t.template.emptyLevel
    if (template.id === 'basic') return t.template.basicLevel
    return template.id
  }

  const getTemplateDesc = (template: LevelTemplate) => {
    if (template.id === 'empty') return t.template.emptyLevelDesc
    if (template.id === 'basic') return t.template.basicLevelDesc
    return ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#1e1e1e] border border-ue-border rounded-lg shadow-2xl w-[600px] max-w-[90vw]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ue-border bg-[#252526]">
          <h2 className="text-lg font-medium text-ue-text-primary">{t.template.selectTemplate}</h2>
          <button
            onClick={onClose}
            className="p-1 text-ue-text-muted hover:text-ue-text-primary hover:bg-ue-bg-hover rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Template Grid */}
        <div className="p-4 grid grid-cols-2 gap-4 bg-[#1e1e1e]">
          {templateList.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedId(template.id)}
              className={`flex flex-col items-center p-6 rounded-lg border-2 transition-all ${
                selectedId === template.id
                  ? 'border-ue-accent-blue bg-[#0d6efd]/10'
                  : 'border-[#3a3a3a] bg-[#2d2d2d] hover:border-[#5a5a5a]'
              }`}
            >
              <div
                className="w-24 h-24 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: template.backgroundColor }}
              >
                {getTemplateIcon(template.id)}
              </div>
              <span className="text-sm font-medium text-ue-text-primary mb-1">
                {getTemplateName(template)}
              </span>
              <span className="text-xs text-ue-text-muted text-center leading-relaxed">
                {getTemplateDesc(template)}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-ue-border bg-[#252526]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-ue-text-secondary bg-ue-bg-dark border border-ue-border rounded hover:bg-ue-bg-hover"
          >
            {t.template.cancel}
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm text-white bg-ue-accent-blue rounded hover:bg-ue-accent-blue/80"
          >
            {t.template.create}
          </button>
        </div>
      </div>
    </div>
  )
}
