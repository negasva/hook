import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { newId } from '../utils/id'
import { now } from '../utils/date'
import { supabase } from '../lib/supabase'

/* ─── Supabase sync helpers ────────────────────────────────────────────────── */

// Convert store shapes → DB row shapes
const groupRow = (g) => ({
  id: g.id, name: g.name, parent_id: g.parentId ?? null,
  color: g.color, icon: g.icon, order: g.order,
})

const scriptRow = (s) => ({
  id: s.id, title: s.title, group_id: s.groupId ?? null,
  hook: s.hook, rehook: s.rehook, content: s.content,
  finale: s.finale, cta: s.cta, objective: s.objective,
  idea: s.idea, created_at: s.createdAt, updated_at: s.updatedAt,
})

// Fire-and-forget — local state is source of truth, Supabase is synced after
const up = (table, data) => {
  supabase?.from(table).upsert(data).then()
}
const del = (table, id) => {
  supabase?.from(table).delete().eq('id', id).then()
}

/* ─── Store ────────────────────────────────────────────────────────────────── */

export const useScriptStore = create(
  persist(
    (set, get) => ({
      groups:  [],
      scripts: [],

      // Called by useDataInit to overwrite local data with Supabase data
      _hydrate: ({ groups, scripts }) => set({ groups, scripts }),

      /* ── Group CRUD ──────────────────────────────────────────────────────── */

      addGroup: (fields) => {
        const { groups } = get()
        const siblingsCount = groups.filter(
          (g) => g.parentId === (fields.parentId ?? null),
        ).length

        const group = {
          id:       newId(),
          name:     fields.name     ?? 'Nuevo grupo',
          parentId: fields.parentId ?? null,
          color:    fields.color    ?? '#6b7280',
          icon:     fields.icon     ?? 'folder',
          order:    fields.order    ?? siblingsCount,
        }

        set((s) => ({ groups: [...s.groups, group] }))
        up('groups', groupRow(group))
        return group
      },

      updateGroup: (id, patch) => {
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }))
        const updated = get().groups.find((g) => g.id === id)
        if (updated) up('groups', groupRow(updated))
      },

      deleteGroup: (id) => {
        const { groups, scripts } = get()

        const collectIds = (rootId) => {
          const ids = [rootId]
          groups
            .filter((g) => g.parentId === rootId)
            .forEach((child) => ids.push(...collectIds(child.id)))
          return ids
        }
        const idsToDelete = new Set(collectIds(id))

        // Scripts that lose their group → update groupId to null in Supabase
        scripts
          .filter((s) => idsToDelete.has(s.groupId))
          .forEach((s) => up('scripts', scriptRow({ ...s, groupId: null })))

        set({
          groups:  groups.filter((g) => !idsToDelete.has(g.id)),
          scripts: scripts.map((s) =>
            idsToDelete.has(s.groupId) ? { ...s, groupId: null } : s,
          ),
        })

        idsToDelete.forEach((gid) => del('groups', gid))
      },

      reorderGroup: (id, newOrder) => {
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, order: newOrder } : g)),
        }))
        const updated = get().groups.find((g) => g.id === id)
        if (updated) up('groups', groupRow(updated))
      },

      /* ── Script CRUD ─────────────────────────────────────────────────────── */

      addScript: (fields = {}) => {
        const ts = now()
        const script = {
          id:        newId(),
          title:     fields.title     ?? 'Sin título',
          hook:      fields.hook      ?? '',
          rehook:    fields.rehook    ?? '',
          content:   fields.content   ?? '',
          finale:    fields.finale    ?? '',
          cta:       fields.cta       ?? '',
          objective: fields.objective ?? '',
          idea:      fields.idea      ?? '',
          groupId:   fields.groupId   ?? null,
          createdAt: ts,
          updatedAt: ts,
        }

        set((s) => ({ scripts: [...s.scripts, script] }))
        up('scripts', scriptRow(script))
        return script
      },

      updateScript: (id, patch) => {
        set((s) => ({
          scripts: s.scripts.map((sc) =>
            sc.id === id ? { ...sc, ...patch, updatedAt: now() } : sc,
          ),
        }))
        const updated = get().scripts.find((s) => s.id === id)
        if (updated) up('scripts', scriptRow(updated))
      },

      deleteScript: (id) => {
        set((s) => ({ scripts: s.scripts.filter((sc) => sc.id !== id) }))
        del('scripts', id)
      },

      /* ── Selectors ───────────────────────────────────────────────────────── */

      getScript:        (id)      => get().scripts.find((s) => s.id === id) ?? null,
      getGroup:         (id)      => get().groups.find((g) => g.id === id) ?? null,
      getScriptsByGroup:(groupId) => get().scripts.filter((s) => s.groupId === groupId),
      getRootGroups:    ()        => get().groups.filter((g) => g.parentId === null).sort((a, b) => a.order - b.order),
      getChildGroups:   (pid)     => get().groups.filter((g) => g.parentId === pid).sort((a, b) => a.order - b.order),
    }),
    { name: 'scriptlab-data' }, // localStorage key
  ),
)
