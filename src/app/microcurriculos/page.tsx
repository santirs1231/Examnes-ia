import { getMicrocurriculoCompleto } from '@/lib/queries'
import MicrocurriculosCliente from '@/components/MicrocurriculosCliente'

export const metadata = {
  title: 'Microcurrículos | Exámenes IA',
}

export default async function MicrocurriculosPage() {
  const initialData = await getMicrocurriculoCompleto()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Microcurrículos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consulta y filtra el contenido curricular por materia y semana.
        </p>
      </div>

      {/* Componente cliente con filtros y resultados */}
      <MicrocurriculosCliente initialData={initialData} />
    </div>
  )
}
