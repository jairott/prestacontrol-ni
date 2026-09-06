import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Wallet, TrendingUp, TrendingDown, Plus, X } from 'lucide-react'

export default function FlujoCaja() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ tipo:'salida', monto:'', concepto:'', fecha: new Date().toISOString().split('T')[0] })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('movimientos_caja')
      .select('*, prestamos(cliente_nombre)')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
    setMovimientos(data || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const guardarMovimiento = async () => {
    if (!form.monto || !form.concepto.trim()) {
      setError('El monto y el concepto son obligatorios'); return
    }
    setGuardando(true); setError('')
    const { error: err } = await supabase.from('movimientos_caja').insert({
      tipo: form.tipo,
      monto: parseFloat(form.monto),
      concepto: form.concepto.trim(),
      fecha: form.fecha
    })
    setGuardando(false)
    if (err) { setError(err.message); return }
    setForm({ tipo:'salida', monto:'', concepto:'', fecha: new Date().toISOString().split('T')[0] })
    setMostrarForm(false)
    cargar()
  }

  if (loading) return <p style={{color:'#64748b'}}>Cargando...</p>

  const entradas = movimientos.filter(m => m.tipo === 'entrada').reduce((s,m) => s + Number(m.monto), 0)
  const salidas = movimientos.filter(m => m.tipo === 'salida').reduce((s,m) => s + Number(m.monto), 0)
  const saldo = entradas - salidas

  const grupos = {}
  movimientos.forEach(m => {
    if (!grupos[m.fecha]) grupos[m.fecha] = []
    grupos[m.fecha].push(m)
  })
  const fechas = Object.keys(grupos).sort((a, b) => b.localeCompare(a))

  const inputStyle = {
    width:'100%',background:'#0f172a',border:'1px solid #334155',borderRadius:9,
    padding:'10px 14px',color:'white',fontSize:14,boxSizing:'border-box'
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.25rem'}}>
        <div>
          <h1 style={{color:'white',fontSize:'1.6rem',fontWeight:700,margin:0}}>Flujo de caja</h1>
          <p style={{color:'#64748b',fontSize:14,margin:0}}>Registro desde hoy — entradas y salidas</p>
        </div>
        <button onClick={() => setMostrarForm(v => !v)} style={{
          display:'flex',alignItems:'center',gap:6,background:'#6366f1',color:'white',
          border:'none',borderRadius:10,padding:'8px 14px',cursor:'pointer',fontSize:13,fontWeight:600
        }}>
          {mostrarForm ? <X size={15}/> : <Plus size={15}/>}
          {mostrarForm ? 'Cancelar' : 'Nuevo movimiento'}
        </button>
      </div>

      <p style={{color:'#475569',fontSize:12,marginBottom:'1.5rem'}}>
        Los pagos de cuotas y los préstamos entregados se registran solos. Usa "Nuevo movimiento" para gastos u otras entradas/salidas.
      </p>

      {mostrarForm && (
        <div style={{background:'#1e293b',borderRadius:14,padding:'1.25rem',marginBottom:'1.5rem',border:'1px solid #6366f144'}}>
          <div style={{display:'flex',gap:10,marginBottom:'1rem'}}>
            <button onClick={() => setForm(f => ({...f, tipo:'salida'}))} style={{
              flex:1,padding:'10px',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:600,
              background: form.tipo === 'salida' ? '#ef444422' : '#0f172a',
              color: form.tipo === 'salida' ? '#ef4444' : '#64748b',
              border: `1px solid ${form.tipo === 'salida' ? '#ef444444' : '#334155'}`
            }}>Salida (dinero que sale)</button>
            <button onClick={() => setForm(f => ({...f, tipo:'entrada'}))} style={{
              flex:1,padding:'10px',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:600,
              background: form.tipo === 'entrada' ? '#22c55e22' : '#0f172a',
              color: form.tipo === 'entrada' ? '#22c55e' : '#64748b',
              border: `1px solid ${form.tipo === 'entrada' ? '#22c55e44' : '#334155'}`
            }}>Entrada (dinero que entra)</button>
          </div>

          <label style={{color:'#94a3b8',fontSize:13,display:'block',marginBottom:6}}>Concepto — ¿para qué {form.tipo === 'salida' ? 'salió' : 'entró'} el dinero? *</label>
          <input value={form.concepto} onChange={e => setForm(f => ({...f, concepto: e.target.value}))}
            placeholder={form.tipo === 'salida' ? 'Ej: gasolina, renta, pago a empleado' : 'Ej: abono extra de un cliente'}
            style={{...inputStyle, marginBottom:'1rem'}} />

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:'1rem'}}>
            <div>
              <label style={{color:'#94a3b8',fontSize:13,display:'block',marginBottom:6}}>Monto (C$) *</label>
              <input type="number" value={form.monto} onChange={e => setForm(f => ({...f, monto: e.target.value}))}
                placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={{color:'#94a3b8',fontSize:13,display:'block',marginBottom:6}}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({...f, fecha: e.target.value}))}
                style={inputStyle} />
            </div>
          </div>

          {error && <p style={{color:'#ef4444',fontSize:13,marginBottom:'1rem'}}>{error}</p>}

          <button onClick={guardarMovimiento} disabled={guardando} style={{
            width:'100%',background:'#6366f1',color:'white',border:'none',
            borderRadius:10,padding:'12px',fontWeight:700,fontSize:14,cursor:'pointer'
          }}>{guardando ? 'Guardando...' : 'Registrar movimiento'}</button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:'1.5rem'}}>
        {[
          { label:'Entradas', value:`C$ ${entradas.toLocaleString('es-NI')}`, icon: TrendingUp, color:'#22c55e' },
          { label:'Salidas', value:`C$ ${salidas.toLocaleString('es-NI')}`, icon: TrendingDown, color:'#ef4444' },
          { label:'Saldo', value:`C$ ${saldo.toLocaleString('es-NI')}`, icon: Wallet, color: saldo >= 0 ? '#a855f7' : '#ef4444' },
        ].map((c,i) => (
          <div key={i} style={{
            background:'#1e293b',borderRadius:14,padding:'1rem',display:'flex',gap:12,alignItems:'center'
          }}>
            <div style={{width:40,height:40,borderRadius:10,background:c.color+'22',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <c.icon size={18} color={c.color} />
            </div>
            <div>
              <p style={{color:'#64748b',fontSize:11,margin:0}}>{c.label}</p>
              <p style={{color:'white',fontSize:'1.1rem',fontWeight:700,margin:0}}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {fechas.length === 0 ? (
        <div style={{background:'#1e293b',borderRadius:14,padding:'1.5rem'}}>
          <p style={{color:'#64748b',fontSize:14,margin:0}}>Todavía no hay movimientos registrados hoy.</p>
        </div>
      ) : fechas.map(fecha => {
        const movsDia = grupos[fecha]
        const totalDia = movsDia.reduce((s,m) => s + (m.tipo === 'entrada' ? Number(m.monto) : -Number(m.monto)), 0)
        return (
          <div key={fecha} style={{background:'#1e293b',borderRadius:14,padding:'1.25rem',marginBottom:'1rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
              <h2 style={{color:'white',fontSize:14,fontWeight:600,margin:0}}>{fecha}</h2>
              <span style={{color: totalDia >= 0 ? '#22c55e' : '#ef4444',fontSize:14,fontWeight:700}}>
                {totalDia >= 0 ? '+' : ''}C$ {totalDia.toLocaleString('es-NI')}
              </span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {movsDia.map(m => (
                <div key={m.id} onClick={() => m.prestamo_id && navigate(`/prestamos/${m.prestamo_id}`)} style={{
                  display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'8px 0',borderBottom:'1px solid #334155',cursor: m.prestamo_id ? 'pointer' : 'default'
                }}>
                  <div>
                    <p style={{color:'white',fontWeight:600,margin:0,fontSize:13}}>{m.prestamos?.cliente_nombre || m.concepto}</p>
                    <p style={{color:'#64748b',fontSize:11,margin:0}}>{m.prestamos?.cliente_nombre ? m.concepto : (m.tipo === 'entrada' ? 'Entrada' : 'Salida')}</p>
                  </div>
                  <p style={{color: m.tipo === 'entrada' ? '#22c55e' : '#ef4444',fontWeight:700,margin:0,fontSize:14}}>
                    {m.tipo === 'entrada' ? '+' : '-'}C$ {Number(m.monto).toLocaleString('es-NI')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
