'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserSession } from '@/types'
import type { User } from '@supabase/supabase-js'

function toSession(u: User | null | undefined): UserSession | null {
  if (!u) return null
  const name = typeof u.user_metadata?.display_name === 'string' ? u.user_metadata.display_name.trim() : ''
  return { id: u.id, email: u.email || '', ...(name ? { name } : {}) }
}

/** Keep the same object while nothing visible changed (token refreshes fire hourly). */
const same = (a: UserSession | null, b: UserSession | null) => a?.id === b?.id && a?.name === b?.name && a?.email === b?.email

interface AuthContextType {
  user: UserSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  /** Save a display name (empty string clears it). */
  updateName: (name: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const next = toSession(session?.user)
      setUser(prev => (same(prev, next) ? prev : next))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // TOKEN_REFRESHED etc. fire roughly hourly; keep the same object when the
      // user hasn't changed so dependants don't reload (and roll back) progress.
      const next = toSession(session?.user)
      setUser(prev => (same(prev, next) ? prev : next))
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Only a real credentials error means "wrong password"; anything else is a connection/server problem.
      const wrong = error.code === 'invalid_credentials' || /invalid login credentials/i.test(error.message)
      return { error: wrong ? 'wrongCreds' : 'connError' }
    }
    return {}
  }

  const updateName = async (name: string) => {
    const clean = name.trim().slice(0, 40)
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: clean } })
    if (error) return { error: 'connError' }
    const next = toSession(data.user)
    setUser(prev => (same(prev, next) ? prev : next))
    return {}
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
