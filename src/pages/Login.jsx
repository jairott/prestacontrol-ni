import { useState } from 'react'
import { Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError('Correo o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <form onSubmit={handleSubmit} style={{ background: '#1e293b', borderRadius: 16, padding: '2.5rem 2rem', width: 320, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ width: 56, height: 56, background: '#6366f1', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Lock size={26} color="white" />
        </div>
        <h1 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>ControlPréstamos</h1>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: '2rem' }}>Nicaragua</p>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, marginBottom: 16 }}
        />

        {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#6366f1', color: 'white', fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
