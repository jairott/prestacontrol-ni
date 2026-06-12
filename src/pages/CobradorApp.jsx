import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useToast, fmt, initials, today } from '../utils'
import DetallePrestamo from '../components/DetallePrestamo'

export default function CobradorApp({ session }) {
  const [prestamos, setPrestamos] = useState([])
  const [loading, setLoading] = useState(true)
  const [detalle, setDetalle] = useState(null)
  const { show, ToastEl } = useToast()

  useEffect(() => {
    fetchPrestamos()
    const channel = supabase
      .channel('cobrador-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cuotas' }, () => fetchPrestamos())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchPrestamos() {
    const { data } = await supabase
      .from('prestamos')
      .select('*, cuotas(*)')
      .order('created_at', { ascending: false })
    setPrestamos((data || []).filter(p => p.cuotas?.some(c => !c.pagada)))
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const hoy = today()

  if (detalle) return (
    <DetallePrestamo
      prestamo={detalle}
      onBack={() => { setDetalle(null); fetchPrestamos() }}
      onUpdate={fetchPrestamos}
      toast={show}
      isAdmin={false}
    />
  )

  return (
    <>
      <ToastEl />
      <div className="page">
        <div className="page-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>📲</span>
            <h2>Cobros del día</h2>
          </div>
          <button className="btn-secondary btn-sm" onClick={handleLogout}>Salir</button>
        </div>

        {loading ? <div className="loading"><div className="spinner"></div></div> :
          prestamos.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🎉</div>
              <p>¡Todo al día!<br />No hay cuotas pendientes.</p>
            </div>
          ) : prestamos.map(p => {
            const pendientes = p.cuotas?.filter(c => !c.pagada) || []
            const proxima = pendientes.sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
            const vencida = proxima && proxima.fecha < hoy
            const pagadas = p.cuotas?.filter(c => c.pagada).length || 0
            const total = p.cuotas?.length || 0
            return (
              <div key={p.id} className="card" onClick={() => setDetalle(p)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '.75rem' }}>
                  <div className="avatar">{initials(p.nombre)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{p.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--gris)' }}>{p.telefono || ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: vencida ? 'var(--rojo)' : 'var(--verde)' }}>
                      {proxima ? fmt(proxima.monto) : ''}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gris)' }}>
                      {proxima ? (vencida ? '⚠ Vencida ' : '') + proxima.fecha : ''}
                    </div>
                  </div>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{ width: Math.round(pagadas / total * 100) + '%' }}></div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--gris)', marginTop: 5 }}>
                  {pagadas}/{total} cuotas · toca para registrar pago
                </div>
              </div>
            )
          })
        }
      </div>
    </>
  )
}
