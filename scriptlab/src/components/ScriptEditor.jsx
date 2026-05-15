import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { useScriptStore } from '../store/useScriptStore'
import { useUIStore }    from '../store/useUIStore'
import { useDebounce }   from '../hooks/useDebounce'
import { useAIGenerate } from '../hooks/useAIGenerate'
import { formatDate }    from '../utils/date'
import Icon              from './Icon'
import AIVariants        from './AIVariants'

/* ─── Section config ──────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    key:         'hook',
    label:       'Hook',
    color:       '#f59e0b',
    placeholder: 'La primera frase. Detiene el scroll. Genera tensión, curiosidad o sorpresa inmediata. Tienes menos de 3 segundos.',
  },
  {
    key:         'rehook',
    label:       'Rehook',
    color:       '#818cf8',
    placeholder: 'Refuerza el gancho. ¿Por qué deben seguir mirando? Una promesa más específica que conecta con lo que viene.',
  },
  {
    key:         'content',
    label:       'Contenido',
    color:       '#34d399',
    placeholder: 'El valor real. Datos, pasos, historia o argumento principal. Sé concreto — usa números, ejemplos y contraste. Aquí está la sustancia.',
  },
  {
    key:         'finale',
    label:       'Final',
    color:       '#f472b6',
    placeholder: 'El remate. Conclusión que refuerza el mensaje central y cierra el loop emocional abierto en el hook.',
  },
  {
    key:         'cta',
    label:       'CTA',
    color:       '#2dd4bf',
    placeholder: 'La acción específica que quieres que hagan. Clara, directa, sin ambigüedad. Un solo CTA convierte mejor.',
  },
]

/* ─── Auto-resizing textarea ─────────────────────────────────────────────── */

function AutoTextarea({ value, onChange, placeholder, sectionColor }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  return (
    <textarea
      ref={ref}
      className="ed-textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      style={{ '--section-color': sectionColor }}
      spellCheck
    />
  )
}

/* ─── Accordion section ──────────────────────────────────────────────────── */

