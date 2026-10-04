// Built-in question translations and explanations ("why"), shipped as static files:
//   /data/i18n/<lang>/<topic>.json  →  { [seenId]: { q?: string; why?: string } }
// Loaded per topic on first use and kept in memory (the service worker caches the files,
// so they work offline). A missing file simply means "not available yet".
import type { Language, Question } from '@/types'
import { seenId } from './progress'

type Entry = { q?: string; why?: string }
type TopicFile = Record<string, Entry>

const cache = new Map<string, Promise<TopicFile | null>>()

function loadTopic(lang: Language, topic: number): Promise<TopicFile | null> {
  const key = `${lang}/${topic}`
  let p = cache.get(key)
  if (!p) {
    p = fetch(`/data/i18n/${lang}/${topic}.json`)
      .then(r => (r.ok ? (r.json() as Promise<TopicFile>) : null))
      .catch(() => null)
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

/** Short explanation of the rule behind the answer, in `lang` (falls back to English). */
export async function getExplanation(q: Question, lang: Language): Promise<string | null> {
  const id = seenId(q)
  const own = lang === 'it' ? null : (await loadTopic(lang, q.t))?.[id]?.why
  if (own) return own
  return (await loadTopic('en', q.t))?.[id]?.why ?? null
}
