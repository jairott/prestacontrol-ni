import { useState, useCallback } from 'react'

export function useToast() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)

  const show = useCallback((text) => {
    setMsg(text)
    setVisible(true)
    setTimeout(() => setVisible(false), 2200)
  }, [])

  const ToastEl = () => (
    <div className={`toast ${visible ? 'show' : ''}`}>{msg}</div>
  )

  return { show, ToastEl }
}

export function fmt(n) {
 return 'C$ ' + Number(n).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202f/g, ',')
}

export function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function today() {
  return new Date().toISOString().split('T')[0]
}
