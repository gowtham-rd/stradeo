import { Question } from '@/types'

let questionsCache: Question[] | null = null

export async function loadQuestions(): Promise<Question[]> {
  if (questionsCache) return questionsCache
  const res = await fetch('/data/questions.json')
  if (!res.ok) throw new Error(`questions.json ${res.status}`)
  questionsCache = await res.json()
  return questionsCache!
}

const topicCache: Record<number, Promise<Question[]>> = {}

/** Questions for one topic. Uses the full bank if it's already loaded, otherwise the small per-topic file. */
export function loadTopicQuestions(topicId: number): Promise<Question[]> {
  if (questionsCache) return Promise.resolve(getTopicQuestions(questionsCache, topicId))
  topicCache[topicId] ??= fetch(`/data/topics/${topicId}.json`).then(res => {
    if (!res.ok) throw new Error(`topics/${topicId}.json ${res.status}`)
    return res.json() as Promise<Question[]>
  }).catch(err => { delete topicCache[topicId]; throw err })
  return topicCache[topicId]
}

export function getTopicQuestions(questions: Question[], topicId: number): Question[] {
  return questions.filter(q => q.t === topicId)
}

export function getTopicQuestionCount(questions: Question[]): Record<number, number> {
  const counts: Record<number, number> = {}
  for (const q of questions) {
    counts[q.t] = (counts[q.t] || 0) + 1
  }
  return counts
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildExamQuestions(questions: Question[]): Question[] {
  const exam: Question[] = []
  for (let t = 1; t <= 25; t++) {
    const tq = shuffle(getTopicQuestions(questions, t))
    const count = t <= 15 ? 2 : 1
    exam.push(...tq.slice(0, Math.min(count, tq.length)))
  }
  return shuffle(exam).slice(0, 30)
}

/** Unique id for a question. Text alone isn't unique: many questions share the same
 *  wording with a different sign picture, so topic + image + text are combined. */
export function questionKey(q: Pick<Question, 't' | 'i' | 'q'>): string {
  return `${q.t}|${q.i ?? ''}|${q.q}`
}

export function getImageUrl(imgPath?: string | null): string | null {
  if (!imgPath) return null
  // Strip leading slash and prefix
  const filename = imgPath.replace(/^\/?(img_sign\/)?/, '')
  return `/images/signs/${filename}`
}
