import { supabase } from '@/lib/supabase'
import { normalizeUserRole, type UserRole } from '@/lib/role-types'
export { formatUserRole, normalizeUserRole, type UserRole } from '@/lib/role-types'

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('rol')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo consultar el rol del usuario: ${error.message}`)
  }

  return normalizeUserRole(data?.rol)
}
