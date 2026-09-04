'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasStarted = useRef(false)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const code = searchParams.get('code')
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const type = searchParams.get('type') ?? hashParams.get('type')
    const hasRecoveryToken = type === 'recovery' || Boolean(hashParams.get('access_token'))

    const handleCallback = async () => {
      if (!code && !hasRecoveryToken) {
        router.replace('/login')
        return
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          router.replace('/login')
          return
        }
      }

      if (hasRecoveryToken) {
        router.replace('/cambiar-password')
        return
      }

      router.replace('/microcurriculos')
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-600 shadow-sm">
        Validando enlace de recuperación...
      </div>
    </div>
  )
}
