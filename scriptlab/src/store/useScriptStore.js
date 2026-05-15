import { create } from 'zustand'
import { newId } from '../utils/id'
import { now } from '../utils/date'

/* ─── Seed data ────────────────────────────────────────────────────────────── */

const SEED_GROUPS = [
  {
    id: 'g-marketing',
    name: 'Marketing',
    parentId: null,
    color: '#f59e0b',
    icon: 'megaphone',
    order: 0,
  },
  {
    id: 'g-education',
    name: 'Educación',
    parentId: null,
    color: '#6366f1',
    icon: 'book',
    order: 1,
  },
  {
    id: 'g-social-ads',
    name: 'Social Ads',
    parentId: 'g-marketing',
    color: '#ec4899',
    icon: 'sparkles',
    order: 0,
  },
]

const SEED_SCRIPTS = [
  {
    id: 's-001',
    title: 'Lanzamiento producto — awareness',
    hook: '¿Qué pasaría si pudieras duplicar tus ventas sin gastar más en publicidad?',
    rehook: 'Lo que te voy a mostrar cambió por completo cómo vendo online.',
    content:
      'El problema no es tu producto. Es cómo lo estás presentando. La mayoría de marcas hablan de características. Tú tienes que hablar de transformación. Muestra el antes y el después. Hazlo específico, hazlo visual, hazlo real.',
    finale:
      'Con este método pasé de 20 a 80 ventas mensuales en 60 días sin aumentar el presupuesto de ads.',
    cta: 'Enlace en bio para ver el caso completo.',
    groupId: 'g-social-ads',
    createdAt: '2025-01-10T09:00:00.000Z',
    updatedAt: '2025-01-10T09:00:00.000Z',
  },
  {
    id: 's-002',
    title: 'Tutorial — Framework de contenido 3x3',
    hook: 'Tres preguntas. Tres respuestas. Noventa días de contenido listo.',
    rehook: 'Esto es lo que usan los creadores con más de 100k seguidores para no quedarse sin ideas.',
    content:
      'Primero: define tu cliente ideal en una frase. Segundo: lista sus tres mayores dolores. Tercero: para cada dolor, crea tres formatos distintos — un carrusel, un video corto y un hilo. Ya tienes 9 piezas. Repite el ciclo cada mes.',
    finale:
      'El contenido consistente no requiere creatividad infinita. Requiere un sistema.',
    cta: 'Guarda este video y úsalo como referencia cada lunes.',
    groupId: 'g-education',
    createdAt: '2025-01-14T11:30:00.000Z',
    updatedAt: '2025-01-15T08:20:00.000Z',
  },
  {
    id: 's-003',
    title: 'Storytelling — El error que me costó 10k',
    hook: 'Perdí diez mil dólares por ignorar este consejo. No lo ignoré una vez. Lo ignoré cinco veces.',
    rehook: 'Hoy te cuento exactamente qué salió mal para que no cometas el mismo error.',
    content:
      'Año 2022. Tenía un producto validado, una audiencia creciente y cero sistema de seguimiento. Cada venta era manual. Cada cliente, un esfuerzo individual. Cuando intenté escalar, el modelo colapsó. No era falta de demanda. Era falta de infraestructura.',
    finale:
      'La lección: valida rápido, pero construye el sistema antes de escalar. En ese orden.',
    cta: 'Comenta "sistema" y te mando el checklist que uso hoy.',
    groupId: 'g-marketing',
    createdAt: '2025-01-18T16:00:00.000Z',
    updatedAt: '2025-01-18T16:00:00.000Z',
  },
]

/* ─── Store ────────────────────────────────────────────────────────────────── */

export const useScriptStore = create((set, get) => ({
  groups: SEED_GROUPS,
  scripts: SEED_SCRIPTS,

  /* ── Group CRUD ────────────────────────────────────────────────────────── */

  addGroup: (fields) => {
    const { groups } = get()
    const siblingsCount = groups.filter(
      (g) => g.parentId === (fields.parentId ?? null),
    ).length

    const group = {
      id: newId(),
      name: fields.name ?? 'Nuevo grupo',
      parentId: fields.parentId ?? null,
      color: fields.color ?? '#6b7280',
      icon: fields.icon ?? 'folder',
      order: fields.order ?? siblingsCount,
    }

    set((s) => ({ groups: [...s.groups, group] }))
    return group
  },

  updateGroup: (id, patch) => {
    set((s) => ({
      groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }))
  },

  deleteGroup: (id) => {
    const { groups, scripts } = get()

    // collect ids of this group and all descendant groups
    const collectIds = (rootId) => {
      const ids = [rootId]
      groups
        .filter((g) => g.parentId === rootId)
        .forEach((child) => ids.push(...collectIds(child.id)))
      return ids
    }
    const idsToDelete = new Set(collectIds(id))

    set({
      groups: groups.filter((g) => !idsToDelete.has(g.id)),
      scripts: scripts.map((s) =>
        idsToDelete.has(s.groupId) ? { ...s, groupId: null } : s,
      ),
    })
  },

  reorderGroup: (id, newOrder) => {
    set((s) => ({
      groups: s.groups.map((g) => (g.id === id ? { ...g, order: newOrder } : g)),
    }))
  },

  /* ── Script CRUD ───────────────────────────────────────────────────────── */

  addScript: (fields = {}) => {
    const ts = now()
    const script = {
      id: newId(),
      title: fields.title ?? 'Sin título',
      hook: fields.hook ?? '',
      rehook: fields.rehook ?? '',
      content: fields.content ?? '',
      finale: fields.finale ?? '',
      cta: fields.cta ?? '',
      groupId: fields.groupId ?? null,
      createdAt: ts,
      updatedAt: ts,
    }

    set((s) => ({ scripts: [...s.scripts, script] }))
    return script
  },

  updateScript: (id, patch) => {
    set((s) => ({
      scripts: s.scripts.map((sc) =>
        sc.id === id ? { ...sc, ...patch, updatedAt: now() } : sc,
      ),
    }))
  },

  deleteScript: (id) => {
    set((s) => ({ scripts: s.scripts.filter((sc) => sc.id !== id) }))
  },

  /* ── Selectors ─────────────────────────────────────────────────────────── */

  getScript: (id) => get().scripts.find((s) => s.id === id) ?? null,

  getGroup: (id) => get().groups.find((g) => g.id === id) ?? null,

  getScriptsByGroup: (groupId) =>
    get().scripts.filter((s) => s.groupId === groupId),

  getRootGroups: () =>
    get()
      .groups.filter((g) => g.parentId === null)
      .sort((a, b) => a.order - b.order),

  getChildGroups: (parentId) =>
    get()
      .groups.filter((g) => g.parentId === parentId)
      .sort((a, b) => a.order - b.order),
}))
