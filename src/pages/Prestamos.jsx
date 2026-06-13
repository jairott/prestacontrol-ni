import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([])
  const [buscar, setBuscar] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('prestamos').select('*').order('created_at', {ascending:false})
      .then(({data}) => setPrestamos(data || []))
  }, [])

  const filtrados = prestamos.filter(p =>
    p.cliente_nombre?.toLowerCase().includes(buscar.toLowerCase()) ||
    p.direccion?.toLowerCase().includes(buscar.toLowerCase())
  )

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <div>
          <h1 style={{color:'white',fontSize:'1.6rem',fontWeight:700,margin:0}}>Préstamos</h1>
          <p style={{color:'#64748b',fontSize:14,margin:0}}>{prestamos.length} préstamos registrados</p>
        </div>
        <button onClick={() => navigate('/prestamos/nuevo')} style={{
          display:'flex',alignItems:'center',gap:8,background:'#6366f1',
          color:'white',border:'none',borderRadius:10,padding:'10px 18px',
          fontWeight:600,cursor:'pointer',fontSize:14
        }}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div style={{position:'relative',marginBottom:'1.5rem'}}>
        <Search size={16} color="#64748b" style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)'}} />
        <input value={buscar} onChange={e=>setBuscar(e.target.value)}
          placeholder="Buscar por nombre o dirección..."
          style={{width:'100%',background:'#1e293b',border:'1px solid #334155',borderRadius:10,
            padding:'10px 14px 10px 40px',color:'white',fontSize:14,boxSizing:'border-box'}} />
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {filtrados.length === 0 ? (
          <p style={{color:'#64748b',textAlign:'center',padding:'3rem'}}>Sin resultados.</p>
        ) : filtrados.map(p => (
          <div key={p.id} onClick={() => navigate(`/prestamos/${p.id}`)} style={{
            background:'#1e293b',borderRadius:12,padding:'1rem 1.25rem',
            display:'flex',justifyContent:'space-between',alignItems:'center',
            cursor:'pointer',border:'1px solid #334155',transition:'border-color 0.2s'
          }}>
            <div>
              <p style={{color:'white',fontWeight:600,margin:0}}>{p.cliente_nombre}</p>
              <p style={{color:'#64748b',fontSize:13,margin:'2px 0 0'}}>{p.direccion || '—'} · {p.telefono || '—'}</p>
              <p style={{color:'#94a3b8',fontSize:12,margin:'2px 0 0'}}>
                {p.frecuencia_pago} · {p.num_cuotas} cuotas
              </p>
            </div>
            <div style={{textAlign:'right'}}>
              <p style={{color:'#6366f1',fontWeight:700,margin:0,fontSize:'1.1rem'}}>C$ {Number(p.monto).toLocaleString('es-NI')}</p>
              <span style={{
                fontSize:11,padding:'3px 10px',borderRadius:20,
                background: p.estado==='activo' ? '#22c55e22' : p.estado==='pagado' ? '#3b82f622' : '#ef444422',
                color: p.estado==='activo' ? '#22c55e' : p.estado==='pagado' ? '#3b82f6' : '#ef4444'
              }}>{p.estado}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
