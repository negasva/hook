import { useRef, useState, useEffect, useCallback } from 'react'
import Sidebar from './Sidebar'
import WorkArea from './WorkArea'
import RightPanel from './RightPanel'
import Dialog from './Dialog'
import Icon from './Icon'
import { useScriptStore } from '../store/useScriptStore'
import { useUIStore } from '../store/useUIStore'
import { useDialog } from '../hooks/useDialog'
import { useDataInit } from '../hooks/useDataInit'

/* ─── Layout ──────────────────────────────────────────────────────────────── */

export default function Layout() {
  useDataInit()
  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <Sidebar />
        <WorkArea />
        <RightPanel />
      </div>
      <StatusBar />
      <Dialog />
    </div>
  )
}

/* ─── Nav dropdown ────────────────────────────────────────────────────────── */

function NavMenu({ label, items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="nav-menu" ref={ref}>
      <button
        className={`nav-item text-label${open ? ' is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>
      {open && (
        <div className="nav-dropdown">
          {items.map((item, i) =>
            item === '---'
              ? <div key={i} className="nav-dropdown-sep" />
              : (
                <button
                  key={item.label}
                  className="nav-dropdown-item"
                  onClick={() => { item.action(); setOpen(false) }}
                  disabled={item.disabled}
                >
                  {item.icon && <Icon name={item.icon} size={12} />}
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="nav-dropdown-shortcut">{item.shortcut}</span>
                  )}
                </button>
              ),
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Header ──────────────────────────────────────────────────────────────── */

function Header() {
  const addScript       = useScriptStore((s) => s.addScript)
  const addGroup        = useScriptStore((s) => s.addGroup)
  const deleteScript    = useScriptStore((s) => s.deleteScript)
  const scripts         = useScriptStore((s) => s.scripts)

  const activeGroupId   = useUIStore((s) => s.activeGroupId)
  const activeScriptId  = useUIStore((s) => s.activeScriptId)
  const setActiveScript = useUIStore((s) => s.setActiveScript)
  const scriptListView  = useUIStore((s) => s.scriptListView)
  const setScriptListView = useUIStore((s) => s.setScriptListView)
  const theme           = useUIStore((s) => s.theme)
  const setTheme        = useUIStore((s) => s.setTheme)

  const handleExport = useCallback(() => {
    const data = JSON.stringify(scripts, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'scriptlab-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [scripts])

  const handleNewScript = useCallback(() => {
    const script = addScript({ groupId: activeGroupId ?? null })
    setActiveScript(script.id)
  }, [addScript, activeGroupId, setActiveScript])

  const { confirm } = useDialog()

  const handleDeleteActive = useCallback(async () => {
    if (!activeScriptId) return
    const ok = await confirm({
      icon: 'trash',
      variant: 'danger',
      title: 'Eliminar guión',
      message: '¿Eliminar este guión? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
    })
    if (ok) {
      setActiveScript(null)
      deleteScript(activeScriptId)
    }
  }, [activeScriptId, deleteScript, setActiveScript, confirm])

  const fileItems = [
    { label: 'Nuevo guión',  icon: 'script',   action: handleNewScript },
    { label: 'Nuevo grupo',  icon: 'folder',   action: () => addGroup({ name: 'Nuevo grupo', color: '#6b7280', icon: 'folder', parentId: null }) },
    '---',
    { label: 'Exportar JSON', icon: 'download', action: handleExport },
  ]

  const editItems = [
    { label: 'Eliminar guión activo', icon: 'trash', action: handleDeleteActive, disabled: !activeScriptId },
  ]

  const viewItems = [
    { label: 'Vista cuadrícula', icon: 'grid', action: () => setScriptListView('grid'), disabled: !activeScriptId && scriptListView === 'grid' },
    { label: 'Vista lista',      icon: 'list', action: () => setScriptListView('list'), disabled: !activeScriptId && scriptListView === 'list' },
    '---',
    { label: theme === 'dark' ? 'Modo claro' : 'Modo oscuro', icon: theme === 'dark' ? 'sun' : 'moon', action: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
  ]

  const runItems = [
    { label: 'Generar todo con IA', icon: 'sparkles', action: () => {}, disabled: true },
  ]

  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="font-display header-logo">ScriptLab</span>
        <span className="header-version text-label">v0.1</span>
      </div>

      <nav className="header-nav">
        <NavMenu label="FILE" items={fileItems} />
        <NavMenu label="EDIT" items={editItems} />
        <NavMenu label="VIEW" items={viewItems} />
        <NavMenu label="RUN"  items={runItems}  />
      </nav>

      <div className="header-actions">
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={13} />
        </button>
        <div className="header-dot" style={{ '--dot': '#22c55e' }} />
        <div className="header-dot" style={{ '--dot': 'var(--color-gold)' }} />
        <div className="header-dot" style={{ '--dot': '#ef4444' }} />
      </div>
    </header>
  )
}

/* ─── Status bar ──────────────────────────────────────────────────────────── */

function StatusBar() {
  return (
    <footer className="status-bar">
      <span className="text-label">Ready</span>
      <span className="text-label" style={{ marginLeft: 'auto' }}>
        ScriptLab — Dark Luxury Editorial
      </span>
    </footer>
  )
}
