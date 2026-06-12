import { useState } from 'react'
import { supabase } from '../supabase'
import { addDays, fmt } from '../utils'

export default function NuevoPrestamo({ onSaved, onCancel }) {
  const [form, setForm] = useState({
    nombre: '', telefono: '', monto: '', interes: '10',
    n_cuotas: '6', frecuencia: '7', primera_fecha: ''
  })
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function calcular() {
    const monto = parseFloat(form.monto)
    const interes = parseFloat(form.interes)
    const n = parseInt(form.n_cuotas)
    if (!monto || monto <= 0) { setError('Ingresa el monto del préstamo'); return }
    if (!form.primera_fecha) { setError('Selecciona la fecha del primer pago'); return }
    setError('')
    const total = parseFloat((monto * (1 + interes / 100)).toFixed(2))
    const cuota = parseFloat((total / n).toFixed(2))
    setPreview({ monto, interes, total, cuota, n })
  }

  async function guardar() {
    if (!preview) { calcular(); return }
    if (!form.nombre.trim()) { setError('Ingresa el nombre del cliente'); return }
    setSaving(true)
    const { data: prestamo, error: err } = await supabase.from('prestamos').insert({
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      monto: preview.monto,
      interes: preview.interes,
      total: preview.total,
      n_cuotas: preview.n,
      frecuencia_dias: parseInt(form.frecuencia),
    }).select().single()

    if (err) { setError('Error guardando: ' + err.message); setSaving(false); return }

    const cuotas = []
    let fecha = form.primera_fecha
    for (let i = 0; i < preview.n; i++) {
      cuotas.push({ prestamo_id: prestamo.id, num: i + 1, monto: preview.cuota, fecha, pagada: false })
      fecha = addDays(fecha, parseInt(form.frecuencia))
    }
    await supabase.from('cuotas').insert(cuotas)
    setSaving(false)
    onSaved()
  }

  const freqLabel = { '7': 'semana', '14': 'quincena', '30': 'mes' }

  return (
    <div className="page">
      <button className="back-btn" onClick={onCancel}>
        ← Cancelar
      </button>
      <div className="page-header">
        <h2>Nuevo préstamo</h2>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <div className="form-group">
          <label>Nombre del cliente</label>
          <input placeholder="Ej: María López" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Teléfono (opcional)</label>
          <input placeholder="8888-0000" value={form.telefono} onChange={e => set('telefono', e.target.value)} type="tel" />
        </div>
        <div className="form-group">
          <label>Monto prestado (C$)</label>
          <input placeholder="1000" value={form.monto} onChange={e => { set('monto', e.target.value); setPreview(null) }} type="number" min="1" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>Interés (%)</label>
            <input value={form.interes} onChange={e => { set('interes', e.target.value); setPreview(null) }} type="number" min="0" max="200" />
          </div>
          <div className="form-group">
            <label>Nº de cuotas</label>
            <input value={form.n_cuotas} onChange={e => { set('n_cuotas', e.target.value); setPreview(null) }} type="number" min="1" max="52" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>Frecuencia</label>
            <select value={form.frecuencia} onChange={e => { set('frecuencia', e.target.value); setPreview(null) }}>
              <option value="7">Semanal</option>
              <option value="14">Quincenal</option>
              <option value="30">Mensual</option>
            </select>
          </div>
          <div className="form-group">
            <label>1er pago</label>
            <input type="date" value={form.primera_fecha} onChange={e => set('primera_fecha', e.target.value)} />
          </div>
        </div>
      </div>

      {preview && (
        <div className="card" style={{ background: 'var(--verde-claro)', border: '1.5px solid var(--verde)' }}>
          <div style={{ fontWeight: 700, marginBottom: '.75rem', color: 'var(--verde-dark)' }}>Resumen del préstamo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gris)' }}>Capital:</span>
              <span style={{ fontWeight: 600 }}>{fmt(preview.monto)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gris)' }}>Interés ({preview.interes}%):</span>
              <span style={{ fontWeight: 600 }}>{fmt(preview.monto * preview.interes / 100)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gris)' }}>Total a cobrar:</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--verde-dark)' }}>{fmt(preview.total)}</span>
            </div>
            <div className="divider" style={{ margin: '.5rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gris)' }}>Cuota por {freqLabel[form.frecuencia]}:</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--verde-dark)' }}>{fmt(preview.cuota)}</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        {!preview && (
          <button className="btn-secondary" style={{ flex: 1, padding: '11px 20px' }} onClick={calcular}>
            Calcular
          </button>
        )}
        <button className="btn-primary" style={{ flex: 2 }} onClick={guardar} disabled={saving}>
          {saving ? 'Guardando...' : preview ? '✓ Guardar préstamo' : 'Calcular y guardar'}
        </button>
      </div>
    </div>
  )
}
