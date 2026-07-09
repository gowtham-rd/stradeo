import type { TheoryContent } from '@/types'

// Pre-generated theory lessons, keyed by topic id ("1".."25").
// Generated once ahead of launch and served statically — no live AI call needed.
let lessonsCache: Record<string, TheoryContent> | null = null

export async function loadLessons(): Promise<Record<string, TheoryContent>> {
  if (lessonsCache) return lessonsCache
  const res = await fetch('/data/theory_lessons.json')
  lessonsCache = await res.json()
  return lessonsCache!
}

export async function getLesson(topicId: number): Promise<TheoryContent | null> {
  const all = await loadLessons()
  return all[String(topicId)] || null
}
