'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/LoginForm'
import SplashScreen from '@/components/SplashScreen'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/')
  }, [user, loading, router])

  if (loading) return <SplashScreen />
  if (user) return <SplashScreen />
  return <LoginForm />
}
