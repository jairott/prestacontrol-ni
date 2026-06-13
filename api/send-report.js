export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { cobrosHoy, atrasados, fecha } = req.body

  const formatCuota = (c) =>
    `• <strong>${c.cliente_nombre}</strong> — C$ ${Number(c.monto).toLocaleString('es-NI')} — ${c.direccion || 'Sin dirección'}`

  const hoyHTML = cobrosHoy?.length
    ? cobrosHoy.map(formatCuota).join('<br>')
    : 'Ninguno'

  const vencidasHTML = atrasados?.length
    ? atrasados.map(formatCuota).join('<br>')
    : 'Ninguno'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: #6366f1; padding: 24px;">
        <h1 style="color: white; margin: 0; font-size: 20px;">💰 Reporte Diario — ControlPréstamos NI</h1>
        <p style="color: #c7d2fe; margin: 6px 0 0; font-size: 14px;">${fecha}</p>
      </div>
      <div style="padding: 24px; background: #1e293b;">
        <h2 style="color: #22c55e; font-size: 16px; margin: 0 0 10px;">📅 Cobros de hoy (${cobrosHoy?.length || 0})</h2>
        <p style="color: #e2e8f0; line-height: 2; margin: 0 0 20px;">${hoyHTML}</p>
        <hr style="border: none; border-top: 1px solid #334155; margin: 0 0 20px;">
        <h2 style="color: #ef4444; font-size: 16px; margin: 0 0 10px;">⚠️ Clientes atrasados (${atrasados?.length || 0})</h2>
        <p style="color: #e2e8f0; line-height: 2; margin: 0;">${vencidasHTML}</p>
      </div>
      <div style="padding: 16px; background: #0f172a; text-align: center;">
        <p style="color: #475569; font-size: 12px; margin: 0;">ControlPréstamos Nicaragua</p>
      </div>
    </div>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ControlPréstamos <onboarding@resend.dev>',
        to: process.env.NOTIFICATION_EMAIL || 'jtjairo512@gmail.com',
        subject: `💰 Reporte del día — ${fecha}`,
        html
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      return res.status(400).json({ error: data })
    }

    return res.status(200).json({ success: true, id: data.id })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
