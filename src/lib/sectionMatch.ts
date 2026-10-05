import type { Question } from '@/types'

// Picks exam questions that belong to a lesson section: words from the section's
// Italian text, weighted by how rare they are in the topic, matched against each
// question. Questions are in Italian, so matching uses the Italian lesson.
const STOP = new Set(('della delle degli dello nelle nella nello negli sulle sulla sullo sugli dalla dalle dallo dagli quando sono deve devono possono può essere anche sempre oppure ovvero questo questa questi queste quella quello quelle quelli hanno verso prima dopo senza tutti tutte ogni altri altre altro altra molto tranne salvo come cioè quindi inoltre però mentre dove perché infatti invece rispetto almeno circa oltre entro fino presso secondo durante sotto sopra attraverso caso casi modo tipo tipi parte parti generale particolare esempio esame domanda domande vero falso risposta').split(' '))

const stem = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 6)
const LONG_WORD = new RegExp('\\p{L}{5,}', 'gu')
const words = (s: string) => (s.match(LONG_WORD) ?? []).map(w => w.toLowerCase()).filter(w => !STOP.has(w)).map(stem)

/** For each section text, the questions that fit it best (best first, up to `max`). */
export function questionsForSections(sectionTexts: string[], qs: Question[], max = 12): Question[][] {
  const qWords = qs.map(q => new Set(words(q.q)))
  const df = new Map<string, number>()
  for (const ws of qWords) ws.forEach(w => df.set(w, (df.get(w) ?? 0) + 1))
  const N = qs.length || 1
  const used = new Set<number>()
  return sectionTexts.map(text => {
    const keys = new Map<string, number>()
    for (const w of words(text)) keys.set(w, (keys.get(w) ?? 0) + 1)
    const scored = qs.map((_, i) => {
      let s = 0
      qWords[i].forEach(w => { const k = keys.get(w); if (k) s += Math.min(k, 3) * Math.log(N / (df.get(w) ?? N)) })
      return [i, s] as const
    }).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1])
    // Prefer questions not already used by an earlier section.
    const pick = [...scored.filter(([i]) => !used.has(i)), ...scored.filter(([i]) => used.has(i))].slice(0, max).map(([i]) => i)
    pick.slice(0, 3).forEach(i => used.add(i))
    return pick.map(i => qs[i])
  })
}
