import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { normalizeUserRole } from '@/lib/role-types'
import { requireAdmin } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

function logAdminUsersError(
  requestId: string,
  action: string,
  stage: string,
  error?: unknown
) {
  const message = error instanceof Error
    ? error.message
    : error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : error == null
        ? undefined
        : String(error)
  console.error('[admin-usuarios]', {
    level: 'error',
    requestId,
    action,
    stage,
    ...(message ? { message } : {}),
  })
}

function errorResponse(
  requestId: string,
  action: string,
  stage: string,
  message: string,
  status: number,
  error?: unknown
) {
  if (status >= 500 || error) logAdminUsersError(requestId, action, stage, error ?? message)
  return NextResponse.json(
    { error: message, requestId },
    { status, headers: { 'X-Request-Id': requestId } }
  )
}

async function withRequestLogging(
  request: NextRequest,
  action: string,
  handler: (request: NextRequest, requestId: string) => Promise<NextResponse>
) {
  const requestId = crypto.randomUUID()
  try {
    return await handler(request, requestId)
  } catch (error) {
    return errorResponse(
      requestId,
      action,
      'unhandled_exception',
      'Ocurrió un error inesperado al procesar la solicitud.',
      500,
      error
    )
  }
}

interface UserPayload {
  id?: string
  nombre_completo?: string
  correo_electronico?: string
  rol?: string
  password?: string
  activo?: boolean
}

async function listarTodasLasCuentas(access: Extract<Awaited<ReturnType<typeof requireAdmin>>, { authorized: true }>) {
  const users: User[] = []
  for (let page = 1; ; page += 1) {
    const { data, error } = await access.client.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return { users: null, error }
    users.push(...data.users)
    if (data.users.length < 1000) return { users, error: null }
  }
}

function validarDatos(payload: UserPayload, includePassword: boolean): string | null {
  if (typeof payload.nombre_completo !== 'string' || !payload.nombre_completo.trim()) {
    return 'El nombre completo es obligatorio.'
  }
  if (
    typeof payload.correo_electronico !== 'string' ||
    !payload.correo_electronico.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correo_electronico.trim())
  ) {
    return 'Ingresa un correo electrónico válido.'
  }
  if (typeof payload.rol !== 'string' || !normalizeUserRole(payload.rol)) {
    return 'El rol debe ser Administrador o Docente.'
  }
  if (includePassword && (typeof payload.password !== 'string' || payload.password.length < 8)) {
    return 'La contraseña inicial debe tener al menos 8 caracteres.'
  }
  if (!includePassword && typeof payload.activo !== 'boolean') return 'Indica si la cuenta está habilitada.'
  return null
}

