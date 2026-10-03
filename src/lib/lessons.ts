import type { TheoryContent, Language } from '@/types'

// Pre-written theory lessons, keyed by topic id ("1".."25").
// English: /data/theory_lessons.json. Translations: /data/lessons/<lang>.json.
// Served statically — no live AI call needed.
type LessonSet = Record<string, TheoryContent>
const cache: Partial<Record<Language, Promise<LessonSet>>> = {}

function loadSet(lang: Language): Promise<LessonSet> {
  const url = lang === 'en' ? '/data/theory_lessons.json' : `/data/lessons/${lang}.json`
  cache[lang] ??= fetch(url).then(res => {
    if (!res.ok) throw new Error(`${url} ${res.status}`)
    return res.json() as Promise<LessonSet>
  }).catch(err => { delete cache[lang]; throw err })
  return cache[lang]!
}

/** Lesson for a topic in the requested language, falling back to English if it isn't translated. */
export async function getLesson(topicId: number, lang: Language = 'en'): Promise<{ lesson: TheoryContent; lang: Language } | null> {
  if (lang !== 'en') {
    try {
      const l = (await loadSet(lang))[String(topicId)]
      if (l) return { lesson: l, lang }
    } catch { /* not translated or offline: fall back to English */ }
  }
  const en = (await loadSet('en'))[String(topicId)]
  return en ? { lesson: en, lang: 'en' } : null
}
