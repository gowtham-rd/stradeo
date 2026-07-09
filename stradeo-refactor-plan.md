# Stradeo — Production Refactor Plan

## Current State Audit

| Metric | Current | Target |
|---|---|---|
| Architecture | Single 3.3 MB monolithic JSX | Multi-file component tree |
| Components | 1 (App with everything inline) | 15–20 focused components |
| useState hooks | 42 in one component | Distributed across components |
| Inline style objects | 224 | 0 (CSS modules or Tailwind) |
| Memoization | 4 useCallback | useMemo, React.memo where needed |
| Question data | 1 MB embedded in JSX | External JSON, lazy loaded |
| Image data | 3 MB base64 in JSX | CDN/Supabase Storage URLs |
| Auth | Hardcoded credentials in source | Supabase Auth (server-side) |
| API calls | 5 direct Claude API calls | Backend proxy (Next.js API routes) |
| Bundle size | 3.3 MB single file | < 200 KB initial, lazy chunks |
| State management | 42 useState in root | useReducer + Context |
| Error handling | try/catch around storage only | Global error boundaries |
| Testing | None | Unit + integration tests |
| TypeScript | No | Yes |

---

## Priority 1: Security

### 1.1 Remove hardcoded credentials
**Current:** `DEFAULT_USERS` array with plaintext passwords in client bundle.
**Fix:** Move to Supabase Auth. Admin creates users via Supabase dashboard. Passwords are never in client code.

```
// BEFORE (insecure)
const DEFAULT_USERS = [
  { username: "admin", password: "stradeo2026", role: "admin" },
  { username: "demo", password: "demo123", role: "user" },
];

// AFTER
// No credentials in client. Supabase handles auth.
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
})
```

### 1.2 Proxy Claude API calls
**Current:** 5 direct `fetch("https://api.anthropic.com/v1/messages")` calls from client. API key is handled by the artifact runtime, but in production the key would be exposed.
**Fix:** Next.js API route as proxy. Key stays server-side only.

```
// /app/api/explain/route.ts
export async function POST(req: Request) {
  const { question, answer, language } = await req.json()
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CLAUDE_API_KEY,       // server only
      "anthropic-version": "2023-06-01",
    },
    // ...
  })
  return Response.json(await res.json())
}
```

### 1.3 Input validation
**Current:** No validation on login inputs, no rate limiting.
**Fix:** Validate inputs, add rate limiting via Supabase or middleware.

---

## Priority 2: Correctness

### 2.1 Spaced repetition algorithm
**Current:** Custom SM-2 variant with potential edge cases (division by zero if interval is 0, no cap on review queue).
**Fix:** Use a well-tested library like `ts-fsrs` or implement SM-2 with full specification compliance. Add unit tests.

### 2.2 Exam scoring
**Current:** Exam timer continues even when tab is backgrounded (setTimeout drift).
**Fix:** Use `Date.now()` timestamps instead of interval-based countdown.

```typescript
// BEFORE
setEt(t => t <= 1 ? 0 : t - 1)  // drifts when tab is hidden

// AFTER
const examEndTime = useRef(Date.now() + 20 * 60 * 1000)
const remaining = Math.max(0, Math.floor((examEndTime.current - Date.now()) / 1000))
```

### 2.3 Streak calculation
**Current:** Streak logic uses `new Date().toISOString().split('T')[0]` which is UTC-based — a user in Italy (UTC+1/+2) studying at 11 PM would get the wrong date.
**Fix:** Use local date: `new Date().toLocaleDateString('sv')` (returns YYYY-MM-DD in local timezone).

---

## Priority 3: Performance

### 3.1 Extract question data from bundle
**Current:** 7,139 questions (1 MB) and 413 images (3 MB as base64) are embedded in the JSX file.
**Fix:**

| Data | Current | Target | Savings |
|---|---|---|---|
| Questions | Inline JSON in JSX | `/public/data/questions.json`, fetched on demand | ~1 MB off initial bundle |
| Images | Base64 in JSX | Supabase Storage or Cloudflare R2, loaded per-question | ~3 MB off initial bundle |
| Logo | 3 base64 strings | `/public/logo-*.png` files | ~90 KB off bundle |

### 3.2 Lazy load by route
**Current:** Everything renders in one component — exam, quiz, study, stats all loaded at once.
**Fix:** React.lazy + Suspense for each view.

```typescript
const ExamView = React.lazy(() => import('./views/ExamView'))
const QuizView = React.lazy(() => import('./views/QuizView'))
const StudyView = React.lazy(() => import('./views/StudyView'))
```

