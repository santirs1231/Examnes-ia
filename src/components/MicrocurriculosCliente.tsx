'use client'

import { useState, useCallback } from 'react'
import FiltrosMicrocurriculo from '@/components/FiltrosMicrocurriculo'
import MicrocurriculoCard from '@/components/MicrocurriculoCard'
import { getMicrocurriculoCompleto } from '@/lib/queries'
import type { MateriaConSemanas } from '@/types/microcurriculo'

export default function MicrocurriculosCliente({
  initialData,
}: {
  initialData: MateriaConSemanas[]
}) {
  const [resultados, setResultados] = useState<MateriaConSemanas[]>(initialData)
  const [cargando, setCargando] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const handleFiltrar = useCallback(
    async (materiaId: number | undefined, semanaNumero: number | undefined) => {
      setCargando(true)
      setBuscado(true)
      const datos = await getMicrocurriculoCompleto({ materiaId, semanaNumero })
      setResultados(datos)
      setCargando(false)
    },
    []
  )

  const totalSemanas = resultados.reduce((acc, m) => acc + m.semanas.length, 0)
  const totalTemas = resultados.reduce(
    (acc, m) => acc + m.semanas.reduce((a, s) => a + s.temas.length, 0),
    0
  )

  return (
    <div className="space-y-6">
      <FiltrosMicrocurriculo onFiltrar={handleFiltrar} />

      {/* Contador */}
      {!cargando && (
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>
            <span className="font-semibold text-gray-800">{resultados.length}</span> materias
          </span>
          <span className="text-gray-300">•</span>
          <span>
            <span className="font-semibold text-gray-800">{totalSemanas}</span> semanas
          </span>
          <span className="text-gray-300">•</span>
          <span>
            <span className="font-semibold text-gray-800">{totalTemas}</span> temas
          </span>
        </div>
      )}

      {/* Resultados */}
      {cargando ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="bg-indigo-50 px-5 py-4">
                <div className="flex gap-2 mb-2">
                  <div className="h-5 w-16 bg-indigo-200 rounded" />
                  <div className="h-5 w-12 bg-indigo-100 rounded" />
                </div>
                <div className="h-5 w-2/3 bg-indigo-200 rounded" />
              </div>
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 h-4 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : resultados.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">
            {buscado
              ? 'No se encontraron microcurrículos con esos filtros.'
              : 'No hay microcurrículos disponibles.'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {!buscado && 'Verifica la conexión a Supabase y los datos en las tablas materias, semanas y temas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {resultados.map((materia) => (
            <MicrocurriculoCard key={materia.id} materia={materia} />
          ))}
        </div>
      )}
    </div>
  )
}
