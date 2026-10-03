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
import { aiPost } from '@/lib/api'

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
      const res = await aiPost('/api/explain', ({ question, correctAnswer, language: LANG_PROMPT[lang] }))
      if (!res.ok) throw new Error('explain failed')
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
          <p className="text-stradeo-inkdim mb-6">{t(lang, 'examSim')}</p>
          <Link href="/exam" className="inline-block px-5 py-3 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand font-bold">{t(lang, 'newExam')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AdBanner /><NavBar />
      <div className="max-w-[640px] mx-auto px-4 pt-5 pb-10 animate-fade-in">
        {/* Score card */}
        <div className={`rounded-[14px] p-7 text-center mb-6 border-2 ${
          passed ? 'bg-stradeo-green/[0.06] border-stradeo-green/20' : 'bg-stradeo-accent2/[0.06] border-stradeo-accent2/20'
        }`}>
          <div className={`font-mono text-[52px] leading-tight tracking-tight ${passed ? 'text-stradeo-green' : 'text-stradeo-accent2'}`}>
            {score}/{EXAM_QUESTIONS}
          </div>
          <div className="text-xl font-bold mt-1">{passed ? `${t(lang, 'passed')} 🎉` : t(lang, 'failed')}</div>
          <div className="text-sm text-stradeo-inkdim mt-1.5">{EXAM_QUESTIONS - score} {t(lang, 'errors')} · {t(lang, 'max3')}</div>
        </div>

        <div className="text-[13px] font-bold text-stradeo-inkfaint uppercase tracking-[1.5px] mb-3">{t(lang, 'review')}</div>

        {hist.map((h, i) => {
          const imgUrl = getImageUrl(h.q.i)
          return (
            <div key={i} className={`p-3.5 mb-2 rounded-[14px] border ${
              h.ok ? 'bg-stradeo-green/[0.03] border-stradeo-green/[0.08]' : 'bg-stradeo-accent2/[0.05] border-stradeo-accent2/[0.12]'
            }`}>
              <div className="flex gap-2.5 items-start">
                <span className={`text-base ${h.ok ? 'text-stradeo-green' : 'text-stradeo-accent2'}`}>{h.ok ? '✓' : '✗'}</span>
                <div className="flex-1">
                  {imgUrl && <img src={imgUrl} alt="" className="max-w-[200px] max-h-[170px] rounded-[10px] mx-auto my-3.5 border border-stradeo-line" />}
                  <p className="text-sm leading-[1.5] mb-1">{h.q.q}</p>
                  <p className={`text-xs ${h.ok ? 'text-stradeo-green/70' : 'text-stradeo-accent2/70'}`}>
                    {t(lang, 'correct')}: <strong>{h.q.a ? 'VERO' : 'FALSO'}</strong>
                  </p>
                  {!h.ok && (exp[i] ? (
                    <div className="bg-stradeo-surface2 rounded-[10px] p-3 mt-2">
                      <div className="flex items-center gap-1.5 mb-1.5"><span>💡</span><span className="text-[11px] font-semibold text-stradeo-inkdim uppercase tracking-[1px]">{t(lang, 'why')}</span></div>
                      <p className="text-[13px] leading-relaxed text-stradeo-ink">{exp[i]}</p>
                    </div>
                  ) : (
                    <button onClick={() => fetchExp(i, h.q.q, h.q.a)} disabled={expLoading[i]}
                      className="mt-2 px-4 py-2 rounded-lg border border-stradeo-line text-stradeo-ink hover:border-stradeo-ink text-xs font-semibold flex items-center gap-1.5">
                      {expLoading[i]
                        ? <><div className="w-3 h-3 border-2 border-stradeo-line border-t-stradeo-ink rounded-full animate-spin-slow" />{t(lang, 'loading')}</>
                        : <>💡 {t(lang, 'explain')}</>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        <div className="flex gap-2.5 mt-5">
          <Link href="/" className="flex-1 py-3.5 rounded-[10px] border border-stradeo-line text-stradeo-inkdim text-sm font-semibold text-center">{t(lang, 'home')}</Link>
          <Link href="/exam" className="flex-1 py-3.5 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-sm font-semibold text-center">{t(lang, 'newExam')}</Link>
        </div>
      </div>
    </div>
  )
}
