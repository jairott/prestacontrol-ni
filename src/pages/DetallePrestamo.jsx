import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, CheckCircle, Circle, Trash2 } from 'lucide-react'

export default function DetallePrestamo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prestamo, setPrestamo] = useState(null)
  const [cuotas, setCuotas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('prestamos').select('*').eq('id', id).single(),
        supabase.from('cuotas').select('*').eq('prestamo_id', id).order('num')
      ])
      setPrestamo(p); setCuotas(c || [])
      setLoading(false)
    }
    load()
  }, [id])

  const toggleCuota = async (cuota) => {
    const { data } = await supabase.from('cuotas')
      .update({ pagada: !cuota.pagada })
      .eq('id', cuota.id).select().single()
    setCuotas(prev => prev.map(c => c.id === cuota.id ? data : c))

    // Si todas pagadas → marcar préstamo como pagado
    const nuevas = cuotas.map(c => c.id === cuota.id ? data : c)
    if (nuevas.every(c => c.pagada)) {
      await supabase.from('prestamos').update({ estado:'pagado' }).eq('id', id)
      setPrestamo(p => ({...p, estado:'pagado'}))
    } else if (prestamo?.estado === 'pagado') {
      await supabase.from('prestamos').update({ estado:'activo' }).eq('id', id)
      setPrestamo(p => ({...p, estado:'activo'}))
    }
  }

  const eliminar = async () => {
    if (!confirm('¿Eliminar este préstamo?')) return
    await supabase.from('prestamos').delete().eq('id', id)
    navigate('/prestamos')
  }

  if (loading) return <p style={{color:'#64748b'}}>Cargando...</p>
  if (!prestamo) return <p style={{color:'#ef4444'}}>No encontrado.</p>

  const pagadas = cuotas.filter(c => c.pagada).length
  const totalCobrado = cuotas.filter(c => c.pagada).reduce((s,c) => s+Number(c.monto),0)
  const totalDeuda = cuotas.reduce((s,c) => s+Number(c.monto),0)
  const hoy = new Date().toISOString().split('T')[0]
  const vencidas = cuotas.filter(c => !c.pagada && c.fecha < hoy).length

  return (
    <div style={{maxWidth:640}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <button onClick={() => navigate('/prestamos')} style={{
          display:'flex',alignItems:'center',gap:6,color:'#94a3b8',background:'none',border:'none',cursor:'pointer',fontSize:14
        }}><ArrowLeft size={16}/> Volver</button>
        <button onClick={eliminar} style={{
          display:'flex',alignItems:'center',gap:6,color:'#ef4444',background:'#ef444415',
          border:'none',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13
        }}><Trash2 size={14}/> Eliminar</button>
      </div>

      {/* Info cliente */}
      <div style={{background:'#1e293b',borderRadius:14,padding:'1.5rem',marginBottom:'1rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <h1 style={{color:'white',fontSize:'1.3rem',fontWeight:700,margin:0}}>{prestamo.cliente_nombre}</h1>
            <p style={{color:'#64748b',fontSize:13,margin:'4px 0'}}>{prestamo.direccion || 'Sin dirección'}</p>
            <p style={{color:'#64748b',fontSize:13,margin:0}}>{prestamo.telefono || 'Sin teléfono'}</p>
          </div>
          <span style={{
            fontSize:12,padding:'4px 12px',borderRadius:20,
            background: prestamo.estado==='activo' ? '#22c55e22' : prestamo.estado==='pagado' ? '#3b82f622' : '#ef444422',
            color: prestamo.estado==='activo' ? '#22c55e' : prestamo.estado==='pagado' ? '#3b82f6' : '#ef4444'
          }}>{prestamo.estado}</span>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:'1.25rem'}}>
          {[
            { label:'Monto prestado', val:`C$ ${Number(prestamo.monto).toLocaleString('es-NI')}` },
            { label:'Total a cobrar', val:`C$ ${totalDeuda.toLocaleString('es-NI')}` },
            { label:'Cobrado', val:`C$ ${totalCobrado.toLocaleString('es-NI')}`, color:'#22c55e' },
          ].map((s,i) => (
            <div key={i} style={{background:'#0f172a',borderRadius:10,padding:'12px'}}>
              <p style={{color:'#64748b',fontSize:11,margin:0}}>{s.label}</p>
              <p style={{color: s.color || 'white',fontWeight:700,margin:'4px 0 0',fontSize:'0.95rem'}}>{s.val}</p>
            </div>
          ))}
        </div>

        {vencidas > 0 && (
          <div style={{background:'#ef444415',border:'1px solid #ef444433',borderRadius:10,padding:'10px 14px',marginTop:'1rem'}}>
            <p style={{color:'#ef4444',fontSize:13,margin:0}}>⚠️ {vencidas} cuota{vencidas>1?'s':''} vencida{vencidas>1?'s':''}</p>
          </div>
        )}
      </div>

      {/* Cuotas */}
      <div style={{background:'#1e293b',borderRadius:14,padding:'1.5rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <h2 style={{color:'white',fontSize:16,fontWeight:600,margin:0}}>Cuotas</h2>
          <span style={{color:'#64748b',fontSize:13}}>{pagadas}/{cuotas.length} pagadas</span>
        </div>

        {/* Progress */}
        <div style={{background:'#0f172a',borderRadius:8,height:8,marginBottom:'1.25rem',overflow:'hidden'}}>
          <div style={{background:'#6366f1',height:'100%',width:`${cuotas.length ? (pagadas/cuotas.length)*100 : 0}%`,transition:'width 0.3s'}} />
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {cuotas.map(c => {
            const vencida = !c.pagada && c.fecha < hoy
            return (
              <div key={c.id} onClick={() => toggleCuota(c)} style={{
                display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'10px 14px',borderRadius:10,cursor:'pointer',
                background: c.pagada ? '#22c55e11' : vencida ? '#ef444411' : '#0f172a',
                border: `1px solid ${c.pagada ? '#22c55e33' : vencida ? '#ef444433' : '#334155'}`
              }}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  {c.pagada
                    ? <CheckCircle size={18} color="#22c55e" />
                    : <Circle size={18} color={vencida ? '#ef4444' : '#64748b'} />
                  }
                  <div>
                    <p style={{color:'white',fontSize:13,fontWeight:500,margin:0}}>Cuota #{c.num}</p>
                    <p style={{color: vencida ? '#ef4444' : '#64748b',fontSize:12,margin:0}}>{c.fecha}</p>
                  </div>
                </div>
                <p style={{color: c.pagada ? '#22c55e' : 'white',fontWeight:600,margin:0,fontSize:14}}>
                  C$ {Number(c.monto).toLocaleString('es-NI')}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
