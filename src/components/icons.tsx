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

/** This week: square calendar. */
export const IconCalendar = (p: P) => (
  <Svg {...p}>
    <path fillRule="evenodd" d="M2.5 4h19v17.5h-19zM5 9.5v9.5h14V9.5z" />
    <path d="M6.5 1.5H9v5H6.5zM15 1.5h2.5v5H15zM7 11.5h2.5V14H7zM10.75 11.5h2.5V14h-2.5zM14.5 11.5H17V14h-2.5zM7 15.25h2.5v2.5H7zM10.75 15.25h2.5v2.5h-2.5z" />
  </Svg>
)

/** Accuracy: square crosshair. */
export const IconAccuracy = (p: P) => (
  <Svg {...p}>
    <path d="M10.75 1.5h2.5v6.5h-2.5zM10.75 16h2.5v6.5h-2.5zM1.5 10.75h6.5v2.5H1.5zM16 10.75h6.5v2.5H16z" />
    <path fillRule="evenodd" d="M4.5 4.5h15v15h-15zM7 7v10h10V7z" />
    <path d="M10.5 10.5h3v3h-3z" />
  </Svg>
)

/** Remaining questions: stack of cards. */
export const IconStack = (p: P) => (
  <Svg {...p}>
    <path d="M2 8.5h13.5V22H2z" />
    <path d="M5 5.5h13.5v13.5H16.5V7.5H5z" />
    <path d="M8 2.5h13.5V16h-2V4.5H8z" />
  </Svg>
)

/** Info: square-cut "i". */
export const IconInfo = (p: P) => (
  <Svg {...p}>
    <path fillRule="evenodd" d="M2 2h20v20H2zM4.5 4.5v15h15v-15z" />
    <path d="M10.75 6.5h2.5V9h-2.5zM10.75 10.5h2.5v7h-2.5z" />
  </Svg>
)

/** Settings: square-toothed gear. */
export const IconSettings = (p: P) => (
  <Svg {...p}>
    <path fillRule="evenodd" d="M19.02 14.91L14.91 19.02H9.09L4.98 14.91V9.09L9.09 4.98H14.91L19.02 9.09ZM9.4 9.4h5.2v5.2H9.4z" />
    <path d="M10 1.25h4v4h-4zM10 18.75h4v4h-4zM1.25 10h4v4h-4zM18.75 10h4v4h-4z" />
    <path transform="rotate(45 12 12)" d="M10 1.25h4v4h-4zM10 18.75h4v4h-4zM1.25 10h4v4h-4zM18.75 10h4v4h-4z" />
  </Svg>
)

/** Home: square-cut house, the door a lane marking like the app mark. */
export const IconHome = (p: P) => (
  <Svg {...p}>
    <path fillRule="evenodd" d="M12 1.5L23 10.75h-3.25V22.5H4.25V10.75H1zM10.5 14v8.5h3V14z" />
  </Svg>
)

/** Exam history: square clock face with a sweep hand. */
export const IconHistory = (p: P) => (
  <Svg {...p}>
    <path fillRule="evenodd" d="M2.5 2.5h19v19h-19zM5 5v14h14V5z" />
    <path d="M10.75 6.5h2.5v5.25h4.25v2.5h-6.75z" />
  </Svg>
)

/** Previous / next page: square-cut chevrons. */
export const IconChevronLeft = (p: P) => (
  <Svg {...p}>
    <path d="M17 3v4.5L12 12l5 4.5V21L7 12z" />
  </Svg>
)
export const IconChevronRight = (p: P) => (
  <Svg {...p}>
    <path d="M7 3v4.5l5 4.5-5 4.5V21l10-9z" />
  </Svg>
)

/** Topics: grid of square tiles. */
export const IconTopics = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 2.5h8.25v8.25H2.5zM13.25 2.5h8.25v8.25h-8.25zM2.5 13.25h8.25v8.25H2.5z" />
    <path fillRule="evenodd" d="M13.25 13.25h8.25v8.25h-8.25zM15.5 15.5v3.75h3.75V15.5z" />
  </Svg>
)