function Section({ config, value, onChange, objective, idea, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const count = (value ?? '').length
  const { generate, loading, variants, error, clear } = useAIGenerate()

  const handleGenerate = () => {
    generate({ sectionKey: config.key, objective, idea })
  }

  const handleSelect = (variant) => {
    onChange(config.key, variant)
    clear()
  }

  const showPanel = loading || variants || error

  return (
    <div className={`ed-section${open ? ' is-open' : ''}`} style={{ '--section-color': config.color }}>
      {/* Header */}
      <button className="ed-section-header" onClick={() => setOpen((o) => !o)}>
        <span className="ed-section-bar" />
        <span className="ed-section-label text-label">{config.label}</span>
        <span className={`ed-section-count${count > 0 ? ' has-content' : ''}`}>
          {count}
        </span>
        <span className={`ed-section-chevron${open ? ' is-open' : ''}`}>
          <Icon name="chevron" size={12} />
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="ed-section-body">
          <AutoTextarea
            value={value ?? ''}
            onChange={(e) => onChange(config.key, e.target.value)}
            placeholder={config.placeholder}
            sectionColor={config.color}
          />

          <div className="ai-trigger-row">
            <button
              className={`ai-btn${loading ? ' is-loading' : ''}`}
              onClick={handleGenerate}
              disabled={loading}
              type="button"
              style={{ '--section-color': config.color }}
            >
              {loading
                ? <span className="ai-btn-spinner" />
                : <span className="ai-btn-icon">✨</span>}
              Generar con IA
            </button>
          </div>

          {showPanel && (
            <AIVariants
              variants={variants}
              loading={loading}
              error={error}
              sectionColor={config.color}
              onSelect={handleSelect}
              onRegenerate={handleGenerate}
              onClose={clear}
            />
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Save indicator ─────────────────────────────────────────────────────── */

function SaveIndicator({ state }) {
  if (state === 'idle') return null
  return (
    <span className={`ed-save-indicator${state === 'saved' ? ' is-saved' : ''}`}>
      {state === 'saving' && <span className="ed-save-dot" />}
      {state === 'saved'  && <Icon name="check" size={11} />}
      {state === 'saving' ? 'Guardando…' : 'Guardado'}
    </span>
  )
}

/* ─── ScriptEditor ───────────────────────────────────────────────────────── */

export default function ScriptEditor() {
  const updateScript   = useScriptStore((s) => s.updateScript)
  const deleteScript   = useScriptStore((s) => s.deleteScript)
  const groups         = useScriptStore((s) => s.groups)
  const activeScriptId = useUIStore((s) => s.activeScriptId)
  const setActiveScript = useUIStore((s) => s.setActiveScript)

  // Read script fresh on each render to get the latest from the store
  const script = useScriptStore(
    useCallback((s) => s.scripts.find((sc) => sc.id === activeScriptId) ?? null, [activeScriptId]),
  )

  const [local, setLocal]       = useState(null)
  const [saveState, setSaveState] = useState('idle')
  const pendingPatch  = useRef({})
  const savedTimer    = useRef(null)

  // Flush pending changes to store
  const flush = useCallback(() => {
    if (!activeScriptId || Object.keys(pendingPatch.current).length === 0) return
    updateScript(activeScriptId, { ...pendingPatch.current })
    pendingPatch.current = {}
    setSaveState('saved')
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaveState('idle'), 1500)
  }, [activeScriptId, updateScript])

  const { debounced: debouncedFlush, cancel: cancelFlush } = useDebounce(flush, 500)

  // Reset local state when the active script changes
  useEffect(() => {
    cancelFlush()
    if (script) {
      setLocal({ ...script })
      pendingPatch.current = {}
      setSaveState('idle')
    }
    return () => cancelFlush()
  }, [activeScriptId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback(
    (field, value) => {
      setLocal((prev) => (prev ? { ...prev, [field]: value } : prev))
      pendingPatch.current[field] = value
      setSaveState('saving')
      debouncedFlush()
    },
    [debouncedFlush],
  )

  const handleBack = () => {
    flush()           // save immediately on leave
    setActiveScript(null)
  }

  const handleDelete = () => {
    cancelFlush()
    setActiveScript(null)
    deleteScript(activeScriptId)
  }

  if (!local) return null

  const group = groups.find((g) => g.id === local.groupId) ?? null

  return (
    <div className="ed-container">
      {/* ── Toolbar ── */}
      <div className="ed-toolbar">
        <button className="ed-back-btn" onClick={handleBack}>
          <Icon name="arrow-left" size={14} />
          Guiones
        </button>

        <SaveIndicator state={saveState} />

        <button className="ed-delete-btn" onClick={handleDelete} title="Eliminar guión">
          <Icon name="trash" size={13} />
        </button>
      </div>

      <div className="divider" />

      {/* ── Scrollable content ── */}
      <div className="ed-scroll">
        <div className="ed-content">
          {/* Title */}
          <div className="ed-title-wrap">
            <input
              className="ed-title font-display"
              value={local.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Sin título"
              spellCheck
            />
          </div>

          {/* Meta */}
          <div className="ed-meta">
            {group && (
              <span className="ed-meta-badge" style={{ '--c': group.color }}>
                <span className="ed-meta-dot" />
                {group.name}
              </span>
            )}
            <span className="ed-meta-sep" />
            <span className="ed-meta-date">
              <Icon name="calendar" size={11} />
              {formatDate(local.updatedAt)}
            </span>
          </div>

          <div className="ed-rule" />

          {/* Sections */}
          <div className="ed-sections">
            {SECTIONS.map((sec, i) => (
              <Section
                key={sec.key}
                config={sec}
                value={local[sec.key]}
                onChange={handleChange}
                objective={local.objective}
                idea={local.idea}
                defaultOpen={i === 0}   // only hook open by default
              />
            ))}
          </div>

          <div className="ed-bottom-spacer" />
        </div>
      </div>
    </div>
  )
}