async function handleGet(request: NextRequest, requestId: string) {
  const access = await requireAdmin(request)
  if (!access.authorized) {
    console.warn('[admin-usuarios]', {
      level: 'warn',
      requestId,
      action: 'list',
      stage: 'authorization',
      status: access.response.status,
    })
    access.response.headers.set('X-Request-Id', requestId)
    return access.response
  }

  const { users: authUsers, error: authError } = await listarTodasLasCuentas(access)
  if (authError || !authUsers) {
    return errorResponse(requestId, 'list', 'list_auth_users', 'No se pudieron consultar las cuentas de autenticación.', 500, authError)
  }

  const { data: profiles, error: profilesError } = await access.client
    .from('perfiles_usuario')
    .select('id, nombre_completo, correo_electronico, rol, fecha_creacion')

  if (profilesError) {
    return errorResponse(requestId, 'list', 'list_profiles', 'No se pudieron consultar los perfiles de usuario.', 500, profilesError)
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const users = authUsers.map((authUser) => {
    const profile = profileById.get(authUser.id)
    return {
      id: authUser.id,
      nombre_completo: profile?.nombre_completo ?? String(authUser.user_metadata?.full_name ?? ''),
      correo_electronico: profile?.correo_electronico ?? authUser.email ?? '',
      rol: normalizeUserRole(profile?.rol),
      fecha_creacion: profile?.fecha_creacion ?? authUser.created_at,
      confirmado: Boolean(authUser.email_confirmed_at),
      activo: !authUser.banned_until || new Date(authUser.banned_until).getTime() <= Date.now(),
    }
  })

  return NextResponse.json({ usuarios: users })
}

async function handlePost(request: NextRequest, requestId: string) {
  const access = await requireAdmin(request)
  if (!access.authorized) {
    console.warn('[admin-usuarios]', {
      level: 'warn',
      requestId,
      action: 'create',
      stage: 'authorization',
      status: access.response.status,
    })
    access.response.headers.set('X-Request-Id', requestId)
    return access.response
  }

  let payload: UserPayload
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return errorResponse(requestId, 'create', 'parse_request', 'El cuerpo de la solicitud debe ser un objeto JSON.', 400)
    }
    payload = body as UserPayload
  } catch (error) {
    return errorResponse(requestId, 'create', 'parse_request', 'El cuerpo de la solicitud no es JSON válido.', 400, error)
  }

  const validationError = validarDatos(payload, true)
  if (validationError) return errorResponse(requestId, 'create', 'validate_request', validationError, 400)

  const email = payload.correo_electronico!.trim().toLowerCase()
  const name = payload.nombre_completo!.trim()
  const role = normalizeUserRole(payload.rol)!
  const { data: authData, error: createError } = await access.client.auth.admin.createUser({
    email,
    password: payload.password!,
    email_confirm: true,
    user_metadata: { full_name: name },
  })

  if (createError || !authData.user) {
    return errorResponse(
      requestId,
      'create',
      'create_auth_user',
      createError?.message ?? 'Supabase no devolvió el usuario creado.',
      400,
      createError
    )
  }

  const { error: profileError } = await access.client.from('perfiles_usuario').upsert({
    id: authData.user.id,
    nombre_completo: name,
    correo_electronico: email,
    rol: role,
  }, { onConflict: 'id' })

  if (profileError) {
    const { error: cleanupError } = await access.client.auth.admin.deleteUser(authData.user.id)
    if (cleanupError) {
      return errorResponse(
        requestId,
        'create',
        'rollback_auth_user',
        'No se guardó el perfil y tampoco se pudo revertir la cuenta Auth.',
        500,
        new Error(`profile: ${profileError.message}; rollback: ${cleanupError.message}`)
      )
    }
    return errorResponse(requestId, 'create', 'create_profile', 'No se pudo guardar el perfil.', 500, profileError)
  }

  return NextResponse.json({
    usuario: {
      id: authData.user.id,
      nombre_completo: name,
      correo_electronico: email,
      rol: role,
      fecha_creacion: authData.user.created_at,
      confirmado: Boolean(authData.user.email_confirmed_at),
      activo: true,
    },
  }, { status: 201 })
}

