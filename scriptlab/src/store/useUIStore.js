import { create } from 'zustand'

export const useUIStore = create((set) => ({
  activeGroupId: null,     // null → "All scripts"
  activeScriptId: null,
  collapsedGroups: [],     // group IDs that are collapsed
  scriptListView: 'grid',  // 'grid' | 'list'

  setActiveGroup:     (id) => set({ activeGroupId: id }),
  setActiveScript:    (id) => set({ activeScriptId: id }),
  setScriptListView:  (v)  => set({ scriptListView: v }),

  toggleGroupCollapsed: (id) =>
    set((s) => ({
      collapsedGroups: s.collapsedGroups.includes(id)
        ? s.collapsedGroups.filter((gid) => gid !== id)
        : [...s.collapsedGroups, id],
    })),
}))
