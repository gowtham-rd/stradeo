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
}

export default function TopicCard({ topic, count, accuracy, done }: Props) {
  const { lang } = useLanguage()
  const isPri = isPrimaryTopic(topic.id)

  return (
    <Link href={`/topic?id=${topic.id}`}
      className="flex items-center gap-3.5 w-full px-4 py-3.5 mb-1.5 rounded-[14px] bg-white/[0.03] border border-white/[0.06] text-left">
      <div className={`min-w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-sm font-bold ${isPri ? 'bg-orange-500/[0.08] text-stradeo-accent' : 'bg-indigo-500/[0.08] text-stradeo-blue'}`}>
        {String(topic.id).padStart(2, '0')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold mb-px">{getTopicName(topic.id, lang)}</div>
        <div className="text-[11px] text-gray-400">{topic.it} · {count} {t(lang, 'questions')}</div>
        {accuracy !== null && (
          <div className="h-[3px] rounded bg-white/[0.06] mt-1.5 max-w-[120px]">
            <div className={`h-full rounded transition-all duration-400 ${accuracy >= 80 ? 'bg-stradeo-green' : accuracy >= 50 ? 'bg-stradeo-accent' : 'bg-stradeo-accent2'}`}
              style={{ width: `${accuracy}%` }} />
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        {accuracy !== null && (
          <span className={`text-[13px] font-bold ${accuracy >= 80 ? 'text-stradeo-green' : accuracy >= 50 ? 'text-stradeo-accent' : 'text-stradeo-accent2'}`}>
            {accuracy}%
          </span>
        )}
        <span className="text-[11px] text-gray-400">{done}/{count}</span>
      </div>
    </Link>
  )
}