async function handlePatch(request: NextRequest, requestId: string) {
  const access = await requireAdmin(request)
  if (!access.authorized) {
    console.warn('[admin-usuarios]', {
      level: 'warn',
      requestId,
      action: 'update',
      stage: 'authorization',
      status: access.response.status,
    })
    access.response.headers.set('X-Request-Id', requestId)
    return access.response
  }

  let payload: UserPayload
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return errorResponse(requestId, 'update', 'parse_request', 'El cuerpo de la solicitud debe ser un objeto JSON.', 400)
    }
    payload = body as UserPayload
  } catch (error) {
    return errorResponse(requestId, 'update', 'parse_request', 'El cuerpo de la solicitud no es JSON válido.', 400, error)
  }

  if (typeof payload.id !== 'string' || !payload.id) {
    return errorResponse(requestId, 'update', 'validate_request', 'Falta el identificador de usuario.', 400)
  }
  const validationError = validarDatos(payload, false)
  if (validationError) return errorResponse(requestId, 'update', 'validate_request', validationError, 400)

  if (payload.id === access.userId && (normalizeUserRole(payload.rol) !== 'admin' || !payload.activo)) {
    return errorResponse(
      requestId,
      'update',
      'prevent_self_lockout',
      'No puedes quitarte el rol de Administrador ni deshabilitar tu propia cuenta.',
      400
    )
  }

  const { data: currentAuthData, error: currentAuthError } = await access.client.auth.admin.getUserById(payload.id)
  if (currentAuthError || !currentAuthData.user) {
    return errorResponse(
      requestId,
      'update',
      'get_auth_user',
      currentAuthError?.message ?? 'No se encontró la cuenta Auth.',
      404,
      currentAuthError
    )
  }

  const { data: currentProfile, error: currentProfileError } = await access.client
    .from('perfiles_usuario')
    .select('rol')
    .eq('id', payload.id)
    .maybeSingle()
  if (currentProfileError) {
    return errorResponse(requestId, 'update', 'get_profile', 'No se pudo consultar el perfil del usuario.', 500, currentProfileError)
  }

  const currentRole = normalizeUserRole(currentProfile?.rol)
  const accountWillLoseAdminAccess =
    currentRole === 'admin' && (normalizeUserRole(payload.rol) !== 'admin' || !payload.activo)

  if (accountWillLoseAdminAccess) {
    const [{ users: allAuthUsers, error: listError }, { data: adminProfiles, error: adminsError }] = await Promise.all([
      listarTodasLasCuentas(access),
      access.client
        .from('perfiles_usuario')
        .select('id')
        .in('rol', ['admin', 'administrador']),
    ])

    if (listError || !allAuthUsers || adminsError) {
      return errorResponse(
        requestId,
        'update',
        'verify_last_admin',
        'No se pudo verificar que quede otro administrador activo.',
        500,
        listError ?? adminsError
      )
    }

    const authUserById = new Map(allAuthUsers.map((user) => [user.id, user]))
    const activeAdminIds = (adminProfiles ?? [])
      .filter((profile) => {
        const user = authUserById.get(profile.id)
        return user && (!user.banned_until || new Date(user.banned_until).getTime() <= Date.now())
      })
      .map((profile) => profile.id)

    if (activeAdminIds.length <= 1) {
      return errorResponse(
        requestId,
        'update',
        'prevent_last_admin_lockout',
        'No puedes quitar el acceso al último Administrador habilitado.',
        400
      )
    }
  }

  const email = payload.correo_electronico!.trim().toLowerCase()
  const name = payload.nombre_completo!.trim()
  const role = normalizeUserRole(payload.rol)!
  const { error: authUpdateError } = await access.client.auth.admin.updateUserById(payload.id, {
    email,
    email_confirm: true,
    user_metadata: { full_name: name },
    ban_duration: payload.activo ? 'none' : '876000h',
  })

  if (authUpdateError) {
    return errorResponse(requestId, 'update', 'update_auth_user', authUpdateError.message, 400, authUpdateError)
  }

  const { data: profile, error: profileError } = await access.client
    .from('perfiles_usuario')
    .upsert({
      id: payload.id,
      nombre_completo: name,
      correo_electronico: email,
      rol: role,
    }, { onConflict: 'id' })
    .select('id')
    .maybeSingle()

  if (profileError || !profile) {
    const remainingBanMs = currentAuthData.user.banned_until
      ? new Date(currentAuthData.user.banned_until).getTime() - Date.now()
      : 0
    const rollbackDuration = remainingBanMs > 0
      ? `${Math.max(1, Math.ceil(remainingBanMs / 3_600_000))}h`
      : 'none'
    const { error: rollbackError } = await access.client.auth.admin.updateUserById(payload.id, {
      email: currentAuthData.user.email,
      email_confirm: Boolean(currentAuthData.user.email_confirmed_at),
      user_metadata: currentAuthData.user.user_metadata,
      ban_duration: rollbackDuration,
    })

    if (rollbackError) {
      return errorResponse(
        requestId,
        'update',
        'rollback_auth_user',
        'No se pudo guardar el perfil ni revertir los cambios de Auth.',
        500,
        new Error(`profile: ${profileError?.message ?? 'profile not found'}; rollback: ${rollbackError.message}`)
      )
    }

    return errorResponse(
      requestId,
      'update',
      'update_profile',
      'No se pudo guardar el perfil; se revirtieron los cambios de la cuenta Auth.',
      500,
      profileError ?? new Error('No se encontró el perfil.')
    )
  }

  return NextResponse.json({ success: true })
}

export function GET(request: NextRequest) {
  return withRequestLogging(request, 'list', handleGet)
}

export function POST(request: NextRequest) {
  return withRequestLogging(request, 'create', handlePost)
}

export function PATCH(request: NextRequest) {
  return withRequestLogging(request, 'update', handlePatch)
}
