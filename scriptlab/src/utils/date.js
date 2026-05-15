export const now = () => new Date().toISOString()

export const formatDate = (iso) =>
  new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
