import { describe, it, expect } from 'vitest'
import {
  filterObjects,
  flattenHierarchy,

  isDescendant,
  canReparent,
  getObjectIconType,
} from './utils'
import { createMockHierarchy } from '@/test/mocks'

describe('filterObjects', () => {
  const { objects, rootIds } = createMockHierarchy()

  describe('search query filtering', () => {
    it('returns all root objects when no filter is applied', () => {
      const result = filterObjects(objects, rootIds, {
        searchQuery: '',
        typeFilters: [],
      })

      expect(result).toContain('parent-1')
      expect(result).toContain('standalone-1')
      expect(result).toContain('particle-1')
    })

    it('filters objects by name (case insensitive)', () => {
      const result = filterObjects(objects, rootIds, {
        searchQuery: 'child',
        typeFilters: [],
      })

      expect(result).toContain('parent-1') // Has matching children
      expect(result).toContain('child-1')
      expect(result).toContain('child-2')
      expect(result).toContain('grandchild-1')
      expect(result).not.toContain('standalone-1')
      expect(result).not.toContain('particle-1')
    })

    it('handles uppercase search query', () => {
      const result = filterObjects(objects, rootIds, {
        searchQuery: 'CHILD',
        typeFilters: [],
      })

      expect(result).toContain('child-1')
      expect(result).toContain('child-2')
    })

    it('trims whitespace from search query', () => {
      const result = filterObjects(objects, rootIds, {
        searchQuery: '  standalone  ',
        typeFilters: [],
      })

      expect(result).toContain('standalone-1')
      expect(result).not.toContain('parent-1')
    })

    it('returns empty array when no matches found', () => {
      const result = filterObjects(objects, rootIds, {
        searchQuery: 'nonexistent',
        typeFilters: [],
      })

      expect(result).toHaveLength(0)
    })

    it('includes parent when child matches search', () => {
      const result = filterObjects(objects, rootIds, {
        searchQuery: 'grandchild',
        typeFilters: [],
      })

      expect(result).toContain('parent-1')
      expect(result).toContain('child-1')
      expect(result).toContain('grandchild-1')
    })
  })

  describe('type filtering', () => {
    it('filters objects by single type', () => {
      const result = filterObjects(objects, rootIds, {
        searchQuery: '',
        typeFilters: ['mesh'],
      })

      expect(result).toContain('parent-1') // Has mesh children
      expect(result).toContain('child-1')
      expect(result).toContain('standalone-1')
      expect(result).not.toContain('particle-1')
    })

    it('filters objects by multiple types', () => {
      const result = filterObjects(objects, rootIds, {
        searchQuery: '',
        typeFilters: ['light', 'camera'],
      })

      expect(result).toContain('parent-1') // Has light and camera children
      expect(result).toContain('child-1') // Has camera child
      expect(result).toContain('child-2') // Light
      expect(result).toContain('grandchild-1') // Camera
      expect(result).not.toContain('standalone-1')
      expect(result).not.toContain('particle-1')
    })

    it('filters by particle type', () => {
      const result = filterObjects(objects, rootIds, {
        searchQuery: '',
        typeFilters: ['particle'],
      })

      expect(result).toContain('particle-1')
      expect(result).not.toContain('parent-1')
      expect(result).not.toContain('standalone-1')
    })

    it('filters by group type', () => {
      const result = filterObjects(objects, rootIds, {
        searchQuery: '',
        typeFilters: ['group'],
      })

      expect(result).toContain('parent-1')
      expect(result).not.toContain('child-1')
      expect(result).not.toContain('standalone-1')
    })
  })

  describe('combined filtering', () => {
    it('applies both search and type filters', () => {
      const result = filterObjects(objects, rootIds, {
        searchQuery: 'child',
        typeFilters: ['mesh'],
      })

      expect(result).toContain('parent-1')
      expect(result).toContain('child-1')
      expect(result).not.toContain('child-2') // Light, not mesh
      expect(result).not.toContain('grandchild-1') // Camera, not mesh
    })
  })

  describe('edge cases', () => {
    it('handles empty objects', () => {
      const result = filterObjects({}, [], {
        searchQuery: 'test',
        typeFilters: [],
      })

      expect(result).toHaveLength(0)
    })

    it('handles missing object references gracefully', () => {
      const result = filterObjects(objects, ['nonexistent-id'], {
        searchQuery: '',
        typeFilters: [],
      })

      expect(result).toHaveLength(0)
    })
  })
})

