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
    hint:        'Basado en tu hook actual',
  },
  {
    key:         'content',
    label:       'Contenido',
    color:       '#34d399',
    placeholder: 'El valor real. Datos, pasos, historia o argumento principal. Sé concreto — usa números, ejemplos y contraste. Aquí está la sustancia.',
    hint:        'Basado en hook y rehook',
  },
  {
    key:         'cta',
    label:       'CTA',
    color:       '#2dd4bf',
    placeholder: 'La acción específica que quieres que hagan. Clara, directa, sin ambigüedad. Un solo CTA convierte mejor.',
    hint:        'Usando todo el guión',
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

/* ─── Length label helper ──────────────────────────────────────────────── */

function getLengthLabel(value) {
  if (value <= 3) return 'Muy corto'
  if (value <= 6) return 'Medio'
  if (value <= 9) return 'Largo'
  return 'Muy largo'
}

/* ─── Accordion section ──────────────────────────────────────────────────── */

function Section({ config, value, onChange, getContext, getLengthValue, setLengthValue, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const count = (value ?? '').length
  const { generate, loading, variants, error, clear } = useAIGenerate()
  const lengthValue = getLengthValue(config.key)

  const handleGenerate = () => {
    const ctx = getContext()
    generate({ sectionKey: config.key, ...ctx, lengthValue })
  }

  const handleSelect = (variant) => {
    onChange(config.key, variant)
    clear()
  }

  const handleLengthChange = (newValue) => {
    setLengthValue(config.key, newValue)
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
          <div className="ed-length-slider-container">
            <label className="ed-length-label">
              Longitud: <span className="ed-length-value">{getLengthLabel(lengthValue)}</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={lengthValue}
              onChange={(e) => handleLengthChange(Number(e.target.value))}
              className="ed-length-slider"
            />
          </div>

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
            {config.hint && (
              <span className="ai-chain-hint">{config.hint}</span>
            )}
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
  const activeScriptId  = useUIStore((s) => s.activeScriptId)
  const setActiveScript = useUIStore((s) => s.setActiveScript)
  const liveContext     = useUIStore((s) => s.liveContext)

  // Read script fresh on each render to get the latest from the store
  const script = useScriptStore(
    useCallback((s) => s.scripts.find((sc) => sc.id === activeScriptId) ?? null, [activeScriptId]),
  )

  const [local, setLocal]       = useState(null)
  const [saveState, setSaveState] = useState('idle')
  const pendingPatch  = useRef({})
  const savedTimer    = useRef(null)
  const localRef      = useRef(null)

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
      const next = { ...script }
      setLocal(next)
      localRef.current = next
      pendingPatch.current = {}
      setSaveState('idle')
    }
    return () => cancelFlush()
  }, [activeScriptId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback(
    (field, value) => {
      setLocal((prev) => {
        const next = prev ? { ...prev, [field]: value } : prev
        localRef.current = next
        return next
      })
      pendingPatch.current[field] = value
      setSaveState('saving')
      debouncedFlush()
    },
    [debouncedFlush],
  )

  const getContext = useCallback(() => {
    const l = localRef.current ?? local
    return {
      objective: liveContext.objective,
      idea:      liveContext.idea,
      hook:      l?.hook    ?? '',
      rehook:    l?.rehook  ?? '',
      content:   l?.content ?? '',
    }
  }, [local, liveContext])

  const getLengthValue = useCallback((sectionKey) => {
    const lengthKey = `${sectionKey}Length`
    return (localRef.current ?? local)?.[lengthKey] ?? 5
  }, [local])

  const setLengthValue = useCallback((sectionKey, value) => {
    const lengthKey = `${sectionKey}Length`
    handleChange(lengthKey, value)
  }, [handleChange])

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
      {/* ── Save progress bar ── */}
      <div className={`ed-progress-bar${saveState === 'saving' ? ' is-saving' : saveState === 'saved' ? ' is-saved' : ''}`} />

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
                getContext={getContext}
                getLengthValue={getLengthValue}
                setLengthValue={setLengthValue}
                defaultOpen={i === 0}
              />
            ))}
          </div>

          <div className="ed-bottom-spacer" />
        </div>
      </div>
    </div>
  )
}
