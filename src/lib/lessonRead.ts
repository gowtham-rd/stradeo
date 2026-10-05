'use client'
// Which lesson sections have been read, per topic, on this device:
// { "1": { n: 6, read: [0, 2] } }. Shown in the lesson and on Home's topic cards.
const KEY = 'stradeo-lesson-read'
export const LESSON_READ_EVENT = 'stradeo:lesson-read'
type Store = Record<string, { n: number; read: number[] }>

function load(): Store {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') as Store } catch { return {} }
}

export function lessonRead(tid: number): { n: number; read: number[] } | null {
  return load()[String(tid)] ?? null
}

export function markSectionRead(tid: number, section: number, total: number) {
  const s = load()
  const cur = s[String(tid)] ?? { n: total, read: [] }
  if (cur.read.includes(section) && cur.n === total) return
  s[String(tid)] = { n: total, read: Array.from(new Set([...cur.read, section])).sort((a, b) => a - b) }
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage blocked */ }
  window.dispatchEvent(new CustomEvent(LESSON_READ_EVENT))
}

export function clearLessonRead() {
  try { localStorage.removeItem(KEY) } catch { /* storage blocked */ }
}
