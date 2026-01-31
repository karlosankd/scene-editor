import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Hierarchy } from './Hierarchy'
import { useEditorStore } from '@/stores/editorStore'
import { createMockHierarchy } from '@/test/mocks'

// Mock the store
vi.mock('@/stores/editorStore', async () => {
  const actual = await vi.importActual('@/stores/editorStore')
  return {
    ...actual,
    useEditorStore: vi.fn(),
    useRootObjects: vi.fn(),
  }
})

// Mock i18n
vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: {
      hierarchy: {
        title: 'Hierarchy',
        noObjects: 'No objects in scene',
        addHint: 'Use Add menu to create objects',
        search: 'Search...',
        filterByType: 'Filter by type',
      },
      edit: {
        delete: 'Delete',
        duplicate: 'Duplicate',
        rename: 'Rename',
      },
    },
  }),
}))

describe('Hierarchy Component', () => {
  const mockSelectObject = vi.fn()
  const mockDeselectObject = vi.fn()
  const mockClearSelection = vi.fn()
  const mockRemoveObject = vi.fn()
  const mockDuplicateObject = vi.fn()
  const mockUpdateObject = vi.fn()
  const mockReparentObject = vi.fn()

  const { objects, rootIds } = createMockHierarchy()

  const createMockStore = (overrides = {}) => ({
    objects,
    rootObjectIds: rootIds,
    selectedIds: [],
    hoveredId: null,
    selectObject: mockSelectObject,
    deselectObject: mockDeselectObject,
    clearSelection: mockClearSelection,
    removeObject: mockRemoveObject,
    duplicateObject: mockDuplicateObject,
    updateObject: mockUpdateObject,
    reparentObject: mockReparentObject,
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    const mockStore = createMockStore()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore as never)
      }
      return mockStore as never
    })
  })

  describe('rendering', () => {
    it('renders the hierarchy panel with title', () => {
      render(<Hierarchy />)
      expect(screen.getByText('Hierarchy')).toBeInTheDocument()
    })

    it('renders empty state when no objects', () => {
      const mockStore = createMockStore({ objects: {}, rootObjectIds: [] })
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector(mockStore as never)
        }
        return mockStore as never
      })

      render(<Hierarchy />)
      expect(screen.getByText('No objects in scene')).toBeInTheDocument()
    })

    it('renders all root objects', () => {
      render(<Hierarchy />)
      expect(screen.getByText('Parent Object')).toBeInTheDocument()
      expect(screen.getByText('Standalone Mesh')).toBeInTheDocument()
      expect(screen.getByText('Particle Effect')).toBeInTheDocument()
    })

    it('renders search input', () => {
      render(<Hierarchy />)
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })

    it('renders type filter buttons', () => {
      render(<Hierarchy />)
      expect(screen.getByTestId('filter-mesh')).toBeInTheDocument()
      expect(screen.getByTestId('filter-light')).toBeInTheDocument()
      expect(screen.getByTestId('filter-camera')).toBeInTheDocument()
      expect(screen.getByTestId('filter-group')).toBeInTheDocument()
      expect(screen.getByTestId('filter-particle')).toBeInTheDocument()
    })
  })

  describe('search functionality', () => {
    it('filters objects by search query', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const searchInput = screen.getByPlaceholderText('Search...')
      await user.type(searchInput, 'child')

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument()
        expect(screen.getByText('Child Two')).toBeInTheDocument()
      })
    })

    it('shows no results when search has no matches', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const searchInput = screen.getByPlaceholderText('Search...')
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.queryByText('Parent Object')).not.toBeInTheDocument()
        expect(screen.queryByText('Standalone Mesh')).not.toBeInTheDocument()
      })
    })

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const searchInput = screen.getByPlaceholderText('Search...')
      await user.type(searchInput, 'child')

      const clearButton = screen.getByTestId('clear-search')
      await user.click(clearButton)

      expect(searchInput).toHaveValue('')
    })
  })

  describe('type filtering', () => {
    it('filters by mesh type when mesh filter is clicked', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const meshFilter = screen.getByTestId('filter-mesh')
      await user.click(meshFilter)

      await waitFor(() => {
        expect(screen.getByText('Standalone Mesh')).toBeInTheDocument()
        expect(screen.queryByText('Particle Effect')).not.toBeInTheDocument()
      })
    })

    it('allows multiple type filters', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      await user.click(screen.getByTestId('filter-light'))
      await user.click(screen.getByTestId('filter-camera'))

      await waitFor(() => {
        expect(screen.getByText('Child Two')).toBeInTheDocument()
      })
    })

    it('toggles filter off when clicked again', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const meshFilter = screen.getByTestId('filter-mesh')
      await user.click(meshFilter)
      await user.click(meshFilter)

      await waitFor(() => {
        expect(screen.getByText('Parent Object')).toBeInTheDocument()
        expect(screen.getByText('Particle Effect')).toBeInTheDocument()
      })
    })
  })

  describe('selection', () => {
    it('calls selectObject when item is clicked', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      await user.click(screen.getByText('Parent Object'))

      expect(mockSelectObject).toHaveBeenCalledWith('parent-1', false)
    })

    it('calls selectObject with additive=true when Ctrl+click', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      await user.keyboard('{Control>}')
      await user.click(screen.getByText('Parent Object'))
      await user.keyboard('{/Control}')

      expect(mockSelectObject).toHaveBeenCalledWith('parent-1', true)
    })

    it('highlights selected objects', () => {
      const mockStore = createMockStore({ selectedIds: ['parent-1'] })
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector(mockStore as never)
        }
        return mockStore as never
      })

      render(<Hierarchy />)

      const parentItem = screen.getByTestId('hierarchy-item-parent-1')
      expect(parentItem).toHaveClass('bg-ue-accent-blue')
    })

    it('clears selection when clicking empty area', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const treeContainer = screen.getByTestId('hierarchy-tree')
      await user.click(treeContainer)

      expect(mockClearSelection).toHaveBeenCalled()
    })
  })

  describe('shift-click range selection', () => {
    it('selects range of objects on shift+click', async () => {
      const mockStore = createMockStore({ selectedIds: ['parent-1'] })
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector(mockStore as never)
        }
        return mockStore as never
      })

      const user = userEvent.setup()
      render(<Hierarchy />)

      // Shift+click on standalone-1
      await user.keyboard('{Shift>}')
      await user.click(screen.getByText('Standalone Mesh'))
      await user.keyboard('{/Shift}')

      // Should select all items between parent-1 and standalone-1
      expect(mockSelectObject).toHaveBeenCalled()
    })
  })

  describe('expand/collapse', () => {
    it('expands collapsed parent when arrow is clicked', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      // Initially children should be visible (default expanded)
      expect(screen.getByText('Child One')).toBeInTheDocument()

      // Click collapse button
      const collapseButton = screen.getByTestId('toggle-parent-1')
      await user.click(collapseButton)

      await waitFor(() => {
        expect(screen.queryByText('Child One')).not.toBeInTheDocument()
      })
    })

    it('shows expand arrow for objects with children', () => {
      render(<Hierarchy />)

      expect(screen.getByTestId('toggle-parent-1')).toBeInTheDocument()
      expect(screen.queryByTestId('toggle-standalone-1')).not.toBeInTheDocument()
    })
  })

  describe('context menu', () => {
    it('opens context menu on right-click', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const item = screen.getByText('Parent Object')
      await user.pointer({ keys: '[MouseRight]', target: item })

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument()
        expect(screen.getByText('Duplicate')).toBeInTheDocument()
        expect(screen.getByText('Rename')).toBeInTheDocument()
      })
    })

    it('calls removeObject when delete is clicked', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const item = screen.getByText('Parent Object')
      await user.pointer({ keys: '[MouseRight]', target: item })

      await user.click(screen.getByText('Delete'))

      expect(mockRemoveObject).toHaveBeenCalledWith('parent-1')
    })

    it('calls duplicateObject when duplicate is clicked', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const item = screen.getByText('Parent Object')
      await user.pointer({ keys: '[MouseRight]', target: item })

      await user.click(screen.getByText('Duplicate'))

      expect(mockDuplicateObject).toHaveBeenCalledWith('parent-1')
    })

    it('starts rename when rename is clicked', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const item = screen.getByText('Parent Object')
      await user.pointer({ keys: '[MouseRight]', target: item })

      await user.click(screen.getByText('Rename'))

      await waitFor(() => {
        expect(screen.getByTestId('rename-input')).toBeInTheDocument()
      })
    })

    it('closes context menu when clicking outside', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const item = screen.getByText('Parent Object')
      await user.pointer({ keys: '[MouseRight]', target: item })

      expect(screen.getByText('Delete')).toBeInTheDocument()

      // Click outside
      await user.click(document.body)

      await waitFor(() => {
        expect(screen.queryByText('Delete')).not.toBeInTheDocument()
      })
    })
  })

  describe('inline renaming', () => {
    it('starts rename on F2 key when object is selected', async () => {
      const mockStore = createMockStore({ selectedIds: ['parent-1'] })
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector(mockStore as never)
        }
        return mockStore as never
      })

      const user = userEvent.setup()
      render(<Hierarchy />)

      await user.keyboard('{F2}')

      await waitFor(() => {
        expect(screen.getByTestId('rename-input')).toBeInTheDocument()
      })
    })

    it('starts rename on double-click', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const item = screen.getByText('Parent Object')
      await user.dblClick(item)

      await waitFor(() => {
        expect(screen.getByTestId('rename-input')).toBeInTheDocument()
      })
    })

    it('submits rename on Enter', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      // Start rename
      const item = screen.getByText('Parent Object')
      await user.dblClick(item)

      const input = screen.getByTestId('rename-input')
      await user.clear(input)
      await user.type(input, 'New Name')
      await user.keyboard('{Enter}')

      expect(mockUpdateObject).toHaveBeenCalledWith('parent-1', { name: 'New Name' })
    })

    it('cancels rename on Escape', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const item = screen.getByText('Parent Object')
      await user.dblClick(item)

      const input = screen.getByTestId('rename-input')
      await user.type(input, 'New Name')
      await user.keyboard('{Escape}')

      expect(mockUpdateObject).not.toHaveBeenCalled()
      expect(screen.queryByTestId('rename-input')).not.toBeInTheDocument()
    })

    it('submits rename on blur', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const item = screen.getByText('Parent Object')
      await user.dblClick(item)

      const input = screen.getByTestId('rename-input')
      await user.clear(input)
      await user.type(input, 'New Name')
      await user.tab()

      expect(mockUpdateObject).toHaveBeenCalledWith('parent-1', { name: 'New Name' })
    })

    it('does not submit empty name', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const item = screen.getByText('Parent Object')
      await user.dblClick(item)

      const input = screen.getByTestId('rename-input')
      await user.clear(input)
      await user.keyboard('{Enter}')

      expect(mockUpdateObject).not.toHaveBeenCalled()
    })
  })

  describe('drag and drop', () => {
    it('allows dragging objects', async () => {
      render(<Hierarchy />)

      const item = screen.getByTestId('hierarchy-item-standalone-1')
      expect(item).toHaveAttribute('draggable', 'true')
    })

    it('shows drop indicator when dragging over valid target', async () => {
      render(<Hierarchy />)

      const source = screen.getByTestId('hierarchy-item-standalone-1')
      const target = screen.getByTestId('hierarchy-item-parent-1')

      fireEvent.dragStart(source)
      fireEvent.dragOver(target)

      await waitFor(() => {
        expect(target).toHaveClass('drop-target')
      })
    })

    it('calls reparentObject on drop', async () => {
      render(<Hierarchy />)

      const source = screen.getByTestId('hierarchy-item-standalone-1')
      const target = screen.getByTestId('hierarchy-item-parent-1')

      fireEvent.dragStart(source, { dataTransfer: { setData: vi.fn() } })
      fireEvent.dragOver(target)
      fireEvent.drop(target)

      expect(mockReparentObject).toHaveBeenCalledWith('standalone-1', 'parent-1')
    })

    it('does not allow dropping object onto itself', async () => {
      render(<Hierarchy />)

      const item = screen.getByTestId('hierarchy-item-parent-1')

      fireEvent.dragStart(item, { dataTransfer: { setData: vi.fn() } })
      fireEvent.dragOver(item)
      fireEvent.drop(item)

      expect(mockReparentObject).not.toHaveBeenCalled()
    })

    it('does not allow dropping parent onto child', async () => {
      render(<Hierarchy />)

      const parent = screen.getByTestId('hierarchy-item-parent-1')
      const child = screen.getByTestId('hierarchy-item-child-1')

      fireEvent.dragStart(parent, { dataTransfer: { setData: vi.fn() } })
      fireEvent.dragOver(child)
      fireEvent.drop(child)

      expect(mockReparentObject).not.toHaveBeenCalled()
    })
  })

  describe('visibility and lock toggles', () => {
    it('toggles visibility when eye icon is clicked', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const visibilityToggle = screen.getByTestId('visibility-toggle-parent-1')
      await user.click(visibilityToggle)

      expect(mockUpdateObject).toHaveBeenCalledWith('parent-1', { visible: false })
    })

    it('toggles lock when lock icon is clicked', async () => {
      const user = userEvent.setup()
      render(<Hierarchy />)

      const lockToggle = screen.getByTestId('lock-toggle-parent-1')
      await user.click(lockToggle)

      expect(mockUpdateObject).toHaveBeenCalledWith('parent-1', { locked: true })
    })
  })

  describe('keyboard navigation', () => {
    it('deletes selected objects on Delete key', async () => {
      const mockStore = createMockStore({ selectedIds: ['parent-1'] })
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector(mockStore as never)
        }
        return mockStore as never
      })

      const user = userEvent.setup()
      render(<Hierarchy />)

      await user.keyboard('{Delete}')

      expect(mockRemoveObject).toHaveBeenCalledWith('parent-1')
    })

    it('duplicates selected objects on Ctrl+D', async () => {
      const mockStore = createMockStore({ selectedIds: ['parent-1'] })
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector(mockStore as never)
        }
        return mockStore as never
      })

      const user = userEvent.setup()
      render(<Hierarchy />)

      await user.keyboard('{Control>}d{/Control}')

      expect(mockDuplicateObject).toHaveBeenCalledWith('parent-1')
    })
  })
})
