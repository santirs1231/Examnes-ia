import { getMicrocurriculoCompleto } from '@/lib/queries'
import { testConnection } from '@/lib/supabase'
import MicrocurriculosCliente from '@/components/MicrocurriculosCliente'

export const metadata = {
  title: 'Microcurrículos | Exámenes IA',
}

export default async function MicrocurriculosPage() {
  const [connected, initialData] = await Promise.all([
    testConnection(),
    getMicrocurriculoCompleto(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Microcurrículos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Consulta y filtra el contenido curricular por curso, semana y tema.
          </p>
        </div>

        {/* Badge conexión */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          connected
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          {connected ? 'Supabase conectado' : 'Sin conexión'}
        </div>
      </div>

      {/* Aviso si no hay conexión */}
      {!connected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Sin conexión a Supabase.</strong> Configura las credenciales en{' '}
          <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">.env.local</code>{' '}
          para ver los datos reales.
        </div>
      )}

      {/* Componente cliente con filtros y resultados */}
      <MicrocurriculosCliente initialData={initialData} />
    </div>
  )
}
