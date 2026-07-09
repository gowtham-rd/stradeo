# Stradeo — Patente B Quiz App

Multilingual Italian driving license quiz app with 7,139 official Ministry questions.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Upload `public/images/signs/` to Supabase Storage (optional — for CDN)
4. Create your first user in Authentication → Users → Add User

### 3. Configure environment
```bash
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, and Claude API key
```

### 4. Run development server
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
npx vercel
```
Add environment variables in Vercel dashboard → Settings → Environment Variables.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # Server-side API routes (Claude proxy)
│   │   ├── explain/        # Wrong answer explanations
│   │   ├── translate/      # On-demand question translation
│   │   └── theory/         # AI theory lesson generation
│   ├── login/              # Login page
│   ├── topic/              # Topic study + quiz view
│   ├── quiz/               # Quiz mode
│   ├── exam/               # Exam simulation
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home dashboard
│   └── globals.css         # Tailwind base styles
├── components/             # Reusable UI components
│   ├── SplashScreen.tsx
│   ├── LoginForm.tsx
│   ├── NavBar.tsx
│   ├── TopicCard.tsx
│   ├── QuestionCard.tsx
│   ├── TranslateButton.tsx
│   ├── ReadinessScore.tsx
│   ├── StatsPanel.tsx
│   └── AdBanner.tsx
├── contexts/               # React Context providers
│   ├── AuthContext.tsx      # Supabase Auth
│   ├── LanguageContext.tsx  # i18n language selection
│   └── ProgressContext.tsx  # User progress + spaced repetition
├── hooks/                  # Custom React hooks (future)
├── lib/                    # Utilities
│   ├── supabase.ts         # Supabase client
│   ├── questions.ts        # Question loading + filtering
│   ├── topics.ts           # 25 topic metadata
│   ├── i18n.ts             # 4-language translations
│   └── constants.ts        # App constants
├── types/
│   └── index.ts            # TypeScript interfaces
public/
├── data/questions.json     # 7,139 questions (1 MB)
├── images/signs/           # 413 road sign PNGs
└── logo/                   # App logos (3 sizes)
supabase/
└── schema.sql              # Database schema + RLS policies
```

## Security

- No credentials in client code — uses Supabase Auth
- Claude API key is server-side only (Next.js API routes)
- Row-Level Security on all database tables
- Input validation on all API endpoints

## Tech Stack

- **Next.js 14** — App Router, server components, API routes
- **TypeScript** — Full type safety
- **Tailwind CSS** — Utility-first styling
- **Supabase** — Auth, Postgres database, file storage
- **Claude API** — AI explanations, translations, theory lessons
- **Capacitor** — Android APK (future)

## Data Source

Questions from [Ed0ardo/QuizPatenteB](https://github.com/Ed0ardo/QuizPatenteB) (MIT licensed).
7,139 official Italian Ministry of Transport questions + 413 road sign images.

## License

MIT
