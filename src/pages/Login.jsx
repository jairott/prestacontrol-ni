import { useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    onLogin()
  }

  return (
    <div style={{minHeight:'100vh',background:'#0f172a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <div style={{background:'#1e293b',borderRadius:16,padding:'2.5rem 2rem',width:320,textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
        <div style={{width:56,height:56,background:'#6366f1',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem'}}>
          <Lock size={26} color="white" />
        </div>
        <h1 style={{color:'white',fontSize:'1.4rem',fontWeight:700,marginBottom:4}}>ControlPréstamos</h1>
        <p style={{color:'#94a3b8',fontSize:13,marginBottom:'2rem'}}>Nicaragua</p>

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'#0f172a',borderRadius:10,padding:'12px 14px',border:'1px solid #334155'}}>
            <Mail size={16} color="#64748b" />
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Correo"
              style={{flex:1,background:'none',border:'none',outline:'none',color:'white',fontSize:14}}
            />
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'#0f172a',borderRadius:10,padding:'12px 14px',border:'1px solid #334155'}}>
            <Lock size={16} color="#64748b" />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              style={{flex:1,background:'none',border:'none',outline:'none',color:'white',fontSize:14}}
            />
          </div>

          {error && (
            <p style={{color:'#ef4444',fontSize:13,margin:0}}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop:8,padding:'12px',borderRadius:10,border:'none',
            background:'#6366f1',color:'white',fontSize:15,fontWeight:600,
            cursor: loading ? 'default' : 'pointer',opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
