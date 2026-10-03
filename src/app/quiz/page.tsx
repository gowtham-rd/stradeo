'use client'
import { Suspense, useEffect, useReducer, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { loadQuestions, loadTopicQuestions, getImageUrl, shuffle, questionKey } from '@/lib/questions'
import { REVIEW_STEPS_MS } from '@/lib/constants'
import { getTopicName, TOPICS } from '@/lib/topics'
import { LANG_PROMPT, t, formatWhen } from '@/lib/i18n'
import type { Question, QuizState, QuizAction } from '@/types'
import NavBar from '@/components/NavBar'
import AdBanner from '@/components/AdBanner'
import TranslateButton from '@/components/TranslateButton'
import ReportQuestion from '@/components/ReportQuestion'
import { aiPost, AI_ENABLED, AI_NOT_READY, AI_LIMIT } from '@/lib/api'
import { IconReview, IconCheck, IconCross, IconTip, IconRoadworks, IconArrowRight } from '@/components/icons'

const initialState: QuizState = {
  questions: [],
  currentIndex: 0,
  answer: null,
  score: { c: 0, w: 0 },
  history: [],
  isReview: false,
  animation: '',
}

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return { ...initialState, questions: action.questions, isReview: action.isReview }
    case 'ANSWER': {
      if (state.answer !== null) return state
      const q = state.questions[state.currentIndex]
      const ok = action.value === q.a
      return {
        ...state,
        answer: action.value,
        animation: ok ? 'ok' : 'no',
        score: { c: state.score.c + (ok ? 1 : 0), w: state.score.w + (ok ? 0 : 1) },
        history: [...state.history, { q, ua: action.value, ok }],
      }
    }
    case 'NEXT':
      return { ...state, currentIndex: state.currentIndex + 1, answer: null, animation: '' }
    case 'SET_ANIMATION':
      return { ...state, animation: action.value }
    default:
      return state
  }
}