/** Timer: square stopwatch with crown and a hand. */
export const IconTimer = (p: P) => (
  <Svg {...p}>
    <path d="M9 1h6v2.5H9z" />
    <path fillRule="evenodd" d="M3 5h18v17H3zM5.5 7.5v12h13v-12z" />
    <path d="M10.75 9.5h2.5v5.25h-2.5z" />
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

// Share (iOS style): box open at the top with an arrow leaving it.
export const IconShare = (p: P) => (
  <Svg {...p}>
    <path d="M11 3.5 7.5 7l1.4 1.4L11 6.3V15h2V6.3l2.1 2.1L16.5 7 13 3.5 12 2.5z" />
    <path d="M5 10h4v2H7v8h10v-8h-2v-2h4v12H5z" />
  </Svg>
)
// Add to Home Screen: square with a plus.
export const IconAddSquare = (p: P) => (
  <Svg {...p}>
    <path d="M3 3h18v18H3zm2 2v14h14V5z" />
    <path d="M11 7h2v4h4v2h-4v4h-2v-4H7v-2h4z" />
  </Svg>
)
// Menu: three bars (Safari's menu button on newer iPhones).
export const IconMenu = (p: P) => (
  <Svg {...p}>
    <path d="M3 5h18v2.5H3zM3 10.75h18v2.5H3zM3 16.5h18V19H3z" />
  </Svg>
)
// Vertical "more" menu (three squares, matching the cut-corner style).
export const IconMore = (p: P) => (
  <Svg {...p}>
    <path d="M10.5 3.5h3v3h-3zM10.5 10.5h3v3h-3zM10.5 17.5h3v3h-3z" />
  </Svg>
)
// Phone outline.
export const IconPhone = (p: P) => (
  <Svg {...p}>
    <path d="M6 2h12v20H6zm2 2v16h8V4z" />
    <path d="M10.5 17h3v1.5h-3z" />
  </Svg>
)
// Download: square-cut arrow into a tray.
export const IconDownload = (p: P) => (
  <Svg {...p}>
    <path d="M10.75 2.5h2.5v9.2l3.1-3.1 1.8 1.8L12 16.6 5.85 10.4l1.8-1.8 3.1 3.1z" />
    <path d="M3 14.5h2.5v4.5h13v-4.5H21v7H3z" />
  </Svg>
)
// Wi-Fi: square dot + two square-cut bands (online).
export const IconOnline = (p: P) => (
  <Svg {...p}>
    <path d="M10.25 17.5h3.5V21h-3.5z" />
    <path d="M7.4 14.4A6.5 6.5 0 0 1 16.6 14.4M3.85 10.85A11.5 11.5 0 0 1 20.15 10.85" fill="none" stroke="currentColor" strokeWidth="2.75" />
  </Svg>
)
// Offline: the same Wi-Fi mark, faded, with a slash through it.
export const IconOffline = (p: P) => (
  <Svg {...p}>
    <path d="M10.25 17.5h3.5V21h-3.5z" />
    <path d="M7.4 14.4A6.5 6.5 0 0 1 16.6 14.4M3.85 10.85A11.5 11.5 0 0 1 20.15 10.85" fill="none" stroke="currentColor" strokeWidth="2.75" opacity="0.4" />
    <path d="M3.5 2l18.5 18.5-1.9 1.9L1.6 3.9z" />
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
  settings: IconSettings,
  calendar: IconCalendar,
  stack: IconStack,
  info: IconInfo,
  accuracy: IconAccuracy,
  check: IconCheck,
  cross: IconCross,
  arrowRight: IconArrowRight,
  arrowLeft: IconArrowLeft,
  chevronDown: IconChevronDown,
  chevronLeft: IconChevronLeft,
  chevronRight: IconChevronRight,
  home: IconHome,
  topics: IconTopics,
  timer: IconTimer,
  history: IconHistory,
} as const

export type IconName = keyof typeof ICONS

export default function Icon({ name, ...p }: P & { name: IconName }) {
  const C = ICONS[name]
  return <C {...p} />
}

// ── Time of day (Home greeting) ──
const rays = (cx: number, cy: number, r: number, angles: number[]) => angles.map(a => {
  return <rect key={a} x={cx - 1} y={cy - r - 3.2} width={2} height={3.2} transform={`rotate(${a} ${cx} ${cy})`} />
})
export const IconSun = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="4.2" />{rays(12, 12, 6.2, [0, 45, 90, 135, 180, 225, 270, 315])}</Svg>
)
export const IconSunrise = (p: P) => (
  <Svg {...p}><path d="M6.5 15a5.5 5.5 0 0 1 11 0z" />{rays(12, 15, 7.4, [-90, -45, 0, 45, 90])}<rect x="2" y="17" width="20" height="2" /></Svg>
)
// Drawn centred on the 24px grid, so the glyph sits in the middle of its box.
export const IconSunset = (p: P) => (
  <Svg {...p}><path d="M6.5 11.5a5.5 5.5 0 0 1 11 0z" /><rect x="2" y="13" width="20" height="2" /><rect x="5" y="16.5" width="14" height="2" /></Svg>
)
export const IconMoon = (p: P) => (
  <Svg {...p}><path d="M14.5 3a8.5 8.5 0 1 0 6.5 13.9A7 7 0 0 1 14.5 3z" /></Svg>
)
