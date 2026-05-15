import { create } from 'zustand'

export const useUIStore = create((set) => ({
  activeGroupId: null,   // null → "All scripts"
  activeScriptId: null,
  collapsedGroups: [],   // array of group IDs that are collapsed

  setActiveGroup: (id) => set({ activeGroupId: id }),
  setActiveScript: (id) => set({ activeScriptId: id }),

  toggleGroupCollapsed: (id) =>
    set((s) => ({
      collapsedGroups: s.collapsedGroups.includes(id)
        ? s.collapsedGroups.filter((gid) => gid !== id)
        : [...s.collapsedGroups, id],
    })),
}))
