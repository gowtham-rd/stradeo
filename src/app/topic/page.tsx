'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { loadQuestions, getTopicQuestionCount } from '@/lib/questions'
import { getLesson } from '@/lib/lessons'
import { getTopicName, isPrimaryTopic, TOPICS } from '@/lib/topics'
import { LANGUAGES, LANG_PROMPT, t } from '@/lib/i18n'
import type { TheoryContent } from '@/types'
import NavBar from '@/components/NavBar'
import AdBanner from '@/components/AdBanner'

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
  const [count, setCount] = useState(0)
  const [theory, setTheory] = useState<TheoryContent | null>(null)
  const [theoryLoading, setTheoryLoading] = useState(false)
  // cache generated lessons per topic+language for this session
  const [cache, setCache] = useState<Record<string, TheoryContent>>({})

  useEffect(() => {
    loadQuestions().then(all => setCount(getTopicQuestionCount(all)[tid] || 0))
  }, [tid])

  // Show the pre-generated lesson for this topic immediately.
  // A live regenerate (in another language) takes precedence via the session cache.
  useEffect(() => {
    const key = `${tid}-${lang}`
    if (cache[key]) { setTheory(cache[key]); setTheoryLoading(false); return }
    let cancelled = false
    setTheoryLoading(false)
    getLesson(tid).then(l => { if (!cancelled) setTheory(l) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tid, lang])

  const valid = TOPICS.some(x => x.id === tid)
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
      const res = await fetch('/api/theory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicNameIt: topic?.it, topicNameEn: topic?.en, language: LANG_PROMPT[lang] }),
      })
      if (!res.ok) throw new Error('theory request failed')
      const data: TheoryContent = await res.json()
      setTheory(data)
      setCache(prev => ({ ...prev, [key]: data }))
    } catch {
      // Keep the pre-generated lesson rather than wiping it (e.g. no Claude key yet)
      setTheory(previous || (await getLesson(tid)) || { title: topic?.en || '', keypoints: 'Could not load theory content.', details: '', traps: '', remember: '' })
    }
    setTheoryLoading(false)
  }

  if (!valid) {
    return (
      <div className="min-h-screen">
        <AdBanner /><NavBar />
        <div className="max-w-[640px] mx-auto px-4 pt-16 text-center">
          <p className="text-stradeo-inkdim mb-6">Topic not found.</p>
          <Link href="/" className="inline-block px-5 py-3 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand font-bold">{t(lang, 'home')}</Link>
        </div>
      </div>
    )
  }

  const topic = TOPICS.find(x => x.id === tid)!

  return (
    <div className="min-h-screen">
      <AdBanner /><NavBar />
      <div className="max-w-[640px] mx-auto px-4 pt-5 pb-10 animate-fade-in">
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

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-stradeo-surface2 rounded-[10px] p-1" role="tablist">
          <button onClick={() => setMode('study')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${mode === 'study' ? 'bg-stradeo-bg2 text-stradeo-ink border border-stradeo-line' : 'text-stradeo-inkdim hover:text-stradeo-ink'}`}>📖 Study</button>
          <button onClick={() => setMode('quiz')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${mode === 'quiz' ? 'bg-stradeo-bg2 text-stradeo-ink border border-stradeo-line' : 'text-stradeo-inkdim hover:text-stradeo-ink'}`}>📝 Quiz</button>
        </div>

        {/* STUDY TAB */}
        {mode === 'study' && (
          <div>
            {!theory && !theoryLoading && (
              <button onClick={() => fetchTheory()}
                className="w-full p-5 rounded-[14px] border border-dashed border-stradeo-line text-stradeo-ink hover:border-stradeo-ink text-[15px] font-semibold mb-4">
                📖 Generate lesson in {LANGUAGES[lang]}
              </button>
            )}

            {theoryLoading && (
              <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-10 text-center">
                <div className="w-7 h-7 border-[3px] border-stradeo-line border-t-stradeo-ink rounded-full animate-spin-slow mx-auto mb-4" />
                <p className="text-[15px] text-stradeo-inkdim m-0">Creating your lesson...</p>
                <p className="text-xs text-stradeo-inkfaint mt-1.5">Powered by AI · {LANGUAGES[lang]}</p>
              </div>
            )}

            {theory && (
              <div className="animate-fade-in">
                {/* Title */}
                <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-5 mb-3.5">
                  <h3 className="text-xl font-bold text-stradeo-ink m-0 leading-snug">{theory.title}</h3>
                </div>

                {/* Key Points */}
                {theory.keypoints && (
                  <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-5 mb-3.5">
                    <div className="text-xs font-semibold text-stradeo-inkdim uppercase tracking-[1px] mb-3">Key Points</div>
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
                    <div className="text-xs font-semibold text-stradeo-inkdim uppercase tracking-[1px] mb-3">Explained</div>
                    {theory.details.split('\n\n').filter(p => p.trim()).map((para, i) => (
                      <p key={i} className={`text-sm leading-[1.7] text-stradeo-inkdim ${i > 0 ? 'mt-3' : ''}`}>{renderMD(para)}</p>
                    ))}
                  </div>
                )}

                {/* Traps */}
                {theory.traps && (
                  <div className="bg-stradeo-accent/[0.06] border border-stradeo-accent/20 rounded-[14px] p-5 mb-3.5">
                    <div className="text-xs font-semibold text-stradeo-accent uppercase tracking-[1px] mb-3">⚠ Exam Traps</div>
                    {theory.traps.split('\n').filter(l => l.trim()).map((line, i) => (
                      <div key={i} className="flex gap-2.5 mb-2 items-start">
                        <span className="text-stradeo-accent text-[13px]">⚠</span>
                        <p className="m-0 text-sm leading-relaxed text-stradeo-ink">{renderMD(line.replace(/^[⚠·\-]\s*/, ''))}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Remember */}
                {theory.remember && (
                  <div className="bg-stradeo-surface2 rounded-[14px] p-[18px] mb-3.5 text-center">
                    <div className="text-xs font-semibold text-stradeo-inkdim uppercase tracking-[1px] mb-2">💡 Remember</div>
                    <p className="m-0 text-[15px] font-semibold leading-relaxed text-stradeo-ink">{renderMD(theory.remember)}</p>
                  </div>
                )}

                {/* Actions */}
                <button onClick={() => setMode('quiz')}
                  className="w-full py-3.5 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-[15px] font-bold mt-2">📝 Start Quiz →</button>
              </div>
            )}
          </div>
        )}

        {/* QUIZ TAB */}
        {mode === 'quiz' && (
          <div>
            <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-5 text-center">
              <div className="text-4xl mb-2">{isPri ? '🎯' : '📝'}</div>
              <h3 className="text-[17px] font-bold mb-1.5">{count} {t(lang, 'questions')}</h3>
              <p className="text-[13px] text-stradeo-inkfaint">{isPri ? 'Primary topic · 2 questions per exam' : 'Integrative · 1 question per exam'}</p>
              {accuracy !== null && (
                <p className={`text-sm font-semibold mt-2 ${accuracy >= 80 ? 'text-stradeo-green' : accuracy >= 50 ? 'text-stradeo-accent' : 'text-stradeo-accent2'}`}>
                  Current accuracy: <span className="font-mono">{accuracy}%</span>
                </p>
              )}
              <Link href={`/quiz?topic=${tid}`}
                className="block w-full py-4 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-base font-bold mt-4">
                Start Quiz →
              </Link>
            </div>

            {!theory && (
              <button onClick={() => setMode('study')}
                className="w-full py-3.5 rounded-[10px] border border-dashed border-stradeo-line text-stradeo-inkdim hover:text-stradeo-ink text-[13px] font-semibold mt-3">
                📖 Study the theory first?
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
