'use client'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTopicName, isPrimaryTopic } from '@/lib/topics'
import { t } from '@/lib/i18n'
import type { TopicMeta } from '@/types'

interface Props {
  topic: TopicMeta
  count: number
  accuracy: number | null
  done: number
  /** Tighter version for use inside other cards. */
  compact?: boolean
}

export default function TopicCard({ topic, count, accuracy, done, compact }: Props) {
  const { lang } = useLanguage()
  const isPri = isPrimaryTopic(topic.id)

  return (
    <Link href={`/topic?id=${topic.id}`}
      className={`flex items-center w-full rounded-[14px] bg-stradeo-bg2 border border-stradeo-line text-left hover:border-stradeo-ink transition-colors ${compact ? 'gap-3 px-3 py-2.5 rounded-[10px]' : 'gap-3.5 px-4 py-3.5 mb-1.5'}`}>
      <div className={`${compact ? 'min-w-[32px] h-[32px] rounded-[8px]' : 'min-w-[38px] h-[38px] rounded-[10px]'} flex items-center justify-center font-mono text-sm ${isPri ? 'bg-stradeo-surface2 text-stradeo-ink' : 'bg-stradeo-surface2 text-stradeo-inkfaint'}`}>
        {String(topic.id).padStart(2, '0')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold mb-px">{getTopicName(topic.id, lang)}</div>
        <div className="text-[11px] text-stradeo-inkdim">{topic.it} · {count} {t(lang, 'questions')}</div>
        {accuracy !== null && (
          <div className="h-[3px] rounded bg-stradeo-surface2 mt-1.5 max-w-[120px]">
            <div className={`h-full rounded transition-all duration-400 ${accuracy >= 90 ? 'bg-stradeo-green' : accuracy >= 50 ? 'bg-stradeo-accent' : 'bg-stradeo-accent2'}`}
              style={{ width: `${accuracy}%` }} />
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        {accuracy !== null && (
          <span className={`font-mono text-[13px] ${accuracy >= 90 ? 'text-stradeo-green' : accuracy >= 50 ? 'text-stradeo-accent' : 'text-stradeo-accent2'}`}>
            {accuracy}%
          </span>
        )}
        <span className="font-mono text-[11px] text-stradeo-inkdim">{Math.min(done, count)}/{count}</span>
      </div>
    </Link>
  )
}
