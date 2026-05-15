import { useEffect, useRef } from 'react'
import { useUIStore } from '../store/useUIStore'
import Icon from './Icon'

export default function Dialog() {
  const dialog    = useUIStore((s) => s.dialog)
  const hideDialog = useUIStore((s) => s.hideDialog)
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!dialog) return
    confirmRef.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') { dialog.onCancel?.(); hideDialog() }
      if (e.key === 'Enter')  { dialog.onConfirm?.(); hideDialog() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [dialog, hideDialog])

  if (!dialog) return null

  const handleConfirm = () => { dialog.onConfirm?.(); hideDialog() }
  const handleCancel  = () => { dialog.onCancel?.();  hideDialog() }

  const isAlert = !dialog.onCancel

  return (
    <div className="dlg-backdrop" onClick={isAlert ? handleConfirm : handleCancel}>
      <div
        className="dlg-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dlg-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="dlg-accent" />

        {/* Icon */}
        {dialog.icon && (
          <div className={`dlg-icon dlg-icon--${dialog.variant ?? 'default'}`}>
            <Icon name={dialog.icon} size={20} sw={1.5} />
          </div>
        )}

        {/* Content */}
        <div className="dlg-body">
          {dialog.title && (
            <h2 id="dlg-title" className="dlg-title font-display">{dialog.title}</h2>
          )}
          {dialog.message && (
            <p className="dlg-message">{dialog.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="dlg-actions">
          {!isAlert && (
            <button className="dlg-btn dlg-btn--cancel" onClick={handleCancel}>
              Cancelar
            </button>
          )}
          <button
            ref={confirmRef}
            className={`dlg-btn dlg-btn--confirm${dialog.variant === 'danger' ? ' dlg-btn--danger' : ''}`}
            onClick={handleConfirm}
          >
            {dialog.confirmLabel ?? (isAlert ? 'Aceptar' : 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  )
}
