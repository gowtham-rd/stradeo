'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { getImageUrl, questionKey } from '@/lib/questions'
import ReportQuestion from '@/components/ReportQuestion'
import { EXAM_QUESTIONS, MAX_ERRORS } from '@/lib/constants'
import { LANG_PROMPT, t } from '@/lib/i18n'
import type { Question } from '@/types'
import NavBar from '@/components/NavBar'
import AdBanner from '@/components/AdBanner'
import { aiPost, AI_NOT_READY, AI_LIMIT } from '@/lib/api'
import { IconExam, IconFinish, IconCheck, IconCross, IconTip, IconRoadworks } from '@/components/icons'

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
      if (res.status === AI_NOT_READY) { setExp(p => ({ ...p, [idx]: t(lang, 'aiSoon') })); setExpLoading(p => ({ ...p, [idx]: false })); return }
      if (res.status === AI_LIMIT) { setExp(p => ({ ...p, [idx]: t(lang, 'aiLimit') })); setExpLoading(p => ({ ...p, [idx]: false })); return }
      if (!res.ok) throw new Error('explain failed')
      const data = await res.json()
      setExp(p => ({ ...p, [idx]: data.explanation || t(lang, 'unavailable') }))
    } catch {
      setExp(p => ({ ...p, [idx]: t(lang, 'unavailable') }))
    }
    setExpLoading(p => ({ ...p, [idx]: false }))
  }

  // Nothing to show until sessionStorage has been read (avoids a flash of 0/30 FAILED).
  if (!loaded) return <div className="min-h-screen" />

  if (!result) {
    return (
      <div className="min-h-screen">
        <AdBanner /><NavBar />
        <div className="max-w-[640px] mx-auto px-4 pt-16 text-center">
          <IconExam size={48} className="mx-auto mb-4" />
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
          <div className="text-xl font-bold mt-1 inline-flex items-center gap-2">{passed ? <>{t(lang, 'passed')} <IconFinish size={22} /></> : t(lang, 'failed')}</div>
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
                <span className={`mt-0.5 ${h.ok ? 'text-stradeo-green' : 'text-stradeo-accent2'}`}>{h.ok ? <IconCheck size={15} title={t(lang, 'correctBadge')} /> : <IconCross size={13} title={t(lang, 'wrong')} />}</span>
                <div className="flex-1">
                  {imgUrl && <img src={imgUrl} alt={t(lang, 'signAlt')} className="max-w-[200px] max-h-[170px] rounded-[10px] mx-auto my-3.5 border border-stradeo-line" />}
                  <p lang="it" className="text-sm leading-[1.5] mb-1">{h.q.q}</p>
                  <p className={`text-xs ${h.ok ? 'text-stradeo-green' : 'text-stradeo-accent2'}`}>
                    {t(lang, 'yourAnswer')}: <strong>{h.ua === undefined ? t(lang, 'noAnswer') : h.ua ? 'VERO' : 'FALSO'}</strong>
                    {!h.ok && <> · {t(lang, 'correct')}: <strong>{h.q.a ? 'VERO' : 'FALSO'}</strong></>}
                  </p>
                  {!h.ok && (exp[i] ? (
                    <div className="bg-stradeo-surface2 rounded-[10px] p-3 mt-2">
                      <div className="flex items-center gap-1.5 mb-1.5"><IconTip size={13} className="text-stradeo-brandorange" /><span className="text-[11px] font-semibold text-stradeo-inkdim uppercase tracking-[1px]">{t(lang, 'why')}</span></div>
                      <p className="text-[13px] leading-relaxed text-stradeo-ink">{exp[i] === t(lang, 'aiSoon') ? <span className="inline-flex items-start gap-2 text-stradeo-inkdim"><IconRoadworks size={15} className="text-stradeo-brandorange mt-0.5" />{exp[i]}</span> : exp[i]}</p>
                    </div>
                  ) : (
                    <button onClick={() => fetchExp(i, h.q.q, h.q.a)} disabled={expLoading[i]}
                      className="mt-2 px-4 py-2 rounded-lg border border-stradeo-line text-stradeo-ink hover:border-stradeo-ink text-xs font-semibold flex items-center gap-1.5">
                      {expLoading[i]
                        ? <><div className="w-3 h-3 border-2 border-stradeo-line border-t-stradeo-ink rounded-full animate-spin-slow" />{t(lang, 'loading')}</>
                        : <><IconTip size={13} />{t(lang, 'explain')}</>}
                    </button>
                  ))}
                  {!h.ok && <ReportQuestion key={questionKey(h.q)} question={h.q} />}
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
