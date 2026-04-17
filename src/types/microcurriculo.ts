// Tabla: materias
export interface Materia {
  id: number
  codigo: string
  nombre: string
  anio: number
  creditos: number | null
  descripcion: string | null
  creador_id: string | null
}

// Tabla: semanas
export interface Semana {
  id: number
  materia_id: number
  numero_semana: number
  objetivo_semanal: string | null
}

// Tabla: temas
export interface Tema {
  id: number
  semana_id: number
  titulo: string
  descripcion: string | null
}

// Semana con sus temas anidados (JOIN)
export interface SemanaConTemas extends Semana {
  temas: Tema[]
}

// Materia con sus semanas y temas anidados (JOIN completo)
export interface MateriaConSemanas extends Materia {
  semanas: SemanaConTemas[]
}

// Filtros para el visor
export interface FiltrosMicrocurriculo {
  materiaId?: number
  semanaNumero?: number
}
