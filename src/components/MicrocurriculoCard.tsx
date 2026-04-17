'use client'

import { useState } from 'react'
import type { MateriaConSemanas } from '@/types/microcurriculo'

interface Props {
  materia: MateriaConSemanas
}

export default function MicrocurriculoCard({ materia }: Props) {
  const [expandido, setExpandido] = useState(false)
  const totalTemas = materia.semanas.reduce((acc, s) => acc + s.temas.length, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header de la materia */}
      <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">
                {materia.codigo}
              </span>
              <span className="text-xs text-indigo-600">Año {materia.anio}</span>
              {materia.creditos && (
                <span className="text-xs text-gray-500">{materia.creditos} créditos</span>
              )}
            </div>
            <h3 className="mt-1 text-base font-bold text-indigo-900 leading-snug">
              {materia.nombre}
            </h3>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xl font-bold text-indigo-700">{materia.semanas.length}</p>
            <p className="text-xs text-indigo-500">semanas</p>
          </div>
        </div>
        {materia.descripcion && (
          <p className="mt-2 text-xs text-indigo-700 line-clamp-2">{materia.descripcion}</p>
        )}

        {/* Botón expandir / colapsar */}
        <button
          onClick={() => setExpandido((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expandido ? 'Ocultar contenido' : `Ver contenido (${totalTemas} temas)`}
        </button>
      </div>

      {/* Semanas y temas — solo visibles cuando está expandido */}
      {expandido && (
        <>
          <div className="divide-y divide-gray-100">
            {materia.semanas.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400 italic">Sin semanas registradas</p>
            ) : (
              materia.semanas.map((semana) => (
                <div key={semana.id} className="px-5 py-3">
                  <div className="flex items-baseline gap-2">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                      {semana.numero_semana}
                    </span>
                    <p className="text-sm font-medium text-gray-700 leading-snug">
                      {semana.objetivo_semanal ?? (
                        <span className="italic text-gray-400">Sin objetivo definido</span>
                      )}
                    </p>
                  </div>

                  {semana.temas.length > 0 && (
                    <div className="mt-2 ml-9 flex flex-wrap gap-1.5">
                      {semana.temas.map((tema) => (
                        <span
                          key={tema.id}
                          title={tema.descripcion ?? undefined}
                          className="inline-block text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full cursor-default hover:bg-gray-100 transition-colors"
                        >
                          {tema.titulo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {totalTemas > 0 && (
            <div className="bg-gray-50 border-t border-gray-100 px-5 py-2.5">
              <p className="text-xs text-gray-400">{totalTemas} temas en total</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