### 3.3 Virtualize topic list
**Current:** All 25 topics render on every home screen visit, each with progress calculations.
**Fix:** Use `useMemo` for progress calculations. If topic list grows, add virtualization.

### 3.4 Memoize expensive renders
**Current:** Stats panel recalculates 7-day chart data on every render.
**Fix:** `useMemo` with dependency on `dailyLog`.

---

## Priority 4: Maintainability

### 4.1 Component decomposition

Split the monolithic `App` into focused components:

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home / dashboard
│   ├── login/page.tsx          # Login screen
│   ├── topic/[id]/page.tsx     # Topic view (Study + Quiz tabs)
│   ├── quiz/page.tsx           # Topic quiz
│   ├── exam/page.tsx           # Exam simulation
│   ├── exam/review/page.tsx    # Exam review
│   └── api/
│       ├── explain/route.ts    # Claude explanation proxy
│       ├── translate/route.ts  # Claude translation proxy
│       └── theory/route.ts     # Claude theory generation proxy
├── components/
│   ├── SplashScreen.tsx
│   ├── LoginForm.tsx
│   ├── NavBar.tsx
│   ├── TopicCard.tsx
│   ├── QuestionCard.tsx
│   ├── TranslateButton.tsx
│   ├── ExplanationPanel.tsx
│   ├── ReadinessScore.tsx
│   ├── StatsPanel.tsx
│   ├── StreakBadge.tsx
│   ├── ExamTimer.tsx
│   ├── ProgressBar.tsx
│   ├── TheoryLesson.tsx
│   ├── LanguageSelector.tsx
│   └── AdBanner.tsx
├── hooks/
│   ├── useAuth.ts              # Authentication logic
│   ├── useQuiz.ts              # Quiz state machine
│   ├── useExam.ts              # Exam state machine
│   ├── useProgress.ts          # Progress tracking + persistence
│   ├── useStreak.ts            # Streak calculation
│   ├── useSpacedRepetition.ts  # SM-2 algorithm
│   ├── useTranslation.ts       # On-demand translation
│   └── useTheory.ts            # Theory generation + cache
├── contexts/
│   ├── AuthContext.tsx          # User session
│   ├── LanguageContext.tsx      # i18n language selection
│   └── ProgressContext.tsx      # Global progress state
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── questions.ts            # Question loading + filtering
│   ├── images.ts               # Image URL resolution
│   ├── i18n.ts                 # Translation strings
│   ├── topics.ts               # Topic metadata (25 topics, names)
│   └── constants.ts            # Colors, config values
├── types/
│   └── index.ts                # TypeScript interfaces
└── public/
    ├── data/
    │   └── questions.json      # 7,139 questions
    ├── images/
    │   └── signs/              # 413 road sign PNGs
    └── logo/
        ├── splash.png
        ├── login.png
        └── nav.png
```

### 4.2 State management with useReducer

**Current:** 42 individual `useState` calls in root component.
**Fix:** Group related state into reducers.

```typescript
// Quiz state reducer
type QuizState = {
  questions: Question[]
  currentIndex: number
  answer: boolean | null
  score: { correct: number; wrong: number }
  history: AnswerHistory[]
  isReview: boolean
}

type QuizAction =
  | { type: 'START'; questions: Question[]; isReview: boolean }
  | { type: 'ANSWER'; value: boolean }
  | { type: 'NEXT' }
  | { type: 'RESET' }

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return { ...initialQuizState, questions: action.questions, isReview: action.isReview }
    case 'ANSWER':
      // scoring logic here
    case 'NEXT':
      return { ...state, currentIndex: state.currentIndex + 1, answer: null }
    // ...
  }
}
```

### 4.3 TypeScript interfaces

```typescript
interface Question {
  t: number           // topic ID (1-25)
  q: string           // question text (Italian)
  a: boolean          // correct answer (true/false)
  i?: string          // image path (optional)
}

interface TopicMeta {
  id: number
  it: string          // Italian name
  en: string          // English name
  ta: string          // Tamil name
  hi: string          // Hindi name
  isPrimary: boolean  // topics 1-15 are primary
}

interface UserProgress {
  stats: Record<number, { correct: number; total: number }>
  totalDone: number
  wrongQuestions: Question[]
  srData: Record<string, SpacedRepetitionData>
  streak: number
  lastStudy: string | null
  dailyLog: Record<string, DayStats>
}
```

---

## Priority 5: Readability

### 5.1 Replace inline styles with CSS
**Current:** 224 inline style objects like `style={{padding:"14px 16px",borderRadius:14,...}}`
**Fix:** Tailwind CSS utility classes (already available in the target stack).

```tsx
// BEFORE
<button style={{padding:"14px 16px",borderRadius:14,background:"rgba(255,255,255,0.03)",
  border:"1px solid rgba(255,255,255,0.06)",cursor:"pointer"}}>

