import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useState, useEffect } from 'react'
import { MenuBar } from './MenuBar/MenuBar'
import { Toolbar } from './Toolbar/Toolbar'
import { Hierarchy } from './Hierarchy/Hierarchy'
import { Viewport } from './Viewport/Viewport'
import { Inspector } from './Inspector/Inspector'

import { Timeline } from './Timeline/Timeline'
import { TemplateSelector } from './Dialogs/TemplateSelector'
import { useEditorStore } from '@/stores/editorStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { templates, type LevelTemplate } from '@/data/templates'

export function EditorLayout() {
  const panels = useEditorStore((state) => state.panels)
  const newProject = useEditorStore((state) => state.newProject)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  useEffect(() => {
    // Initialize with basic template on first load
    newProject('Untitled Project', templates.basic)
  }, [newProject])

  const handleNewProject = () => {
    setShowTemplateSelector(true)
  }

  const handleTemplateSelect = (template: LevelTemplate) => {
    newProject('Untitled Project', template)
    setShowTemplateSelector(false)
  }

  return (
    <div className="flex flex-col w-full h-full bg-ue-bg-dark">
      <MenuBar onNewProject={handleNewProject} />
      <Toolbar />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Hierarchy */}
          {panels.hierarchy && (
            <>
              <Panel defaultSize={15} minSize={10} maxSize={30}>
                <Hierarchy />
              </Panel>
              <PanelResizeHandle className="w-1 bg-ue-border hover:bg-ue-accent-blue transition-colors" />
            </>
          )}

          {/* Center - Viewport & Timeline */}
          <Panel defaultSize={55} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={panels.timeline ? 75 : 100} minSize={30}>
                <Viewport />
              </Panel>

              {panels.timeline && (
                <>
                  <PanelResizeHandle className="h-1 bg-ue-border hover:bg-ue-accent-blue transition-colors" />
                  <Panel defaultSize={25} minSize={15} maxSize={50}>
                    <Timeline />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          {/* Right Panel - Inspector & Assets */}
          {(panels.inspector || panels.assets) && (
            <>
              <PanelResizeHandle className="w-1 bg-ue-border hover:bg-ue-accent-blue transition-colors" />
              <Panel defaultSize={20} minSize={15} maxSize={40}>
                <PanelGroup direction="vertical">
                  {panels.inspector && (
                    <Panel defaultSize={100} minSize={20}>
                      <Inspector />
                    </Panel>
                  )}


                </PanelGroup>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Template Selection Dialog */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  )
}
