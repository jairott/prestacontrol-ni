import { supabase } from './supabase'

export async function registrarAuditoria({ accion, descripcion, monto = null, prestamo_id = null, cuota_id = null }) {
  const { error } = await supabase.from('auditoria').insert({ accion, descripcion, monto, prestamo_id, cuota_id })
  if (error) console.error('No se pudo registrar en auditoría:', error.message)
}
