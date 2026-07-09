'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { getImageUrl } from '@/lib/questions'
import { EXAM_QUESTIONS, MAX_ERRORS } from '@/lib/constants'
import { LANG_PROMPT, t } from '@/lib/i18n'
import type { Question } from '@/types'
import NavBar from '@/components/NavBar'
import AdBanner from '@/components/AdBanner'

interface ExamResult {
  questions: Question[]
  answers: Record<number, boolean>
}

export default function ExamReviewPage() {
  const { lang } = useLanguage()
  const [result, setResult] = useState<ExamResult | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [exp, setExp] = useState<Record<number, string>>({})
  const [expLoading, setExpLoading] = useState<Record<number, boolean>>({})

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('stradeo_exam_result')
      if (raw) setResult(JSON.parse(raw))
    } catch { /* no result */ }
    setLoaded(true)
  }, [])

  const hist = useMemo(() => {
    if (!result) return []
    return result.questions.map((q, i) => ({ q, ua: result.answers[i], ok: result.answers[i] === q.a }))
  }, [result])

  const score = hist.filter(h => h.ok).length
  const passed = score >= EXAM_QUESTIONS - MAX_ERRORS

  async function fetchExp(idx: number, question: string, correctAnswer: boolean) {
    setExpLoading(p => ({ ...p, [idx]: true }))
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, correctAnswer, language: LANG_PROMPT[lang] }),
      })
      const data = await res.json()
      setExp(p => ({ ...p, [idx]: data.explanation || 'Unavailable.' }))
    } catch {
      setExp(p => ({ ...p, [idx]: 'Could not load.' }))
    }
    setExpLoading(p => ({ ...p, [idx]: false }))
  }

  if (loaded && !result) {
    return (
      <div className="min-h-screen">
        <AdBanner /><NavBar />
        <div className="max-w-[640px] mx-auto px-4 pt-16 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-gray-300 mb-6">{t(lang, 'examSim')}</p>
          <Link href="/exam" className="inline-block px-5 py-3 rounded-xl bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 text-white font-bold">{t(lang, 'newExam')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AdBanner /><NavBar />
      <div className="max-w-[640px] mx-auto px-4 pt-5 pb-10 animate-fade-in">
        {/* Score card */}
        <div className={`rounded-[20px] p-7 text-center mb-6 border-2 ${
          passed ? 'bg-green-500/[0.06] border-green-500/20' : 'bg-red-500/[0.06] border-red-500/20'
        }`}>
          <div className={`text-[52px] font-extrabold tracking-tight ${passed ? 'text-stradeo-green' : 'text-stradeo-accent2'}`}>
            {score}/{EXAM_QUESTIONS}
          </div>
          <div className="text-xl font-bold mt-1">{passed ? `${t(lang, 'passed')} 🎉` : t(lang, 'failed')}</div>
          <div className="text-sm text-gray-400 mt-1.5">{EXAM_QUESTIONS - score} {t(lang, 'errors')} · {t(lang, 'max3')}</div>
        </div>

        <div className="text-[13px] font-bold text-gray-500 uppercase tracking-[1.5px] mb-3">{t(lang, 'review')}</div>

        {hist.map((h, i) => {
          const imgUrl = getImageUrl(h.q.i)
          return (
            <div key={i} className={`p-3.5 mb-2 rounded-[14px] border ${
              h.ok ? 'bg-green-500/[0.03] border-green-500/[0.08]' : 'bg-red-500/[0.05] border-red-500/[0.12]'
            }`}>
              <div className="flex gap-2.5 items-start">
                <span className={`text-base ${h.ok ? 'text-stradeo-green' : 'text-stradeo-accent2'}`}>{h.ok ? '✓' : '✗'}</span>
                <div className="flex-1">
                  {imgUrl && <img src={imgUrl} alt="" className="max-w-[200px] max-h-[170px] rounded-xl mx-auto my-3.5 border border-white/[0.08]" />}
                  <p className="text-sm leading-[1.5] mb-1">{h.q.q}</p>
                  <p className={`text-xs ${h.ok ? 'text-green-500/70' : 'text-red-500/70'}`}>
                    {t(lang, 'correct')}: <strong>{h.q.a ? 'VERO' : 'FALSO'}</strong>
                  </p>
                  {!h.ok && (exp[i] ? (
                    <div className="bg-orange-500/[0.06] border border-orange-500/[0.12] rounded-[10px] p-3 mt-2">
                      <div className="flex items-center gap-1.5 mb-1.5"><span>💡</span><span className="text-[11px] font-bold text-stradeo-accent">{t(lang, 'why')}</span></div>
                      <p className="text-[13px] leading-relaxed text-[#d4956a]">{exp[i]}</p>
                    </div>
                  ) : (
                    <button onClick={() => fetchExp(i, h.q.q, h.q.a)} disabled={expLoading[i]}
                      className="mt-2 px-4 py-2 rounded-lg border border-orange-500/20 bg-orange-500/[0.06] text-stradeo-accent text-xs font-semibold flex items-center gap-1.5">
                      {expLoading[i]
                        ? <><div className="w-3 h-3 border-2 border-orange-500/30 border-t-stradeo-accent rounded-full animate-spin-slow" />{t(lang, 'loading')}</>
                        : <>💡 {t(lang, 'explain')}</>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        <div className="flex gap-2.5 mt-5">
          <Link href="/" className="flex-1 py-3.5 rounded-xl border border-white/[0.06] text-gray-300 text-sm font-semibold text-center">{t(lang, 'home')}</Link>
          <Link href="/exam" className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 text-white text-sm font-semibold text-center">{t(lang, 'newExam')}</Link>
        </div>
      </div>
    </div>
  )
}
