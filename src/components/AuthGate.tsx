'use client'
import { useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useProgress } from '@/contexts/ProgressContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import { IconWarning } from './icons'

// Home ('/') shows its own login form and '/login' is public; every other page
// needs a signed-in user, otherwise answers would be silently lost.
const PUBLIC = new Set(['/', '/login'])

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const protectedPage = !PUBLIC.has(pathname)

  useEffect(() => {
    if (protectedPage && !loading && !user) router.replace('/login')
  }, [protectedPage, loading, user, router])

  if (protectedPage && (loading || !user)) return <div className="min-h-screen" />
  return (
    <>
      {children}
      {user && <ProgressStatus />}
    </>
  )
}

// Small fixed banner when progress can't be loaded or saved.
function ProgressStatus() {
  const { loadError, saveError, retryLoad } = useProgress()
  const { lang } = useLanguage()
  if (!loadError && !saveError) return null
  return (
    <div role="alert" className="fixed inset-x-0 bottom-0 z-[200] p-3 flex justify-center pointer-events-none">
      <div className="pointer-events-auto max-w-[640px] w-full flex items-center gap-3 rounded-[10px] border border-stradeo-accent2/30 bg-stradeo-bg2 px-4 py-3 text-[13px] text-stradeo-ink">
        <IconWarning size={16} className="text-stradeo-accent2 shrink-0" />
        <span className="flex-1">{t(lang, loadError ? 'loadFailed' : 'saveFailed')}</span>
        {loadError && (
          <button onClick={retryLoad} className="shrink-0 rounded-lg border border-stradeo-line px-3 py-1.5 font-semibold hover:border-stradeo-ink">
            {t(lang, 'retry')}
          </button>
        )}
      </div>
    </div>
  )
}
