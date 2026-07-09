'use client'
import { getImageUrl } from '@/lib/questions'
import type { Question } from '@/types'

interface Props {
  question: Question
  children?: React.ReactNode
  animation?: '' | 'ok' | 'no'
}

export default function QuestionCard({ question, children, animation }: Props) {
  const imgUrl = getImageUrl(question.i)

  return (
    <div className={`bg-stradeo-bg2 border border-stradeo-line rounded-[18px] p-6 mb-4 ${
      animation === 'ok' ? 'animate-pulse-green' : animation === 'no' ? 'animate-shake' : ''
    }`}>
      {children}
      {imgUrl && (
        <img src={imgUrl} alt="" className="max-w-[200px] max-h-[170px] rounded-xl mx-auto my-3.5 border border-stradeo-line" />
      )}
      <p className={`text-[17px] leading-relaxed font-medium ${imgUrl ? 'mt-3.5' : ''}`}>
        {question.q}
      </p>
    </div>
  )
}
