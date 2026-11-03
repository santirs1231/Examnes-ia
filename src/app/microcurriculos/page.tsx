'use client'

import { useEffect, useState } from 'react'
import MicrocurriculosCliente from '@/components/MicrocurriculosCliente'
import { getMicrocurriculoCompleto } from '@/lib/queries'
import type { MateriaConSemanas } from '@/types/microcurriculo'

export default function MicrocurriculosPage() {
  const [materias, setMaterias] = useState<MateriaConSemanas[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let active = true
    getMicrocurriculoCompleto()
      .then((data) => {
        if (active) setMaterias(data)
      })
      .catch((error: unknown) => {
        console.error('[microcurriculos] load:error', error)
      })
      .finally(() => {
        if (active) setCargando(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Microcurrículos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consulta y filtra el contenido curricular por materia y semana.
        </p>
      </header>

      {cargando ? (
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Cargando microcurrículos...
        </p>
      ) : (
        <MicrocurriculosCliente initialData={materias} />
      )}
    </div>
  )
}
