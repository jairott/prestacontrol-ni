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
return 'C$ ' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
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

// Desglose de lo que falta por cobrar de un préstamo, separando capital e interés.
// Cada pago se reparte en proporción (promedio): capital = monto / total del préstamo.
export function desglosePrestamo(prestamo, cuotasPrestamo) {
  const total = cuotasPrestamo.reduce((s,c) => s + Number(c.monto), 0) || Number(prestamo.monto) * (1 + Number(prestamo.interes_porcentaje || 0) / 100)
  const cobrado = cuotasPrestamo.reduce((s,c) => s + (c.pagada ? Number(c.monto) : Number(c.monto_pagado || 0)), 0)
  const pendiente = Math.max(0, total - cobrado)
  const ratio = total > 0 ? Math.min(1, Number(prestamo.monto) / total) : 1
  const capitalPendiente = pendiente * ratio
  return { total, cobrado, pendiente, ratio, capitalPendiente, interesPendiente: pendiente - capitalPendiente }
}
