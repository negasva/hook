import { create } from 'zustand'

export const useUIStore = create((set) => ({
  activeGroupId: null,
  activeScriptId: null,
  collapsedGroups: [],
  scriptListView: 'grid',
  theme: localStorage.getItem('sl-theme') ?? 'dark',

  setActiveGroup:     (id) => set({ activeGroupId: id }),
  setActiveScript:    (id) => set({ activeScriptId: id }),
  setScriptListView:  (v)  => set({ scriptListView: v }),

  toggleGroupCollapsed: (id) =>
    set((s) => ({
      collapsedGroups: s.collapsedGroups.includes(id)
        ? s.collapsedGroups.filter((gid) => gid !== id)
        : [...s.collapsedGroups, id],
    })),

  setTheme: (t) => {
    localStorage.setItem('sl-theme', t)
    document.documentElement.setAttribute('data-theme', t)
    set({ theme: t })
  },

  // ── Dialog (replaces window.confirm / window.alert) ──
  dialog: null,
  showDialog: (opts) => set({ dialog: opts }),
  hideDialog: () => set({ dialog: null }),
}))
