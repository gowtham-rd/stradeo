'use client'
import { useEffect, useReducer, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { loadQuestions, buildExamQuestions, getImageUrl } from '@/lib/questions'
import { t } from '@/lib/i18n'
import { EXAM_DURATION } from '@/lib/constants'
import type { ExamState, ExamAction } from '@/types'
import AdBanner from '@/components/AdBanner'
import TranslateButton from '@/components/TranslateButton'
import { IconCross } from '@/components/icons'

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

export default function ExamPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { recordAnswers, loaded: progressLoaded } = useProgress()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [loading, setLoading] = useState(true)
  const [remaining, setRemaining] = useState(EXAM_DURATION)
  const [loadFailed, setLoadFailed] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  // Exit dialog: opened by the Exit button or the browser Back button.
  const [confirmLeave, setConfirmLeave] = useState<false | 'button' | 'back'>(false)
  const leavingRef = useRef(false)
  // Latest state for the timer callback (an interval would otherwise see stale answers).
  const stateRef = useRef(state)
  stateRef.current = state
  const submittedRef = useRef(false)

  // Start only once saved progress has loaded, so exam answers are never
  // recorded on top of an empty (unloaded) progress snapshot.
  useEffect(() => {
    if (!progressLoaded) return
    let cancelled = false
    loadQuestions().then(all => {
      if (cancelled) return
      dispatch({ type: 'START', questions: buildExamQuestions(all), endTime: Date.now() + EXAM_DURATION * 1000 })
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
  // (Copying the router's own history state keeps Next from treating it as a navigation.)
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

  // Wall-clock countdown (survives tab backgrounding)
  useEffect(() => {
    if (loading || state.submitted || !state.endTime) return
    const tick = () => {
      const r = Math.max(0, Math.round((state.endTime - Date.now()) / 1000))
      setRemaining(r)
      if (r <= 0) submit()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, state.submitted, state.endTime])

  function submit() {
    const s = stateRef.current
    if (s.submitted || submittedRef.current) return
    submittedRef.current = true
    dispatch({ type: 'SUBMIT' })
    // Feed answered questions into progress so the dashboard reflects the exam.
    const answered = s.questions
      .map((q, i) => ({ question: q, correct: s.answers[i] === q.a }))
      .filter((_, i) => i in s.answers)
    recordAnswers(answered)
    try {
      sessionStorage.setItem('stradeo_exam_result', JSON.stringify({
        questions: s.questions,
        answers: s.answers,
      }))
    } catch { /* review page will show empty state */ }
    router.push('/exam/review')
  }

  const total = state.questions.length
  const answeredCount = Object.keys(state.answers).length

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
      <div className="min-h-screen">
        <AdBanner />
        <div className="max-w-[640px] mx-auto px-4 pt-10">
          <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-6 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-stradeo-surface2 mb-3" />
            <div className="h-4 w-full rounded bg-stradeo-surface2" />
          </div>
        </div>
      </div>
    )
  }

  const lowTime = remaining < 120

  return (
    <div className="min-h-screen">
      <AdBanner />
      <div className="max-w-[640px] mx-auto px-4 pt-5 pb-10 animate-fade-in">
        {/* Sticky timer + progress */}
        <div className="sticky top-0 z-10 bg-stradeo-nav backdrop-blur-[20px] py-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[17px] font-bold">{t(lang, 'examSim')}</h3>
              <p className="text-xs text-stradeo-inkfaint mt-0.5">{t(lang, 'examSimSub')}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-4 py-2 rounded-[10px] font-mono text-xl tabular-nums ${lowTime ? 'bg-stradeo-accent2/[0.12] text-stradeo-accent2' : 'bg-stradeo-surface2 text-stradeo-inkdim'}`}>
                {fmt(remaining)}
              </div>
              <button onClick={() => setConfirmLeave('button')} aria-label={t(lang, 'exitExam')}
                className="h-11 px-3 rounded-[10px] border border-stradeo-line text-stradeo-inkdim hover:text-stradeo-ink hover:border-stradeo-ink text-sm font-semibold inline-flex items-center gap-1.5">
                <IconCross size={11} /><span className="hidden min-[380px]:inline">{t(lang, 'exitExam')}</span>
              </button>
            </div>
          </div>
          <div className="flex gap-[3px] mt-3">
            {state.questions.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded ${i in state.answers ? 'bg-stradeo-ink' : 'bg-stradeo-surface2'}`} />
            ))}
          </div>
        </div>

        {/* Question list */}
        {state.questions.map((q, i) => {
          const imgUrl = getImageUrl(q.i)
          return (
            <div key={i} className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-4 mb-2">
              <div className="flex gap-2.5 items-start">
                <span className="font-mono text-stradeo-inkfaint text-[13px] min-w-[24px]">{i + 1}.</span>
                <div className="flex-1">
                  {imgUrl && <img src={imgUrl} alt={t(lang, 'signAlt')} className="max-w-[200px] max-h-[170px] rounded-[10px] mx-auto my-3.5 border border-stradeo-line" />}
                  <div className="flex flex-wrap justify-between items-start mb-1.5 gap-2">
                    <p lang="it" className="text-sm leading-[1.55] flex-1">{q.q}</p>
                    <TranslateButton question={q.q} compact />
                  </div>
                  <div className="flex gap-2">
                    {[true, false].map(val => (
                      <button key={String(val)} aria-pressed={state.answers[i] === val} onClick={() => { setConfirmSubmit(false); dispatch({ type: 'ANSWER', index: i, value: val }) }}
                        className={`px-5 py-2 rounded-lg text-[13px] font-semibold border ${
                          state.answers[i] === val ? 'border-stradeo-ink bg-stradeo-ink text-stradeo-bg' : 'border-stradeo-line bg-transparent text-stradeo-inkdim hover:text-stradeo-ink'
                        }`}>
                        {val ? 'VERO' : 'FALSO'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Unanswered questions need a second tap, so nobody submits by accident. */}
        <button onClick={() => (answeredCount === total || confirmSubmit ? submit() : setConfirmSubmit(true))}
          className={`w-full mt-2 py-4 rounded-[10px] text-base font-bold ${
            answeredCount === total || confirmSubmit ? 'bg-stradeo-brand text-stradeo-onbrand' : 'bg-stradeo-surface2 text-stradeo-inkdim'
          }`}>
          {confirmSubmit && answeredCount < total
            ? `${total - answeredCount} ${t(lang, 'unanswered')} — ${t(lang, 'submitAnyway')}`
            : `${t(lang, 'submit')} (${answeredCount}/${total})`}
        </button>

        {confirmLeave && (
          <div role="dialog" aria-modal="true" aria-labelledby="leave-title"
            className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-[400px] rounded-[14px] border border-stradeo-line bg-stradeo-bg2 p-5">
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
