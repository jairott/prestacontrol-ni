import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DollarSign, Users, AlertCircle, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState({ total:0, activos:0, vencidos:0, cobrado:0 })
  const [recientes, setRecientes] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data: prestamos } = await supabase.from('prestamos').select('*')
      const { data: cuotas } = await supabase.from('cuotas').select('*')
      if (!prestamos) return

      const activos = prestamos.filter(p => p.estado === 'activo').length
      const hoy = new Date().toISOString().split('T')[0]
      const vencidas = cuotas?.filter(c => !c.pagada && c.fecha < hoy).length || 0
      const cobrado = cuotas?.filter(c => c.pagada).reduce((s,c) => s + Number(c.monto), 0) || 0

      setStats({ total: prestamos.length, activos, vencidos: vencidas, cobrado })
      setRecientes(prestamos.slice(-5).reverse())
    }
    load()
  }, [])

  const cards = [
    { label:'Total préstamos', value: stats.total, icon: Users, color:'#6366f1' },
    { label:'Activos', value: stats.activos, icon: CheckCircle, color:'#22c55e' },
    { label:'Cuotas vencidas', value: stats.vencidos, icon: AlertCircle, color:'#ef4444' },
    { label:'Total cobrado', value: `C$ ${stats.cobrado.toLocaleString('es-NI')}`, icon: DollarSign, color:'#f59e0b' },
  ]

  return (
    <div>
      <h1 style={{color:'white',fontSize:'1.6rem',fontWeight:700,marginBottom:'0.25rem'}}>Dashboard</h1>
      <p style={{color:'#64748b',marginBottom:'2rem',fontSize:14}}>Resumen general</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:'2rem'}}>
        {cards.map((c,i) => (
          <div key={i} style={{background:'#1e293b',borderRadius:14,padding:'1.25rem',display:'flex',gap:14,alignItems:'center'}}>
            <div style={{width:44,height:44,borderRadius:11,background:c.color+'22',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <c.icon size={20} color={c.color} />
            </div>
            <div>
              <p style={{color:'#64748b',fontSize:12,margin:0}}>{c.label}</p>
              <p style={{color:'white',fontSize:'1.3rem',fontWeight:700,margin:0}}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{background:'#1e293b',borderRadius:14,padding:'1.5rem'}}>
        <h2 style={{color:'white',fontSize:16,fontWeight:600,marginBottom:'1rem'}}>Préstamos recientes</h2>
        {recientes.length === 0 ? (
          <p style={{color:'#64748b',fontSize:14}}>Sin préstamos aún.</p>
        ) : recientes.map(p => (
          <div key={p.id} onClick={() => navigate(`/prestamos/${p.id}`)} style={{
            display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'12px 0',borderBottom:'1px solid #334155',cursor:'pointer'
          }}>
            <div>
              <p style={{color:'white',fontWeight:600,margin:0,fontSize:14}}>{p.cliente_nombre}</p>
              <p style={{color:'#64748b',fontSize:12,margin:0}}>{p.direccion || 'Sin dirección'}</p>
            </div>
            <div style={{textAlign:'right'}}>
              <p style={{color:'#6366f1',fontWeight:700,margin:0}}>C$ {Number(p.monto).toLocaleString('es-NI')}</p>
              <span style={{
                fontSize:11,padding:'2px 8px',borderRadius:20,
                background: p.estado==='activo' ? '#22c55e22' : '#ef444422',
                color: p.estado==='activo' ? '#22c55e' : '#ef4444'
              }}>{p.estado}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
