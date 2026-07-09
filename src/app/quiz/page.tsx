'use client'
import { Suspense, useEffect, useReducer, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { loadQuestions, getTopicQuestions, getImageUrl, shuffle } from '@/lib/questions'
import { getTopicName } from '@/lib/topics'
import { LANG_PROMPT, t } from '@/lib/i18n'
import type { Question, QuizState, QuizAction } from '@/types'
import NavBar from '@/components/NavBar'
import AdBanner from '@/components/AdBanner'
import TranslateButton from '@/components/TranslateButton'

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
  const isReview = mode === 'review'

  const { lang } = useLanguage()
  const { progress, getDueReviews, recordAnswer } = useProgress()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [loading, setLoading] = useState(true)

  // AI explanation for the current wrong answer
  const [exp, setExp] = useState<string | null>(null)
  const [expLoading, setExpLoading] = useState(false)

  async function buildQuestions(): Promise<Question[]> {
    if (isReview) {
      const due = getDueReviews()
      const pool = due.length ? due : progress.wrongQuestions
      return shuffle([...pool]).slice(0, 20)
    }
    const all = await loadQuestions()
    return topicId ? shuffle(getTopicQuestions(all, topicId)) : shuffle(all).slice(0, 30)
  }

  useEffect(() => {
    let cancelled = false
    buildQuestions().then(qs => {
      if (cancelled) return
      dispatch({ type: 'START', questions: qs, isReview })
      setLoading(false)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReview, topicId])

  // Reset explanation whenever the question changes
  useEffect(() => { setExp(null); setExpLoading(false) }, [state.currentIndex])

  const total = state.questions.length
  const q = state.questions[state.currentIndex]
  const isLast = state.currentIndex === total - 1
  const imgUrl = getImageUrl(q?.i)

  const title = isReview
    ? `🧠 ${t(lang, 'smartReview')}`
    : topicId ? getTopicName(topicId, lang) : t(lang, 'examSim')

  async function fetchExplanation(question: string, correctAnswer: boolean) {
    setExpLoading(true)
    setExp(null)
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, correctAnswer, language: LANG_PROMPT[lang] }),
      })
      const data = await res.json()
      setExp(data.explanation || 'Unavailable.')
    } catch {
      setExp('Could not load.')
    }
    setExpLoading(false)
  }

  function handleAnswer(value: boolean) {
    if (state.answer !== null || !q) return
    const ok = value === q.a
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
          <div className="bg-stradeo-bg2 border border-white/10 rounded-[18px] p-6 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-white/[0.06] mb-3" />
            <div className="h-4 w-full rounded bg-white/[0.06] mb-3" />
            <div className="h-4 w-1/2 rounded bg-white/[0.06]" />
          </div>
        ) : total === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">✓</div>
            <p className="text-gray-300 mb-6">{t(lang, 'ready')}</p>
            <Link href="/" className="inline-block px-5 py-3 rounded-xl bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 text-white font-bold">{t(lang, 'home')}</Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[17px] font-bold">{title}</h3>
                <p className="text-[13px] text-gray-500 mt-0.5">{state.currentIndex + 1}/{total}</p>
              </div>
              <div className="flex gap-3 text-[15px] font-bold">
                <span className="text-stradeo-green">✓{state.score.c}</span>
                <span className="text-stradeo-accent2">✗{state.score.w}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-[4px] rounded bg-white/[0.06] mb-5 overflow-hidden">
              <div className="h-full rounded bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 transition-all duration-300"
                style={{ width: `${((state.currentIndex + 1) / total) * 100}%` }} />
            </div>

            {/* Question card */}
            <div className={`bg-stradeo-bg2 border border-white/10 rounded-[18px] p-6 mb-4 ${
              state.animation === 'ok' ? 'animate-pulse-green' : state.animation === 'no' ? 'animate-shake' : ''
            }`}>
              <div className={`flex justify-end ${imgUrl ? '' : 'mb-2'}`}>
                <TranslateButton question={q.q} />
              </div>
              {imgUrl && <img src={imgUrl} alt="" className="max-w-[200px] max-h-[170px] rounded-xl mx-auto my-3.5 border border-white/[0.08]" />}
              <p className={`text-[17px] leading-relaxed font-medium ${imgUrl ? 'mt-3.5' : ''}`}>{q.q}</p>
            </div>

            {/* Answer buttons (recolor after answering) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[true, false].map(val => {
                const isCorrect = q.a === val
                const isSelected = state.answer === val
                let cls = 'border border-white/[0.06] bg-white/[0.03] text-white'
                if (state.answer !== null) {
                  if (isCorrect) cls = 'border-2 border-stradeo-green bg-green-500/10 text-stradeo-green shadow-[0_0_20px_rgba(34,197,94,0.15)]'
                  else if (isSelected) cls = 'border-2 border-stradeo-accent2 bg-red-500/10 text-stradeo-accent2'
                }
                return (
                  <button key={String(val)} onClick={() => handleAnswer(val)}
                    disabled={state.answer !== null}
                    className={`py-4 rounded-[14px] text-lg font-bold transition-all ${cls} ${state.answer === null ? 'cursor-pointer' : 'cursor-default'}`}>
                    {val ? 'VERO ✓' : 'FALSO ✗'}
                  </button>
                )
              })}
            </div>

            {/* Wrong → explanation */}
            {state.answer !== null && state.answer !== q.a && (
              <div className="bg-orange-500/[0.06] border border-orange-500/[0.15] rounded-[14px] p-[18px] mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>💡</span>
                  <span className="text-[13px] font-bold text-stradeo-accent uppercase tracking-[1px]">{t(lang, 'why')}</span>
                </div>
                {expLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-500/30 border-t-stradeo-accent rounded-full animate-spin-slow" />
                    <span className="text-sm text-gray-400">{t(lang, 'gettingExp')}</span>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-[#d4956a]">{exp}</p>
                )}
              </div>
            )}

            {/* Correct badge */}
            {state.answer !== null && state.answer === q.a && (
              <div className="bg-green-500/[0.06] border border-green-500/[0.12] rounded-[14px] px-4 py-3.5 mb-4 text-center">
                <span className="text-sm text-stradeo-green font-semibold">✓ {t(lang, 'correctBadge')}</span>
              </div>
            )}

            {/* Next (not last) */}
            {state.answer !== null && !isLast && (
              <button onClick={() => dispatch({ type: 'NEXT' })}
                className="w-full py-3.5 rounded-xl bg-white/[0.06] text-white text-[15px] font-semibold">
                {t(lang, 'next')} →
              </button>
            )}

            {/* Results (last answered) */}
            {state.answer !== null && isLast && (
              <div className="bg-stradeo-bg2 border border-white/10 rounded-[18px] p-7 text-center mt-2 animate-fade-in-up">
                <div className="text-4xl font-extrabold">{state.score.c}/{total}</div>
                <div className={`text-[15px] font-semibold mb-4 ${state.score.c / total >= 0.9 ? 'text-stradeo-green' : 'text-stradeo-accent'}`}>
                  {Math.round((state.score.c / total) * 100)}% {t(lang, 'correct')}
                </div>
                <div className="flex gap-2.5">
                  <Link href="/" className="flex-1 py-3.5 rounded-xl border border-white/[0.06] text-gray-300 text-sm font-semibold">{t(lang, 'home')}</Link>
                  <button onClick={restart} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 text-white text-sm font-semibold">{t(lang, 'again')}</button>
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
