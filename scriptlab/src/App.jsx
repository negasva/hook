import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import LoginScreen from './components/LoginScreen'
import { supabase } from './lib/supabase'

export default function App() {
  const [user,    setUser]    = useState(undefined) // undefined = checking
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check existing session (auto-login if already logged in on this device)
    supabase?.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Listen for login / logout
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    }) ?? { data: { subscription: null } }

    return () => subscription?.unsubscribe()
  }, [])

  if (!supabase || loading) return <AppLoading />
  if (!user)                return <LoginScreen />
  return <Layout />
}

function AppLoading() {
  return (
    <div className="app-loading">
      <span className="font-display app-loading-logo">ScriptLab</span>
    </div>
  )
}
