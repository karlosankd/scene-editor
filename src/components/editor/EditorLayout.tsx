import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { MenuBar } from './MenuBar/MenuBar'
import { Toolbar } from './Toolbar/Toolbar'
import { Hierarchy } from './Hierarchy/Hierarchy'
import { Viewport } from './Viewport/Viewport'
import { Inspector } from './Inspector/Inspector'
import { Assets } from './Assets/Assets'
import { Timeline } from './Timeline/Timeline'
import { useEditorStore } from '@/stores/editorStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useEffect } from 'react'

export function EditorLayout() {
  const panels = useEditorStore((state) => state.panels)
  const newProject = useEditorStore((state) => state.newProject)

  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  useEffect(() => {
    // Initialize with a new project
    newProject('Untitled Project')
  }, [newProject])

  return (
    <div className="flex flex-col w-full h-full bg-ue-bg-dark">
      <MenuBar />
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
                    <Panel defaultSize={60} minSize={20}>
                      <Inspector />
                    </Panel>
                  )}

                  {panels.inspector && panels.assets && (
                    <PanelResizeHandle className="h-1 bg-ue-border hover:bg-ue-accent-blue transition-colors" />
                  )}

                  {panels.assets && (
                    <Panel defaultSize={40} minSize={20}>
                      <Assets />
                    </Panel>
                  )}
                </PanelGroup>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  )
}
