import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

// Auth starts immediately at module load — before any React renders.
// All writes import and await this promise so they never hit RLS unauthenticated.
export const authReady = supabase
  ? supabase.auth.signInAnonymously().then(({ data, error }) => {
      if (error) console.error('[ScriptLab] auth error:', error.message)
      else console.log('[ScriptLab] auth ok — user:', data?.user?.id)
      return data?.user ?? null
    })
  : Promise.resolve(null)
