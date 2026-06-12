import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useToast, fmt, initials, today } from '../utils'
import NuevoPrestamo from '../components/NuevoPrestamo'
import DetallePrestamo from '../components/DetallePrestamo'

export default function AdminApp({ session, onLogout }) 
  const [tab, setTab] = useState('panel')
  const [prestamos, setPrestamos] = useState([])
  const [loading, setLoading] = useState(true)
  const [detalle, setDetalle] = useState(null)
  const { show, ToastEl } = useToast()

  useEffect(() => {
    fetchPrestamos()
    const channel = supabase
      .channel('cuotas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cuotas' }, () => fetchPrestamos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prestamos' }, () => fetchPrestamos())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchPrestamos() {
    const { data } = await supabase
      .from('prestamos')
      .select('*, cuotas(*)')
      .order('created_at', { ascending: false })
    setPrestamos(data || [])
    setLoading(false)
  }
function handleLogout() {
    if (onLogout) onLogout()
  }
  }

  const hoy = today()
  const totalPrestado = prestamos.reduce((s, p) => s + p.monto, 0)
  const totalCobrado = prestamos.reduce((s, p) => s + (p.cuotas?.filter(c => c.pagada).reduce((a, c) => a + c.monto, 0) || 0), 0)
  const totalPendiente = prestamos.reduce((s, p) => s + (p.cuotas?.filter(c => !c.pagada).reduce((a, c) => a + c.monto, 0) || 0), 0)
  const vencidas = prestamos.reduce((s, p) => s + (p.cuotas?.filter(c => !c.pagada && c.fecha < hoy).length || 0), 0)

  if (detalle) return (
    <DetallePrestamo
      prestamo={detalle}
      onBack={() => { setDetalle(null); fetchPrestamos() }}
      onUpdate={fetchPrestamos}
      toast={show}
      isAdmin={true}
    />
  )

  return (
    <>
      <ToastEl />
      {tab === 'panel' && (
        <div className="page">
          <div className="page-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>💰</span>
              <h2>PrestaControl</h2>
            </div>
            <button className="btn-secondary btn-sm" onClick={handleLogout}>Salir</button>
          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-label">Total prestado</div>
              <div className="metric-val" style={{ fontSize: 17 }}>{fmt(totalPrestado)}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Cobrado</div>
              <div className="metric-val verde" style={{ fontSize: 17 }}>{fmt(totalCobrado)}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Por cobrar</div>
              <div className="metric-val naranja" style={{ fontSize: 17 }}>{fmt(totalPendiente)}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Cuotas vencidas</div>
              <div className={`metric-val ${vencidas > 0 ? 'rojo' : 'verde'}`} style={{ fontSize: 28 }}>{vencidas}</div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '.875rem', fontSize: 15 }}>Clientes ({prestamos.length})</div>
            {loading ? <div className="loading"><div className="spinner"></div></div> :
              prestamos.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📋</div>
                  <p>No hay préstamos aún.<br />Toca "Nuevo" para agregar uno.</p>
                </div>
              ) : prestamos.map(p => {
                const pagadas = p.cuotas?.filter(c => c.pagada).length || 0
                const total = p.cuotas?.length || p.n_cuotas
                const pct = total ? Math.round(pagadas / total * 100) : 0
                const venc = p.cuotas?.filter(c => !c.pagada && c.fecha < hoy).length || 0
                return (
                  <div key={p.id} className="client-row" onClick={() => setDetalle(p)}>
                    <div className="avatar">{initials(p.nombre)}</div>
                    <div className="client-info">
                      <div className="client-name">{p.nombre}</div>
                      <div className="client-sub">{fmt(p.monto)} · {pagadas}/{total} cuotas</div>
                      <div className="progress">
                        <div className="progress-fill" style={{ width: pct + '%' }}></div>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {venc > 0
                        ? <span className="badge badge-rojo">⚠ {venc}</span>
                        : pagadas === total
                          ? <span className="badge badge-verde">✓ Pagado</span>
                          : <span className="badge badge-amarillo">{total - pagadas} pend.</span>
                      }
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      )}

      {tab === 'nuevo' && (
        <NuevoPrestamo
          onSaved={() => { show('✓ Préstamo guardado'); setTab('panel'); fetchPrestamos() }}
          onCancel={() => setTab('panel')}
        />
      )}

      <nav className="bottom-nav">
        <button className={`nav-btn ${tab === 'panel' ? 'active' : ''}`} onClick={() => setTab('panel')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Panel
        </button>
        <button className={`nav-btn ${tab === 'nuevo' ? 'active' : ''}`} onClick={() => setTab('nuevo')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Nuevo
        </button>
      </nav>
    </>
  )
}
