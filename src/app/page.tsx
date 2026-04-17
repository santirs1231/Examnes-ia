import Link from 'next/link'
import { testConnection } from '@/lib/supabase'

export default async function Home() {
  const connected = await testConnection()

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

      {/* Estado de conexión Supabase */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${
        connected
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <div>
          <p className={`font-medium text-sm ${connected ? 'text-green-800' : 'text-red-800'}`}>
            {connected ? 'Conectado a Supabase' : 'Sin conexión a Supabase'}
          </p>
          <p className={`text-xs mt-0.5 ${connected ? 'text-green-600' : 'text-red-600'}`}>
            {connected
              ? 'Base de datos disponible y respondiendo correctamente.'
              : 'Verifica las credenciales en el archivo .env.local'}
          </p>
        </div>
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
              <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                Próximamente
              </span>
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

      {/* Info setup */}
      {!connected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-900 text-sm">Configurar conexión a Supabase</h3>
          <p className="mt-1 text-sm text-amber-700">
            Edita el archivo{' '}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code>{' '}
            en la raíz del proyecto y reemplaza los valores:
          </p>
          <pre className="mt-3 bg-amber-100 rounded-lg p-3 text-xs text-amber-900 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key`}
          </pre>
          <p className="mt-2 text-xs text-amber-600">
            Encuentra estas credenciales en tu proyecto de Supabase: Settings → API
          </p>
        </div>
      )}
    </div>
  )
}

