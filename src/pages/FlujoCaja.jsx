import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Wallet, TrendingUp } from 'lucide-react'

export default function FlujoCaja() {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('cuotas')
        .select('id, monto, fecha, fecha_pago, num, prestamo_id, prestamos(cliente_nombre)')
        .eq('pagada', true)
        .order('fecha_pago', { ascending: false, nullsFirst: false })
      setPagos(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p style={{color:'#64748b'}}>Cargando...</p>

  const totalGeneral = pagos.reduce((s, p) => s + Number(p.monto), 0)
  const hoy = new Date().toISOString().split('T')[0]
  const totalHoy = pagos.filter(p => (p.fecha_pago || p.fecha) === hoy).reduce((s, p) => s + Number(p.monto), 0)

  // Agrupar por fecha de pago (con fallback a fecha de la cuota si nunca se registró)
  const grupos = {}
  pagos.forEach(p => {
    const key = p.fecha_pago || p.fecha
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(p)
  })
  const fechas = Object.keys(grupos).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <h1 style={{color:'white',fontSize:'1.6rem',fontWeight:700,margin:0}}>Flujo de caja</h1>
      <p style={{color:'#64748b',fontSize:14,margin:'0 0 1.5rem'}}>Pagos recibidos, más reciente primero</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:'1.5rem'}}>
        {[
          { label:'Cobrado hoy', value:`C$ ${totalHoy.toLocaleString('es-NI')}`, icon: TrendingUp, color:'#22c55e' },
          { label:'Total histórico', value:`C$ ${totalGeneral.toLocaleString('es-NI')}`, icon: Wallet, color:'#a855f7' },
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
          <p style={{color:'#64748b',fontSize:14,margin:0}}>Todavía no hay pagos registrados.</p>
        </div>
      ) : fechas.map(fecha => {
        const pagosDia = grupos[fecha]
        const totalDia = pagosDia.reduce((s,p) => s + Number(p.monto), 0)
        return (
          <div key={fecha} style={{background:'#1e293b',borderRadius:14,padding:'1.25rem',marginBottom:'1rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
              <h2 style={{color:'white',fontSize:14,fontWeight:600,margin:0}}>{fecha}</h2>
              <span style={{color:'#22c55e',fontSize:14,fontWeight:700}}>C$ {totalDia.toLocaleString('es-NI')}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {pagosDia.map(p => (
                <div key={p.id} onClick={() => navigate(`/prestamos/${p.prestamo_id}`)} style={{
                  display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'8px 0',borderBottom:'1px solid #334155',cursor:'pointer'
                }}>
                  <div>
                    <p style={{color:'white',fontWeight:500,margin:0,fontSize:13}}>{p.prestamos?.cliente_nombre || 'Cliente'}</p>
                    <p style={{color:'#64748b',fontSize:11,margin:0}}>Cuota #{p.num}</p>
                  </div>
                  <p style={{color:'#22c55e',fontWeight:700,margin:0,fontSize:14}}>C$ {Number(p.monto).toLocaleString('es-NI')}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
