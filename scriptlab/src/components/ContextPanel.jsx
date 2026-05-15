import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { useScriptStore } from '../store/useScriptStore'
import { useUIStore }     from '../store/useUIStore'
import { useDebounce }    from '../hooks/useDebounce'
import { useContextAI }   from '../hooks/useContextAI'
import Icon               from './Icon'

/* ─── Chip options ────────────────────────────────────────────────────────── */

const OBJECTIVE_CHIPS = [
  { label: 'Generar leads',        color: '#f59e0b' },
  { label: 'Ganar followers',      color: '#818cf8' },
  { label: 'Visibilidad de marca', color: '#34d399' },
  { label: 'Vender producto',      color: '#f472b6' },
  { label: 'Educar',               color: '#2dd4bf' },
  { label: 'Entretener',           color: '#fb923c' },
]

/* ─── Auto-resizing textarea ─────────────────────────────────────────────── */

function AutoTextarea({ value, onChange, placeholder, className }) {
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
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      spellCheck
    />
  )
}

/* ─── AI Suggestion box ───────────────────────────────────────────────────── */

function AISuggestion({ text, onAccept, onDiscard }) {
  return (
    <div className="cp-ai-suggestion">
      <div className="cp-ai-suggestion-label text-label">
        <span>✨</span> Sugerencia IA
      </div>
      <p className="cp-ai-suggestion-text">{text}</p>
      <div className="cp-ai-suggestion-actions">
        <button className="cp-ai-use-btn" onClick={onAccept}>
          <Icon name="check" size={11} /> Usar
        </button>
        <button className="cp-ai-discard-btn" onClick={onDiscard}>
          <Icon name="x" size={11} />
        </button>
      </div>
    </div>
  )
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="cp-empty">
      <div className="cp-empty-icon">
        <Icon name="target" size={28} sw={1} />
      </div>
      <p className="cp-empty-label text-label">Sin guión activo</p>
      <p className="cp-empty-hint">
        Selecciona o crea un guión para añadir contexto.
      </p>
    </div>
  )
}

/* ─── ContextPanel ───────────────────────────────────────────────────────── */

