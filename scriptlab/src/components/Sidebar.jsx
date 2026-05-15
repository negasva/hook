import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useCallback } from 'react'
import { useScriptStore } from '../store/useScriptStore'
import { useUIStore } from '../store/useUIStore'
import Icon from './Icon'

/* ─── Script row (leaf node) ─────────────────────────────────────────────── */

function ScriptRow({ script, depth }) {
  const activeScriptId = useUIStore((s) => s.activeScriptId)
  const setActiveScript = useUIStore((s) => s.setActiveScript)
  const isActive = activeScriptId === script.id

  return (
    <button
      className={`sb-script-row${isActive ? ' is-active' : ''}`}
      style={{ paddingLeft: 12 + (depth + 1) * 16 + 6 }}
      onClick={() => setActiveScript(script.id)}
      title={script.title}
    >
      <Icon name="script" size={11} sw={1.5} className="sb-script-icon" />
      <span className="sb-script-title">{script.title}</span>
    </button>
  )
}

/* ─── Sortable group row ─────────────────────────────────────────────────── */

function SortableGroupRow({ group, depth }) {
  const scripts       = useScriptStore((s) => s.scripts.filter((sc) => sc.groupId === group.id))
  const childGroups   = useScriptStore((s) =>
    s.groups.filter((g) => g.parentId === group.id).sort((a, b) => a.order - b.order),
  )
  const updateGroup   = useScriptStore((s) => s.updateGroup)
  const addGroup      = useScriptStore((s) => s.addGroup)

  const activeGroupId       = useUIStore((s) => s.activeGroupId)
  const setActiveGroup      = useUIStore((s) => s.setActiveGroup)
  const collapsedGroups     = useUIStore((s) => s.collapsedGroups)
  const toggleGroupCollapsed = useUIStore((s) => s.toggleGroupCollapsed)

  const isActive    = activeGroupId === group.id
  const isCollapsed = collapsedGroups.includes(group.id)
  const hasChildren = childGroups.length > 0 || scripts.length > 0

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSelectGroup = (e) => {
    e.stopPropagation()
    setActiveGroup(isActive ? null : group.id)
  }

  const handleAddSubgroup = (e) => {
    e.stopPropagation()
    addGroup({ parentId: group.id, name: 'Nuevo subgrupo', color: '#6b7280', icon: 'folder' })
    if (isCollapsed) toggleGroupCollapsed(group.id)
  }

  const handleDragEndChild = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return
    const siblings = childGroups
    const oldIdx = siblings.findIndex((g) => g.id === active.id)
    const newIdx = siblings.findIndex((g) => g.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    arrayMove(siblings, oldIdx, newIdx).forEach((g, i) => {
      if (g.order !== i) updateGroup(g.id, { order: i })
    })
  }, [childGroups, updateGroup])

  return (
    <div ref={setNodeRef} style={style} className={`sb-group-item${isDragging ? ' is-ghost' : ''}`}>
      {/* Row */}
      <div
        className={`sb-group-row${isActive ? ' is-active' : ''}`}
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        {/* Drag handle */}
        <span
          className="sb-drag-handle"
          {...attributes}
          {...listeners}
          role="button"
          tabIndex={-1}
        >
          <Icon name="grip" size={12} sw={2} />
        </span>

        {/* Chevron */}
        <button
          className={`sb-chevron${isCollapsed ? '' : ' is-open'}${!hasChildren ? ' sb-invisible' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleGroupCollapsed(group.id) }}
          tabIndex={-1}
        >
          <Icon name="chevron" size={11} />
        </button>

        {/* Color + icon */}
        <span className="sb-group-bullet" style={{ color: group.color }}>
          <Icon name={group.icon} size={13} />
        </span>

        {/* Name (click = select group) */}
        <button className="sb-group-name" onClick={handleSelectGroup}>
          {group.name}
        </button>

        {/* Script count */}
        {scripts.length > 0 && (
          <span className="sb-count">{scripts.length}</span>
        )}

        {/* Add subgroup — only on depth 0 */}
        {depth === 0 && (
          <button
            className="sb-add-sub"
            onClick={handleAddSubgroup}
            title="Nuevo subgrupo"
            tabIndex={-1}
          >
            <Icon name="plus" size={11} />
          </button>
        )}
      </div>

      {/* Children */}
      {!isCollapsed && hasChildren && (
        <div className="sb-children" style={{ '--indent': `${12 + depth * 16 + 20}px` }}>
          <div className="sb-indent-line" />

          {/* Child groups with their own DndContext */}
          {childGroups.length > 0 && (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndChild}
            >
              <SortableContext
                items={childGroups.map((g) => g.id)}
                strategy={verticalListSortingStrategy}
              >
                {childGroups.map((child) => (
                  <SortableGroupRow key={child.id} group={child} depth={depth + 1} />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {/* Script leaves */}
          {scripts.map((script) => (
            <ScriptRow key={script.id} script={script} depth={depth} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Drag overlay content ───────────────────────────────────────────────── */

function OverlayRow({ group }) {
  if (!group) return null
  return (
    <div className="sb-drag-overlay">
      <span style={{ color: group.color }}>
        <Icon name={group.icon} size={13} />
      </span>
      <span className="sb-overlay-name">{group.name}</span>
    </div>
  )
}

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */

export default function Sidebar() {
  const groups      = useScriptStore((s) => s.groups)
  const scripts     = useScriptStore((s) => s.scripts)
  const addGroup    = useScriptStore((s) => s.addGroup)
  const updateGroup = useScriptStore((s) => s.updateGroup)

  const activeGroupId  = useUIStore((s) => s.activeGroupId)
  const setActiveGroup = useUIStore((s) => s.setActiveGroup)

  const [dragActiveId, setDragActiveId] = useState(null)

  const rootGroups = groups
    .filter((g) => g.parentId === null)
    .sort((a, b) => a.order - b.order)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = useCallback(({ active }) => {
    setDragActiveId(active.id)
  }, [])

  const handleDragEnd = useCallback(
    ({ active, over }) => {
      setDragActiveId(null)
      if (!over || active.id === over.id) return

      const dragged = groups.find((g) => g.id === active.id)
      const target  = groups.find((g) => g.id === over.id)
      if (!dragged || !target || dragged.parentId !== target.parentId) return

      const siblings = groups
        .filter((g) => g.parentId === dragged.parentId)
        .sort((a, b) => a.order - b.order)

      const oldIdx = siblings.findIndex((g) => g.id === active.id)
      const newIdx = siblings.findIndex((g) => g.id === over.id)
      arrayMove(siblings, oldIdx, newIdx).forEach((g, i) => {
        if (g.order !== i) updateGroup(g.id, { order: i })
      })
    },
    [groups, updateGroup],
  )

  const handleAddRootGroup = () => {
    addGroup({ name: 'Nuevo grupo', color: '#6b7280', icon: 'folder', parentId: null })
  }

  const draggedGroup = dragActiveId ? groups.find((g) => g.id === dragActiveId) : null

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sb-header">
        <span className="text-label">Grupos</span>
        <button className="sb-add-root" onClick={handleAddRootGroup} title="Nuevo grupo">
          <Icon name="plus" size={13} />
        </button>
      </div>

      {/* All scripts */}
      <button
        className={`sb-all-row${activeGroupId === null ? ' is-active' : ''}`}
        onClick={() => setActiveGroup(null)}
      >
        <Icon name="script" size={13} className="sb-all-icon" />
        <span>Todos los guiones</span>
        <span className="sb-count">{scripts.length}</span>
      </button>

      <div className="divider" />

      {/* Tree */}
      <div className="sb-tree">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rootGroups.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            {rootGroups.map((group) => (
              <SortableGroupRow key={group.id} group={group} depth={0} />
            ))}
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            <OverlayRow group={draggedGroup} />
          </DragOverlay>
        </DndContext>

        {rootGroups.length === 0 && (
          <p className="sb-empty">Sin grupos. Crea uno con +</p>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="accent-line" />
        <p className="text-label" style={{ marginTop: 8 }}>Workspace</p>
      </div>
    </aside>
  )
}
