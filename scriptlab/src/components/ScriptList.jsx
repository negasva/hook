import { useScriptStore } from '../store/useScriptStore'
import { useUIStore } from '../store/useUIStore'
import { formatDate } from '../utils/date'
import Icon from './Icon'

/* ─── Script card ─────────────────────────────────────────────────────────── */

function ScriptCard({ script, group, isActive, view, onClick, index = 0 }) {
  const hook    = script.hook ?? ''
  const preview = hook.length > 60 ? hook.slice(0, 60) + '…' : hook
  const date    = formatDate(script.updatedAt)

  return (
    <button
      className={`sl-card${isActive ? ' is-active' : ''}${view === 'list' ? ' is-list' : ''}`}
      onClick={onClick}
      style={{ '--i': index }}
    >
      {/* Group badge */}
      {group && (
        <span className="sl-badge" style={{ '--c': group.color }}>
          <span className="sl-badge-dot" />
          <span className="sl-badge-label">{group.name}</span>
        </span>
      )}

      {/* Main content */}
      <div className="sl-card-body">
        <h3 className="sl-card-title font-display">{script.title || 'Sin título'}</h3>
        {preview && <p className="sl-card-hook">{preview}</p>}
      </div>

      {/* Footer */}
      <div className="sl-card-footer">
        <span className="sl-card-date">
          <Icon name="calendar" size={11} className="sl-date-icon" />
          {date}
        </span>
        {isActive && <span className="sl-card-active-dot" />}
      </div>
    </button>
  )
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState({ groupName, onNew }) {
  return (
    <div className="sl-empty">
      <div className="sl-empty-inner">
        <div className="accent-line" style={{ width: 32, margin: '0 auto 20px' }} />
        <p className="font-display sl-empty-title">
          {groupName ? `${groupName} está vacío.` : 'No hay guiones.'}
        </p>
        <p className="sl-empty-sub">
          Crea tu primer guión para empezar.
        </p>
        <button className="sl-empty-btn" onClick={onNew}>
          <Icon name="plus" size={13} />
          Nuevo guión
        </button>
        <div className="accent-line" style={{ width: 32, margin: '20px auto 0' }} />
      </div>
    </div>
  )
}

/* ─── ScriptList ──────────────────────────────────────────────────────────── */

export default function ScriptList() {
  const scripts     = useScriptStore((s) => s.scripts)
  const groups      = useScriptStore((s) => s.groups)
  const addScript   = useScriptStore((s) => s.addScript)

  const activeGroupId      = useUIStore((s) => s.activeGroupId)
  const activeScriptId     = useUIStore((s) => s.activeScriptId)
  const setActiveScript    = useUIStore((s) => s.setActiveScript)
  const scriptListView     = useUIStore((s) => s.scriptListView)
  const setScriptListView  = useUIStore((s) => s.setScriptListView)

  const activeGroup = activeGroupId
    ? groups.find((g) => g.id === activeGroupId) ?? null
    : null

  const visible = activeGroupId === null
    ? [...scripts].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    : scripts
        .filter((s) => s.groupId === activeGroupId)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  const handleNew = () => {
    const script = addScript({ groupId: activeGroupId ?? null })
    setActiveScript(script.id)
  }

  return (
    <div className="sl-container">
      {/* ── Toolbar ── */}
      <div className="sl-toolbar">
        <div className="sl-toolbar-left">
          {activeGroup ? (
            <span
              className="sl-toolbar-dot"
              style={{ background: activeGroup.color }}
            />
          ) : (
            <Icon name="script" size={15} className="sl-toolbar-icon" />
          )}
          <h2 className="sl-toolbar-title">
            {activeGroup ? activeGroup.name : 'Todos los guiones'}
          </h2>
          <span className="sl-toolbar-count text-label">
            {visible.length} {visible.length === 1 ? 'guión' : 'guiones'}
          </span>
        </div>

        <div className="sl-toolbar-right">
          <div className="sl-view-toggle">
            <button
              className={`sl-view-btn${scriptListView === 'grid' ? ' is-active' : ''}`}
              onClick={() => setScriptListView('grid')}
              title="Vista cuadrícula"
            >
              <Icon name="grid" size={14} />
            </button>
            <button
              className={`sl-view-btn${scriptListView === 'list' ? ' is-active' : ''}`}
              onClick={() => setScriptListView('list')}
              title="Vista lista"
            >
              <Icon name="list" size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* ── Content ── */}
      {visible.length === 0 ? (
        <EmptyState groupName={activeGroup?.name} onNew={handleNew} />
      ) : (
        <div className={`sl-scroll`}>
          <div className={`sl-grid${scriptListView === 'list' ? ' is-list' : ''}`}>
            {visible.map((script, index) => {
              const group = groups.find((g) => g.id === script.groupId) ?? null
              return (
                <ScriptCard
                  key={script.id}
                  script={script}
                  group={group}
                  isActive={activeScriptId === script.id}
                  view={scriptListView}
                  onClick={() => setActiveScript(script.id)}
                  index={index}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button className="sl-fab" onClick={handleNew} title="Nuevo guión">
        <Icon name="plus" size={18} sw={2} />
      </button>
    </div>
  )
}
