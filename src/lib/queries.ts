import { supabase } from './supabase'
import type { Materia, Semana, MateriaConSemanas, FiltrosMicrocurriculo } from '@/types/microcurriculo'

/**
 * Obtiene todas las materias ordenadas por nombre.
 */
export async function getMaterias(): Promise<Materia[]> {
  const { data, error } = await supabase
    .from('materias')
    .select('id, codigo, nombre, anio, creditos, descripcion, creador_id')
    .order('nombre')

  if (error) {
    console.error('Error al obtener materias:', error.message)
    return []
  }
  return data ?? []
}

/**
 * Obtiene las semanas de una materia específica.
 */
export async function getSemanasByMateria(materiaId: number): Promise<Semana[]> {
  const { data, error } = await supabase
    .from('semanas')
    .select('id, materia_id, numero_semana, objetivo_semanal')
    .eq('materia_id', materiaId)
    .order('numero_semana')

  if (error) {
    console.error('Error al obtener semanas:', error.message)
    return []
  }
  return data ?? []
}

/**
 * Obtiene materias con sus semanas y temas anidados usando JOIN de Supabase.
 * Filtra por materia y/o semana si se especifican.
 */
export async function getMicrocurriculoCompleto(
  filtros?: FiltrosMicrocurriculo
): Promise<MateriaConSemanas[]> {
  let query = supabase
    .from('materias')
    .select(`
      id, codigo, nombre, anio, creditos, descripcion, creador_id,
      semanas (
        id, materia_id, numero_semana, objetivo_semanal,
        temas (
          id, semana_id, titulo, descripcion
        )
      )
    `)
    .order('nombre')

  if (filtros?.materiaId) {
    query = query.eq('id', filtros.materiaId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener microcurrículos:', error.message)
    return []
  }

  // Si se filtra por semana, filtramos las semanas dentro de cada materia
  let resultado = (data ?? []) as MateriaConSemanas[]

  if (filtros?.semanaNumero !== undefined) {
    resultado = resultado.map((materia) => ({
      ...materia,
      semanas: materia.semanas.filter(
        (s) => s.numero_semana === filtros.semanaNumero
      ),
    })).filter((materia) => materia.semanas.length > 0)
  }

  return resultado
}
