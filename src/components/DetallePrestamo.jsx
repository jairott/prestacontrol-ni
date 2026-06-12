import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { fmt, today } from '../utils'

export default function DetallePrestamo({ prestamo: initialData, onBack, onUpdate, toast, isAdmin }) {
  const [p, setP] = useState(initialData)
  const [toggling, setToggling] = useState(null)
  const hoy = today()

  useEffect(() => {
    const channel = supabase
      .channel('detalle-' + initialData.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cuotas', filter: `prestamo_id=eq.${initialData.id}` }, () => refetch())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [initialData.id])

  async function refetch() {
    const { data } = await supabase.from('prestamos').select('*, cuotas(*)').eq('id', initialData.id).single()
    if (data) setP(data)
  }

  async function toggleCuota(cuota) {
    setToggling(cuota.id)
    const nuevaFecha = !cuota.pagada ? hoy : null
    const { error } = await supabase
      .from('cuotas')
      .update({ pagada: !cuota.pagada, fecha_pago: nuevaFecha })
      .eq('id', cuota.id)
    if (!error) {
      toast(cuota.pagada ? 'Cuota desmarcada' : '✓ Cuota marcada como pagada')
      await refetch()
      onUpdate()
    }
    setToggling(null)
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este préstamo y todas sus cuotas?')) return
    await supabase.from('cuotas').delete().eq('prestamo_id', p.id)
    await supabase.from('prestamos').delete().eq('id', p.id)
    toast('Préstamo eliminado')
    onUpdate()
    onBack()
  }

  const cuotas = [...(p.cuotas || [])].sort((a, b) => a.num - b.num)
  const pagadas = cuotas.filter(c => c.pagada).length
  const total = cuotas.length
  const cobrado = cuotas.filter(c => c.pagada).reduce((s, c) => s + c.monto, 0)
  const pendiente = cuotas.filter(c => !c.pagada).reduce((s, c) => s + c.monto, 0)

  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>← Volver</button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{p.nombre}</div>
            {p.telefono && <div style={{ fontSize: 13, color: 'var(--gris)', marginTop: 2 }}>📱 {p.telefono}</div>}
          </div>
          {isAdmin && (
            <button
              style={{ background: 'var(--rojo-claro)', color: 'var(--rojo)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
              onClick={eliminar}
            >
              Eliminar
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ background: 'var(--gris-claro)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--gris)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.03em' }}>Prestado</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 3 }}>{fmt(p.monto)}</div>
          </div>
          <div style={{ background: 'var(--verde-claro)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--verde-dark)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.03em' }}>Cobrado</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 3, color: 'var(--verde-dark)' }}>{fmt(cobrado)}</div>
          </div>
          <div style={{ background: 'var(--amarillo-claro)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#8a5c00', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.03em' }}>Pendiente</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 3, color: '#8a5c00' }}>{fmt(pendiente)}</div>
          </div>
        </div>

        <div className="progress" style={{ marginTop: '1rem' }}>
          <div className="progress-fill" style={{ width: total ? Math.round(pagadas / total * 100) + '%' : '0%' }}></div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--gris)', marginTop: 5, textAlign: 'right' }}>
          {pagadas}/{total} cuotas pagadas · {fmt(p.total)} total
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: '.875rem', fontSize: 15 }}>
          Cuotas — toca para marcar/desmarcar
        </div>
        <div className="cuotas-grid">
          {cuotas.map(c => {
            const vencida = !c.pagada && c.fecha < hoy
            const cls = c.pagada ? 'pagada' : vencida ? 'vencida' : ''
            const loading = toggling === c.id
            return (
              <div
                key={c.id}
                className={`cuota-pill ${cls}`}
                onClick={() => !loading && toggleCuota(c)}
                style={{ opacity: loading ? .5 : 1, position: 'relative' }}
              >
                <span className="num">Cuota {c.num}</span>
                <span className="monto">{fmt(c.monto)}</span>
                <span className="fecha">{c.fecha}</span>
                <span className="estado">
                  {loading ? '...' : c.pagada ? '✓ Pagada' : vencida ? '⚠ Vencida' : 'Pendiente'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
