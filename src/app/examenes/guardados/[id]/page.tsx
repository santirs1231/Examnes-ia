'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ExportarExamen from '@/components/ExportarExamen'
import { supabase } from '@/lib/supabase'
import type { ExamenGuardado, PreguntaExamen } from '@/types/examen'

interface SemanaRelacion {
  semana_id: number
}

interface SemanaRow {
  id: number
  numero_semana: number
}

export default function ExamenGuardadoDetallePage() {
  const params = useParams<{ id: string }>()
  const [examen, setExamen] = useState<ExamenGuardado | null>(null)
  const [materia, setMateria] = useState<string>('Materia no disponible')
  const [semanas, setSemanas] = useState<number[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const cargarExamen = async () => {
      const id = Number(params.id)
      if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error('El identificador del examen no es válido.')
      }

      const { data, error: examenError } = await supabase
        .from('examenes_guardados')
        .select('id, titulo, materia_id, tipo, formato_preguntas, nivel, porcentaje_nota, cantidad_preguntas, preguntas, creado_en')
        .eq('id', id)
        .maybeSingle()

      if (examenError) throw examenError
      if (!data) throw new Error('No se encontró el examen solicitado.')

      const examenRow = data as ExamenGuardado
      let materiaNombre = 'Materia no disponible'
      if (examenRow.materia_id !== null) {
        const { data: materiaRow, error: materiaError } = await supabase
          .from('materias')
          .select('nombre')
          .eq('id', examenRow.materia_id)
          .maybeSingle()

        if (materiaError) throw materiaError
        materiaNombre = (materiaRow as { nombre: string } | null)?.nombre ?? 'Materia eliminada'
      }

      const { data: semanaRelaciones, error: semanasError } = await supabase
        .from('examenes_guardados_semanas')
        .select('semana_id')
        .eq('examen_id', id)

      if (semanasError) throw semanasError

      const semanaIds = ((semanaRelaciones ?? []) as SemanaRelacion[]).map((semana) => semana.semana_id)
      let numerosSemanas: number[] = []
      if (semanaIds.length > 0) {
        const { data: semanasRows, error: semanasRowsError } = await supabase
          .from('semanas')
          .select('id, numero_semana')
          .in('id', semanaIds)

        if (semanasRowsError) throw semanasRowsError
        numerosSemanas = ((semanasRows ?? []) as SemanaRow[])
          .map((semana) => semana.numero_semana)
          .sort((a, b) => a - b)
      }

      if (active) {
        setExamen(examenRow)
        setMateria(materiaNombre)
        setSemanas(numerosSemanas)
        console.info('[examenes-guardados] detalle:exito', { examenId: id })
        setCargando(false)
      }
    }

    cargarExamen().catch((loadError: unknown) => {
      if (active) {
        console.error(
          '[examenes-guardados] detalle:error',
          loadError instanceof Error ? loadError.message : 'Error desconocido'
        )
        setError(loadError instanceof Error ? loadError.message : 'Error inesperado al cargar el examen.')
        setCargando(false)
      }
    })

    return () => {
      active = false
    }
  }, [params.id])

  if (cargando) {
    return <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Cargando examen...</p>
  }

  if (error || !examen) {
    return (
      <section className="space-y-4">
        <Link
          href="/examenes/guardados"
          onClick={() => console.info('[examenes-guardados] volver_lista:click')}
          className="text-sm font-medium text-purple-700 hover:text-purple-900"
        >
          ← Volver a exámenes guardados
        </Link>
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? 'No se encontró el examen solicitado.'}
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <Link
        href="/examenes/guardados"
        onClick={() => console.info('[examenes-guardados] volver_lista:click')}
        className="text-sm font-medium text-purple-700 hover:text-purple-900"
      >
        ← Volver a exámenes guardados
      </Link>

      <header className="rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-6 text-white">
        <h1 className="text-2xl font-bold">{examen.titulo}</h1>
        <p className="mt-2 text-sm text-purple-100">
          {materia} · {examen.tipo.toUpperCase()} · Nivel {examen.nivel}
        </p>
        <p className="mt-1 text-sm text-purple-100">
          {examen.cantidad_preguntas} preguntas · Formato {examen.formato_preguntas}
          {examen.porcentaje_nota !== null ? ` · ${examen.porcentaje_nota}% de la nota` : ''}
        </p>
        {semanas.length > 0 && (
          <p className="mt-1 text-sm text-purple-100">
            Semanas: {semanas.join(', ')}
          </p>
        )}
      </header>

      <ExportarExamen examen={examen} />

      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {examen.preguntas.map((pregunta: PreguntaExamen, indice) => (
          <article key={`${pregunta.numero ?? indice}-${indice}`} className="flex gap-4 px-6 py-5">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-sm font-bold text-purple-700">
              {pregunta.numero ?? indice + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-gray-800">
                {pregunta.enunciado || pregunta.texto_con_espacio || 'Pregunta sin enunciado'}
              </p>
              {pregunta.opciones && (
                <ul className="space-y-1.5">
                  {pregunta.opciones.map((opcion, opcionIndice) => (
                    <li
                      key={opcionIndice}
                      className={`print-answer-option rounded-lg px-3 py-2 text-sm ${
                        pregunta.respuesta_correcta === opcion.charAt(0)
                          ? 'border border-green-200 bg-green-50 text-green-800'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {opcion}
                    </li>
                  ))}
                </ul>
              )}
              {pregunta.palabra_correcta && (
                <p className="print:hidden text-sm text-green-800">
                  <span className="font-semibold">Respuesta:</span> {pregunta.palabra_correcta}
                </p>
              )}
              {pregunta.rubrica && (
                <p className="print:hidden whitespace-pre-wrap rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  <span className="font-semibold">Rúbrica:</span> {pregunta.rubrica}
                </p>
              )}
              {pregunta.justificacion && (
                <p className="print:hidden whitespace-pre-wrap text-sm italic text-gray-500">
                  {pregunta.justificacion}
                </p>
              )}
              {pregunta.gift_text && (
                <pre className="print:hidden overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 text-xs text-green-400">
                  {pregunta.gift_text}
                </pre>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
