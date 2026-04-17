import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Plataforma de Exámenes con IA
        </h1>
        <p className="mt-2 text-gray-600">
          Genera exámenes personalizados a partir de los microcurrículos institucionales.
        </p>
      </div>

      {/* Cards de navegación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Microcurrículos */}
        <Link href="/microcurriculos" className="group block">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Microcurrículos</h2>
            <p className="mt-1 text-sm text-gray-500">
              Visualiza y filtra los microcurrículos cargados por curso, semana y tema.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
              Ver microcurrículos
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Exámenes — próximamente */}
        <Link href="/examenes" className="group block">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Generador de Exámenes</h2>
            <p className="mt-1 text-sm text-gray-500">
              Selecciona curso, semanas y temas para generar exámenes automáticamente con IA.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-purple-600">
              Ver detalles
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

    </div>
  )
}

