import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
}) : null

// Resolves with the user once a real session exists (from localStorage or after login).
// All store writes await this — they queue silently until auth is ready.
let _resolveAuth
export const authReady = new Promise((resolve) => { _resolveAuth = resolve })

if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) _resolveAuth(data.session.user)
  })
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) _resolveAuth(session.user)
  })
}
