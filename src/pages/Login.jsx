import { useState } from 'react'

const PIN_ADMIN = '1234'

export default function Login({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (pin === PIN_ADMIN) {
      onLogin('admin')
    } else {
      setError('PIN incorrecto. Intenta de nuevo.')
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
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="••••"
              value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              maxLength={6}
              autoFocus
              required
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
