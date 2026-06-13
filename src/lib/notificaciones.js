import { supabase } from './supabase'

export async function enviarReporteDiario() {
  const hoy = new Date().toISOString().split('T')[0]

  const { data: cuotasHoy } = await supabase
    .from('cuotas')
    .select('monto, prestamos(cliente_nombre, direccion)')
    .eq('fecha', hoy)
    .eq('pagada', false)

  const { data: atrasados } = await supabase
    .from('cuotas')
    .select('monto, fecha, prestamos(cliente_nombre, direccion)')
    .lt('fecha', hoy)
    .eq('pagada', false)

  const cobrosHoy = cuotasHoy?.map(c => ({
    cliente_nombre: c.prestamos?.cliente_nombre,
    monto: c.monto,
    direccion: c.prestamos?.direccion
  })) || []

  const atrasadosList = atrasados?.map(c => ({
    cliente_nombre: c.prestamos?.cliente_nombre,
    monto: c.monto,
    direccion: c.prestamos?.direccion
  })) || []

  const fecha = new Date().toLocaleDateString('es-NI', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const res = await fetch('/api/send-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cobrosHoy, atrasados: atrasadosList, fecha })
  })

  return res.ok
}