function QuizInner() {
  const params = useSearchParams()
  const mode = params.get('mode')
  const topicId = params.get('topic') ? Number(params.get('topic')) : null
  const invalidTopic = topicId !== null && !TOPICS.some(x => x.id === topicId)
  const isReview = mode === 'review'

  const { lang } = useLanguage()
  const { progress, loaded: progressLoaded, getDueReviews, recordAnswer } = useProgress()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  // Smart Review: what happens to this question next (shown after answering in review mode)
  const [reviewNote, setReviewNote] = useState<string | null>(null)

  // AI explanation for the current wrong answer
  const [exp, setExp] = useState<string | null>(null)
  const [expLoading, setExpLoading] = useState(false)

  async function buildQuestions(): Promise<Question[]> {
    if (isReview) {
      const due = getDueReviews()
      const pool = due.length ? due : progress.wrongQuestions
      return shuffle([...pool]).slice(0, 20)
    }
    if (topicId) return shuffle(await loadTopicQuestions(topicId))
    return shuffle(await loadQuestions()).slice(0, 30)
  }

  useEffect(() => {
    // Wait for saved progress: review questions come from it, and answering before
    // it has loaded would save on top of an empty snapshot.
    if (!progressLoaded) return
    let cancelled = false
    buildQuestions().then(qs => {
      if (cancelled) return
      dispatch({ type: 'START', questions: qs, isReview })
      setLoading(false)
    }, () => { if (!cancelled) { setLoadFailed(true); setLoading(false) } })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReview, topicId, progressLoaded])

  // Reset explanation whenever the question changes
  useEffect(() => { setExp(null); setExpLoading(false); setReviewNote(null) }, [state.currentIndex])

  const total = state.questions.length
  const q = state.questions[state.currentIndex]
  const isLast = state.currentIndex === total - 1
  const imgUrl = getImageUrl(q?.i)

  const title = isReview
    ? t(lang, 'smartReview')
    : topicId ? getTopicName(topicId, lang) : t(lang, 'randomQuiz')

  async function fetchExplanation(question: string, correctAnswer: boolean) {
    if (!AI_ENABLED) { setExp(t(lang, 'explainSoon')); setExpLoading(false); return }
    setExpLoading(true)
    setExp(null)
    try {
      const res = await aiPost('/api/explain', ({ question, correctAnswer, language: LANG_PROMPT[lang] }))
      if (res.status === AI_NOT_READY) { setExp(t(lang, 'explainSoon')); setExpLoading(false); return }
      if (res.status === AI_LIMIT) { setExp(t(lang, 'aiLimit')); setExpLoading(false); return }
      if (!res.ok) throw new Error('explain failed')
      const data = await res.json()
      setExp(data.explanation || t(lang, 'unavailable'))
    } catch {
      setExp(t(lang, 'unavailable'))
    }
    setExpLoading(false)
  }

  function handleAnswer(value: boolean) {
    if (state.answer !== null || !q) return
    const ok = value === q.a
    if (isReview) {
      // Mirror the scheduling rule in ProgressContext so the user sees the outcome.
      const now = Date.now()
      const entry = progress.srData[questionKey(q)]
      const due = !entry || now >= entry.next
      const stage = (entry?.stage ?? 0) + 1
      setReviewNote(
        !ok ? `${t(lang, 'reviewBack')} ${formatWhen(now + REVIEW_STEPS_MS[0], lang, now)}`
        : !due ? t(lang, 'reviewEarly')
        : stage >= REVIEW_STEPS_MS.length ? t(lang, 'reviewMastered')
        : `${t(lang, 'reviewBack')} ${formatWhen(now + REVIEW_STEPS_MS[stage], lang, now)}`
      )
    }
    recordAnswer(q, ok)
    dispatch({ type: 'ANSWER', value })
    if (!ok) fetchExplanation(q.q, q.a)
  }

  function restart() {
    setExp(null)
    buildQuestions().then(qs => dispatch({ type: 'START', questions: qs, isReview }))
  }

  return (
    <div className="min-h-screen">
      <AdBanner />
      <NavBar />
      <div className="max-w-[640px] mx-auto px-4 pt-5 pb-10 animate-fade-in">
        {loading ? (
          <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-6 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-stradeo-surface2 mb-3" />
            <div className="h-4 w-full rounded bg-stradeo-surface2 mb-3" />
            <div className="h-4 w-1/2 rounded bg-stradeo-surface2" />
          </div>
        ) : loadFailed || invalidTopic ? (
          <div className="text-center py-16">
            <p className="text-stradeo-inkdim mb-6">{t(lang, invalidTopic ? 'topicNotFound' : 'questionsFailed')}</p>
            <Link href="/" className="inline-block px-5 py-3 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand font-bold">{t(lang, 'home')}</Link>
          </div>
        ) : total === 0 ? (
          <div className="text-center py-16">
            <IconCheck size={48} className="text-stradeo-green mb-4" />
            <p className="text-stradeo-inkdim mb-6">{isReview ? t(lang, 'allCaughtUp') : t(lang, 'ready')}</p>
            <Link href="/" className="inline-block px-5 py-3 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand font-bold">{t(lang, 'home')}</Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[17px] font-bold inline-flex items-center gap-2">{isReview && <IconReview size={17} />}{title}</h3>
                <p className="font-mono text-[13px] text-stradeo-inkfaint mt-0.5">{state.currentIndex + 1}/{total}</p>
              </div>
              <div className="flex gap-3 font-mono text-[15px]">
                <span className="text-stradeo-green inline-flex items-center gap-1"><IconCheck size={13} />{state.score.c}</span>
                <span className="text-stradeo-accent2 inline-flex items-center gap-1"><IconCross size={12} />{state.score.w}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-[4px] rounded bg-stradeo-surface2 mb-5 overflow-hidden">
              <div className="h-full rounded bg-stradeo-ink transition-all duration-300"
                style={{ width: `${((state.currentIndex + 1) / total) * 100}%` }} />
            </div>

            {/* Question card */}
            <div className={`bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-6 mb-4 ${
              state.animation === 'ok' ? 'animate-pulse-green' : state.animation === 'no' ? 'animate-shake' : ''
            }`}>
              <div className={`flex flex-wrap justify-end ${imgUrl ? '' : 'mb-2'}`}>
                <TranslateButton key={questionKey(q)} question={q.q} />
              </div>
              {imgUrl && <img src={imgUrl} alt={t(lang, 'signAlt')} className="max-w-[200px] max-h-[170px] rounded-[10px] mx-auto my-3.5 border border-stradeo-line" />}
              <p lang="it" className={`text-[17px] leading-relaxed font-normal ${imgUrl ? 'mt-3.5' : ''}`}>{q.q}</p>
            </div>

            {/* Answer buttons (recolor after answering) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[true, false].map(val => {
                const isCorrect = q.a === val
                const isSelected = state.answer === val
                let cls = 'border border-stradeo-line bg-stradeo-surface2 text-stradeo-ink'
                if (state.answer !== null) {
                  if (isCorrect) cls = 'border-2 border-stradeo-green bg-stradeo-green/10 text-stradeo-green'
                  else if (isSelected) cls = 'border-2 border-stradeo-accent2 bg-stradeo-accent2/10 text-stradeo-accent2'
                }
                return (
                  <button key={String(val)} onClick={() => handleAnswer(val)}
                    disabled={state.answer !== null}
                    className={`py-4 rounded-[14px] text-lg font-bold transition-all inline-flex items-center justify-center gap-2 ${cls} ${state.answer === null ? 'cursor-pointer' : 'cursor-default'}`}>
                    {val ? <>VERO <IconCheck size={18} /></> : <>FALSO <IconCross size={16} /></>}
                  </button>
                )
              })}
            </div>

            {/* Wrong → explanation */}
            {state.answer !== null && state.answer !== q.a && (
              <div className="bg-stradeo-surface2 rounded-[14px] p-[18px] mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconTip size={16} className="text-stradeo-brandorange" />
                  <span className="text-[13px] font-semibold text-stradeo-inkdim uppercase tracking-[1px]">{t(lang, 'why')}</span>
                </div>
                {expLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-stradeo-line border-t-stradeo-ink rounded-full animate-spin-slow" />
                    <span className="text-sm text-stradeo-inkdim">{t(lang, 'gettingExp')}</span>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-stradeo-ink">{exp === t(lang, 'aiSoon') || exp === t(lang, 'explainSoon') ? <span className="inline-flex items-start gap-2 text-stradeo-inkdim"><IconRoadworks size={16} className="text-stradeo-brandorange mt-0.5" />{exp}</span> : exp}</p>
                )}
              </div>
            )}

            {/* Correct badge */}
            {state.answer !== null && state.answer === q.a && (
              <div className="bg-stradeo-green/[0.06] border border-stradeo-green/[0.12] rounded-[14px] px-4 py-3.5 mb-4 text-center">
                <span className="text-sm text-stradeo-green font-semibold inline-flex items-center gap-1.5"><IconCheck size={14} />{t(lang, 'correctBadge')}</span>
              </div>
            )}

            {/* Smart Review outcome */}
            {state.answer !== null && reviewNote && (
              <p className="flex items-center justify-center gap-2 text-[13px] text-stradeo-inkdim mb-4">
                <IconReview size={14} />{reviewNote}
              </p>
            )}

            {state.answer !== null && <div className="mb-4 -mt-1"><ReportQuestion key={questionKey(q)} question={q} /></div>}

            {/* Next (not last) */}
            {state.answer !== null && !isLast && (
              <button onClick={() => dispatch({ type: 'NEXT' })}
                className="flex w-full py-3.5 rounded-[10px] inline-flex items-center justify-center gap-2 bg-stradeo-ink text-stradeo-bg text-[15px] font-semibold">
                {t(lang, 'next')} <IconArrowRight size={15} />
              </button>
            )}

            {/* Results (last answered) */}
            {state.answer !== null && isLast && (
              <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-7 text-center mt-2 animate-fade-in-up">
                <div className="font-mono text-4xl">{state.score.c}/{total}</div>
                <div className={`text-[15px] font-semibold mb-4 ${state.score.c / total >= 0.9 ? 'text-stradeo-green' : 'text-stradeo-accent'}`}>
                  {Math.round((state.score.c / total) * 100)}% {t(lang, 'correct')}
                </div>
                <div className="flex gap-2.5">
                  <Link href="/" className="flex-1 py-3.5 rounded-[10px] border border-stradeo-line text-stradeo-inkdim text-sm font-semibold">{t(lang, 'home')}</Link>
                  <button onClick={restart} className="flex-1 py-3.5 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-sm font-semibold">{t(lang, 'again')}</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <QuizInner />
    </Suspense>
  )
}
