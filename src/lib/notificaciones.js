import { supabase } from './supabase'

const RESEND_KEY = import.meta.env.VITE_RESEND_API_KEY
const EMAIL_DESTINO = import.meta.env.VITE_NOTIFICATION_EMAIL || 'jairott@icloud.com'

export async function enviarReporteDisario() {
  const hoy = new Date().toISOString().split('T')[0]

  // Cuotas de HOY
  const { data: cuotasHoy } = await supabase
    .from('cuotas')
    .select('*, prestamos(cliente_nombre, telefono, direccion)')
    .eq('fecha', hoy)
    .eq('pagada', false)

  // Cuotas VENCIDAS (antes de hoy, no pagadas)
  const { data: cuotasVencidas } = await supabase
    .from('cuotas')
    .select('*, prestamos(cliente_nombre, telefono, direccion)')
    .lt('fecha', hoy)
    .eq('pagada', false)

  const formatCuota = (c) =>
    `• ${c.prestamos?.cliente_nombre || 'Sin nombre'} — C$ ${Number(c.monto).toLocaleString('es-NI')} — ${c.prestamos?.direccion || 'Sin dirección'}`

  const hoyHTML = cuotasHoy?.length
    ? cuotasHoy.map(formatCuota).join('<br>')
    : 'Ninguno'

  const vencidasHTML = cuotasVencidas?.length
    ? cuotasVencidas.map(formatCuota).join('<br>')
    : 'Ninguno'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6366f1; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">💰 Reporte Diario — ControlPréstamos NI</h1>
        <p style="color: #c7d2fe; margin: 5px 0 0;">${new Date().toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      
      <div style="background: #1e293b; padding: 20px;">
        <h2 style="color: #22c55e; font-size: 16px;">📅 Cobros de hoy (${cuotasHoy?.length || 0})</h2>
        <p style="color: #e2e8f0; line-height: 1.8;">${hoyHTML}</p>
        
        <hr style="border-color: #334155; margin: 20px 0;">
        
        <h2 style="color: #ef4444; font-size: 16px;">⚠️ Clientes atrasados (${cuotasVencidas?.length || 0})</h2>
        <p style="color: #e2e8f0; line-height: 1.8;">${vencidasHTML}</p>
      </div>
      
      <div style="background: #0f172a; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
        <p style="color: #64748b; font-size: 12px; margin: 0;">ControlPréstamos Nicaragua</p>
      </div>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'ControlPréstamos <onboarding@resend.dev>',
      to: EMAIL_DESTINO,
      subject: `💰 Reporte del día — ${new Date().toLocaleDateString('es-NI')}`,
      html
    })
  })

  return res.ok
}
