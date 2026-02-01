import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Box,
  ChevronDown,
  Plus,
  Sun,
  Layers,
  Sparkles,
  Cloud,
  Zap,
  Search,
  Download,
  Play,
  ChevronRight,
  GripHorizontal
} from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import type { ObjectType } from '@/types'

// Mock Recent Items
const MOCK_RECENT_ITEMS = [
  { label: 'Cube', icon: Box, actionType: 'mesh', actionName: 'Cube', extras: { geometry: { type: 'box', width: 1, height: 1, depth: 1 } } },
  { label: 'Empty Actor', icon: Layers, actionType: 'group', actionName: 'Actor', extras: {} }
]

export function AddObjectMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [flyoutPosition, setFlyoutPosition] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()
  const addObject = useEditorStore((state) => state.addObject)

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      // Check if click is inside menu OR inside the portal flyout
      const target = e.target as HTMLElement
      const isFlyout = target.closest('.flyout-menu')
      
      if (menuRef.current && !menuRef.current.contains(target) && !isFlyout) {
        setIsOpen(false)
        setHoveredCategory(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Helper to create objects
  const createObject = (
    type: ObjectType,
    name: string,
    extras: Record<string, any> = {}
  ) => {
    addObject({
      name,
      type,
      ...extras,
    })
    setIsOpen(false)
    setHoveredCategory(null)
  }

  // Handle Mouse Enter for Categories
  const handleCategoryMouseEnter = (e: React.MouseEvent, categoryLabel: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setFlyoutPosition({ x: rect.right, y: rect.top })
    setHoveredCategory(categoryLabel)
  }

  // --- Menu Data Structure ---
  const sectionGetContent = [
    {
      label: t.addMenu.importContent,
      icon: Download,
      action: () => { alert('Import feature to be implemented') },
    }
  ]

  const sectionPlaceActor = [
    {
      label: t.addMenu.categories.basic,
      icon: Layers, 
      children: [
        { label: t.addMenu.items.emptyActor, icon: Layers, action: () => createObject('group', 'Actor') },
        { label: t.addMenu.items.character, icon: Layers, action: () => createObject('group', 'Character') },
        { label: t.addMenu.items.pawn, icon: Layers, action: () => createObject('group', 'Pawn') },
        { label: t.addMenu.items.pointLight, icon: Zap, action: () => createObject('light', 'PointLight', { light: { type: 'point', color: '#ffffff', intensity: 1, distance: 10, decay: 2 } }) },
        { label: t.addMenu.items.playerStart, icon: Play, action: () => createObject('group', 'PlayerStart', { userData: { isPlayerStart: true } }) },
        { label: t.addMenu.items.boxTrigger, icon: Box, action: () => createObject('group', 'BoxTrigger') },
        { label: t.addMenu.items.sphereTrigger, icon: Box, action: () => createObject('group', 'SphereTrigger') },
      ]
    },
    {
      label: t.addMenu.categories.lights,
      icon: Sun,
      children: [
        { label: t.addMenu.items.directionalLight, icon: Sun, action: () => createObject('light', 'DirectionalLight', { light: { type: 'directional', color: '#ffffff', intensity: 1, castShadow: true } }) },
        { label: t.addMenu.items.pointLight, icon: Zap, action: () => createObject('light', 'PointLight', { light: { type: 'point', color: '#ffffff', intensity: 1, distance: 10, decay: 2 } }) },
        { label: t.addMenu.items.spotLight, icon: Zap, action: () => createObject('light', 'SpotLight', { light: { type: 'spot', color: '#ffffff', intensity: 1, distance: 20, angle: 0.5, penumbra: 0.5 } }) },
        { label: t.addMenu.items.skyLight, icon: Cloud, action: () => createObject('light', 'SkyLight', { light: { type: 'hemisphere', color: '#87ceeb', groundColor: '#3d3d3d', intensity: 0.6 } }) },
      ]
    },
    {
      label: t.addMenu.categories.shapes,
      icon: Box,
      children: [
        { label: t.addMenu.items.cube, icon: Box, action: () => createObject('mesh', 'Cube', { geometry: { type: 'box', width: 1, height: 1, depth: 1 } }) },
        { label: t.addMenu.items.sphere, icon: Box, action: () => createObject('mesh', 'Sphere', { geometry: { type: 'sphere', radius: 0.5 } }) },
        { label: t.addMenu.items.cylinder, icon: Box, action: () => createObject('mesh', 'Cylinder', { geometry: { type: 'cylinder', radiusTop: 0.5, radiusBottom: 0.5, height: 1 } }) },
        { label: t.addMenu.items.cone, icon: Box, action: () => createObject('mesh', 'Cone', { geometry: { type: 'cone', radius: 0.5, height: 1 } }) },
        { label: t.addMenu.items.plane, icon: Box, action: () => createObject('mesh', 'Plane', { geometry: { type: 'plane', width: 10, height: 10 } }) },
      ]
    },
    {
      label: t.addMenu.categories.visualEffects,
      icon: Sparkles,
      children: [
        { label: t.addMenu.items.postProcessVolume, icon: Box, action: () => createObject('group', 'PostProcessVolume') },
        { label: t.addMenu.items.skyAtmosphere, icon: Cloud, action: () => createObject('sky', 'SkyAtmosphere', { sky: { sunPosition: [100, 20, 100], turbidity: 0.5, rayleigh: 0.5, mieCoefficient: 0.003, mieDirectionalG: 0.8, inclination: 0.49, azimuth: 0.25 } }) },
        { label: t.addMenu.items.volumetricCloud, icon: Cloud, action: () => createObject('cloud', 'VolumetricClouds', { cloud: { opacity: 0.5, speed: 0.4, width: 20, depth: 5, segments: 20, color: '#ffffff' } }) },
        { label: t.addMenu.items.exponentialHeightFog, icon: Cloud, action: () => createObject('fog', 'HeightFog', { fog: { type: 'exponential', color: '#87ceeb', density: 0.0002 } }) },
        { label: t.addMenu.items.decal, icon: GripHorizontal, action: () => createObject('group', 'Decal') },
      ]
    }
  ]

  const allItems = [
    ...sectionGetContent.map(i => ({ ...i, category: t.addMenu.getContent })),
    ...sectionPlaceActor.flatMap(cat => cat.children ? cat.children.map(i => ({ ...i, category: cat.label })) : [])
  ]
  
  const filteredItems = searchTerm
    ? allItems.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  const activeCategory = sectionPlaceActor.find(c => c.label === hoveredCategory)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); if(!isOpen) setHoveredCategory(null); }}
        className={`
          flex items-center gap-1 h-8 px-2 rounded
          border border-transparent hover:bg-ue-bg-hover
          ${isOpen ? 'bg-ue-bg-hover' : ''}
          transition-colors
        `}
        title="Place Actors"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Box size={20} className="text-[#d4d4d4]" />
          <div className="absolute -bottom-1 -right-1 bg-[#4d4d4d] rounded-full p-[1px] border border-[#252526]">
            <Plus size={8} className="text-[#87d287]" strokeWidth={4} />
          </div>
        </div>
        <ChevronDown size={12} className="text-[#808080] ml-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[260px] bg-[#252526] border border-[#3e3e42] rounded shadow-xl z-50 text-[#d4d4d4] flex flex-col max-h-[600px] select-none">
          {/* Search */}
          <div className="p-2 border-b border-[#3e3e42]">
            <div className="relative">
              <input
                type="text"
                placeholder={t.addMenu.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-full px-3 py-1.5 text-xs text-[#d4d4d4] pl-8 focus:outline-none focus:border-[#007fd4]"
                autoFocus
              />
              <Search size={14} className="absolute left-2.5 top-1.5 text-[#808080]" />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {searchTerm ? (
              // Search Results
              <div className="flex flex-col py-1">
                 {filteredItems.map((item, idx) => (
                   <button
                     key={idx}
                     onClick={item.action}
                     className="flex items-center gap-3 px-4 py-2 hover:bg-[#007fd4] hover:text-white text-left group"
                   >
                     <item.icon size={16} className="text-[#a0a0a0] group-hover:text-white" />
                     <span className="text-sm">{item.label}</span>
                     <span className="text-xs text-[#808080] ml-auto group-hover:text-white/80">{item.category}</span>
                   </button>
                 ))}
                 {filteredItems.length === 0 && (
                  <div className="px-4 py-2 text-xs text-[#808080]">{t.addMenu.noResults}</div>
                 )}
              </div>
            ) : (
              // Main Menu Structure
              <div className="flex flex-col pb-2">
                
                {/* Section 1: Get Content */}
                <div className="px-4 py-2 mt-1">
                  <div className="text-[10px] font-bold text-[#606060] uppercase tracking-wider mb-1 border-b border-[#3e3e42] pb-1">
                    {t.addMenu.getContent}
                  </div>
                  {sectionGetContent.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-2 py-1.5 hover:bg-[#3e3e42] text-left rounded"
                    >
                      <item.icon size={16} className="text-[#a0a0a0]" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Section 2: Place Actor */}
                <div className="px-4 py-1">
                  <div className="text-[10px] font-bold text-[#606060] uppercase tracking-wider mb-1 border-b border-[#3e3e42] pb-1">
                    {t.addMenu.placeActor}
                  </div>
                  <div className="relative">
                    {sectionPlaceActor.map((category, idx) => (
                      <div 
                        key={idx} 
                        className={`group relative flex items-center justify-between px-2 py-1.5 cursor-pointer rounded ${hoveredCategory === category.label ? 'bg-[#007fd4] text-white' : 'hover:bg-[#3e3e42]'}`}
                        onMouseEnter={(e) => handleCategoryMouseEnter(e, category.label)}
                      >
                        <div className="flex items-center gap-3 pointer-events-none">
                          <category.icon size={16} className={hoveredCategory === category.label ? 'text-white' : 'text-[#a0a0a0]'} />
                          <span className="text-sm">{category.label}</span>
                        </div>
                        <ChevronRight size={14} className={hoveredCategory === category.label ? 'text-white' : 'text-[#808080]'} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Recent */}
                <div className="px-4 py-2 mt-1">
                   <div className="text-[10px] font-bold text-[#606060] uppercase tracking-wider mb-1 border-b border-[#3e3e42] pb-1">
                    {t.addMenu.recent}
                  </div>
                  {MOCK_RECENT_ITEMS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => createObject(item.actionType as any, item.actionName, item.extras)}
                      className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[#3e3e42] text-left rounded"
                    >
                      <div className="flex items-center gap-3">
                         <item.icon size={16} className="text-[#a0a0a0]" />
                         <span className="text-sm">{item.label}</span>
                      </div>
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-[#808080] rounded-full" />
                        <div className="w-1 h-1 bg-[#808080] rounded-full" />
                        <div className="w-1 h-1 bg-[#808080] rounded-full" />
                      </div>
                    </button>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Flyout Menu Portal */}
      {hoveredCategory && flyoutPosition && activeCategory && createPortal(
        <div 
          className="flyout-menu fixed bg-[#252526] border border-[#3e3e42] rounded shadow-xl z-[9999] flex flex-col py-1 w-[200px]"
          style={{ 
            left: flyoutPosition.x + 4, 
            top: flyoutPosition.y - 4 
          }}
          onMouseEnter={() => setHoveredCategory(activeCategory.label)} // Keep open when hovering flyout
          onMouseLeave={() => setHoveredCategory(null)}
        >
          {activeCategory.children.map((child, cIdx) => (
            <button
              key={cIdx}
              onClick={(e) => {
                e.stopPropagation();
                child.action(); 
                setIsOpen(false); 
                setHoveredCategory(null);
              }}
              className="flex items-center justify-between px-3 py-1.5 hover:bg-[#007fd4] hover:text-white text-left group/item"
            >
              <div className="flex items-center gap-2">
                <child.icon size={14} className="text-[#a0a0a0] group-hover/item:text-white" />
                <span className="text-sm">{child.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-0.5 opacity-0 group-hover/item:opacity-100">
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
