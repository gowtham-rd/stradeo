// Stradeo icon set — drawn to match the app mark: solid fills, square-cut ends,
// no rounded joins, slanted "road" geometry. 24×24 grid, colour via currentColor.
// Use <Icon name="exam" /> or a named export like <IconExam />.
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number; title?: string }

function Svg({ size = 18, title, children, className = '', ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      {...rest}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  )
}

// ── Marks ───────────────────────────────────────────────────────────────────
/** Exam: square target — ring + bullseye. */
export const IconExam = (p: P) => (
  <Svg {...p}>
    <path fillRule="evenodd" d="M2.5 2.5h19v19h-19zM6 6v12h12V6z" />
    <path d="M9.25 9.25h5.5v5.5h-5.5z" />
  </Svg>
)

/** Smart review: square-cut loop of two arrows. */
export const IconReview = (p: P) => (
  <Svg {...p}>
    <path d="M3 11.5V5h13V2l5.5 4.75L16 11.5v-3H6.5v3z" />
    <path d="M21 12.5V19H8v3l-5.5-4.75L8 12.5v3h9.5v-3z" />
  </Svg>
)

/** Study: open book, pages in perspective like the road. */
export const IconStudy = (p: P) => (
  <Svg {...p}>
    <path d="M1.5 4.5l9.25 2.25V21L1.5 18.75z" />
    <path d="M22.5 4.5l-9.25 2.25V21l9.25-2.25z" />
  </Svg>
)

/** Quiz: square-cut pencil. */
export const IconQuiz = (p: P) => (
  <Svg {...p}>
    <path d="M15.75 2.5l5.75 5.75-1.75 1.75L14 4.25z" />
    <path d="M12.75 5.5l5.75 5.75L8.25 21.5 2.5 15.75z" />
    <path d="M1.75 17.25l5 5H1.75z" />
  </Svg>
)

/** Streak: faceted flame. */
export const IconStreak = (p: P) => (
  <Svg {...p}>
    <path fillRule="evenodd" d="M12 1l6.75 8.5 1 5.75L12 23l-7.75-7.75 1.25-6.5 3.25 3.25zM12 13.25l-3.25 4L12 20.5l3.25-3.25z" />
  </Svg>
)

/** Stats: three rising bars. */
export const IconStats = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 13.5h5v8h-5zM9.5 8.5h5v13h-5zM16.5 2.5h5v19h-5z" />
  </Svg>
)

/** Translate: two square speech blocks, the back one hollow. */
export const IconTranslate = (p: P) => (
  <Svg {...p}>
    <path fillRule="evenodd" d="M9 2h13v11h-3.5v3.5L15 13H9zM11.25 4.25v6.5h8.5v-6.5z" />
    <path d="M2 9h11.5v10H8l-3.5 3.5V19H2z" />
  </Svg>
)

/** Exam trap / warning: square-cut road-sign triangle. */
export const IconWarning = (p: P) => (
  <Svg {...p}>
    <path fillRule="evenodd" d="M12 1.5l11 20H1zM10.75 8.5v6.5h2.5V8.5zM10.75 16.5V19h2.5v-2.5z" />
  </Svg>
)

/** Tip / remember / explanation: faceted bulb. */
export const IconTip = (p: P) => (
  <Svg {...p}>
    <path d="M12 1.5l6.5 3.75v7L15.25 16h-6.5L5.5 12.25v-7z" />
    <path d="M8.75 17.5h6.5v2h-6.5zM10 20.5h4V23h-4z" />
  </Svg>
)

/** Passed: checkered finish flag. */
export const IconFinish = (p: P) => (
  <Svg {...p}>
    <path d="M3 1.5h2.5v21H3z" />
    <path fillRule="evenodd" d="M6.5 2.5h15V15h-15zM8 4v3.5h3.25V4zM14.5 4v3.5h3.25V4zM11.25 7.5V11h3.25V7.5zM17.75 7.5V11H20V7.5zM8 11v2.5h3.25V11zM14.5 11v2.5h3.25V11z" />
  </Svg>
)

/** In progress: road-works barrier. */
export const IconRoadworks = (p: P) => (
  <Svg {...p}>
    <path fillRule="evenodd" d="M1.5 4.5h21v9h-21zM3.25 11.75h2.5L8.5 6.25H6zM9.5 11.75H12l2.75-5.5h-2.5zM15.75 11.75h2.5L21 6.25h-2.5z" />
    <path d="M4.5 13.5h2.25v7H4.5zM17.25 13.5h2.25v7h-2.25zM2.5 20.5h6.25V22H2.5zM15.25 20.5h6.25V22h-6.25z" />
  </Svg>
)

// ── Glyphs ──────────────────────────────────────────────────────────────────
export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="M1.5 12.5L5 9l4.75 4.75L19 4.5l3.5 3.5L9.75 20.75z" />
  </Svg>
)

export const IconCross = (p: P) => (
  <Svg {...p}>
    <path d="M5 1.5l7 7 7-7L22.5 5l-7 7 7 7-3.5 3.5-7-7-7 7L1.5 19l7-7-7-7z" />
  </Svg>
)

export const IconArrowRight = (p: P) => (
  <Svg {...p}>
    <path d="M2 10h11.5V4.5L22 12l-8.5 7.5V14H2z" />
  </Svg>
)

export const IconArrowLeft = (p: P) => (
  <Svg {...p}>
    <path d="M22 10H10.5V4.5L2 12l8.5 7.5V14H22z" />
  </Svg>
)

export const IconChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="M3 7h4.5l4.5 5 4.5-5H21l-9 10z" />
  </Svg>
)

export const ICONS = {
  exam: IconExam,
  review: IconReview,
  study: IconStudy,
  quiz: IconQuiz,
  streak: IconStreak,
  stats: IconStats,
  translate: IconTranslate,
  warning: IconWarning,
  tip: IconTip,
  finish: IconFinish,
  roadworks: IconRoadworks,
  check: IconCheck,
  cross: IconCross,
  arrowRight: IconArrowRight,
  arrowLeft: IconArrowLeft,
  chevronDown: IconChevronDown,
} as const

export type IconName = keyof typeof ICONS

export default function Icon({ name, ...p }: P & { name: IconName }) {
  const C = ICONS[name]
  return <C {...p} />
}
