import Icon from './Icon'

export default function AIVariants({ variants, loading, error, sectionColor, onSelect, onRegenerate, onClose }) {
  return (
    <div className="ai-panel" style={{ '--section-color': sectionColor }}>
      {loading && (
        <div className="ai-loading">
          <span className="ai-spinner" />
          <span className="ai-loading-text">Generando variantes…</span>
        </div>
      )}

      {error && !loading && (
        <div className="ai-error">
          <Icon name="x" size={12} />
          <span>{error}</span>
        </div>
      )}

      {variants && !loading && (
        <>
          <div className="ai-variants">
            {variants.map((v, i) => (
              <button
                key={i}
                className="ai-variant"
                onClick={() => onSelect(v)}
                type="button"
              >
                <span className="ai-variant-num">{i + 1}</span>
                <span className="ai-variant-text">{v}</span>
              </button>
            ))}
          </div>
          <div className="ai-panel-footer">
            <button className="ai-regen-btn" onClick={onRegenerate} type="button">
              <Icon name="sparkles" size={11} />
              Regenerar
            </button>
            <button className="ai-close-btn" onClick={onClose} type="button" title="Cerrar">
              <Icon name="x" size={11} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
