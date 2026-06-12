import { useState } from 'react'

export default function Login({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (pin.trim() === '1234') {
      onLogin('admin')
    } else {
      setError('PIN incorrecto.')
      setPin('')
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ fontSize: '2.5rem' }}>💰</div>
          <h1>PrestaControl</h1>
          <p>Sistema de préstamos Nicaragua</p>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ingresa tu PIN</label>
            <input
              type="password"
              placeholder="••••"
              value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              autoFocus
            />
          </div>
          <button className="btn-primary" type="submit">
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
