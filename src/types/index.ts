// ─── Data Types ───
export interface Question {
  t: number       // topic ID (1-25)
  q: string       // question text (Italian)
  a: boolean      // correct answer (true/false)
  i?: string      // image path (optional)
}

export interface TopicMeta {
  id: number
  it: string
  en: string
  ta: string
  hi: string
}

export type Language = 'en' | 'it' | 'ta' | 'hi'

// ─── Auth ───
export interface UserSession {
  id: string
  email: string
  role?: string
}

// ─── Progress ───
export interface TopicStats {
  c: number   // correct
  t: number   // total
}

export interface DayStats {
  c: number
  w: number
  total: number
}

export interface SRData {
  interval: number
  next: number
  reps: number
}

export interface UserProgress {
  stats: Record<number, TopicStats>
  totalDone: number
  wrongQuestions: Question[]
  srData: Record<string, SRData>
  streak: number
  lastStudy: string | null
  dailyLog: Record<string, DayStats>
}

// ─── Theory ───
export interface TheoryContent {
  title: string
  keypoints?: string
  details?: string
  traps?: string
  remember?: string
}

// ─── Quiz State ───
export interface AnswerHistory {
  q: Question
  ua: boolean
  ok: boolean
}

export interface QuizState {
  questions: Question[]
  currentIndex: number
  answer: boolean | null
  score: { c: number; w: number }
  history: AnswerHistory[]
  isReview: boolean
  animation: '' | 'ok' | 'no'
}

export type QuizAction =
  | { type: 'START'; questions: Question[]; isReview: boolean }
  | { type: 'ANSWER'; value: boolean }
  | { type: 'NEXT' }
  | { type: 'SET_ANIMATION'; value: '' | 'ok' | 'no' }

// ─── Exam State ───
export interface ExamState {
  questions: Question[]
  answers: Record<number, boolean>
  submitted: boolean
  endTime: number
}

export type ExamAction =
  | { type: 'START'; questions: Question[]; endTime: number }
  | { type: 'ANSWER'; index: number; value: boolean }
  | { type: 'SUBMIT' }
