'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AUTH_LINK } from '@/lib/authLink'

// Sends email links to the right page: invites to /welcome, password resets to
// /reset, expired links to the "link expired" message. Works even when the link
// lands on the home page (Supabase falls back to the site root).
export default function AuthLinkRouter() {
  const pathname = usePathname()
  const router = useRouter()
  useEffect(() => {
    const { type, error } = AUTH_LINK
    if (error && pathname !== '/reset' && pathname !== '/welcome') { router.replace('/reset?error=link'); return }
    if ((type === 'invite' || type === 'signup') && pathname !== '/welcome') router.replace('/welcome')
    else if (type === 'recovery' && pathname !== '/reset') router.replace('/reset')
    // Only on the first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
