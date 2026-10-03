'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import { TEXT_SCALES, DEFAULT_TEXT_STEP, readTextStep, applyTextStep } from '@/lib/textSize'

// 5-step text size slider: square thumb, solid track, ticks at each step.
export default function TextSizeSlider() {
  const { lang } = useLanguage()
  const [step, setStep] = useState(DEFAULT_TEXT_STEP)
  useEffect(() => { setStep(readTextStep()) }, [])

  const change = (n: number) => { setStep(n); applyTextStep(n) }
  const max = TEXT_SCALES.length - 1

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-semibold text-stradeo-inkdim" aria-hidden="true">A</span>
        <div className="relative flex-1">
          <input type="range" min={0} max={max} step={1} value={step}
            onChange={e => change(Number(e.target.value))}
            aria-label={t(lang, 'textSize')} aria-valuetext={`${step + 1} / ${max + 1}`}
            style={{ '--fill': `${(step / max) * 100}%` } as React.CSSProperties}
            className="stradeo-range w-full" />
          <div className="pointer-events-none absolute inset-x-[8px] top-1/2 flex justify-between -translate-y-1/2" aria-hidden="true">
            {TEXT_SCALES.map((_, i) => <span key={i} className={`h-2 w-px ${i <= step ? 'bg-transparent' : 'bg-stradeo-inkfaint'}`} />)}
          </div>
        </div>
        <span className="text-[18px] font-semibold text-stradeo-inkdim" aria-hidden="true">A</span>
      </div>
      <div className="flex justify-between mt-1.5 text-[12px] text-stradeo-inkfaint">
        <span>{t(lang, 'textSize')}</span>
        <span className="font-mono">{step + 1}/{max + 1}{step === DEFAULT_TEXT_STEP ? ` · ${t(lang, 'default')}` : ''}</span>
      </div>
    </div>
  )
}
