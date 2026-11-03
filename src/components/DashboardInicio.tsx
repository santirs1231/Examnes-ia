'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/roles'
import { formatUserRole, type UserRole } from '@/lib/role-types'

interface DashboardMetric {
  label: string
  value: number
  description: string
}

export default function DashboardInicio() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!sessionData.session) throw new Error('No hay una sesión activa.')

        const currentRole = await getUserRole(sessionData.session.user.id)
        if (!currentRole) throw new Error('La cuenta no tiene un rol válido asignado.')
        if (active) setRole(currentRole)

        if (currentRole === 'admin') {
          const [
            profiles,
            subjects,
            weeks,
            savedExams,
          ] = await Promise.all([
            supabase.from('perfiles_usuario').select('id', { count: 'exact', head: true }),
            supabase.from('materias').select('id', { count: 'exact', head: true }),
            supabase.from('semanas').select('id', { count: 'exact', head: true }),
            supabase.from('examenes_guardados').select('id', { count: 'exact', head: true }),
          ])

          const queryError = profiles.error ?? subjects.error ?? weeks.error ?? savedExams.error
          if (queryError) throw queryError

          if (active) {
            setMetrics([
              { label: 'Usuarios', value: profiles.count ?? 0, description: 'Cuentas registradas' },
              { label: 'Asignaturas', value: subjects.count ?? 0, description: 'Materias disponibles' },
              { label: 'Semanas', value: weeks.count ?? 0, description: 'Semanas curriculares' },
              { label: 'Exámenes guardados', value: savedExams.count ?? 0, description: 'Contenido registrado' },
            ])
          }
        } else {
          const { data: exams, error: examsError } = await supabase
            .from('examenes_guardados')
            .select('cantidad_preguntas')
            .eq('creador_id', sessionData.session.user.id)

          if (examsError) throw examsError

          if (active) {
            setMetrics([
              {
                label: 'Mis exámenes',
                value: exams.length,
                description: 'Exámenes guardados por ti',
              },
              {
                label: 'Preguntas en mis exámenes',
                value: exams.reduce((total, exam) => total + (exam.cantidad_preguntas ?? 0), 0),
                description: 'Preguntas en tus exámenes guardados',
              },
            ])
          }
        }

        if (active) setLoading(false)
      } catch (loadError) {
        console.error('[dashboard] load:error', loadError)
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el dashboard.')
          setLoading(false)
        }
      }
    }

    void loadDashboard()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Cargando dashboard...</p>
  }

  return (
    <section className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          {role ? `Panel de ${formatUserRole(role)}` : 'Panel'}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          {role === 'admin' ? 'Administración del sistema' : 'Dashboard docente'}
        </h1>
        <p className="mt-2 text-gray-600">
          {role === 'admin'
            ? 'Consulta el estado general de usuarios y estructura académica.'
            : 'Consulta tu actividad y continúa trabajando con tus exámenes.'}
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {!error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{metric.value}</p>
              <p className="mt-1 text-xs text-gray-500">{metric.description}</p>
            </article>
          ))}
        </div>
      )}

      {role === 'admin' ? (
        <Link
          href="/microcurriculos"
          className="inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Consultar estructura académica
        </Link>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/examenes"
            className="inline-flex rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
          >
            Crear preguntas / examen
          </Link>
          <Link
            href="/examenes/guardados"
            className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Consultar mis exámenes
          </Link>
          <Link
            href="/microcurriculos"
            className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Consultar asignaturas
          </Link>
        </div>
      )}
    </section>
  )
}
