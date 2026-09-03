'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const publicRoutes = ['/login', '/recuperar-password', '/cambiar-password', '/auth/callback']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const isPublicRoute = publicRoutes.includes(pathname)
    const searchParams = new URLSearchParams(window.location.search)
    const hasRecoveryCode = Boolean(searchParams.get('code')) || searchParams.get('type') === 'recovery'

    if (isPublicRoute || hasRecoveryCode) {
      setLoading(false)
      setIsAuthenticated(false)
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
      } else {
        setIsAuthenticated(true)
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
      }

      setIsAuthenticated(Boolean(session))
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

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

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
