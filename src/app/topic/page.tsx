'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { TOPIC_COUNTS } from '@/lib/questionCounts'
import { getLesson } from '@/lib/lessons'
import { getTopicName, isPrimaryTopic, TOPICS } from '@/lib/topics'
import { LANGUAGES, LANG_PROMPT, t } from '@/lib/i18n'
import type { TheoryContent } from '@/types'
import NavBar from '@/components/NavBar'
import AdBanner from '@/components/AdBanner'
import { aiPost } from '@/lib/api'
import { setLastTopic } from '@/lib/lastTopic'
import LessonView from '@/components/LessonView'

// New lesson layout: being tried on topic 1 first.
const NEW_LESSON = new Set([1])
import { IconStudy, IconQuiz, IconRoadworks, IconWarning, IconTip, IconArrowRight, IconExam } from '@/components/icons'

// Render inline Markdown emphasis (**bold** and *italic*) as real elements.
function renderMD(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-stradeo-ink">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

function TopicInner() {
  const params = useSearchParams()
  const tid = Number(params.get('id'))
  const { lang } = useLanguage()
  const { getTopicAccuracy, progress } = useProgress()

  const [mode, setMode] = useState<'study' | 'quiz'>('study')
  const count = TOPIC_COUNTS[tid] || 0
  const [theory, setTheory] = useState<TheoryContent | null>(null)
  // Language the shown lesson is actually in (English when no translation exists yet).
  const [theoryLang, setTheoryLang] = useState<string>('en')
  const [theoryLoading, setTheoryLoading] = useState(false)
  // cache generated lessons per topic+language for this session
  const [cache, setCache] = useState<Record<string, TheoryContent>>({})

  // Show the pre-generated lesson for this topic immediately.
  // A live regenerate (in another language) takes precedence via the session cache.
  useEffect(() => {
    const key = `${tid}-${lang}`
    if (cache[key]) { setTheory(cache[key]); setTheoryLoading(false); return }
    let cancelled = false
    setTheoryLoading(false)
    getLesson(tid, lang).then(r => { if (!cancelled) { setTheory(r?.lesson ?? null); setTheoryLang(r?.lang ?? 'en') } }, () => { /* the 'Generate lesson' button stays available */ })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tid, lang])

  const valid = TOPICS.some(x => x.id === tid)
  useEffect(() => { if (valid) setLastTopic(tid) }, [valid, tid])
  const isPri = isPrimaryTopic(tid)
  const accuracy = getTopicAccuracy(tid)

  async function fetchTheory(force = false) {
    const key = `${tid}-${lang}`
    if (!force && cache[key]) { setTheory(cache[key]); return }
    const previous = theory // pre-generated lesson to restore if a live regenerate fails
    setTheoryLoading(true)
    setTheory(null)
    const topic = TOPICS.find(x => x.id === tid)
    try {
      const res = await aiPost('/api/theory', ({ topicNameIt: topic?.it, topicNameEn: topic?.en, language: LANG_PROMPT[lang] }))
      if (!res.ok) throw new Error('theory request failed')
      const data: TheoryContent = await res.json()
      setTheory(data); setTheoryLang(lang)
      setCache(prev => ({ ...prev, [key]: data }))
    } catch {
      // Keep the pre-generated lesson rather than wiping it (e.g. no Claude key yet)
      let fallback: TheoryContent | null = previous
      if (!fallback) { try { fallback = (await getLesson(tid, lang))?.lesson ?? null } catch { /* offline */ } }
      setTheory(fallback || { title: topic?.en || '', keypoints: t(lang, 'lessonFailed'), details: '', traps: '', remember: '' })
    } finally {
      setTheoryLoading(false)
    }
  }

  if (!valid) {
    return (
      <div className="min-h-screen">
        <AdBanner /><NavBar />
        <div className="max-w-[640px] mx-auto px-4 pt-16 text-center">
          <p className="text-stradeo-inkdim mb-6">{t(lang, 'topicNotFound')}</p>
          <Link href="/" className="inline-block px-5 py-3 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand font-bold">{t(lang, 'home')}</Link>
        </div>
      </div>
    )
  }

  const topic = TOPICS.find(x => x.id === tid)!

  return (
    <div className="min-h-screen">
      <AdBanner /><NavBar />
      <div className="max-w-[640px] mx-auto px-4 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className={`min-w-[38px] h-[38px] rounded-[10px] flex items-center justify-center font-mono text-sm ${isPri ? 'bg-stradeo-surface2 text-stradeo-ink' : 'bg-stradeo-surface2 text-stradeo-inkfaint'}`}>
            {String(tid).padStart(2, '0')}
          </div>
          <div>
            <h3 className="text-lg font-bold">{getTopicName(tid, lang)}</h3>
            <p className="text-xs text-stradeo-inkfaint mt-0.5">{topic.it} · {count} {t(lang, 'questions')}</p>
          </div>
        </div>

        {/* Tabs: the white pill slides to the selected one */}
        <div className="relative grid grid-cols-2 gap-1 mb-5 bg-stradeo-surface2 rounded-[10px] p-1" role="tablist">
          <span aria-hidden="true"
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-6px)] rounded-lg bg-stradeo-bg2 border border-stradeo-line transition-transform duration-300 ease-[cubic-bezier(0.22,0.8,0.24,1)] ${mode === 'quiz' ? 'translate-x-[calc(100%+4px)]' : ''}`} />
          <button role="tab" aria-selected={mode === 'study'} onClick={() => setMode('study')}
            className={`relative py-2.5 rounded-lg text-sm font-semibold transition-colors ${mode === 'study' ? 'text-stradeo-ink' : 'text-stradeo-inkdim hover:text-stradeo-ink'} inline-flex items-center justify-center gap-2`}><IconStudy size={16} />{t(lang, 'study')}</button>
          <button role="tab" aria-selected={mode === 'quiz'} onClick={() => setMode('quiz')}
            className={`relative py-2.5 rounded-lg text-sm font-semibold transition-colors ${mode === 'quiz' ? 'text-stradeo-ink' : 'text-stradeo-inkdim hover:text-stradeo-ink'} inline-flex items-center justify-center gap-2`}><IconQuiz size={15} />{t(lang, 'quiz')}</button>
        </div>

        {/* STUDY TAB */}
        {mode === 'study' && (
          <div key="study" className="animate-page-in">
            {!theory && !theoryLoading && (
              <button onClick={() => fetchTheory()}
                className="w-full p-5 rounded-[14px] border border-dashed border-stradeo-line text-stradeo-ink hover:border-stradeo-ink text-[15px] font-semibold mb-4 inline-flex items-center justify-center gap-2">
                <IconStudy size={16} />{t(lang, 'generateLesson')} · {LANGUAGES[lang]}
              </button>
            )}

            {theoryLoading && (
              <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-10 text-center">
                <div className="w-7 h-7 border-[3px] border-stradeo-line border-t-stradeo-ink rounded-full animate-spin-slow mx-auto mb-4" />
                <p className="text-[15px] text-stradeo-inkdim m-0">{t(lang, 'creatingLesson')}</p>
                <p className="text-xs text-stradeo-inkfaint mt-1.5">{t(lang, 'poweredByAi')} · {LANGUAGES[lang]}</p>
              </div>
            )}

            {theory && lang !== 'en' && theoryLang !== lang && !cache[`${tid}-${lang}`] && (
              <div className="mb-3.5 rounded-[10px] border border-stradeo-accent/30 bg-stradeo-accent/[0.08] px-4 py-3 text-[13px] text-stradeo-ink flex items-start gap-2.5">
                <IconRoadworks size={18} className="text-stradeo-brandorange shrink-0" /><span>{t(lang, 'lessonLangSoon')}</span>
              </div>
            )}

            {theory && NEW_LESSON.has(tid) && <LessonView tid={tid} theory={theory} />}

            {theory && !NEW_LESSON.has(tid) && (
              <div className="[&>*]:animate-rise [&>*:nth-child(2)]:[animation-delay:60ms] [&>*:nth-child(3)]:[animation-delay:120ms] [&>*:nth-child(4)]:[animation-delay:180ms] [&>*:nth-child(5)]:[animation-delay:240ms] [&>*:nth-child(6)]:[animation-delay:300ms]">
                {/* Title */}
                <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-5 mb-3.5">
                  <h3 className="text-xl font-bold text-stradeo-ink m-0 leading-snug">{theory.title}</h3>
                </div>

                {/* Key Points */}
                {theory.keypoints && (
                  <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-5 mb-3.5">
                    <div className="text-xs font-semibold text-stradeo-inkdim uppercase tracking-[1px] mb-3">{t(lang, 'keyPoints')}</div>
                    {theory.keypoints.split('\n').filter(l => l.trim()).map((line, i) => (
                      <div key={i} className="flex gap-2.5 mb-2 items-start">
                        <span className="text-stradeo-inkfaint text-sm mt-px">•</span>
                        <p className="m-0 text-sm leading-relaxed">{renderMD(line.replace(/^[•·\-]\s*/, ''))}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Details */}
                {theory.details && (
                  <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-5 mb-3.5">
                    <div className="text-xs font-semibold text-stradeo-inkdim uppercase tracking-[1px] mb-3">{t(lang, 'explained')}</div>
                    {theory.details.split('\n\n').filter(p => p.trim()).map((para, i) => (
                      <p key={i} className={`text-sm leading-[1.7] text-stradeo-inkdim ${i > 0 ? 'mt-3' : ''}`}>{renderMD(para)}</p>
                    ))}
                  </div>
                )}

                {/* Traps */}
                {theory.traps && (
                  <div className="bg-stradeo-accent/[0.06] border border-stradeo-accent/20 rounded-[14px] p-5 mb-3.5">
                    <div className="text-xs font-semibold text-stradeo-accent uppercase tracking-[1px] mb-3 flex items-center gap-2"><IconWarning size={14} />{t(lang, 'examTraps')}</div>
                    {theory.traps.split('\n').filter(l => l.trim()).map((line, i) => (
                      <div key={i} className="flex gap-2.5 mb-2 items-start">
                        <IconWarning size={13} className="text-stradeo-accent mt-1" />
                        <p className="m-0 text-sm leading-relaxed text-stradeo-ink">{renderMD(line.replace(/^[⚠·\-]\s*/, ''))}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Remember */}
                {theory.remember && (
                  <div className="bg-stradeo-surface2 rounded-[14px] p-[18px] mb-3.5 text-center">
                    <div className="text-xs font-semibold text-stradeo-inkdim uppercase tracking-[1px] mb-2 flex items-center justify-center gap-2"><IconTip size={14} className="text-stradeo-brandorange" />{t(lang, 'remember')}</div>
                    <p className="m-0 text-[15px] font-semibold leading-relaxed text-stradeo-ink">{renderMD(theory.remember)}</p>
                  </div>
                )}

                {/* Actions */}
                <button onClick={() => setMode('quiz')}
                  className="flex w-full py-3.5 rounded-[10px] items-center justify-center gap-2 bg-stradeo-brand text-stradeo-onbrand text-[15px] font-bold mt-2"><IconQuiz size={15} />{t(lang, 'startQuiz')} <IconArrowRight size={15} /></button>
              </div>
            )}
          </div>
        )}

        {/* QUIZ TAB */}
        {mode === 'quiz' && (
          <div key="quiz" className="animate-page-in">
            <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-5 text-center">
              <div className="mb-2 flex justify-center">{isPri ? <IconExam size={36} /> : <IconQuiz size={34} />}</div>
              <h3 className="text-[17px] font-bold mb-1.5">{count} {t(lang, 'questions')}</h3>
              <p className="text-[13px] text-stradeo-inkfaint">{t(lang, isPri ? 'primaryTopic' : 'secondaryTopic')}</p>
              {accuracy !== null && (
                <p className={`text-sm font-semibold mt-2 ${accuracy >= 80 ? 'text-stradeo-green' : accuracy >= 50 ? 'text-stradeo-accent' : 'text-stradeo-accent2'}`}>
                  {t(lang, 'currentAccuracy')}: <span className="font-mono">{accuracy}%</span>
                </p>
              )}
              <Link href={`/quiz?topic=${tid}`}
                className="flex w-full py-4 rounded-[10px] items-center justify-center gap-2 bg-stradeo-brand text-stradeo-onbrand text-base font-bold mt-4">
                {t(lang, 'startQuiz')} <IconArrowRight size={16} />
              </Link>
            </div>

            {!theory && (
              <button onClick={() => setMode('study')}
                className="w-full py-3.5 rounded-[10px] border border-dashed border-stradeo-line text-stradeo-inkdim hover:text-stradeo-ink text-[13px] font-semibold mt-3 inline-flex items-center justify-center gap-2">
                <IconStudy size={15} />{t(lang, 'studyFirst')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TopicPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <TopicInner />
    </Suspense>
  )
}
