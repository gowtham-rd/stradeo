'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { loadQuestions, getTopicQuestionCount } from '@/lib/questions'
import { getTopicName, isPrimaryTopic, TOPICS } from '@/lib/topics'
import { LANGUAGES, LANG_PROMPT, t } from '@/lib/i18n'
import type { TheoryContent } from '@/types'
import NavBar from '@/components/NavBar'
import AdBanner from '@/components/AdBanner'

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

  // Reset / restore cached lesson when topic or language changes
  useEffect(() => {
    setTheory(cache[`${tid}-${lang}`] || null)
    setTheoryLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tid, lang])

  const valid = TOPICS.some(x => x.id === tid)
  const isPri = isPrimaryTopic(tid)
  const accuracy = getTopicAccuracy(tid)

  async function fetchTheory(force = false) {
    const key = `${tid}-${lang}`
    if (!force && cache[key]) { setTheory(cache[key]); return }
    setTheoryLoading(true)
    setTheory(null)
    const topic = TOPICS.find(x => x.id === tid)
    try {
      const res = await fetch('/api/theory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicNameIt: topic?.it, topicNameEn: topic?.en, language: LANG_PROMPT[lang] }),
      })
      const data: TheoryContent = await res.json()
      setTheory(data)
      setCache(prev => ({ ...prev, [key]: data }))
    } catch {
      setTheory({ title: topic?.en || '', keypoints: 'Could not load theory content.', details: '', traps: '', remember: '' })
    }
    setTheoryLoading(false)
  }

  if (!valid) {
    return (
      <div className="min-h-screen">
        <AdBanner /><NavBar />
        <div className="max-w-[640px] mx-auto px-4 pt-16 text-center">
          <p className="text-gray-400 mb-6">Topic not found.</p>
          <Link href="/" className="inline-block px-5 py-3 rounded-xl bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 text-white font-bold">{t(lang, 'home')}</Link>
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
          <div className={`min-w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-sm font-bold ${isPri ? 'bg-orange-500/[0.08] text-stradeo-accent' : 'bg-indigo-500/[0.08] text-stradeo-blue'}`}>
            {String(tid).padStart(2, '0')}
          </div>
          <div>
            <h3 className="text-lg font-bold">{getTopicName(tid, lang)}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{topic.it} · {count} {t(lang, 'questions')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white/[0.03] rounded-xl p-1">
          <button onClick={() => setMode('study')}
            className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold ${mode === 'study' ? 'bg-green-500/[0.12] text-stradeo-green' : 'text-gray-500'}`}>📖 Study</button>
          <button onClick={() => setMode('quiz')}
            className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold ${mode === 'quiz' ? 'bg-orange-500/[0.12] text-stradeo-accent' : 'text-gray-500'}`}>📝 Quiz</button>
        </div>

        {/* STUDY TAB */}
        {mode === 'study' && (
          <div>
            {!theory && !theoryLoading && (
              <button onClick={() => fetchTheory()}
                className="w-full p-5 rounded-2xl border-2 border-dashed border-green-500/20 bg-green-500/[0.04] text-stradeo-green text-[15px] font-semibold mb-4">
                📖 Generate lesson in {LANGUAGES[lang]}
              </button>
            )}

            {theoryLoading && (
              <div className="bg-stradeo-bg2 border border-white/10 rounded-[18px] p-10 text-center">
                <div className="w-7 h-7 border-[3px] border-green-500/20 border-t-stradeo-green rounded-full animate-spin-slow mx-auto mb-4" />
                <p className="text-[15px] text-gray-300 m-0">Creating your lesson...</p>
                <p className="text-xs text-gray-500 mt-1.5">Powered by AI · {LANGUAGES[lang]}</p>
              </div>
            )}

            {theory && (
              <div className="animate-fade-in">
                {/* Title */}
                <div className="bg-gradient-to-br from-stradeo-bg2 to-green-500/[0.06] border border-green-500/[0.12] rounded-2xl p-5 mb-3.5">
                  <h3 className="text-lg font-bold text-stradeo-green m-0">{theory.title}</h3>
                </div>

                {/* Key Points */}
                {theory.keypoints && (
                  <div className="bg-stradeo-bg2 border border-white/[0.06] rounded-2xl p-5 mb-3.5">
                    <div className="text-xs font-bold text-stradeo-green uppercase tracking-[1px] mb-3">Key Points</div>
                    {theory.keypoints.split('\n').filter(l => l.trim()).map((line, i) => (
                      <div key={i} className="flex gap-2.5 mb-2 items-start">
                        <span className="text-stradeo-green text-sm mt-px">•</span>
                        <p className="m-0 text-sm leading-relaxed">{line.replace(/^[•·\-]\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Details */}
                {theory.details && (
                  <div className="bg-stradeo-bg2 border border-white/[0.06] rounded-2xl p-5 mb-3.5">
                    <div className="text-xs font-bold text-stradeo-blue uppercase tracking-[1px] mb-3">Explained</div>
                    {theory.details.split('\n\n').filter(p => p.trim()).map((para, i) => (
                      <p key={i} className={`text-sm leading-[1.7] text-gray-400 ${i > 0 ? 'mt-3' : ''}`}>{para}</p>
                    ))}
                  </div>
                )}

                {/* Traps */}
                {theory.traps && (
                  <div className="bg-red-500/[0.04] border border-red-500/10 rounded-2xl p-5 mb-3.5">
                    <div className="text-xs font-bold text-stradeo-accent2 uppercase tracking-[1px] mb-3">⚠ Exam Traps</div>
                    {theory.traps.split('\n').filter(l => l.trim()).map((line, i) => (
                      <div key={i} className="flex gap-2.5 mb-2 items-start">
                        <span className="text-stradeo-accent2 text-[13px]">⚠</span>
                        <p className="m-0 text-sm leading-relaxed text-[#d4956a]">{line.replace(/^[⚠·\-]\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Remember */}
                {theory.remember && (
                  <div className="bg-orange-500/[0.06] border border-orange-500/[0.12] rounded-2xl p-[18px] mb-3.5 text-center">
                    <div className="text-xs font-bold text-stradeo-accent uppercase tracking-[1px] mb-2">💡 Remember</div>
                    <p className="m-0 text-[15px] font-semibold leading-relaxed text-stradeo-accent">{theory.remember}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2.5 mt-2">
                  <button onClick={() => fetchTheory(true)}
                    className="flex-1 py-3.5 rounded-xl border border-white/[0.06] text-gray-400 text-sm font-semibold">🔄 Regenerate</button>
                  <button onClick={() => setMode('quiz')}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 text-white text-sm font-semibold">📝 Start Quiz →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUIZ TAB */}
        {mode === 'quiz' && (
          <div>
            <div className="bg-stradeo-bg2 border border-white/[0.06] rounded-2xl p-5 text-center">
              <div className="text-4xl mb-2">{isPri ? '🎯' : '📝'}</div>
              <h3 className="text-[17px] font-bold mb-1.5">{count} {t(lang, 'questions')}</h3>
              <p className="text-[13px] text-gray-500">{isPri ? 'Primary topic · 2 questions per exam' : 'Integrative · 1 question per exam'}</p>
              {accuracy !== null && (
                <p className={`text-sm font-semibold mt-2 ${accuracy >= 80 ? 'text-stradeo-green' : accuracy >= 50 ? 'text-stradeo-accent' : 'text-stradeo-accent2'}`}>
                  Current accuracy: {accuracy}%
                </p>
              )}
              <Link href={`/quiz?topic=${tid}`}
                className="block w-full py-4 rounded-[14px] bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 text-white text-base font-bold mt-4">
                Start Quiz →
              </Link>
            </div>

            {!theory && (
              <button onClick={() => setMode('study')}
                className="w-full py-3.5 rounded-xl border border-dashed border-green-500/20 text-stradeo-green text-[13px] font-semibold mt-3">
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
