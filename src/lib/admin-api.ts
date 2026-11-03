import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeUserRole } from '@/lib/role-types'

type AdminAccess =
  | { authorized: true; userId: string; client: SupabaseClient }
  | { authorized: false; response: NextResponse }

export async function requireAdmin(request: NextRequest): Promise<AdminAccess> {
  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!accessToken) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 }),
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) {
    console.error('[admin-api] missing_public_supabase_config')
    return {
      authorized: false,
      response: NextResponse.json({ error: 'La configuración de Supabase no está completa.' }, { status: 500 }),
    }
  }

  const userClient = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken)
  if (userError || !userData.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'La sesión no es válida.' }, { status: 401 }),
    }
  }

  if (userData.user.banned_until && new Date(userData.user.banned_until).getTime() > Date.now()) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'La cuenta está deshabilitada.' }, { status: 403 }),
    }
  }

  const { data: profile, error: profileError } = await userClient
    .from('perfiles_usuario')
    .select('rol')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[admin-api] role_lookup:error', profileError.message)
    return {
      authorized: false,
      response: NextResponse.json({ error: 'No se pudo validar el rol.' }, { status: 500 }),
    }
  }

  if (normalizeUserRole(profile?.rol) !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Solo un administrador puede gestionar usuarios.' }, { status: 403 }),
    }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.error('[admin-api] SUPABASE_SERVICE_ROLE_KEY_not_configured')
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.' },
        { status: 500 }
      ),
    }
  }

  return {
    authorized: true,
    userId: userData.user.id,
    client: createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }),
  }
}
