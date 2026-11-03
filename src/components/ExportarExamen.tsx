'use client'

import { useState } from 'react'
import {
  descargarArchivo,
  generarAiken,
  generarMoodleXml,
  nombreArchivo,
  type ExamenExportable,
} from '@/lib/examenes/exportaciones'

export default function ExportarExamen({ examen }: { examen: ExamenExportable }) {
  const [error, setError] = useState<string | null>(null)

  const descargarMoodleXml = () => {
    try {
      const xml = generarMoodleXml(examen)
      descargarArchivo(`${nombreArchivo(examen.titulo)}.xml`, xml, 'application/xml')
      console.info('[examenes] descargar_moodle_xml:exito', { preguntas: examen.preguntas.length })
      setError(null)
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : 'No se pudo generar Moodle XML.'
      console.error('[examenes] descargar_moodle_xml:error', message)
      setError(message)
    }
  }

  const descargarAiken = () => {
    try {
      const aiken = generarAiken(examen)
      descargarArchivo(`${nombreArchivo(examen.titulo)}.txt`, aiken, 'text/plain')
      console.info('[examenes] descargar_aiken:exito', { preguntas: examen.preguntas.length })
      setError(null)
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : 'No se pudo generar AIKEN.'
      console.error('[examenes] descargar_aiken:error', message)
      setError(message)
    }
  }

  const guardarPdf = () => {
    console.info('[examenes] imprimir_pdf:inicio')
    setError(null)
    window.print()
  }

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={descargarMoodleXml}
          className="rounded-lg border border-siad-violet-200 bg-white px-3 py-2 text-sm font-medium text-siad-violet-700 transition-colors hover:border-siad-violet-300 hover:bg-siad-violet-50"
        >
          Descargar Moodle XML
        </button>
        <button
          type="button"
          onClick={descargarAiken}
          className="rounded-lg border border-siad-navy-200 bg-white px-3 py-2 text-sm font-medium text-siad-navy-800 transition-colors hover:border-siad-navy-300 hover:bg-siad-navy-50"
        >
          Descargar AIKEN
        </button>
        <button
          type="button"
          onClick={guardarPdf}
          className="rounded-lg border border-siad-navy-200 bg-white px-3 py-2 text-sm font-medium text-siad-navy-800 transition-colors hover:border-siad-navy-300 hover:bg-siad-navy-50"
        >
          Imprimir / Guardar PDF
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}
