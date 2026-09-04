'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CambiarPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const initializeSession = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      console.log('CambiarPassword debug', {
        code,
        type: params.get('type'),
        next: params.get('next'),
        href: window.location.href,
      })

      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.log('CambiarPassword: current session exists?', Boolean(session), session?.user?.id ?? null)

      if (isMounted) {
        setHasSession(Boolean(session))
      }
    }

    initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setHasSession(Boolean(session))
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Debes completar ambos campos.')
      return
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    try {
      setIsSubmitting(true)
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

      if (updateError) {
        throw updateError
      }

      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        console.warn('No se pudo cerrar la sesión después del cambio de contraseña:', signOutError)
      }

      setMessage('Tu contraseña se actualizó correctamente. Ahora vuelve a iniciar sesión con tu nueva contraseña.')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        router.replace('/login')
      }, 1500)
    } catch (err: unknown) {
      const value = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.'
      setError(value)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasSession === false) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Enlace inválido o vencido</h1>
          <p className="mt-3 text-sm text-gray-500">
            Debes iniciar sesión o usar el enlace de recuperación enviado por correo.
          </p>
          <Link href="/login" className="mt-5 inline-block rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
            Ir al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Crear nueva contraseña</h1>
        <p className="mt-2 text-sm text-gray-500">
          Ingresa tu nueva contraseña y, cuando termine, volverás al inicio de sesión para entrar con ella.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Repite la contraseña"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !hasSession}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
