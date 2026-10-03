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
  /** Display name chosen in Settings (Supabase user_metadata.display_name). */
  name?: string
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
  /** Correct on-time reviews so far (0 = just missed). Graduates at REVIEW_STEPS_MS.length. */
  stage: number
  /** Epoch ms when the question is next due. */
  next: number
}

export interface UserProgress {
  stats: Record<number, TopicStats>
  totalDone: number
  wrongQuestions: Question[]
  srData: Record<string, SRData>
  streak: number
  lastStudy: string | null
  dailyLog: Record<string, DayStats>
  /** Ids (seenId) of questions answered at least once, per topic. */
  seen: Record<number, string[]>
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
