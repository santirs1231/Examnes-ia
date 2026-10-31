'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ExamenGuardado } from '@/types/examen'

interface ExamenLista extends Pick<
  ExamenGuardado,
  'id' | 'titulo' | 'materia_id' | 'tipo' | 'formato_preguntas' | 'nivel' | 'cantidad_preguntas' | 'creado_en'
> {
  materia: string
}

interface MateriaRow {
  id: number
  nombre: string
}

export default function ExamenesGuardadosPage() {
  const [examenes, setExamenes] = useState<ExamenLista[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const cargarExamenes = async () => {
      setCargando(true)
      setError(null)

      const { data, error: examenesError } = await supabase
        .from('examenes_guardados')
        .select('id, titulo, materia_id, tipo, formato_preguntas, nivel, cantidad_preguntas, creado_en')
        .order('creado_en', { ascending: false })

      if (examenesError) {
        console.error('[examenes-guardados] listar:error', examenesError.message)
        if (active) {
          setError(`No se pudieron cargar los exámenes guardados: ${examenesError.message}`)
          setCargando(false)
        }
        return
      }

      const filas = (data ?? []) as Omit<ExamenLista, 'materia'>[]
      const materiaIds = Array.from(new Set(filas.flatMap((examen) =>
        examen.materia_id === null ? [] : [examen.materia_id]
      )))

      let materiasPorId = new Map<number, string>()
      if (materiaIds.length > 0) {
        const { data: materias, error: materiasError } = await supabase
          .from('materias')
          .select('id, nombre')
          .in('id', materiaIds)

        if (materiasError) {
          console.error('[examenes-guardados] materias:error', materiasError.message)
          if (active) {
            setError(`Se cargaron los exámenes, pero no sus materias: ${materiasError.message}`)
            setCargando(false)
          }
          return
        }

        materiasPorId = new Map(
          ((materias ?? []) as MateriaRow[]).map((materia) => [materia.id, materia.nombre])
        )
      }

      if (active) {
        setExamenes(filas.map((examen) => ({
          ...examen,
          materia: examen.materia_id === null
            ? 'Materia eliminada'
            : materiasPorId.get(examen.materia_id) ?? 'Materia no disponible',
        })))
        console.info('[examenes-guardados] listar:exito', { cantidad: filas.length })
        setCargando(false)
      }
    }

    cargarExamenes().catch((loadError: unknown) => {
      if (active) {
        console.error(
          '[examenes-guardados] listar:error',
          loadError instanceof Error ? loadError.message : 'Error desconocido'
        )
        setError(loadError instanceof Error ? loadError.message : 'Error inesperado al cargar los exámenes.')
        setCargando(false)
      }
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exámenes guardados</h1>
          <p className="mt-1 text-sm text-gray-500">Consulta los exámenes que se han guardado en la plataforma.</p>
        </div>
        <Link
          href="/examenes"
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
        >
          Generar examen
        </Link>
      </header>

      {cargando && (
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Cargando exámenes...
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {!cargando && !error && examenes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-gray-800">Todavía no hay exámenes guardados</h2>
          <p className="mt-2 text-sm text-gray-500">Genera un examen y usa el botón “Guardar examen” para verlo aquí.</p>
          <Link href="/examenes" className="mt-4 inline-block text-sm font-semibold text-purple-700 hover:text-purple-900">
            Ir al generador
          </Link>
        </div>
      )}

      {examenes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {examenes.map((examen) => (
            <article key={examen.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{examen.titulo}</h2>
                  <p className="mt-1 text-sm text-gray-500">{examen.materia}</p>
                </div>
                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                  {examen.tipo}
                </span>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                {examen.cantidad_preguntas} preguntas · {examen.nivel} · {examen.formato_preguntas}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Guardado el {new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date(examen.creado_en))}
              </p>
              <Link
                href={`/examenes/guardados/${examen.id}`}
                onClick={() => console.info('[examenes-guardados] visualizar:click', { examenId: examen.id })}
                className="mt-4 inline-flex rounded-lg border border-purple-200 px-3 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-50"
              >
                Visualizar examen
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
