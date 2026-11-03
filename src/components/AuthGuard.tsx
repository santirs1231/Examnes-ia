'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/roles'
import type { UserRole } from '@/lib/role-types'

const publicRoutes = ['/login', '/recuperar-password', '/cambiar-password', '/auth/callback']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState<UserRole | null>(null)
  const [accessError, setAccessError] = useState<string | null>(null)

  useEffect(() => {
    const isPublicRoute = publicRoutes.includes(pathname)
    const searchParams = new URLSearchParams(window.location.search)
    const hasRecoveryCode = Boolean(searchParams.get('code')) || searchParams.get('type') === 'recovery'

    if (isPublicRoute || hasRecoveryCode) {
      setLoading(false)
      setIsAuthenticated(false)
      setRole(null)
      setAccessError(null)
      return
    }

    let isMounted = true

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) return

      if (!session) {
        router.replace('/login')
        setIsAuthenticated(false)
        setRole(null)
      } else {
        try {
          const currentRole = await getUserRole(session.user.id)
          if (!isMounted) return
          if (!currentRole) {
            setAccessError('Tu cuenta no tiene un rol válido asignado. Contacta al administrador.')
            setIsAuthenticated(false)
            setRole(null)
          } else {
            setAccessError(null)
            setIsAuthenticated(true)
            setRole(currentRole)
          }
        } catch (error) {
          if (!isMounted) return
          console.error('[auth] role_lookup:error', error)
          setAccessError(error instanceof Error ? error.message : 'No se pudo validar tu rol.')
          setIsAuthenticated(false)
          setRole(null)
        }
      }

      setLoading(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return

      if (!session && !publicRoutes.includes(pathname)) {
        router.replace('/login')
        setRole(null)
        setAccessError(null)
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      if (session) {
        setLoading(true)
        getUserRole(session.user.id).then((currentRole) => {
          if (!isMounted) return
          if (!currentRole) {
            setAccessError('Tu cuenta no tiene un rol válido asignado. Contacta al administrador.')
            setIsAuthenticated(false)
            setRole(null)
          } else {
            setAccessError(null)
            setIsAuthenticated(true)
            setRole(currentRole)
          }
          setLoading(false)
        }).catch((error: unknown) => {
          if (!isMounted) return
          console.error('[auth] role_lookup:error', error)
          setAccessError(error instanceof Error ? error.message : 'No se pudo validar tu rol.')
          setIsAuthenticated(false)
          setRole(null)
          setLoading(false)
        })
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  const adminIsBlockedFromQuestions =
    role === 'admin' &&
    (pathname === '/examenes' || pathname.startsWith('/examenes/guardados'))
  const teacherIsBlockedFromAdmin =
    role === 'docente' && pathname.startsWith('/admin')

  useEffect(() => {
    if (adminIsBlockedFromQuestions) router.replace('/')
    if (teacherIsBlockedFromAdmin) router.replace('/')
  }, [adminIsBlockedFromQuestions, teacherIsBlockedFromAdmin, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-600 shadow-sm">
          Validando sesión...
        </div>
      </div>
    )
  }

  if (publicRoutes.includes(pathname) || (pathname === '/auth/callback' && Boolean(new URLSearchParams(window.location.search).get('code')))) {
    return <>{children}</>
  }

  if (accessError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div role="alert" className="max-w-lg rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {accessError}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (adminIsBlockedFromQuestions || teacherIsBlockedFromAdmin) return null

  return <>{children}</>
}
