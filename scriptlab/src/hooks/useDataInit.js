import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useScriptStore } from '../store/useScriptStore'

export function useDataInit() {
  const hydrate = useScriptStore((s) => s._hydrate)

  useEffect(() => {
    if (!supabase) return // no Supabase config → localStorage-only mode

    const init = async () => {
      // Anonymous auth — creates a persistent user per device/browser
      await supabase.auth.signInAnonymously()

      const [{ data: groupRows, error: ge }, { data: scriptRows, error: se }] =
        await Promise.all([
          supabase.from('groups').select('*').order('order'),
          supabase.from('scripts').select('*').order('created_at'),
        ])

      if (ge || se) {
        console.error('[ScriptLab] Supabase load error', ge ?? se)
        return
      }

      const groups = (groupRows ?? []).map((r) => ({
        id:       r.id,
        name:     r.name,
        parentId: r.parent_id,
        color:    r.color,
        icon:     r.icon,
        order:    r.order,
      }))

      const scripts = (scriptRows ?? []).map((r) => ({
        id:        r.id,
        title:     r.title,
        groupId:   r.group_id,
        hook:      r.hook,
        rehook:    r.rehook,
        content:   r.content,
        finale:    r.finale,
        cta:       r.cta,
        objective: r.objective,
        idea:      r.idea,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }))

      hydrate({ groups, scripts })
    }

    init().catch(console.error)
  }, [hydrate])
}
