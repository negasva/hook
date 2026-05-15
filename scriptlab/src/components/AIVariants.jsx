import Icon from './Icon'

export default function AIVariants({ variants, loading, error, sectionColor, onSelect, onRegenerate, onClose }) {
  return (
    <div className="ai-panel" style={{ '--section-color': sectionColor }}>
      {loading && (
        <div className="ai-shimmer">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ai-shimmer-row" style={{ '--row': i }}>
              <div className="ai-shimmer-bone ai-shimmer-num-bone" />
              <div className="ai-shimmer-lines">
                <div className="ai-shimmer-bone ai-shimmer-line-bone" style={{ width: `${68 + i * 9}%` }} />
                <div className="ai-shimmer-bone ai-shimmer-line-bone" style={{ width: '42%' }} />
              </div>
            </div>
          ))}
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
