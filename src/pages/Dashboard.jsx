import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { enviarReporteDisario } from '../lib/notificaciones'
import { DollarSign, Users, AlertCircle, CheckCircle, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState({ total:0, activos:0, vencidos:0, cobrado:0 })
  const [recientes, setRecientes] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
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

    // Verificar si ya se envió el reporte hoy
    const ultimoEnvio = localStorage.getItem('ultimo_reporte')
    const hoy = new Date().toISOString().split('T')[0]
    if (ultimoEnvio === hoy) setEnviado(true)

    // Programar envío automático a las 12pm
    const ahora = new Date()
    const medioDia = new Date()
    medioDia.setHours(12, 0, 0, 0)
    
    if (ahora < medioDia && ultimoEnvio !== hoy) {
      const msHastaMediaDia = medioDia - ahora
      setTimeout(async () => {
        const ok = await enviarReporteDisario()
        if (ok) {
          localStorage.setItem('ultimo_reporte', hoy)
          setEnviado(true)
        }
      }, msHastaMediaDia)
    }
  }, [])

  const handleEnviarAhora = async () => {
    setEnviando(true)
    const ok = await enviarReporteDisario()
    if (ok) {
      const hoy = new Date().toISOString().split('T')[0]
      localStorage.setItem('ultimo_reporte', hoy)
      setEnviado(true)
    }
    setEnviando(false)
  }

  const cards = [
    { label:'Total préstamos', value: stats.total, icon: Users, color:'#6366f1' },
    { label:'Activos', value: stats.activos, icon: CheckCircle, color:'#22c55e' },
    { label:'Cuotas vencidas', value: stats.vencidos, icon: AlertCircle, color:'#ef4444' },
    { label:'Total cobrado', value: `C$ ${stats.cobrado.toLocaleString('es-NI')}`, icon: DollarSign, color:'#f59e0b' },
  ]

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.25rem'}}>
        <div>
          <h1 style={{color:'white',fontSize:'1.6rem',fontWeight:700,margin:0}}>Dashboard</h1>
          <p style={{color:'#64748b',fontSize:14,margin:0}}>Resumen general</p>
        </div>
        <button onClick={handleEnviarAhora} disabled={enviando} style={{
          display:'flex',alignItems:'center',gap:6,
          background: enviado ? '#22c55e22' : '#6366f122',
          color: enviado ? '#22c55e' : '#a5b4fc',
          border:`1px solid ${enviado ? '#22c55e44' : '#6366f144'}`,
          borderRadius:10,padding:'8px 14px',cursor:'pointer',fontSize:13,fontWeight:500
        }}>
          <Bell size={15}/>
          {enviando ? 'Enviando...' : enviado ? '✓ Reporte enviado' : 'Enviar reporte'}
        </button>
      </div>

      <p style={{color:'#475569',fontSize:12,marginBottom:'1.5rem'}}>
        📧 Reporte automático a las 12pm → jairott@icloud.com
      </p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:'1.5rem'}}>
        {cards.map((c,i) => (
          <div key={i} style={{background:'#1e293b',borderRadius:14,padding:'1rem',display:'flex',gap:12,alignItems:'center'}}>
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

      <div style={{background:'#1e293b',borderRadius:14,padding:'1.25rem'}}>
        <h2 style={{color:'white',fontSize:15,fontWeight:600,marginBottom:'0.75rem'}}>Préstamos recientes</h2>
        {recientes.length === 0 ? (
          <p style={{color:'#64748b',fontSize:14}}>Sin préstamos aún.</p>
        ) : recientes.map(p => (
          <div key={p.id} onClick={() => navigate(`/prestamos/${p.id}`)} style={{
            display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'10px 0',borderBottom:'1px solid #334155',cursor:'pointer'
          }}>
            <div>
              <p style={{color:'white',fontWeight:600,margin:0,fontSize:14}}>{p.cliente_nombre}</p>
              <p style={{color:'#64748b',fontSize:12,margin:0}}>{p.direccion || 'Sin dirección'}</p>
            </div>
            <div style={{textAlign:'right'}}>
              <p style={{color:'#6366f1',fontWeight:700,margin:0,fontSize:14}}>C$ {Number(p.monto).toLocaleString('es-NI')}</p>
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
