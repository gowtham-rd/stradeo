'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { getImageUrl, loadQuestions, questionKey } from '@/lib/questions'
import { seenId } from '@/lib/progress'
import ReportQuestion from '@/components/ReportQuestion'
import { MAX_ERRORS } from '@/lib/constants'
import { LANG_PROMPT, t } from '@/lib/i18n'
import type { Question } from '@/types'
import NavBar from '@/components/NavBar'
import ExamHistoryChart from '@/components/ExamHistoryChart'
import { useCountUp } from '@/lib/useCountUp'
import { aiPost, AI_ENABLED, AI_NOT_READY, AI_LIMIT } from '@/lib/api'
import { IconExam, IconFinish, IconCheck, IconCross, IconTip, IconHistory, IconHome } from '@/components/icons'

interface Result {
  at: number
  secs: number | null
  questions: Question[]
  /** Per question: true / false, or undefined when not answered. */
  answers: (boolean | undefined)[]
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function ResultsInner() {
  const { lang } = useLanguage()
  const router = useRouter()
  const params = useSearchParams()
  const { progress, loaded: progressLoaded } = useProgress()
  const atParam = Number(params.get('at')) || null
  const [result, setResult] = useState<Result | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [filter, setFilter] = useState<'all' | 'errors'>('all')
  const [exp, setExp] = useState<Record<number, string>>({})
  const [expLoading, setExpLoading] = useState<Record<number, boolean>>({})

  const exams = progress.exams || []

  // The exam just taken comes from this tab's session; older ones are rebuilt
  // from the stored history (question ids → questions).
  useEffect(() => {
    let cancelled = false
    setFilter('all')
    setExp({})
    try {
      const raw = sessionStorage.getItem('stradeo_exam_result')
      if (raw) {
        const r = JSON.parse(raw) as { at?: number; secs?: number; questions: Question[]; answers: Record<number, boolean> }
        if (!atParam || r.at === atParam) {
          setResult({ at: r.at ?? 0, secs: r.secs ?? null, questions: r.questions, answers: r.questions.map((_, i) => r.answers[i]) })
          setState('ready')
          return
        }
      }
    } catch { /* fall through to history */ }
    if (!progressLoaded) return
    const rec = atParam ? exams.find(e => e.at === atParam) : exams[exams.length - 1]
    if (!rec) { setState('missing'); return }
    setState('loading')
    loadQuestions().then(all => {
      if (cancelled) return
      const byId = new Map<string, Question>()
      for (const q of all) byId.set(seenId(q), q)
      const questions = rec.ids.map(id => byId.get(id))
      if (questions.some(q => !q)) { setState('missing'); return }
      setResult({
        at: rec.at, secs: rec.secs, questions: questions as Question[],
        answers: rec.ans.split('').map(c => (c === 'T' ? true : c === 'F' ? false : undefined)),
      })
      setState('ready')
    }, () => { if (!cancelled) setState('missing') })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atParam, progressLoaded, exams.length])

  const rows = useMemo(() => {
    if (!result) return []
    return result.questions.map((q, i) => ({ i, q, ua: result.answers[i], ok: result.answers[i] === q.a }))
  }, [result])

  const total = rows.length || 30
  const score = rows.filter(r => r.ok).length
  const errors = total - score
  const passed = errors <= MAX_ERRORS
  const shownScore = Math.round(useCountUp(state === 'ready' ? score : 0, 900))
  const visible = filter === 'errors' ? rows.filter(r => !r.ok) : rows

  async function fetchExp(idx: number, question: string, correctAnswer: boolean) {
    setExpLoading(p => ({ ...p, [idx]: true }))
    try {
      const res = await aiPost('/api/explain', ({ question, correctAnswer, language: LANG_PROMPT[lang] }))
      if (res.status === AI_NOT_READY) setExp(p => ({ ...p, [idx]: t(lang, 'explainSoon') }))
      else if (res.status === AI_LIMIT) setExp(p => ({ ...p, [idx]: t(lang, 'aiLimit') }))
      else if (!res.ok) throw new Error('explain failed')
      else { const data = await res.json(); setExp(p => ({ ...p, [idx]: data.explanation || t(lang, 'unavailable') })) }
    } catch {
      setExp(p => ({ ...p, [idx]: t(lang, 'unavailable') }))
    }
    setExpLoading(p => ({ ...p, [idx]: false }))
  }

  if (state === 'missing') {
    return (
      <div className="max-w-[640px] mx-auto px-4 pt-16 text-center animate-page-in">
        <IconExam size={44} className="mx-auto mb-4 text-stradeo-inkdim" />
        <p className="text-stradeo-inkdim mb-6">{t(lang, 'historyMissing')}</p>
        <Link href="/exam" className="inline-block px-5 py-3 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand font-bold">{t(lang, 'newExam')}</Link>
      </div>
    )
  }

  if (state === 'loading' || !result) {
    return (
      <div className="max-w-[640px] mx-auto px-4 pt-5">
        <div className="h-[188px] rounded-[14px] bg-stradeo-surface2 animate-pulse mb-4" />
        <div className="h-[160px] rounded-[14px] bg-stradeo-surface2 animate-pulse" />
      </div>
    )
  }

  const dateLabel = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(result.at || Date.now())

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-5 pb-10 animate-page-in">
      {/* Score */}
      <section className="rounded-[14px] border border-stradeo-line bg-stradeo-bg2 p-5 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim">{t(lang, 'results')}</div>
          <div className="text-[12px] text-stradeo-inkfaint">{dateLabel}</div>
        </div>
        <div className="flex items-end gap-4">
          <div className={`font-mono text-[56px] leading-none tracking-tight tabular-nums ${passed ? 'text-stradeo-green' : 'text-stradeo-accent2'}`}>
            {shownScore}<span className="text-[26px] text-stradeo-inkfaint">/{total}</span>
          </div>
          <div className="pb-1.5">
            <div className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[13px] font-bold uppercase tracking-[1px] animate-rise ${passed ? 'bg-stradeo-green/[0.12] text-stradeo-green' : 'bg-stradeo-accent2/[0.12] text-stradeo-accent2'}`}>
              {passed ? <IconFinish size={14} /> : <IconCross size={11} />}{t(lang, passed ? 'passed' : 'failed')}
            </div>
            <div className="text-[13px] text-stradeo-inkdim mt-1.5">
              {errors} {t(lang, 'errors')} · {t(lang, 'max3')}{result.secs != null && <> · {t(lang, 'timeUsed')} <span className="font-mono">{fmtTime(result.secs)}</span></>}
            </div>
          </div>
        </div>

        {/* Answer map: one square per question; tap to jump to it below */}
        <div className="grid grid-cols-10 gap-1 mt-4">
          {rows.map(r => (
            <a key={r.i} href={`#q${r.i + 1}`} onClick={() => setFilter('all')}
              aria-label={`${t(lang, 'questionN')} ${r.i + 1}: ${r.ok ? t(lang, 'correctBadge') : r.ua === undefined ? t(lang, 'noAnswer') : t(lang, 'wrong')}`}
              style={{ animationDelay: `${r.i * 18}ms` }}
              className={`h-7 rounded-[5px] flex items-center justify-center font-mono text-[10px] animate-rise ${
                r.ok ? 'bg-stradeo-green/[0.14] text-stradeo-green' : r.ua === undefined ? 'border border-stradeo-accent text-stradeo-accent' : 'bg-stradeo-accent2/[0.14] text-stradeo-accent2'
              }`}>
              {r.i + 1}
            </a>
          ))}
        </div>
      </section>

      {/* Past exams */}
      {exams.length > 0 && (
        <section className="rounded-[14px] border border-stradeo-line bg-stradeo-bg2 p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <IconHistory size={15} className="text-stradeo-blue" />
            <div className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim">
              {t(lang, 'lastExams').replace('{n}', String(Math.min(10, exams.length)))}
            </div>
          </div>
          <ExamHistoryChart exams={exams} selected={result.at} onSelect={at => router.replace(`/exam/review?at=${at}`, { scroll: false })} />
        </section>
      )}

      {/* Question list */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim">{t(lang, 'review')}</div>
        <div className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-stradeo-line bg-stradeo-bg2 p-0.5 text-[13px]" role="tablist">
          {(['all', 'errors'] as const).map(f => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={`h-full rounded-md px-2.5 ${filter === f ? 'bg-stradeo-ink text-stradeo-bg font-semibold' : 'text-stradeo-inkdim hover:text-stradeo-ink'}`}>
              {f === 'all' ? `${t(lang, 'showAll')} ${total}` : `${t(lang, 'showErrors')} ${errors}`}
            </button>
          ))}
        </div>
      </div>

      {visible.map(({ i, q, ua, ok }, n) => {
        const imgUrl = getImageUrl(q.i)
        return (
          <article id={`q${i + 1}`} key={i} style={{ animationDelay: `${Math.min(n, 8) * 35}ms` }}
            className="scroll-mt-20 rounded-[14px] border border-stradeo-line bg-stradeo-bg2 p-4 mb-2 animate-rise">
            <div className="flex gap-3 items-start">
              <div className={`flex h-7 min-w-[28px] items-center justify-center rounded-[8px] font-mono text-[12px] ${ok ? 'bg-stradeo-green/[0.12] text-stradeo-green' : 'bg-stradeo-accent2/[0.12] text-stradeo-accent2'}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                {imgUrl && <img src={imgUrl} alt={t(lang, 'signAlt')} loading="lazy" className="max-w-[150px] max-h-[130px] rounded-[10px] mb-2.5 border border-stradeo-line" />}
                <p lang="it" className="text-[15px] leading-[1.5]">{q.q}</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className={`rounded-[8px] px-2.5 py-2 ${ok ? 'bg-stradeo-green/[0.08]' : 'bg-stradeo-accent2/[0.08]'}`}>
                    <div className="text-[10px] font-bold uppercase tracking-[1px] text-stradeo-inkdim">{t(lang, 'yourAnswer')}</div>
                    <div className={`mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-bold ${ok ? 'text-stradeo-green' : 'text-stradeo-accent2'}`}>
                      {ok ? <IconCheck size={12} /> : <IconCross size={10} />}
                      {ua === undefined ? t(lang, 'noAnswer') : ua ? 'VERO' : 'FALSO'}
                    </div>
                  </div>
                  <div className="rounded-[8px] px-2.5 py-2 bg-stradeo-surface2">
                    <div className="text-[10px] font-bold uppercase tracking-[1px] text-stradeo-inkdim">{t(lang, 'correctAnswer')}</div>
                    <div className="mt-0.5 text-[13px] font-bold text-stradeo-ink">{q.a ? 'VERO' : 'FALSO'}</div>
                  </div>
                </div>
                {/* "Why" only when explanations are available */}
                {!ok && AI_ENABLED && (exp[i] ? (
                  <div className="bg-stradeo-surface2 rounded-[10px] p-3 mt-2">
                    <div className="flex items-center gap-1.5 mb-1.5"><IconTip size={13} className="text-stradeo-brandorange" /><span className="text-[11px] font-semibold text-stradeo-inkdim uppercase tracking-[1px]">{t(lang, 'why')}</span></div>
                    <p className="text-[13px] leading-relaxed text-stradeo-ink">{exp[i]}</p>
                  </div>
                ) : (
                  <button onClick={() => fetchExp(i, q.q, q.a)} disabled={expLoading[i]}
                    className="mt-2 px-3 py-2 rounded-lg border border-stradeo-line text-stradeo-ink hover:border-stradeo-ink text-xs font-semibold inline-flex items-center gap-1.5">
                    <IconTip size={13} />{expLoading[i] ? t(lang, 'loading') : t(lang, 'why')}
                  </button>
                ))}
                {!ok && <ReportQuestion key={questionKey(q)} question={q} />}
              </div>
            </div>
          </article>
        )
      })}

      <div className="grid grid-cols-2 gap-2.5 mt-5">
        <Link href="/" className="py-3.5 rounded-[10px] border border-stradeo-line text-stradeo-ink text-sm font-semibold inline-flex items-center justify-center gap-2 hover:border-stradeo-ink"><IconHome size={14} />{t(lang, 'home')}</Link>
        <Link href="/exam" className="py-3.5 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-sm font-bold inline-flex items-center justify-center gap-2"><IconExam size={15} />{t(lang, 'newExam')}</Link>
      </div>
    </div>
  )
}

export default function ExamResultsPage() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Suspense fallback={null}>
        <ResultsInner />
      </Suspense>
    </div>
  )
}
