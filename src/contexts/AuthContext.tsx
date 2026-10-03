'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserSession } from '@/types'

interface AuthContextType {
  user: UserSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const next = session?.user ? { id: session.user.id, email: session.user.email || '' } : null
      setUser(prev => (prev?.id === next?.id ? prev : next))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // TOKEN_REFRESHED etc. fire roughly hourly; keep the same object when the
      // user hasn't changed so dependants don't reload (and roll back) progress.
      const next = session?.user ? { id: session.user.id, email: session.user.email || '' } : null
      setUser(prev => (prev?.id === next?.id ? prev : next))
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

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
