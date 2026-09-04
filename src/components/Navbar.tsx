'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/', label: 'Inicio' },
  { href: '/microcurriculos', label: 'Microcurrículos' },
  { href: '/examenes', label: 'Exámenes' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<string>('')

  useEffect(() => {
    const syncSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)

      if (data.session?.user) {
        const { data: perfil } = await supabase
          .from('perfiles_usuario')
          .select('rol')
          .eq('id', data.session.user.id)
          .maybeSingle()

        setRole((perfil?.rol as string) || 'docente')
      } else {
        setRole('')
      }
    }

    syncSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)

      if (nextSession?.user) {
        const { data: perfil } = await supabase
          .from('perfiles_usuario')
          .select('rol')
          .eq('id', nextSession.user.id)
          .maybeSingle()

        setRole((perfil?.rol as string) || 'docente')
      } else {
        setRole('')
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-sm font-bold text-white">IA</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">Exámenes IA</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}

          {session ? (
            <div className="ml-2 flex items-center gap-3">
              {role && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 uppercase">
                  {role}
                </span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