// AFTER
<button className="px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer">
```

### 5.2 Extract color constants
**Current:** Colors defined as an object `c` inside the component.
**Fix:** Tailwind `theme.extend.colors` in `tailwind.config.ts`.

```typescript
// tailwind.config.ts
colors: {
  stradeo: {
    bg: '#0a0e1a',
    bg2: '#111827',
    accent: '#f97316',
    accent2: '#ef4444',
    green: '#22c55e',
    blue: '#818cf8',
  }
}
```

### 5.3 Extract i18n strings
**Current:** 4 language objects (EN, IT, Tamil, Hindi) with ~40 keys each, inline in JSX.
**Fix:** Separate `i18n.ts` file with typed access.

```typescript
// lib/i18n.ts
export const translations = {
  en: { login: "Log in", username: "Username", ... },
  it: { login: "Accedi", username: "Nome utente", ... },
  ta: { ... },
  hi: { ... },
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations['en']
```

---

## Priority 6: Developer Experience

### 6.1 Tech stack (confirmed from earlier sessions)
- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (free tier)
- **Auth:** Supabase Auth
- **Hosting:** Vercel
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Mobile:** Capacitor (for Android APK)

### 6.2 Environment variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
CLAUDE_API_KEY=sk-ant-...          # server-only
```

### 6.3 Testing strategy
- **Unit tests:** Vitest for pure functions (SM-2 algorithm, streak calc, scoring)
- **Component tests:** React Testing Library for key flows (login, answer question, submit exam)
- **E2E tests:** Playwright for critical paths (login → quiz → answer → see explanation)

### 6.4 Database schema (Supabase)

```sql
-- Users managed by Supabase Auth (no custom user table needed for MVP)

-- User progress (one row per user)
CREATE TABLE progress (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  stats JSONB DEFAULT '{}',
  total_done INTEGER DEFAULT 0,
  wrong_questions JSONB DEFAULT '[]',
  sr_data JSONB DEFAULT '{}',
  streak INTEGER DEFAULT 0,
  last_study DATE,
  daily_log JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Theory cache (avoid re-generating lessons)
CREATE TABLE theory_cache (
  topic_id INTEGER NOT NULL,
  language VARCHAR(2) NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (topic_id, language)
);

-- Row-Level Security
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own progress"
  ON progress FOR ALL
  USING (auth.uid() = user_id);
```

---

## Migration Path (Incremental)

### Phase 1: Foundation (Week 1–2)
1. Initialize Next.js project with TypeScript + Tailwind
2. Set up Supabase project (auth, database, storage)
3. Upload 413 sign images to Supabase Storage
4. Create `/public/data/questions.json` from the GitHub repo
5. Implement auth flow (Supabase Auth, no hardcoded creds)
6. Create API proxy routes for Claude

### Phase 2: Core Features (Week 3–4)
7. Build component tree (NavBar, QuestionCard, etc.)
8. Implement quiz flow with `useReducer`
9. Implement exam simulation
10. Connect progress tracking to Supabase
11. Add spaced repetition (SM-2)

### Phase 3: AI Features (Week 5–6)
12. Explanation on wrong answer (via API proxy)
13. On-demand translation button
14. Theory lesson generation + caching
15. Stats panel with streak tracking

### Phase 4: Polish & Launch (Week 7–8)
16. Splash screen + PWA manifest
17. AdMob integration (Capacitor plugin)
18. Capacitor build for Android APK
19. Performance audit (Lighthouse)
20. Deploy to Vercel + custom domain

---

## Key Architectural Decisions

**Why Next.js over plain React?**
Server-side API routes keep the Claude API key secure. SSR/SSG options improve SEO if we add a landing page later. File-based routing simplifies navigation.

**Why Supabase over Firebase?**
Free tier includes auth, Postgres database, and file storage — all we need. Row-Level Security means we don't need a custom backend for access control. The JS client works with Capacitor for mobile.

**Why Tailwind over CSS Modules?**
The current app has 224 inline style objects. Tailwind's utility classes are the closest 1:1 migration path from inline styles, with zero runtime cost and better consistency.

**Why useReducer over Redux/Zustand?**
The state is not deeply shared across unrelated components. A few focused reducers (quiz, exam, progress) with React Context is sufficient and adds no dependencies.

**Why keep questions as static JSON?**
The 7,139 questions rarely change (Ministry updates ~yearly). Static JSON avoids database queries for read-heavy data. When 2026 ADAS questions are added, just update the JSON file and redeploy.
