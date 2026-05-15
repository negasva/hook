import { useEffect } from 'react'
import { supabase, authReady } from '../lib/supabase'
import { useScriptStore } from '../store/useScriptStore'

export function useDataInit() {
  const hydrate        = useScriptStore((s) => s._hydrate)
  const pushToSupabase = useScriptStore((s) => s._pushToSupabase)

  useEffect(() => {
    if (!supabase) return // localStorage-only mode

    const init = async () => {
 claude/remove-vite-api-prefix-zqYpU
      const { error: authError } = await supabase.auth.signInAnonymously()
      if (authError) {
        // Auth not enabled or failed — keep localStorage data intact
        console.warn('[ScriptLab] Supabase auth failed, using localStorage:', authError.message)

      const user = await authReady
      if (!user) {
        console.warn('[ScriptLab] No user after auth — check Supabase anonymous auth is enabled')
main
        return
      }

      const [{ data: groupRows, error: ge }, { data: scriptRows, error: se }] =
        await Promise.all([
          supabase.from('groups').select('*').order('order'),
          supabase.from('scripts').select('*').order('created_at'),
        ])

      if (ge) { console.error('[ScriptLab] load groups error:', ge.message); return }
      if (se) { console.error('[ScriptLab] load scripts error:', se.message); return }

      console.log(`[ScriptLab] loaded ${groupRows?.length ?? 0} groups, ${scriptRows?.length ?? 0} scripts`)

      const hasRemote = groupRows.length > 0 || scriptRows.length > 0

      if (!hasRemote) {
        // Supabase is empty for this user — push local data up instead of wiping it
        await pushToSupabase()
        return
      }

      const groups = groupRows.map((r) => ({
        id:       r.id,
        name:     r.name,
        parentId: r.parent_id,
        color:    r.color,
        icon:     r.icon,
        order:    r.order,
      }))

      const scripts = scriptRows.map((r) => ({
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

claude/remove-vite-api-prefix-zqYpU
    init().catch(console.error)
  }, [hydrate, pushToSupabase])

    init().catch((e) => console.error('[ScriptLab] init error:', e.message))
  }, [hydrate])
 main
}
