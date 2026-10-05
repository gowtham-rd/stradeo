// Built-in question translations and explanations ("why"), shipped as static files:
//   /data/i18n/<lang>/<topic>.json  →  { [seenId]: { q?: string; why?: string } }
// Loaded per topic on first use and kept in memory (the service worker caches the files,
// so they work offline). A missing file simply means "not available yet".
import type { Language, Question } from '@/types'
import { seenId } from './progress'

type Entry = { q?: string; why?: string }
type TopicFile = Record<string, Entry>

const cache = new Map<string, Promise<TopicFile | null>>()

// Each release asks for the files under a new address (?v=<build date>), so a
// phone never keeps an older copy — or an old "not found" — from a previous release.
const RELEASE = encodeURIComponent(process.env.NEXT_PUBLIC_BUILD_DATE || '')

function loadTopic(lang: Language, topic: number): Promise<TopicFile | null> {
  const key = `${lang}/${topic}`
  let p = cache.get(key)
  if (!p) {
    p = fetch(`/data/i18n/${lang}/${topic}.json?v=${RELEASE}`)
      .then(r => (r.ok ? (r.json() as Promise<TopicFile>) : null))
      .catch(() => null)
      // Don't remember a miss (offline, or not published yet): try again next time.
      .then(f => { if (!f) cache.delete(key); return f })
    cache.set(key, p)
  }
  return p
}

/** Translation of the question text into `lang`, or null if there isn't one yet. */
export async function getTranslation(q: Question, lang: Language): Promise<string | null> {
  if (lang === 'it') return null
  const file = await loadTopic(lang, q.t)
  return file?.[seenId(q)]?.q ?? null
}

/** Short explanation of the rule behind the answer, in `lang` (Italian for Italian;
 *  other languages fall back to English). */
export async function getExplanation(q: Question, lang: Language): Promise<string | null> {
  return (await getExplanations(q, lang)).main
}

/** The explanation in the learner's language and in the other one of the pair
 *  Italiano ↔ (their language, or English), for the in-place language switch. */
export async function getExplanations(q: Question, lang: Language): Promise<{
  main: string | null; alt: string | null; mainLang: Language; altLang: Language
}> {
  const id = seenId(q)
  const why = async (l: Language) => (await loadTopic(l, q.t))?.[id]?.why ?? null
  const it = await why('it')
  if (lang === 'it') return { main: it, alt: await why('en'), mainLang: 'it', altLang: 'en' }
  const own = lang === 'en' ? null : await why(lang)
  const en = own ? null : await why('en')
  const main = own ?? en ?? it
  const mainLang: Language = own ? lang : en ? 'en' : 'it'
  return { main, alt: mainLang === 'it' ? null : it, mainLang, altLang: 'it' }
}
