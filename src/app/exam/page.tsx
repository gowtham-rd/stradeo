'use client'
import { useEffect, useReducer, useRef, useState, type TouchEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { loadQuestions, buildExamQuestions, getImageUrl } from '@/lib/questions'
import { t } from '@/lib/i18n'
import { EXAM_DURATION } from '@/lib/constants'
import type { ExamState, ExamAction } from '@/types'
import QuestionText from '@/components/QuestionText'
import SignImage, { preloadImages } from '@/components/SignImage'
import { PULL_GUARD_ATTR, PULL_EVENT } from '@/components/PullToRefresh'
import { IconCross, IconChevronLeft, IconChevronRight, IconWarning, IconFinish } from '@/components/icons'
import { toast } from '@/lib/toast'

const initialState: ExamState = { questions: [], answers: {}, submitted: false, endTime: 0 }

function reducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case 'START':
      return { questions: action.questions, answers: {}, submitted: false, endTime: action.endTime }
    case 'ANSWER':
      if (state.submitted) return state
      return { ...state, answers: { ...state.answers, [action.index]: action.value } }
    case 'SUBMIT':
      return { ...state, submitted: true }
    default:
      return state
  }
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// Exam simulation, laid out like the real one: one question per page, Previous /
// Next, a numbered strip to jump around (unanswered ones marked), and a check of
// unanswered questions before submitting.
export default function ExamPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { recordExam, loaded: progressLoaded } = useProgress()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [loading, setLoading] = useState(true)
  const [remaining, setRemaining] = useState(EXAM_DURATION)
  const [loadFailed, setLoadFailed] = useState(false)
  const [current, setCurrent] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]))
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  // Exit dialog: opened by the Exit button or the browser Back button.
  const [confirmLeave, setConfirmLeave] = useState<false | 'button' | 'back'>(false)
  const leavingRef = useRef(false)
  // Latest state for the timer callback (an interval would otherwise see stale answers).
  const stateRef = useRef(state)
  stateRef.current = state
  const submittedRef = useRef(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)

  // Start only once saved progress has loaded, so exam answers are never
  // recorded on top of an empty (unloaded) progress snapshot.
  useEffect(() => {
    if (!progressLoaded) return
    let cancelled = false
    loadQuestions().then(all => {
      if (cancelled) return
      const qs = buildExamQuestions(all)
      preloadImages(qs.map(x => getImageUrl(x.i)))
      dispatch({ type: 'START', questions: qs, endTime: Date.now() + EXAM_DURATION * 1000 })
      setLoading(false)
    }, () => { if (!cancelled) setLoadFailed(true) })
    return () => { cancelled = true }
  }, [progressLoaded])

  // Warn before leaving or refreshing mid-exam (a refresh starts a new exam).
  useEffect(() => {
    if (loading || state.submitted) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [loading, state.submitted])

  // Browser Back mid-exam: keep an extra history entry so Back lands on it, then ask.
  useEffect(() => {
    if (loading || state.submitted) return
    window.history.pushState({ ...window.history.state, stradeoExam: true }, '')
    const onPop = () => {
      if (leavingRef.current || submittedRef.current) return
      setConfirmLeave('back')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [loading, state.submitted])

  // Pull-to-refresh would lose the exam: pulling down asks to leave instead.
  useEffect(() => {
    if (loading || state.submitted) return
    const root = document.documentElement
    root.setAttribute(PULL_GUARD_ATTR, 'exam')
    const onPull = () => setConfirmLeave(c => c || 'button')
    window.addEventListener(PULL_EVENT, onPull)
    return () => { root.removeAttribute(PULL_GUARD_ATTR); window.removeEventListener(PULL_EVENT, onPull) }
  }, [loading, state.submitted])

  // Wall-clock countdown (survives tab backgrounding)
  useEffect(() => {
    if (loading || state.submitted || !state.endTime) return
    const tick = () => {
      const r = Math.max(0, Math.round((state.endTime - Date.now()) / 1000))
      setRemaining(r)
      if (r <= 0) submit(true)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, state.submitted, state.endTime])

  // Keep the current number visible in the strip.
  useEffect(() => {
    // Scroll only the strip (scrollIntoView could also move the page).
    const strip = stripRef.current
    const el = strip?.children[current] as HTMLElement | undefined
    if (strip && el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
  }, [current])

  const total = state.questions.length
  const answeredCount = Object.keys(state.answers).length
  const unanswered = state.questions.map((_, i) => i).filter(i => !(i in state.answers))

  function go(i: number) {
    if (i < 0 || i >= total || i === current) return
    setDir(i > current ? 1 : -1)
    setCurrent(i)
    setVisited(v => (v.has(i) ? v : new Set(v).add(i)))
  }

  // Desktop keys: ← → to move, V / F to answer.
  useEffect(() => {
    if (loading || state.submitted || confirmLeave || confirmSubmit) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input,textarea')) return
      if (e.key === 'ArrowRight') go(current + 1)
      else if (e.key === 'ArrowLeft') go(current - 1)
      else if (e.key === 'v' || e.key === 'V') dispatch({ type: 'ANSWER', index: current, value: true })
      else if (e.key === 'f' || e.key === 'F') dispatch({ type: 'ANSWER', index: current, value: false })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Swipe left / right between questions.
  const onTouchStart = (e: TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e: TouchEvent) => {
    const s = touch.current
    touch.current = null
    if (!s) return
    const dx = e.changedTouches[0].clientX - s.x
    const dy = e.changedTouches[0].clientY - s.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1))
  }

  function stay() {
    // Back already consumed our guard entry: put it back so the next Back asks again.
    if (confirmLeave === 'back') window.history.pushState({ ...window.history.state, stradeoExam: true }, '')
    setConfirmLeave(false)
  }

  function saveAndFinish() {
    leavingRef.current = true
    setConfirmLeave(false)
    submit()
  }

  function leave() {
    leavingRef.current = true
    setConfirmLeave(false)
    router.push('/')
  }

  function submit(timeUp = false) {
    const s = stateRef.current
    if (s.submitted || submittedRef.current) return
    submittedRef.current = true
    dispatch({ type: 'SUBMIT' })
    // Time ran out: hand it in as it is and say so (like the real exam).
    if (timeUp) {
      setConfirmSubmit(false); setConfirmLeave(false)
      toast({ tone: 'error', title: t(lang, 'timeUp'), note: t(lang, 'timeUpNote'), ms: 5000 })
    }
    const secs = EXAM_DURATION - Math.max(0, Math.round((s.endTime - Date.now()) / 1000))
    // Answers count towards progress; the exam joins the history.
    const rec = recordExam(s.questions, s.answers, secs)
    const at = rec?.at ?? Date.now()
    try {
      sessionStorage.setItem('stradeo_exam_result', JSON.stringify({ at, secs, questions: s.questions, answers: s.answers }))
    } catch { /* the results page falls back to the stored history */ }
    router.push(`/exam/review?at=${at}`)
  }

  if (loadFailed) {
    return (
      <div className="min-h-screen max-w-[640px] mx-auto px-4 pt-16 text-center">
        <p className="text-stradeo-inkdim mb-6">{t(lang, 'questionsFailed')}</p>
        <div className="flex justify-center gap-2.5">
          <a href="/" className="px-5 py-3 rounded-[10px] border border-stradeo-line text-stradeo-inkdim font-semibold">{t(lang, 'home')}</a>
          <button onClick={() => window.location.reload()} className="px-5 py-3 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand font-bold">{t(lang, 'retry')}</button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen max-w-[640px] mx-auto px-4 pt-6">
        <div className="h-10 rounded-[10px] bg-stradeo-surface2 animate-pulse mb-4" />
        <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-6 animate-pulse">
          <div className="h-4 w-2/3 rounded bg-stradeo-surface2 mb-3" />
          <div className="h-4 w-full rounded bg-stradeo-surface2" />
        </div>
      </div>
    )
  }

  // Time left drives the clock and the bar under the header: green → yellow →
  // orange → red, with a soft pulse in the last minute.
  const left = remaining / EXAM_DURATION
  const band = remaining <= 60 ? 'red' : remaining <= 180 ? 'orange' : left <= 0.5 ? 'yellow' : 'green'
  const barColor = { green: 'bg-stradeo-green', yellow: 'bg-stradeo-accent', orange: 'bg-stradeo-brandorange', red: 'bg-stradeo-accent2' }[band]
  const clock = { green: 'bg-stradeo-surface2 text-stradeo-ink', yellow: 'bg-stradeo-accent/[0.12] text-stradeo-ink', orange: 'bg-stradeo-brandorange/[0.14] text-stradeo-brandorange', red: 'bg-stradeo-accent2/[0.14] text-stradeo-accent2 time-glow' }[band]
  const allAnswered = answeredCount === total
  const q = state.questions[current]
  const imgUrl = getImageUrl(q.i)
  const isLast = current === total - 1
  const answer = state.answers[current]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header: question number · timer · exit, then the numbered strip */}
      <div className="sticky top-0 z-20 bg-stradeo-nav backdrop-blur-[20px] border-b border-stradeo-line relative">
        {/* Time bar: empties as the exam runs, colour follows the time left */}
        <div className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-stradeo-surface2" role="progressbar" aria-label={fmt(remaining)} aria-valuemin={0} aria-valuemax={EXAM_DURATION} aria-valuenow={remaining}>
          <div className={`h-full ${barColor} transition-[width,background-color] duration-1000 ease-linear ${band === 'red' ? 'time-glow' : ''}`} style={{ width: `${left * 100}%` }} />
        </div>
        <div className="max-w-[640px] mx-auto px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim">{t(lang, 'examSim')}</div>
              <div className="text-[15px] font-semibold">
                {t(lang, 'questionN')} <span className="font-mono">{current + 1}</span><span className="text-stradeo-inkfaint font-mono">/{total}</span>
              </div>
            </div>
            <div role="timer" aria-label={fmt(remaining)}
              className={`h-10 px-3 flex items-center rounded-[10px] font-mono text-lg tabular-nums transition-colors duration-700 ${clock}`}>
              {fmt(remaining)}
            </div>
            <button onClick={() => setConfirmLeave('button')} aria-label={t(lang, 'exitExam')}
              className="h-10 px-3 rounded-[10px] border border-stradeo-accent2/30 bg-stradeo-accent2/[0.08] text-stradeo-accent2 hover:bg-stradeo-accent2/[0.14] text-sm font-semibold inline-flex items-center gap-1.5">
              <IconCross size={11} /><span className="hidden min-[380px]:inline">{t(lang, 'exitExam')}</span>
            </button>
          </div>

          {/* 30 numbered squares: filled = answered, outlined orange = skipped, ring = current */}
          <div ref={stripRef} className="no-scrollbar mt-2.5 -mx-4 px-4 flex gap-1 overflow-x-auto" role="tablist" aria-label={t(lang, 'questionN')}>
            {state.questions.map((_, i) => {
              const done = i in state.answers
              const skipped = !done && visited.has(i) && i !== current
              return (
                <button key={i} role="tab" aria-selected={i === current} onClick={() => go(i)}
                  aria-label={`${t(lang, 'questionN')} ${i + 1}${done ? '' : ` · ${t(lang, 'unanswered')}`}`}
                  className={`h-8 min-w-[30px] flex-1 rounded-[6px] font-mono text-[11px] transition-colors duration-200 active:scale-95 ${
                    i === current
                      ? 'bg-stradeo-ink text-stradeo-bg font-bold'
                      : done
                        ? 'bg-stradeo-ink/[0.14] text-stradeo-ink'
                        : skipped
                          ? 'border border-stradeo-accent text-stradeo-accent bg-stradeo-accent/[0.07]'
                          : 'border border-stradeo-line text-stradeo-inkfaint'
                  }`}>
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Question */}
      <main className="flex-1 max-w-[640px] w-full mx-auto px-4 pt-4 pb-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div key={current} className={`${dir > 0 ? 'animate-slide-from-right' : 'animate-slide-from-left'}`}>
          <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-5">
            {imgUrl && <SignImage src={imgUrl} alt={t(lang, 'signAlt')} height={160} className="mb-4" />}
            <QuestionText key={current} question={q} />
          </div>

        </div>
      </main>

      {/* Answer + Previous / Next (Submit on the last question), always within thumb reach */}
      <div className="sticky bottom-0 z-20 bg-stradeo-nav backdrop-blur-[20px] border-t border-stradeo-line">
        <div className="max-w-[640px] mx-auto px-4 pt-3 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={t(lang, 'yourAnswer')}>
          {[true, false].map(val => (
            <button key={String(val)} role="radio" aria-checked={answer === val}
              onClick={() => dispatch({ type: 'ANSWER', index: current, value: val })}
              className={`h-14 rounded-[10px] text-[15px] font-bold tracking-[1px] border transition-colors duration-150 ${
                answer === val ? 'border-stradeo-ink bg-stradeo-ink text-stradeo-bg' : 'border-stradeo-line bg-stradeo-bg2 text-stradeo-ink hover:border-stradeo-ink'
              }`}>
              {val ? 'VERO' : 'FALSO'}
            </button>
          ))}
        </div>
        <div className="max-w-[640px] mx-auto px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))] grid grid-cols-[1fr_84px_1fr] gap-2 items-center">
          <button onClick={() => go(current - 1)} disabled={current === 0} aria-label={t(lang, 'prev')}
            className="h-12 w-full min-w-0 px-1.5 text-[15px] rounded-[10px] concentric-bl border border-stradeo-line text-stradeo-ink font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-35 disabled:active:scale-100">
            <IconChevronLeft size={12} /><span className="truncate">{t(lang, 'prev')}</span>
          </button>
          {/* Submit (with the answered count): turns solid yellow once every question is answered */}
          {/* (On the last question the big button on the right is Submit, so this just counts.) */}
          {isLast ? (
            <div className="h-12 flex items-center justify-center text-[13px] font-mono text-stradeo-inkdim"><span className="font-bold text-stradeo-ink">{answeredCount}</span>/{total}</div>
          ) : (
            <button onClick={() => setConfirmSubmit(true)}
              className={`h-12 flex flex-col items-center justify-center rounded-[10px] border transition-colors duration-300 ${
                allAnswered ? 'border-stradeo-brand bg-stradeo-brand text-stradeo-onbrand' : 'border-stradeo-line bg-stradeo-bg2 text-stradeo-ink hover:border-stradeo-ink'}`}>
              <span className="text-[13px] leading-none font-mono"><span className="font-bold">{answeredCount}</span>/{total}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.5px] leading-none"><IconFinish size={10} />{t(lang, 'submitShort')}</span>
            </button>
          )}
          {isLast ? (
            <button onClick={() => setConfirmSubmit(true)}
              className="h-12 w-full min-w-0 px-2 text-[15px] rounded-[10px] concentric-br bg-stradeo-brand text-stradeo-onbrand font-bold inline-flex items-center justify-center gap-2">
              <IconFinish size={15} /><span className="truncate">{t(lang, 'submitExam')}</span>
            </button>
          ) : (
            <button onClick={() => go(current + 1)}
              className="h-12 w-full min-w-0 px-2 text-[15px] rounded-[10px] concentric-br bg-stradeo-ink text-stradeo-bg font-bold inline-flex items-center justify-center gap-1.5">
              <span className="truncate">{t(lang, 'next')}</span><IconChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Submit check: unanswered questions listed, tap one to go there */}
      {confirmSubmit && (
        <Sheet labelledBy="submit-title" onClose={() => setConfirmSubmit(false)}>
          {unanswered.length > 0 ? (
            <>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-stradeo-accent/[0.12] text-stradeo-accent"><IconWarning size={16} /></span>
                <h2 id="submit-title" className="text-lg font-bold">{t(lang, 'unansweredTitle').replace('{n}', String(unanswered.length))}</h2>
              </div>
              <p className="text-sm text-stradeo-inkdim mb-3">{t(lang, 'unansweredBody')}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {unanswered.map(i => (
                  <button key={i} onClick={() => { setConfirmSubmit(false); go(i) }}
                    className="h-9 min-w-[40px] px-2 rounded-[8px] border border-stradeo-accent text-stradeo-accent bg-stradeo-accent/[0.07] font-mono text-sm">
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="grid gap-2">
                <button onClick={() => { setConfirmSubmit(false); go(unanswered[0]) }} autoFocus
                  className="py-3 rounded-[10px] bg-stradeo-ink text-stradeo-bg font-semibold">
                  {t(lang, 'goToFirst').replace('{n}', String(unanswered[0] + 1))}
                </button>
                <button onClick={() => { setConfirmSubmit(false); submit() }}
                  className="py-3 rounded-[10px] border border-stradeo-line text-stradeo-ink font-semibold hover:border-stradeo-ink">
                  {t(lang, 'submitNow')}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 id="submit-title" className="text-lg font-bold mb-1">{t(lang, 'submitExam')}</h2>
              <p className="text-sm text-stradeo-inkdim mb-5">{t(lang, 'allAnswered')}</p>
              <div className="grid gap-2">
                <button onClick={() => { setConfirmSubmit(false); submit() }} autoFocus
                  className="py-3 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand font-bold">{t(lang, 'submitExam')}</button>
                <button onClick={() => setConfirmSubmit(false)}
                  className="py-3 rounded-[10px] text-stradeo-inkdim font-semibold hover:text-stradeo-ink">{t(lang, 'notYet')}</button>
              </div>
            </>
          )}
        </Sheet>
      )}

      {confirmLeave && (
        <Sheet labelledBy="leave-title" onClose={stay}>
          <h2 id="leave-title" className="text-lg font-bold mb-1">{t(lang, 'leaveExamTitle')}</h2>
          <p className="text-sm text-stradeo-inkdim mb-5">
            {answeredCount > 0 ? t(lang, 'exitExamBody').replace('{n}', String(answeredCount)) : t(lang, 'exitExamBodyNone')}
          </p>
          <div className="grid gap-2">
            {answeredCount > 0 && (
              <button onClick={saveAndFinish} className="py-3 rounded-[10px] bg-stradeo-ink text-stradeo-bg font-semibold">
                {t(lang, 'saveAndFinish')}
              </button>
            )}
            <button onClick={leave} className="py-3 rounded-[10px] border border-stradeo-line text-stradeo-accent2 font-semibold hover:border-stradeo-accent2">
              {t(lang, 'discardAttempt')}
            </button>
            <button onClick={stay} autoFocus className="py-3 rounded-[10px] text-stradeo-inkdim font-semibold hover:text-stradeo-ink">
              {t(lang, 'keepGoing')}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}

/** Bottom sheet on phones, centred dialog on wider screens. Escape or a tap outside closes it. */
function Sheet({ labelledBy, onClose, children }: { labelledBy: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/40 p-3 sm:p-4 animate-backdrop-in">
      <div className="w-full max-w-[420px] rounded-[14px] concentric-b border border-stradeo-line bg-stradeo-bg2 p-5 pb-[max(20px,env(safe-area-inset-bottom))] animate-sheet-up">
        {children}
      </div>
    </div>
  )
}
