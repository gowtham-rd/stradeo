'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { loadQuestions } from '@/lib/questions'
import { seenId } from '@/lib/progress'
import ResultRow from '@/components/ResultRow'
import { MAX_ERRORS } from '@/lib/constants'
import { t } from '@/lib/i18n'
import type { Question } from '@/types'
import NavBar from '@/components/NavBar'
import ExamHistoryChart from '@/components/ExamHistoryChart'
import { useCountUp } from '@/lib/useCountUp'
import { IconExam, IconFinish, IconCross, IconHistory, IconHome, IconChevronDown } from '@/components/icons'

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
  const [openRow, setOpenRow] = useState<number | null>(null)
  const [showCorrect, setShowCorrect] = useState(false)

  const exams = progress.exams || []

  // The exam just taken comes from this tab's session; older ones are rebuilt
  // from the stored history (question ids → questions).
  useEffect(() => {
    let cancelled = false
    setOpenRow(null); setShowCorrect(false)
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
  const mistakes = rows.filter(r => !r.ok && r.ua !== undefined)
  const unanswered = rows.filter(r => r.ua === undefined)
  const correct = rows.filter(r => r.ok)
  // Answer map: open that question (and its section) and scroll to it.
  const jumpTo = (i: number) => {
    if (rows[i]?.ok) setShowCorrect(true)
    setOpenRow(i)
    requestAnimationFrame(() => document.getElementById(`q${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
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
    <div className="max-w-[640px] mx-auto px-4 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] animate-page-in">
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
            <div className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[13px] font-bold uppercase tracking-[1px] animate-pop [animation-delay:700ms] ${passed ? 'bg-stradeo-green/[0.12] text-stradeo-green' : 'bg-stradeo-accent2/[0.12] text-stradeo-accent2'}`}>
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
            <button type="button" key={r.i} onClick={() => jumpTo(r.i)}
              aria-label={`${t(lang, 'questionN')} ${r.i + 1}: ${r.ok ? t(lang, 'correctBadge') : r.ua === undefined ? t(lang, 'noAnswer') : t(lang, 'wrong')}`}
              style={{ animationDelay: `${r.i * 18}ms` }}
              className={`h-7 rounded-[5px] flex items-center justify-center font-mono text-[10px] animate-rise ${
                r.ok ? 'bg-stradeo-green/[0.14] text-stradeo-green' : r.ua === undefined ? 'border border-stradeo-accent text-stradeo-accent' : 'bg-stradeo-accent2/[0.14] text-stradeo-accent2'
              }`}>
              {r.i + 1}
            </button>
          ))}
        </div>
      </section>

      {/* Past exams */}
      {exams.length > 0 && (
        <section className="rounded-[14px] border border-stradeo-line bg-stradeo-bg2 p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <IconHistory size={15} className="text-stradeo-blue" />
            <div className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim">
              {exams.length > 1 ? t(lang, 'lastExams').replace('{n}', String(Math.min(10, exams.length))) : t(lang, 'examHistory')}
            </div>
          </div>
          <ExamHistoryChart exams={exams} selected={result.at} onSelect={at => router.replace(`/exam/review?at=${at}`, { scroll: false })} />
        </section>
      )}

      {/* Questions, grouped: mistakes and unanswered open, correct folded away */}
      {([
        ['secMistakes', mistakes, 'text-stradeo-accent2'],
        ['secUnanswered', unanswered, 'text-stradeo-accent'],
      ] as const).map(([key, list, tone]) => list.length > 0 && (
        <section key={key} className="mb-4">
          <h2 className="mb-2 flex items-baseline gap-2 text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim">
            {t(lang, key)} <span className={`font-mono ${tone}`}>{list.length}</span>
          </h2>
          <div className="stagger">
          {list.map(r => (
            <ResultRow key={r.i} n={r.i + 1} q={r.q} ua={r.ua} ok={r.ok}
              open={openRow === r.i} onToggle={() => setOpenRow(o => (o === r.i ? null : r.i))} />
          ))}
          </div>
        </section>
      ))}

      {correct.length > 0 && (
        <section className="mb-4">
          <button type="button" onClick={() => setShowCorrect(v => !v)} aria-expanded={showCorrect}
            className="mb-2 flex w-full items-center gap-2 text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim">
            {t(lang, 'secCorrect')} <span className="font-mono text-stradeo-green">{correct.length}</span>
            <span className="ml-auto inline-flex items-center gap-1 normal-case tracking-normal text-[12px] font-semibold text-stradeo-blue">
              {t(lang, showCorrect ? 'hideCorrect' : 'showCorrect')}
              <IconChevronDown size={11} className={`transition-transform duration-300 ${showCorrect ? 'rotate-180' : ''}`} />
            </span>
          </button>
          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${showCorrect ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              {correct.map(r => (
                <ResultRow key={r.i} n={r.i + 1} q={r.q} ua={r.ua} ok={r.ok}
                  open={openRow === r.i} onToggle={() => setOpenRow(o => (o === r.i ? null : r.i))} />
              ))}
            </div>
          </div>
        </section>
      )}

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
