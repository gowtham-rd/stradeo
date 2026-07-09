'use client'
import { useEffect, useReducer, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { loadQuestions, buildExamQuestions, getImageUrl } from '@/lib/questions'
import { t } from '@/lib/i18n'
import { EXAM_DURATION } from '@/lib/constants'
import type { ExamState, ExamAction } from '@/types'
import AdBanner from '@/components/AdBanner'
import TranslateButton from '@/components/TranslateButton'

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
  const [state, dispatch] = useReducer(reducer, initialState)
  const [loading, setLoading] = useState(true)
  const [remaining, setRemaining] = useState(EXAM_DURATION)

  useEffect(() => {
    let cancelled = false
    loadQuestions().then(all => {
      if (cancelled) return
      dispatch({ type: 'START', questions: buildExamQuestions(all), endTime: Date.now() + EXAM_DURATION * 1000 })
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

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
    if (state.submitted) return
    dispatch({ type: 'SUBMIT' })
    try {
      sessionStorage.setItem('stradeo_exam_result', JSON.stringify({
        questions: state.questions,
        answers: state.answers,
      }))
    } catch { /* review page will show empty state */ }
    router.push('/exam/review')
  }

  const total = state.questions.length
  const answeredCount = Object.keys(state.answers).length

  if (loading) {
    return (
      <div className="min-h-screen">
        <AdBanner />
        <div className="max-w-[640px] mx-auto px-4 pt-10">
          <div className="bg-stradeo-bg2 border border-white/10 rounded-[18px] p-6 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-white/[0.06] mb-3" />
            <div className="h-4 w-full rounded bg-white/[0.06]" />
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
        <div className="sticky top-0 z-10 bg-[rgba(10,14,26,0.95)] backdrop-blur-[20px] py-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[17px] font-bold">{t(lang, 'examSim')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t(lang, 'examSimSub')}</p>
            </div>
            <div className={`px-4 py-2 rounded-[10px] text-xl font-bold tabular-nums ${lowTime ? 'bg-red-500/[0.12] text-stradeo-accent2' : 'bg-white/[0.05] text-gray-300'}`}>
              {fmt(remaining)}
            </div>
          </div>
          <div className="flex gap-[3px] mt-3">
            {state.questions.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded ${i in state.answers ? 'bg-orange-500/50' : 'bg-white/[0.06]'}`} />
            ))}
          </div>
        </div>

        {/* Question list */}
        {state.questions.map((q, i) => {
          const imgUrl = getImageUrl(q.i)
          return (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-[16px] p-4 mb-2">
              <div className="flex gap-2.5 items-start">
                <span className="text-gray-500 text-[13px] font-bold min-w-[24px]">{i + 1}.</span>
                <div className="flex-1">
                  {imgUrl && <img src={imgUrl} alt="" className="max-w-[200px] max-h-[170px] rounded-xl mx-auto my-3.5 border border-white/[0.08]" />}
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <p className="text-sm leading-[1.55] flex-1">{q.q}</p>
                    <TranslateButton question={q.q} compact />
                  </div>
                  <div className="flex gap-2">
                    {[true, false].map(val => (
                      <button key={String(val)} onClick={() => dispatch({ type: 'ANSWER', index: i, value: val })}
                        className={`px-5 py-2 rounded-lg text-[13px] font-semibold border ${
                          state.answers[i] === val ? 'border-2 border-stradeo-accent bg-orange-500/10 text-stradeo-accent' : 'border-white/[0.08] bg-transparent text-gray-500'
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

        <button onClick={submit}
          className={`w-full mt-2 py-4 rounded-[14px] text-base font-bold ${
            answeredCount === total ? 'bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 text-white' : 'bg-white/[0.06] text-gray-400'
          }`}>
          {t(lang, 'submit')} ({answeredCount}/{total})
        </button>
      </div>
    </div>
  )
}
