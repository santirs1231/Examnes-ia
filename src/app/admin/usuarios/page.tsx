'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/lib/role-types'

interface AdminUser {
  id: string
  nombre_completo: string
  correo_electronico: string
  rol: UserRole | null
  fecha_creacion: string
  confirmado: boolean
  activo: boolean
}

interface UserForm {
  nombre_completo: string
  correo_electronico: string
  rol: UserRole
  password: string
}

interface AdminApiErrorBody {
  usuarios?: AdminUser[]
  usuario?: AdminUser
  error?: string
  success?: boolean
  requestId?: string
}

class AdminRequestError extends Error {
  constructor(
    message: string,
    readonly requestId?: string,
    readonly status?: number
  ) {
    super(message)
    this.name = 'AdminRequestError'
  }
}

function logRequestError(action: string, error: unknown) {
  console.error('[admin-usuarios]', {
    level: 'error',
    action,
    message: error instanceof Error ? error.message : 'Error desconocido',
    ...(error instanceof AdminRequestError
      ? { requestId: error.requestId, status: error.status }
      : {}),
  })
}

const emptyForm: UserForm = {
  nombre_completo: '',
  correo_electronico: '',
  rol: 'docente',
  password: '',
}

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const authenticatedRequest = useCallback(async (method: 'GET' | 'POST' | 'PATCH', body?: object) => {
    const { data, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!data.session) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')

    const response = await fetch('/api/admin/usuarios', {
      method,
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const result = await response.json() as AdminApiErrorBody
    if (!response.ok) {
      const requestId = result.requestId ?? response.headers.get('X-Request-Id') ?? undefined
      throw new AdminRequestError(
        result.error
          ? `${result.error}${requestId ? ` Referencia: ${requestId}.` : ''}`
          : 'La solicitud de administración falló.',
        requestId,
        response.status
      )
    }
    return result
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await authenticatedRequest('GET')
      setUsers(result.usuarios ?? [])
    } catch (loadError) {
      logRequestError('list', loadError)
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los usuarios.')
    } finally {
      setLoading(false)
    }
  }, [authenticatedRequest])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) =>
      user.nombre_completo.toLowerCase().includes(query) ||
      user.correo_electronico.toLowerCase().includes(query) ||
      user.rol?.includes(query)
    )
  }, [search, users])

  const startEditing = (user: AdminUser) => {
    setEditing(user)
    setForm({
      nombre_completo: user.nombre_completo,
      correo_electronico: user.correo_electronico,
      rol: user.rol ?? 'docente',
      password: '',
    })
    setNotice(null)
    setError(null)
  }

  const resetForm = () => {
    setEditing(null)
    setForm(emptyForm)
  }

  const submitUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)

    try {
      if (editing) {
        await authenticatedRequest('PATCH', {
          id: editing.id,
          nombre_completo: form.nombre_completo,
          correo_electronico: form.correo_electronico,
          rol: form.rol,
          activo: editing.activo,
        })
        setNotice('Los datos del usuario se actualizaron.')
        console.info('[admin-usuarios] update:success', { userId: editing.id })
      } else {
        await authenticatedRequest('POST', form)
        setNotice('La cuenta se creó correctamente.')
        console.info('[admin-usuarios] create:success')
      }
      resetForm()
      await loadUsers()
    } catch (saveError) {
      logRequestError(editing ? 'update' : 'create', saveError)
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (user: AdminUser) => {
    setError(null)
    setNotice(null)
    try {
      await authenticatedRequest('PATCH', {
        id: user.id,
        nombre_completo: user.nombre_completo,
        correo_electronico: user.correo_electronico,
        rol: user.rol ?? 'docente',
        activo: !user.activo,
      })
      setNotice(`La cuenta quedó ${user.activo ? 'deshabilitada' : 'habilitada'}.`)
      console.info('[admin-usuarios] status:success', { userId: user.id, activo: !user.activo })
      await loadUsers()
    } catch (updateError) {
      logRequestError('change_status', updateError)
      setError(updateError instanceof Error ? updateError.message : 'No se pudo cambiar el estado.')
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Administración</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Usuarios y roles</h1>
        <p className="mt-1 text-sm text-gray-500">
          Crea cuentas de Supabase Auth, asigna Administrador o Docente y habilita o deshabilita el acceso.
        </p>
      </header>

      {(error || notice) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`rounded-xl border px-4 py-3 text-sm ${
            error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
          }`}
        >
          {error ?? notice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <form onSubmit={submitUser} className="h-fit space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">{editing ? 'Editar usuario' : 'Crear usuario'}</h2>
          <label className="block text-sm font-medium text-gray-700">
            Nombre completo
            <input
              required
              maxLength={150}
              value={form.nombre_completo}
              onChange={(event) => setForm((current) => ({ ...current, nombre_completo: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Correo electrónico
            <input
              required
              type="email"
              maxLength={255}
              value={form.correo_electronico}
              onChange={(event) => setForm((current) => ({ ...current, correo_electronico: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Rol
            <select
              value={form.rol}
              onChange={(event) => setForm((current) => ({ ...current, rol: event.target.value as UserRole }))}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="docente">Docente</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          {!editing && (
            <label className="block text-sm font-medium text-gray-700">
              Contraseña inicial
              <input
                required
                minLength={8}
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cuenta'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Buscar por nombre, correo o rol
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Escribe para filtrar..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          {loading ? (
            <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Cargando usuarios...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">No hay usuarios que coincidan.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <ul className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <li key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{user.nombre_completo || 'Sin nombre'}</p>
                      <p className="truncate text-sm text-gray-500">{user.correo_electronico}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {user.rol === 'admin'
                          ? 'Administrador'
                          : user.rol === 'docente'
                            ? 'Docente'
                            : 'Sin rol válido'}
                        {' · '}
                        {user.activo ? 'Habilitado' : 'Deshabilitado'}
                        {' · '}
                        {user.confirmado ? 'Correo confirmado' : 'Correo sin confirmar'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(user)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleActive(user)}
                        disabled={!user.rol}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                          user.activo
                            ? 'border-red-200 text-red-700 hover:bg-red-50'
                            : 'border-green-200 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {user.activo ? 'Deshabilitar' : 'Habilitar'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-gray-400">
            La lista incluye las cuentas registradas en Supabase Auth. La clave de servicio se utiliza solo en el servidor.
          </p>
        </div>
      </div>
    </section>
  )
}
