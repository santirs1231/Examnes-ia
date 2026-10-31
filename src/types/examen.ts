export type FormatoPreguntaExamen = 'aiken' | 'palabra_ausente' | 'desarrollo' | 'GITF'

export interface PreguntaExamen {
  numero?: number
  enunciado?: string
  texto_con_espacio?: string
  opciones?: string[]
  respuesta_correcta?: string
  palabra_correcta?: string
  rubrica?: string
  justificacion?: string
  gift_text?: string
}

export interface ExamenGuardado {
  id: number
  titulo: string
  materia_id: number | null
  tipo: 'parcial' | 'quiz' | 'taller'
  formato_preguntas: FormatoPreguntaExamen
  nivel: 'basico' | 'intermedio' | 'avanzado'
  porcentaje_nota: number | null
  cantidad_preguntas: number
  preguntas: PreguntaExamen[]
  creado_en: string
}
