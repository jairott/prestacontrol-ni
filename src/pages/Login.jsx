import { useState } from 'react'
import { Lock } from 'lucide-react'

const PIN = '1234'

export default function Login({ onLogin }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const handleKey = (k) => {
    if (k === 'del') { setInput(p => p.slice(0, -1)); setError(false); return }
    if (input.length >= 4) return
    const next = input + k
    setInput(next)
    if (next.length === 4) {
      if (next === PIN) { onLogin() }
      else { setError(true); setTimeout(() => { setInput(''); setError(false) }, 800) }
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#0f172a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <div style={{background:'#1e293b',borderRadius:16,padding:'2.5rem 2rem',width:320,textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
        <div style={{width:56,height:56,background:'#6366f1',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem'}}>
          <Lock size={26} color="white" />
        </div>
        <h1 style={{color:'white',fontSize:'1.4rem',fontWeight:700,marginBottom:4}}>ControlPréstamos</h1>
        <p style={{color:'#94a3b8',fontSize:13,marginBottom:'2rem'}}>Nicaragua</p>

        <div style={{display:'flex',gap:10,justifyContent:'center',marginBottom:'1.5rem'}}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width:14,height:14,borderRadius:'50%',
              background: i < input.length ? (error ? '#ef4444' : '#6366f1') : '#334155',
              transition:'background 0.2s'
            }} />
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((k,i) => (
            k === '' ? <div key={i} /> :
            <button key={i} onClick={() => handleKey(k)} style={{
              padding:'1rem',borderRadius:10,border:'none',
              background: k === 'del' ? '#334155' : '#293548',
              color:'white',fontSize: k === 'del' ? 13 : 20,fontWeight:600,
              cursor:'pointer',transition:'background 0.15s'
            }}
            onMouseOver={e => e.target.style.background='#3d4f6b'}
            onMouseOut={e => e.target.style.background = k === 'del' ? '#334155' : '#293548'}
            >{k === 'del' ? '⌫' : k}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
