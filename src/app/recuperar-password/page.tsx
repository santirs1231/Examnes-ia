'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [lastRequestAt, setLastRequestAt] = useState(0)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Debes ingresar tu correo electrónico.')
      return
    }

    const now = Date.now()
    const cooldownMs = 30000

    if (now - lastRequestAt < cooldownMs) {
      setError('Ya se envió un enlace recientemente. Espera unos segundos antes de intentarlo otra vez.')
      return
    }

    try {
      setIsSubmitting(true)
      setLastRequestAt(now)

      const redirectUrl = new URL('/auth/callback', window.location.origin)

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl.toString(),
      })

      if (resetError) {
        if (resetError.status === 429) {
          setError('Se enviaron demasiadas solicitudes desde esta cuenta. Espera unos momentos y vuelve a intentarlo.')
          return
        }

        throw resetError
      }

      setMessage('Si el correo existe en la base de autenticación, recibirás el enlace para restablecer la contraseña.')
      setEmail('')
    } catch (err: unknown) {
      const value =
        err instanceof Error
          ? err.message
          : 'No se pudo enviar la solicitud. Verifica tu conexión o intenta nuevamente.'
      setError(value)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-gray-500">
          Ingresa tu correo para recibir un enlace de recuperación.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="correo@institucion.edu.co"
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
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