export default function ContextPanel() {
  const updateScript   = useScriptStore((s) => s.updateScript)
  const activeScriptId = useUIStore((s) => s.activeScriptId)

  const script = useScriptStore(
    useCallback((s) => s.scripts.find((sc) => sc.id === activeScriptId) ?? null,
      [activeScriptId]),
  )

  const [local, setLocal]         = useState(null)
  const pendingPatch               = useRef({})
  const savedTimer                 = useRef(null)
  const [saveState, setSaveState]  = useState('idle')

  const {
    improving, suggestions, clearSuggestion, improve,
    questionsLoading, questions, clearQuestions, generateQuestions,
    error: aiError,
  } = useContextAI()

  /* ── Autosave ── */

  const flush = useCallback(() => {
    if (!activeScriptId || Object.keys(pendingPatch.current).length === 0) return
    updateScript(activeScriptId, { ...pendingPatch.current })
    pendingPatch.current = {}
    setSaveState('saved')
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaveState('idle'), 1400)
  }, [activeScriptId, updateScript])

  const { debounced: debouncedFlush, cancel: cancelFlush } = useDebounce(flush, 500)

  useEffect(() => {
    cancelFlush()
    if (script) {
      setLocal({ objective: script.objective ?? '', idea: script.idea ?? '' })
      pendingPatch.current = {}
      setSaveState('idle')
    } else {
      setLocal(null)
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

  const handleChipClick = useCallback(
    (label) => {
      const current = (local?.objective ?? '').trim()
      const already = current.includes(label)
      const newValue = already
        ? current.split(',').map((s) => s.trim()).filter((s) => s !== label).join(', ')
        : current ? `${current}, ${label}` : label
      handleChange('objective', newValue)
    },
    [local, handleChange],
  )

  const isChipActive = (label) =>
    (local?.objective ?? '').split(',').map((s) => s.trim()).includes(label)

  /* ── Accept AI suggestion ── */

  const handleAccept = useCallback((field, value) => {
    handleChange(field, value)
    clearSuggestion(field)
  }, [handleChange, clearSuggestion])

  /* ── Improve field ── */

  const handleImprove = useCallback((field) => {
    improve({
      field,
      currentValue: local?.[field],
      objective: local?.objective,
      idea: local?.idea,
    })
  }, [improve, local])

  /* ── Key questions ── */

  const handleAskQuestions = useCallback(() => {
    if (questions) { clearQuestions(); return }
    generateQuestions({ objective: local?.objective, idea: local?.idea })
  }, [questions, clearQuestions, generateQuestions, local])

  return (
    <>
      {/* ── Panel header ── */}
      <div className="cp-header">
        <div className="cp-header-left">
          <span className="cp-header-icon">
            <Icon name="target" size={14} sw={1.5} />
          </span>
          <span className="cp-header-title font-display">Contexto</span>
        </div>
        {saveState !== 'idle' && (
          <span className={`cp-save${saveState === 'saved' ? ' is-saved' : ''}`}>
            {saveState === 'saved' ? <Icon name="check" size={10} /> : <span className="cp-save-dot" />}
          </span>
        )}
      </div>

      <div className="divider" />

      {/* ── Content ── */}
      <div className="cp-scroll">
        {!local ? (
          <EmptyState />
        ) : (
          <div className="cp-body">

            {/* Objetivo */}
            <div className="cp-field">
              <div className="cp-field-header">
                <label className="cp-field-label text-label">Objetivo del video</label>
                <button
                  className={`cp-improve-btn${improving === 'objective' ? ' is-loading' : ''}`}
                  onClick={() => handleImprove('objective')}
                  disabled={improving !== null}
                  title="Mejorar con IA"
                >
                  {improving === 'objective'
                    ? <span className="cp-improve-spinner" />
                    : '✨'}
                </button>
              </div>
              <input
                className="cp-input"
                value={local.objective}
                onChange={(e) => handleChange('objective', e.target.value)}
                placeholder="¿Qué quieres lograr con este video?"
                spellCheck
              />
              {suggestions.objective && (
                <AISuggestion
                  text={suggestions.objective}
                  onAccept={() => handleAccept('objective', suggestions.objective)}
                  onDiscard={() => clearSuggestion('objective')}
                />
              )}
              {/* Chips */}
              <div className="cp-chips" role="group" aria-label="Objetivos rápidos">
                {OBJECTIVE_CHIPS.map((chip) => {
                  const active = isChipActive(chip.label)
                  return (
                    <button
                      key={chip.label}
                      className={`cp-chip${active ? ' is-active' : ''}`}
                      style={{ '--chip-color': chip.color }}
                      onClick={() => handleChipClick(chip.label)}
                      type="button"
                    >
                      {active && <span className="cp-chip-dot" />}
                      {chip.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="cp-field-divider" />

            {/* Idea */}
            <div className="cp-field">
              <div className="cp-field-header">
                <label className="cp-field-label text-label">Idea del video</label>
                <button
                  className={`cp-improve-btn${improving === 'idea' ? ' is-loading' : ''}`}
                  onClick={() => handleImprove('idea')}
                  disabled={improving !== null}
                  title="Mejorar con IA"
                >
                  {improving === 'idea'
                    ? <span className="cp-improve-spinner" />
                    : '✨'}
                </button>
              </div>
              <AutoTextarea
                className="cp-textarea"
                value={local.idea}
                onChange={(e) => handleChange('idea', e.target.value)}
                placeholder="Describe la idea central, el ángulo, el personaje o la situación de partida del video."
              />
              {suggestions.idea && (
                <AISuggestion
                  text={suggestions.idea}
                  onAccept={() => handleAccept('idea', suggestions.idea)}
                  onDiscard={() => clearSuggestion('idea')}
                />
              )}
            </div>

            {aiError && (
              <p className="cp-ai-error">{aiError}</p>
            )}

            <div className="cp-field-divider" />

            {/* Key questions */}
            <div className="cp-field">
              <button
                className={`cp-questions-btn${questionsLoading ? ' is-loading' : ''}${questions ? ' is-active' : ''}`}
                onClick={handleAskQuestions}
                disabled={questionsLoading}
              >
                {questionsLoading
                  ? <span className="cp-improve-spinner" />
                  : <Icon name="lightbulb" size={13} />}
                {questions ? 'Ocultar preguntas' : 'Preguntas clave'}
              </button>

              {questions && (
                <ol className="cp-questions-list">
                  {questions.map((q, i) => (
                    <li key={i} className="cp-question-item">
                      <span className="cp-question-num">{i + 1}</span>
                      <span className="cp-question-text">{q}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  )
}
