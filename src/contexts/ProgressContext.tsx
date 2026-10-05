'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import type { UserProgress, Question, ExamRecord } from '@/types'
import { questionKey } from '@/lib/questions'
import {
  DEFAULT_PROGRESS, type PendingEvent, newEventId, unapplied, activeStreak, makeExamRecord, computeReadiness, fromRow, toRow, replay, seenCount,
} from '@/lib/progress'

export { computeReadiness, READINESS_MIN_ANSWERS, applyAnswer, normaliseReview, activeStreak } from '@/lib/progress'

interface ProgressContextType {
  progress: UserProgress
  /** True once the user's saved progress has been fetched. */
  loaded: boolean
  /** Progress couldn't be fetched; answering is blocked until retryLoad succeeds. */
  loadError: boolean
  /** Answers are waiting to be saved because the last attempt failed. */
  saveError: boolean
  retryLoad: () => void
  /** Wipe all study progress for this user (server + device). */
  resetProgress: () => Promise<boolean>
  recordAnswer: (question: Question, correct: boolean) => void
  recordAnswers: (entries: { question: Question; correct: boolean }[]) => void
  /** Save a finished exam: its answers count towards progress and it joins the exam history. Returns the record. */
  recordExam: (questions: Question[], answers: Record<number, boolean>, secs: number) => ExamRecord | null
  getDueReviews: () => Question[]
  /** Epoch ms of the next review that isn't due yet, or null if none. */
  nextReviewAt: number | null
  /** Current streak, 0 if it has lapsed. */
  streak: number
  getTopicAccuracy: (topicId: number) => number | null
  /** Distinct questions answered at least once (overall, or for one topic). */
  seenCount: (topicId?: number) => number
  readiness: number
  topicsCovered: number
}

const ProgressContext = createContext<ProgressContextType | null>(null)
const RETRY_MS = 5000
// Until migration 003 has run, the database has no `exams` column: saves then
// leave it out (history stays on this device) instead of failing.
let examsColumn = true
const isMissingExams = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === 'PGRST204' || e.code === '42703') && /exams/.test(e.message || '')
function rowFor(p: UserProgress) {
  const row: Partial<ReturnType<typeof toRow>> = toRow(p)
  if (!examsColumn) delete row.exams
  return row
}

