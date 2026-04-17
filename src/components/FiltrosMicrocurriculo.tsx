'use client'

import { useEffect, useState, useTransition } from 'react'
import { getMaterias, getSemanasByMateria } from '@/lib/queries'
import type { Materia, Semana } from '@/types/microcurriculo'

interface Props {
  onFiltrar: (materiaId: number | undefined, semanaNumero: number | undefined) => void
}

export default function FiltrosMicrocurriculo({ onFiltrar }: Props) {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [semanas, setSemanas] = useState<Semana[]>([])

  const [materiaSelId, setMateriaSelId] = useState<string>('')
  const [semanaSelNum, setSemanaSelNum] = useState<string>('')

  const [isPending, startTransition] = useTransition()

  // Cargar materias al montar
  useEffect(() => {
    getMaterias().then(setMaterias)
  }, [])

  // Cargar semanas cuando cambia la materia
  useEffect(() => {
    if (!materiaSelId) {
      setSemanas([])
      setSemanaSelNum('')
      return
    }
    getSemanasByMateria(Number(materiaSelId)).then(setSemanas)
    setSemanaSelNum('')
  }, [materiaSelId])

  const handleBuscar = () => {
    startTransition(() => {
      onFiltrar(
        materiaSelId ? Number(materiaSelId) : undefined,
        semanaSelNum ? Number(semanaSelNum) : undefined
      )
    })
  }

  const handleLimpiar = () => {
    setMateriaSelId('')
    setSemanaSelNum('')
    onFiltrar(undefined, undefined)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Filtrar microcurrículos</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Materia */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Materia</label>
          <select
            value={materiaSelId}
            onChange={(e) => setMateriaSelId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="">Todas las materias</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                [{m.codigo}] {m.nombre} — {m.anio}
              </option>
            ))}
          </select>
        </div>

        {/* Semana */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Semana</label>
          <select
            value={semanaSelNum}
            onChange={(e) => setSemanaSelNum(e.target.value)}
            disabled={!materiaSelId || semanas.length === 0}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Todas las semanas</option>
            {semanas.map((s) => (
              <option key={s.id} value={s.numero_semana}>
                Semana {s.numero_semana}
                {s.objetivo_semanal ? ` — ${s.objetivo_semanal.slice(0, 40)}${s.objetivo_semanal.length > 40 ? '…' : ''}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleBuscar}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Buscando...' : 'Buscar'}
        </button>
        <button
          onClick={handleLimpiar}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}
