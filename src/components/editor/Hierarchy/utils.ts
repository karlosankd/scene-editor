import type { SceneObject, ObjectType } from '@/types'
import type { HierarchyFilter, FlattenedObject } from './types'

/**
 * Filters objects based on search query and type filters
 */
export function filterObjects(
  objects: Record<string, SceneObject>,
  rootIds: string[],
  filter: HierarchyFilter
): string[] {
  const { searchQuery, typeFilters } = filter
  const query = searchQuery.toLowerCase().trim()

  const matchesFilter = (obj: SceneObject): boolean => {
    // Check type filter
    if (typeFilters.length > 0 && !typeFilters.includes(obj.type)) {
      return false
    }

    // Check search query
    if (query && !obj.name.toLowerCase().includes(query)) {
      return false
    }

    return true
  }

  // Collect all matching object IDs
  const matchingIds: string[] = []

  const checkObject = (id: string): boolean => {
    const obj = objects[id]
    if (!obj) return false

    const selfMatches = matchesFilter(obj)

    // Check if any children match
    const childrenMatch = obj.childIds.some((childId) => checkObject(childId))

    if (selfMatches || childrenMatch) {
      matchingIds.push(id)
      return true
    }

    return false
  }

  rootIds.forEach((id) => checkObject(id))

  return matchingIds
}

/**
 * Flattens the object hierarchy for rendering
 */
export function flattenHierarchy(
  objects: Record<string, SceneObject>,
  rootIds: string[],
  expandedIds: Set<string>,
  filteredIds?: string[]
): FlattenedObject[] {
  const result: FlattenedObject[] = []
  let index = 0

  const traverse = (id: string, depth: number, isParentHidden: boolean) => {
    const obj = objects[id]
    if (!obj) return

    // If filtering, skip objects not in filtered list
    if (filteredIds && !filteredIds.includes(id)) {
      return
    }

    result.push({ object: obj, depth, index: index++, isParentHidden })

    // Only traverse children if expanded
    if (expandedIds.has(id)) {
      // 子级继承父级的隐藏状态
      const childIsParentHidden = isParentHidden || !obj.visible
      obj.childIds.forEach((childId) => traverse(childId, depth + 1, childIsParentHidden))
    }
  }

  rootIds.forEach((id) => traverse(id, 0, false))

  return result
}



/**
 * Checks if an object is a descendant of another object
 */
export function isDescendant(
  objects: Record<string, SceneObject>,
  potentialDescendantId: string,
  ancestorId: string
): boolean {
  let currentId: string | null = potentialDescendantId

  while (currentId) {
    const obj: SceneObject | undefined = objects[currentId]
    if (!obj) return false
    if (obj.parentId === ancestorId) return true
    currentId = obj.parentId
  }

  return false
}

/**
 * Validates if a reparent operation is allowed
 */
export function canReparent(
  objects: Record<string, SceneObject>,
  draggedId: string,
  targetId: string | null
): boolean {
  // Can always move to root
  if (targetId === null) return true

  // Cannot move to itself
  if (draggedId === targetId) return false

  // Cannot move to own descendant
  if (isDescendant(objects, targetId, draggedId)) return false

  return true
}

/**
 * Gets the icon type for an object
 */
export function getObjectIconType(type: ObjectType): string {
  switch (type) {
    case 'light':
      return 'sun'
    case 'camera':
      return 'camera'
    case 'group':
      return 'layers'
    case 'folder':
      return 'folder'
    case 'particle':
      return 'sparkles'
    default:
      return 'box'
  }
}

/**
 * Type filter options with labels
 */
export const TYPE_FILTER_OPTIONS: { type: ObjectType; label: string; icon: string }[] = [
  { type: 'mesh', label: 'Mesh', icon: 'box' },
  { type: 'light', label: 'Light', icon: 'sun' },
  { type: 'camera', label: 'Camera', icon: 'camera' },
  { type: 'group', label: 'Group', icon: 'layers' },
  { type: 'folder', label: 'Folder', icon: 'folder' },
  { type: 'particle', label: 'Particle', icon: 'sparkles' },
]

/**
 * Highlights search text by splitting into matched and unmatched segments
 */
export function highlightSearchText(
  text: string,
  query: string
): { text: string; isMatch: boolean }[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }]
  }

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const result: { text: string; isMatch: boolean }[] = []
  let lastIndex = 0

  let index = lowerText.indexOf(lowerQuery)
  while (index !== -1) {
    // Add non-matching part before
    if (index > lastIndex) {
      result.push({ text: text.slice(lastIndex, index), isMatch: false })
    }
    // Add matching part
    result.push({ text: text.slice(index, index + query.length), isMatch: true })
    lastIndex = index + query.length
    index = lowerText.indexOf(lowerQuery, lastIndex)
  }

  // Add remaining non-matching part
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), isMatch: false })
  }

  return result.length > 0 ? result : [{ text, isMatch: false }]
}

/**
 * Gets all descendant IDs of an object recursively
 */
export function getAllDescendantIds(
  objects: Record<string, SceneObject>,
  id: string
): string[] {
  const obj = objects[id]
  if (!obj) return []

  const descendants: string[] = []
  const collectDescendants = (objId: string) => {
    const current = objects[objId]
    if (!current) return
    for (const childId of current.childIds) {
      descendants.push(childId)
      collectDescendants(childId)
    }
  }

  collectDescendants(id)
  return descendants
}

/**
 * Gets the next visible object ID in the flattened hierarchy
 */
export function getNextVisibleId(
  flattenedObjects: FlattenedObject[],
  currentId: string
): string | null {
  const currentIndex = flattenedObjects.findIndex((f) => f.object.id === currentId)
  if (currentIndex === -1 || currentIndex >= flattenedObjects.length - 1) {
    return null
  }
  return flattenedObjects[currentIndex + 1].object.id
}

/**
 * Gets the previous visible object ID in the flattened hierarchy
 */
export function getPreviousVisibleId(
  flattenedObjects: FlattenedObject[],
  currentId: string
): string | null {
  const currentIndex = flattenedObjects.findIndex((f) => f.object.id === currentId)
  if (currentIndex <= 0) {
    return null
  }
  return flattenedObjects[currentIndex - 1].object.id
}
