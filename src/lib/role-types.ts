export type UserRole = 'admin' | 'docente'

export function normalizeUserRole(value: string | null | undefined): UserRole | null {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'admin' || normalized === 'administrador') return 'admin'
  if (normalized === 'docente') return 'docente'
  return null
}

export function formatUserRole(role: UserRole): string {
  return role === 'admin' ? 'Administrador' : 'Docente'
}
