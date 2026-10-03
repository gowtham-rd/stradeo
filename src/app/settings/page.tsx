'use client'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGES, t } from '@/lib/i18n'
import type { Language } from '@/types'
import NavBar from '@/components/NavBar'
import ThemeToggle from '@/components/ThemeToggle'
import { IconSettings, IconCheck, IconArrowRight } from '@/components/icons'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { lang, setLang } = useLanguage()

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-[640px] mx-auto px-4 pt-5 pb-10 animate-fade-in">
        <h1 className="text-[22px] font-bold mb-5 inline-flex items-center gap-2.5"><IconSettings size={20} />{t(lang, 'settings')}</h1>

        <Section title={t(lang, 'appearance')}>
          <ThemeToggle />
          <p className="text-[12px] text-stradeo-inkfaint mt-2.5">{t(lang, 'themeHint')}</p>
        </Section>

        <Section title={t(lang, 'language')}>
          <div role="radiogroup" aria-label={t(lang, 'language')} className="grid grid-cols-2 gap-2">
            {(Object.entries(LANGUAGES) as [Language, string][]).map(([k, name]) => (
              <button key={k} role="radio" aria-checked={lang === k} onClick={() => setLang(k)}
                className={`flex items-center justify-between rounded-[10px] border px-3.5 py-3 text-sm font-semibold text-left ${
                  lang === k ? 'border-stradeo-ink text-stradeo-ink' : 'border-stradeo-line text-stradeo-inkdim hover:text-stradeo-ink'
                }`}>
                {name}
                {lang === k && <IconCheck size={14} />}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t(lang, 'account')}>
          <p className="text-[13px] text-stradeo-inkdim mb-3">
            {t(lang, 'signedInAs')} <strong className="font-semibold text-stradeo-ink break-all">{user?.email}</strong>
          </p>
          <button onClick={signOut}
            className="w-full rounded-[10px] border border-stradeo-line px-4 py-3 text-sm font-semibold text-stradeo-accent2 hover:border-stradeo-accent2">
            {t(lang, 'logout')}
          </button>
        </Section>

        <Section title={t(lang, 'about')}>
          <Link href="/privacy" className="flex items-center justify-between rounded-[10px] border border-stradeo-line px-4 py-3 text-sm font-semibold text-stradeo-ink hover:border-stradeo-ink">
            {t(lang, 'privacyLink')} <IconArrowRight size={13} />
          </Link>
          <p className="font-mono text-[12px] text-stradeo-inkfaint mt-3">Stradeo · {t(lang, 'appVersion')} {process.env.NEXT_PUBLIC_APP_VERSION}</p>
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-5 mb-3.5">
      <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim mb-3">{title}</h2>
      {children}
    </section>
  )
}
