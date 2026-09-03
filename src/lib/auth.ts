import { supabase } from './supabase'

export type PerfilUsuario = {
  id: string
  nombre_completo: string
  correo_electronico: string
  rol: string | null
  fecha_creacion: string | null
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    throw error
  }

  return data.session
}

export async function getCurrentUserProfile(): Promise<PerfilUsuario | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as PerfilUsuario | null
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function resetPasswordForEmail(email: string, redirectTo: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  })

  if (error) {
    throw error
  }
}

export async function updateCurrentUserPassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw error
  }

  return data
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}
