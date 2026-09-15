import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NuevoPrestamo() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    cliente_nombre:'', telefono:'', direccion:'',
    monto:'', interes_porcentaje:'', num_cuotas:'',
    frecuencia_pago:'semanal', fecha_inicio: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k,v) => setForm(p => ({...p,[k]:v}))

  const calcCuotas = () => {
    const monto = parseFloat(form.monto) || 0
    const interes = parseFloat(form.interes_porcentaje) || 0
    const num = parseInt(form.num_cuotas) || 0
    if (!monto || !num) return 0
    const total = monto * (1 + interes/100)
    return (total / num).toFixed(2)
  }

  const handleSubmit = async () => {
    if (!form.cliente_nombre || !form.monto || !form.num_cuotas) {
      setError('Completa los campos requeridos'); return
    }
    setLoading(true); setError('')
    try {
      const monto = parseFloat(form.monto)
      const interes = parseFloat(form.interes_porcentaje) || 0
      const num = parseInt(form.num_cuotas)
      const total = monto * (1 + interes/100)
      const montoCuota = parseFloat((total / num).toFixed(2))

      const { data: prestamo, error: err } = await supabase.from('prestamos').insert({
        cliente_nombre: form.cliente_nombre,
        telefono: form.telefono,
        direccion: form.direccion,
        monto,
        interes_porcentaje: interes,
        num_cuotas: num,
        frecuencia_pago: form.frecuencia_pago,
        fecha_inicio: form.fecha_inicio,
        estado: 'activo'
      }).select().single()

      if (err) throw err

      // Generar cuotas
      const cuotas = []
      let fecha = new Date(form.fecha_inicio)
      for (let i = 1; i <= num; i++) {
        cuotas.push({ prestamo_id: prestamo.id, num: i, monto: montoCuota, fecha: fecha.toISOString().split('T')[0], pagada: false })
        if (form.frecuencia_pago === 'semanal') fecha.setDate(fecha.getDate() + 7)
        else if (form.frecuencia_pago === 'quincenal') fecha.setDate(fecha.getDate() + 15)
        else fecha.setMonth(fecha.getMonth() + 1)
      }
      await supabase.from('cuotas').insert(cuotas)

      navigate(`/prestamos/${prestamo.id}`)
    } catch(e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const inp = (label, key, type='text', placeholder='') => (
    <div style={{marginBottom:'1rem'}}>
      <label style={{color:'#94a3b8',fontSize:13,display:'block',marginBottom:6}}>{label}</label>
      <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)}
        placeholder={placeholder}
        style={{width:'100%',background:'#0f172a',border:'1px solid #334155',borderRadius:9,
          padding:'10px 14px',color:'white',fontSize:14,boxSizing:'border-box'}} />
    </div>
  )

  return (
    <div style={{maxWidth:560}}>
      <button onClick={() => navigate('/prestamos')} style={{
        display:'flex',alignItems:'center',gap:6,color:'#94a3b8',background:'none',
        border:'none',cursor:'pointer',marginBottom:'1.5rem',fontSize:14
      }}><ArrowLeft size={16}/> Volver</button>

      <h1 style={{color:'white',fontSize:'1.5rem',fontWeight:700,marginBottom:'2rem'}}>Nuevo préstamo</h1>

      <div style={{background:'#1e293b',borderRadius:14,padding:'1.5rem'}}>
        <h3 style={{color:'#6366f1',fontSize:13,fontWeight:600,marginBottom:'1rem',textTransform:'uppercase',letterSpacing:1}}>Cliente</h3>
        {inp('Nombre completo *','cliente_nombre','text','Ej: Juan Pérez')}
        {inp('Teléfono','telefono','text','Ej: 8888-1234')}
        {inp('Dirección','direccion','text','Barrio, municipio...')}

        <h3 style={{color:'#6366f1',fontSize:13,fontWeight:600,margin:'1.5rem 0 1rem',textTransform:'uppercase',letterSpacing:1}}>Préstamo</h3>
        {inp('Monto (C$) *','monto','number','0')}
        {inp('Interés (%) *','interes_porcentaje','number','Ej: 20')}
        {inp('Número de cuotas *','num_cuotas','number','Ej: 12')}

        <div style={{marginBottom:'1rem'}}>
          <label style={{color:'#94a3b8',fontSize:13,display:'block',marginBottom:6}}>Frecuencia de pago</label>
          <select value={form.frecuencia_pago} onChange={e=>set('frecuencia_pago',e.target.value)}
            style={{width:'100%',background:'#0f172a',border:'1px solid #334155',borderRadius:9,
              padding:'10px 14px',color:'white',fontSize:14}}>
            <option value="semanal">Semanal</option>
            <option value="quincenal">Quincenal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>

        {inp('Fecha inicio *','fecha_inicio','date')}

        {form.monto && form.num_cuotas && (
          <div style={{background:'#6366f122',borderRadius:10,padding:'12px 16px',marginBottom:'1rem'}}>
            <p style={{color:'#a5b4fc',fontSize:13,margin:0}}>
              Cuota estimada: <strong style={{color:'white'}}>C$ {calcCuotas()}</strong> / {form.frecuencia_pago}
            </p>
            <p style={{color:'#a5b4fc',fontSize:13,margin:'4px 0 0'}}>
              Total a cobrar: <strong style={{color:'white'}}>C$ {((parseFloat(form.monto)||0)*(1+(parseFloat(form.interes_porcentaje)||0)/100)).toFixed(2)}</strong>
            </p>
          </div>
        )}

        {error && <p style={{color:'#ef4444',fontSize:13,marginBottom:'1rem'}}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading} style={{
          width:'100%',background:'#6366f1',color:'white',border:'none',
          borderRadius:10,padding:'13px',fontWeight:700,fontSize:15,cursor:'pointer'
        }}>{loading ? 'Guardando...' : 'Crear préstamo'}</button>
      </div>
    </div>
  )
}