describe('flattenHierarchy', () => {
  const { objects, rootIds } = createMockHierarchy()

  it('flattens hierarchy with all nodes expanded', () => {
    const expandedIds = new Set(['parent-1', 'child-1'])
    const result = flattenHierarchy(objects, rootIds, expandedIds)

    expect(result).toHaveLength(6)
    expect(result[0].object.id).toBe('parent-1')
    expect(result[0].depth).toBe(0)
    expect(result[1].object.id).toBe('child-1')
    expect(result[1].depth).toBe(1)
    expect(result[2].object.id).toBe('grandchild-1')
    expect(result[2].depth).toBe(2)
  })

  it('respects collapsed nodes', () => {
    const expandedIds = new Set<string>() // All collapsed
    const result = flattenHierarchy(objects, rootIds, expandedIds)

    expect(result).toHaveLength(3) // Only root objects
    expect(result.map((r) => r.object.id)).toEqual([
      'parent-1',
      'standalone-1',
      'particle-1',
    ])
  })

  it('assigns correct indices', () => {
    const expandedIds = new Set(['parent-1'])
    const result = flattenHierarchy(objects, rootIds, expandedIds)

    result.forEach((item, idx) => {
      expect(item.index).toBe(idx)
    })
  })

  it('respects filtered IDs when provided', () => {
    const expandedIds = new Set(['parent-1', 'child-1'])
    const filteredIds = ['parent-1', 'child-1', 'grandchild-1']
    const result = flattenHierarchy(objects, rootIds, expandedIds, filteredIds)

    expect(result).toHaveLength(3)
    expect(result.map((r) => r.object.id)).toEqual([
      'parent-1',
      'child-1',
      'grandchild-1',
    ])
  })

  it('handles empty hierarchy', () => {
    const result = flattenHierarchy({}, [], new Set())
    expect(result).toHaveLength(0)
  })
})



describe('isDescendant', () => {
  const { objects } = createMockHierarchy()

  it('returns true for direct child', () => {
    expect(isDescendant(objects, 'child-1', 'parent-1')).toBe(true)
  })

  it('returns true for nested descendant', () => {
    expect(isDescendant(objects, 'grandchild-1', 'parent-1')).toBe(true)
  })

  it('returns false for parent of ancestor', () => {
    expect(isDescendant(objects, 'parent-1', 'child-1')).toBe(false)
  })

  it('returns false for sibling', () => {
    expect(isDescendant(objects, 'child-1', 'child-2')).toBe(false)
  })

  it('returns false for unrelated objects', () => {
    expect(isDescendant(objects, 'standalone-1', 'parent-1')).toBe(false)
  })

  it('returns false for same object', () => {
    expect(isDescendant(objects, 'parent-1', 'parent-1')).toBe(false)
  })

  it('handles nonexistent objects', () => {
    expect(isDescendant(objects, 'nonexistent', 'parent-1')).toBe(false)
  })
})

describe('canReparent', () => {
  const { objects } = createMockHierarchy()

  it('allows moving to root (null parent)', () => {
    expect(canReparent(objects, 'child-1', null)).toBe(true)
  })

  it('allows moving to unrelated object', () => {
    expect(canReparent(objects, 'standalone-1', 'parent-1')).toBe(true)
  })

  it('allows moving to sibling', () => {
    expect(canReparent(objects, 'child-1', 'child-2')).toBe(true)
  })

  it('disallows moving to self', () => {
    expect(canReparent(objects, 'parent-1', 'parent-1')).toBe(false)
  })

  it('disallows moving to own descendant', () => {
    expect(canReparent(objects, 'parent-1', 'child-1')).toBe(false)
    expect(canReparent(objects, 'parent-1', 'grandchild-1')).toBe(false)
  })

  it('allows moving child to different parent', () => {
    expect(canReparent(objects, 'grandchild-1', 'child-2')).toBe(true)
  })
})

describe('getObjectIconType', () => {
  it('returns correct icon for mesh', () => {
    expect(getObjectIconType('mesh')).toBe('box')
  })

  it('returns correct icon for light', () => {
    expect(getObjectIconType('light')).toBe('sun')
  })

  it('returns correct icon for camera', () => {
    expect(getObjectIconType('camera')).toBe('camera')
  })

  it('returns correct icon for group', () => {
    expect(getObjectIconType('group')).toBe('layers')
  })

  it('returns correct icon for particle', () => {
    expect(getObjectIconType('particle')).toBe('sparkles')
  })

  it('returns box for model type', () => {
    expect(getObjectIconType('model')).toBe('box')
  })

  it('returns box for ui type', () => {
    expect(getObjectIconType('ui')).toBe('box')
  })
})
