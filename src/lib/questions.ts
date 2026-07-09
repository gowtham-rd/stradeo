import { Question } from '@/types'

let questionsCache: Question[] | null = null

export async function loadQuestions(): Promise<Question[]> {
  if (questionsCache) return questionsCache
  const res = await fetch('/data/questions.json')
  questionsCache = await res.json()
  return questionsCache!
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

export function getImageUrl(imgPath?: string | null): string | null {
  if (!imgPath) return null
  // Strip leading slash and prefix
  const filename = imgPath.replace(/^\/?(img_sign\/)?/, '')
  return `/images/signs/${filename}`
}
