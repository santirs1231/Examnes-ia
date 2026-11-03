'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { normalizeUserRole } from '@/lib/role-types'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const params = new URLSearchParams(window.location.search)
    const rawNext = params.get('next') ?? ''
    const decodedNext = rawNext ? decodeURIComponent(rawNext) : ''
    const hasRecoveryCode = params.get('type') === 'recovery' || decodedNext.includes('/cambiar-password') || Boolean(params.get('code'))

    if (hasRecoveryCode) {
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted && data.session) {
        router.replace('/')
      }
    })

    return () => {
      isMounted = false
    }
  }, [router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Debes ingresar email y contraseña.')
      return
    }

    try {
      setIsSubmitting(true)

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (!data.user) {
        throw new Error('No se pudo iniciar sesión.')
      }

      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles_usuario')
        .select('rol')
        .eq('id', data.user.id)
        .maybeSingle()
      if (perfilError) throw perfilError

      if (!normalizeUserRole(perfil?.rol)) {
        throw new Error('Tu cuenta no tiene un rol válido asignado. Contacta al administrador.')
      }

      router.push('/')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'No se pudo iniciar sesión con las credenciales actuales.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Image
            src="/logo/siad-saber-pro.png"
            alt="SIAD-Saber Pro"
            width={1536}
            height={1024}
            priority
            className="mx-auto h-32 w-48 object-contain"
          />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-gray-500">
            Accede con tu cuenta institucional para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="usuario@institucion.edu.co"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <Link href="/recuperar-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

      </div>
    </div>
  )
}
