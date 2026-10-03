import Link from 'next/link'
import type { Metadata } from 'next'
import StradeoMark from '@/components/StradeoMark'

export const metadata: Metadata = { title: 'Privacy — Stradeo' }

// Plain-language privacy notice (GDPR art. 13). Keep it in sync with what the app stores.
export default function PrivacyPage() {
  return (
    <main className="max-w-[640px] mx-auto px-4 py-10 text-[15px] leading-relaxed">
      <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
        <StradeoMark size={32} /><span className="text-[17px] font-bold">Stradeo</span>
      </Link>
      <h1 className="text-2xl font-bold mb-2">Privacy</h1>
      <p className="text-stradeo-inkdim mb-8">Last updated: 3 October 2026</p>

      <Section title="Who runs Stradeo">
        Stradeo is a small study app made by Hashtag Labs. Accounts are created by invitation only.
        For any privacy question, or to have your data deleted, contact the person who gave you your account.
      </Section>

      <Section title="What we store">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><b>Your account:</b> your email address. Your password is handled by our login provider (Supabase) and is never visible to us.</li>
          <li><b>Your study progress:</b> which questions you answered, right or wrong, your Smart Review schedule, your daily activity and streak.</li>
          <li><b>Questions you report</b> as wrong or unclear, with the optional note you write.</li>
          <li><b>How many AI requests you made today</b>, only to apply the daily limit.</li>
        </ul>
      </Section>

      <Section title="Why">
        Only to run the app for you: to keep your progress between devices, schedule reviews, and fix
        reported questions (legal basis: providing the service you asked for). No advertising, no tracking
        cookies, no selling or sharing of data.
      </Section>

      <Section title="Where it lives">
        Data is stored with Supabase (database and login) and the app is hosted on Vercel. If you use the
        AI features (translations, explanations), the question text and your chosen language are sent to
        Anthropic to generate the answer; your email is not sent.
      </Section>

      <Section title="On your device">
        Your browser keeps your theme, language, and a copy of your progress so you can practise offline.
        Logging out and clearing site data removes it.
      </Section>

      <Section title="Your rights">
        You can ask to see, correct, export or delete your data at any time, and you can complain to the
        Italian data protection authority (Garante per la protezione dei dati personali). We keep your data
        until you ask us to delete your account.
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-base font-bold mb-2">{title}</h2>
      <div className="text-stradeo-inkdim">{children}</div>
    </section>
  )
}