// Device copy of the last confirmed snapshot + unsaved answers, so practice works
// offline and nothing is lost if the tab closes before a save lands.
type Stored = { data: UserProgress; version: number; exists: boolean; pending: PendingEvent[] }
const storeKey = (id: string) => `stradeo-progress:${id}`
function readStore(id: string): Stored | null {
  try {
    const raw = localStorage.getItem(storeKey(id))
    if (!raw) return null
    const s = JSON.parse(raw) as Stored
    // Copies saved by older versions may miss newer fields.
    return { ...s, data: { ...DEFAULT_PROGRESS, ...s.data, exams: s.data?.exams ?? [] } }
  } catch { return null }
}
function writeStore(id: string, s: Stored) {
  try { localStorage.setItem(storeKey(id), JSON.stringify(s)) } catch { /* storage full or blocked */ }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  // Sync model: `server` is the last snapshot confirmed by the database together
  // with its version; `pending` are answers not yet confirmed. What the user sees
  // is always server + pending. A save only succeeds if nobody else (another tab
  // or device) saved in between; otherwise we fetch their snapshot, replay our
  // pending answers on top and try again — so no device overwrites another.
  const server = useRef<{ userId: string; data: UserProgress; version: number; exists: boolean } | null>(null)
  const pending = useRef<PendingEvent[]>([])
  const flushing = useRef(false)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Bumped by a reset, so a save that was already in flight can't touch the new state.
  const generation = useRef(0)

  // The device copy is shared by every tab: keep the other tabs' unsaved answers too
  // (merged by event id) instead of overwriting them, and drop anything already saved.
  const persist = useCallback((replace = false) => {
    const s = server.current
    if (!s) return
    const mine = pending.current
    const ids = new Set(mine.map(e => e.id))
    const others = replace ? [] : (readStore(s.userId)?.pending ?? []).filter(e => e.id && !ids.has(e.id))
    const merged = unapplied(s.data, [...others, ...mine]).sort((a, b) => a.at - b.at)
    writeStore(s.userId, { data: s.data, version: s.version, exists: s.exists, pending: merged })
  }, [])

  const fetchRow = useCallback(async (id: string) => {
    const { data, error } = await supabase.from('progress').select('*').eq('user_id', id).maybeSingle()
    if (error) throw error
    const parsed = fromRow(data)
    if (data && !('exams' in data)) {
      // Database not migrated yet (003): keep the exam history this device has.
      examsColumn = false
      parsed.exams = readStore(id)?.data.exams ?? []
    }
    return { data: parsed, version: (data?.version as number | undefined) ?? 0, exists: !!data }
  }, [])

  // Load on sign-in / user change / retry.
  useEffect(() => {
    server.current = null
    pending.current = []
    setLoaded(false)
    setLoadError(false)
    setSaveError(false)
    if (!userId) { setProgress(DEFAULT_PROGRESS); return }
    let cancelled = false
    const stored = readStore(userId)
    // Copies from older versions have no event ids: give them one so they're saved once.
    pending.current = (stored?.pending ?? []).map(e => (e.id ? e : { ...e, id: newEventId() }))
    // Show this device's copy straight away (no empty screen while the server
    // answers); the server copy replaces it quietly when it arrives.
    if (stored) { setProgress(replay(stored.data, pending.current)); setLoaded(true) }
    fetchRow(userId).then(row => {
      if (cancelled) return
      server.current = { userId, ...row }
      pending.current = unapplied(row.data, pending.current)
      setProgress(replay(row.data, pending.current))
      setLoaded(true)
      persist()
      if (pending.current.length) void flushRef.current()
    }, () => {
      if (cancelled) return
      if (stored) {
        // Offline (or server unreachable): carry on from the device copy; sync later.
        server.current = { userId, data: stored.data, version: stored.version, exists: stored.exists }
        setProgress(replay(stored.data, pending.current))
        setLoaded(true)
        setSaveError(true)
      } else {
        setLoadError(true)
      }
    })
    return () => { cancelled = true }
  }, [userId, reloadToken, fetchRow, persist])

  const retryLoad = useCallback(() => setReloadToken(n => n + 1), [])

  const flush = useCallback(async () => {
    if (flushing.current) return
    flushing.current = true
    const gen = generation.current
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null }
    try {
      for (let attempt = 0; pending.current.length && attempt < 5; attempt++) {
        const base = server.current
        if (!base) return
        const batch = pending.current.slice()
        const target = replay(base.data, batch)
        const nextVersion = base.version + 1
        let ok: boolean
        if (base.exists) {
          const { data, error } = await supabase.from('progress')
            .update({ ...rowFor(target), version: nextVersion, updated_at: new Date().toISOString() })
            .eq('user_id', base.userId).eq('version', base.version)
            .select('version')
          if (isMissingExams(error)) { examsColumn = false; attempt--; continue }
          if (error) throw error
          ok = !!data && data.length > 0
        } else {
          const { error } = await supabase.from('progress')
            .insert({ user_id: base.userId, ...rowFor(target), version: nextVersion, updated_at: new Date().toISOString() })
          if (isMissingExams(error)) { examsColumn = false; attempt--; continue }
          ok = !error // a duplicate-key error means another device created the row first
        }
        if (server.current?.userId !== base.userId) return // signed out meanwhile
        if (gen !== generation.current) return // progress was reset meanwhile
        if (ok) {
          server.current = { userId: base.userId, data: target, version: nextVersion, exists: true }
          pending.current = pending.current.slice(batch.length)
          persist()
        } else {
          // Someone else saved first: rebase our pending answers on their snapshot.
          const latest = await fetchRow(base.userId)
          if (server.current?.userId !== base.userId || gen !== generation.current) return
          server.current = { userId: base.userId, ...latest }
          // Drop answers that are already in it (e.g. our own save whose reply was lost).
          pending.current = unapplied(latest.data, pending.current)
          setProgress(replay(latest.data, pending.current))
          persist()
        }
      }
      setSaveError(pending.current.length > 0)
    } catch {
      setSaveError(true)
    } finally {
      flushing.current = false
      if (pending.current.length) {
        // Retry later (offline, expired session, or more answers arrived mid-save).
        retryTimer.current = setTimeout(() => { void flush() }, RETRY_MS)
      }
    }
  }, [fetchRow, persist])
  const flushRef = useRef(flush)
  flushRef.current = flush

  // Try again as soon as the connection or the tab comes back.
  useEffect(() => {
    const kick = () => { if (pending.current.length) void flush() }
    window.addEventListener('online', kick)
    document.addEventListener('visibilitychange', kick)
    return () => {
      window.removeEventListener('online', kick)
      document.removeEventListener('visibilitychange', kick)
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [flush])

  const recordAnswers = useCallback((entries: { question: Question; correct: boolean }[]) => {
    if (!entries.length || !server.current) return // not loaded: never save over unloaded data
    const at = Date.now()
    const answers = entries.map(e => ({ id: newEventId(), question: e.question, correct: e.correct, at }))
    pending.current = [...pending.current, ...answers]
    persist()
    setProgress(prev => replay(prev, answers))
    void flush()
  }, [flush, persist])

  const recordExam = useCallback((questions: Question[], answers: Record<number, boolean>, secs: number): ExamRecord | null => {
    if (!server.current) return null
    const at = Date.now()
    const exam = makeExamRecord(questions, answers, at, secs)
    const events: PendingEvent[] = [
      ...questions.flatMap((q, i) => (i in answers ? [{ id: newEventId(), question: q, correct: answers[i] === q.a, at }] : [])),
      { id: newEventId(), exam, at },
    ]
    pending.current = [...pending.current, ...events]
    persist()
    setProgress(prev => replay(prev, events))
    void flush()
    return exam
  }, [flush, persist])

  const recordAnswer = useCallback((question: Question, correct: boolean) => {
    recordAnswers([{ question, correct }])
  }, [recordAnswers])

  const resetProgress = useCallback(async (): Promise<boolean> => {
    const base = server.current
    if (!base) return false
    // Keep the unsaved answers until the reset is confirmed, so a failed reset loses nothing.
    const kept = pending.current
    generation.current++
    pending.current = []
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null }
    try {
      // Conditional on the version like every save, retried on conflict: a device saving
      // at the same moment then rebases onto the reset instead of writing old data back.
      for (let attempt = 0; attempt < 5; attempt++) {
        const latest = await fetchRow(base.userId)
        const nextVersion = latest.version + 1
        // Remember which events were saved, so stale copies in other tabs aren't re-added.
        const fresh = { ...DEFAULT_PROGRESS, applied: latest.data.applied ?? [] }
        const row = { ...rowFor(fresh), version: nextVersion, updated_at: new Date().toISOString() }
        let ok: boolean
        if (latest.exists) {
          const res = await supabase.from('progress').update(row).eq('user_id', base.userId).eq('version', latest.version).select('version')
          if (isMissingExams(res.error)) { examsColumn = false; attempt--; continue }
          if (res.error) throw res.error
          ok = !!res.data && res.data.length > 0
        } else {
          const res = await supabase.from('progress').insert({ user_id: base.userId, ...row })
          if (isMissingExams(res.error)) { examsColumn = false; attempt--; continue }
          ok = !res.error
        }
        if (!ok) continue
        server.current = { userId: base.userId, data: fresh, version: nextVersion, exists: true }
        // Answers given while the reset was saving belong to the new start: keep them.
        setProgress(replay(fresh, pending.current))
        setSaveError(false)
        persist(true)
        if (pending.current.length) void flushRef.current()
        return true
      }
      throw new Error('reset conflict')
    } catch {
      pending.current = [...kept, ...pending.current]
      persist()
      if (pending.current.length) void flushRef.current()
      return false
    }
  }, [fetchRow, persist])

  const getDueReviews = useCallback((): Question[] => {
    const now = Date.now()
    return progress.wrongQuestions.filter(q => now >= (progress.srData[questionKey(q)]?.next ?? 0))
  }, [progress.wrongQuestions, progress.srData])

  const nowMs = Date.now()
  const upcoming = progress.wrongQuestions
    .map(q => progress.srData[questionKey(q)]?.next ?? 0)
    .filter(n => n > nowMs)
  const nextReviewAt = upcoming.length ? Math.min(...upcoming) : null

  const getTopicAccuracy = useCallback((topicId: number): number | null => {
    const s = progress.stats[topicId]
    if (!s || s.t === 0) return null
    return Math.round((s.c / s.t) * 100)
  }, [progress.stats])

  const seenCountFn = useCallback((topicId?: number) => seenCount(progress.seen, topicId), [progress.seen])

  const { readiness, topicsCovered } = computeReadiness(progress.stats)

  return (
    <ProgressContext.Provider value={{
      progress, loaded, loadError, saveError, retryLoad, resetProgress, recordAnswer, recordAnswers, recordExam,
      getDueReviews, nextReviewAt, streak: activeStreak(progress), getTopicAccuracy,
      seenCount: seenCountFn, readiness, topicsCovered,
    }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
