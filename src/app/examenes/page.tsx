import Link from 'next/link'

export const metadata = {
  title: 'Generador de Exámenes | Exámenes IA',
}

const featuresPendientes = [
  {
    titulo: 'Selección de curso',
    descripcion: 'Escoge el curso del cual quieres generar el examen.',
    icono: '📚',
  },
  {
    titulo: 'Selección de semanas',
    descripcion: 'Define el rango de semanas que entrarán en el examen.',
    icono: '📅',
  },
  {
    titulo: 'Selección de temas',
    descripcion: 'Elige los temas específicos a evaluar dentro de las semanas.',
    icono: '🎯',
  },
  {
    titulo: 'Generación con IA',
    descripcion: 'La IA creará preguntas basadas en el contenido de los microcurrículos seleccionados.',
    icono: '🤖',
  },
  {
    titulo: 'Exportar examen',
    descripcion: 'Descarga el examen generado en formato txt',
    icono: '📄',
  },
]

export default function ExamenesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Generador de Exámenes</h1>
            <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              En desarrollo
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Próximamente podrás generar exámenes automáticamente con IA a partir de los microcurrículos.
          </p>
        </div>
      </div>

      {/* Características que vendrán */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Funcionalidades previstas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuresPendientes.map((f) => (
            <div
              key={f.titulo}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm opacity-75"
            >
              <div className="text-2xl mb-3">{f.icono}</div>
              <h3 className="font-semibold text-gray-900 text-sm">{f.titulo}</h3>
              <p className="mt-1 text-xs text-gray-500">{f.descripcion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA a microcurrículos */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-indigo-900">
            Mientras tanto, explora los microcurrículos
          </p>
          <p className="text-sm text-indigo-700 mt-0.5">
            Revisa el contenido cargado en la base de datos que se usará para generar los exámenes.
          </p>
        </div>
        <Link
          href="/microcurriculos"
          className="flex-shrink-0 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Ver microcurrículos →
        </Link>
      </div>
    </div>
  )
}
