import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginScreen() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isSignUp) {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) {
        setError(err.message)
      } else {
        setError(null)
        setIsSignUp(false)
        setEmail('')
        setPassword('')
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="font-display login-logo">ScriptLab</span>
          <p className="login-tagline text-label">Tu estudio de guiones</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
          <div className="login-field">
            <label className="login-label text-label" htmlFor="sl-email">
              Correo
            </label>
            <input
              id="sl-email"
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete={isSignUp ? 'off' : 'email'}
              autoCapitalize="none"
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label text-label" htmlFor="sl-password">
              Contraseña
            </label>
            <input
              id="sl-password"
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {error && (
            <p className="login-error">{error}</p>
          )}

          <button
            type="submit"
            className={`login-btn${loading ? ' is-loading' : ''}`}
            disabled={loading || !email || !password}
          >
            {loading ? <span className="login-spinner" /> : isSignUp ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-hint text-label">
            {isSignUp
              ? 'La contraseña se guardará en este dispositivo.'
              : 'La contraseña se guarda en este dispositivo. No volverá a pedírtela aquí.'}
          </p>
          <button
            type="button"
            className="login-toggle"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setEmail('')
              setPassword('')
            }}
          >
            {isSignUp ? '¿Ya tienes cuenta? Entra' : '¿Sin cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  )
}
