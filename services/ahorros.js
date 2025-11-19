import { supabase } from '../supabase'

// Obtener todos los ahorros de un usuario
export async function getAhorros(usuarioId) {
  const { data, error } = await supabase
    .from('ahorros')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })

  if (error) throw error
  return data
}

// Registrar un aporte de ahorro
export async function registrarAhorro(usuarioId, monto, descripcion, firma) {
  // Traer la configuración (cuota mínima)
  const { data: config, error: errorConfig } = await supabase
    .from('configuracion')
    .select('cuota_minima_mensual')
    .single()

  if (errorConfig) throw errorConfig

  if (monto < config.cuota_minima) {
    throw new Error(`El monto debe ser mayor o igual a la cuota mínima (${config.cuota_minima})`)
  }

  const { data, error } = await supabase
    .from('ahorros')
    .insert([{
      usuario_id: usuarioId,
      monto,
      fecha: new Date().toISOString().split('T')[0],
      descripcion,
      tipo: 'deposito',
      firma
    }])

  if (error) throw error
  return data
}

// Obtener todos los retiros de un usuario
export async function obtenerRetiros(usuarioId) {
  const { data, error } = await supabase
    .from('retiros')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })
  if (error) throw error
  return data
}


// Solicitar retiro (programado con 1 mes de anticipación)
export async function solicitarRetiro(usuarioId, monto, fechaProgramada) {
  const { data, error } = await supabase
    .from('retiros_programados')
    .insert([{
      usuario_id: usuarioId,
      monto: monto,
      fecha_programada: fechaProgramada
    }])

  if (error) throw error
  return data
}
