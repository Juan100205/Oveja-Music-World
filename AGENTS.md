# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (default port 3000)
npm run dev -- -p 3001  # Start on alternate port
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run Jest tests
npm run test:watch   # Watch mode
npm run test:coverage
```

If the dev server fails to start due to a Turbopack lock or panic, delete `.next/` and restart.

## Architecture

**Oveja Music World** is an interactive music school built on Next.js 16 App Router. The core experience is a 3D Spline world at `/escuela` where users hover over zones (school / gym) to trigger panels and navigate to classrooms.

### Spline ↔ React bridge

`src/components/spline/SplineScene.tsx` wraps `@splinetool/react-spline` (v4, client-only via `dynamic`). On load it polls `splineApp.getVariables()` every 100ms and fires `onVariableChange(name, value)` whenever a boolean changes. **Always use `flushSync`** when setting state from this callback to prevent batching delays.

Spline scenes in use:
- Map: `https://prod.spline.design/WpjnQukgytAKxnYq/scene.splinecode` — booleans: `IsOverGym`, `IsOverSchool`
- Classroom: `https://prod.spline.design/646pGt79P6qgQp6p/scene.splinecode` — booleans: `isInClass`, `isOutingClass`
- Gym: `https://prod.spline.design/gYLTlZu92yz616yC/scene.splinecode` — booleans: `isTrainning`, `isOutingGym`

### Navigation flow

```
/                 → login / landing
/escuela          → 3D map (SplineScene)
                    IsOverSchool → class instrument picker → module picker
                    IsOverGym    → gym instrument picker
/escuela/clase/[instrumento]/[modulo]   → classroom (SplineScene)
/escuela/gym/[instrumento]              → gym sala (SplineScene)
```

### Data layer (`src/data/`)

All course content is static — no DB reads at runtime for content.

- `cursos.ts` — `CURSOS: Curso[]` — all instruments, modules, sections, and resource links. Types: `Curso → Modulo → Seccion → Recurso`. `TipoRecurso` values: `'video' | 'drive' | 'juego' | 'pdf' | 'imagen' | 'herramienta' | 'otro'`
- `clases.ts` — `CLASES_CONFIG: ClaseConfig[]` — 6 school instruments mapped to their `cursoId`
- `gym.ts` — `GYM_INSTRUMENTOS: GymInstrumento[]` — uses `getModulos(cursoId, moduloIds?)` to pull practice-specific modules from `CURSOS`

### Auth & backend (`src/lib/`, `src/app/api/`)

Custom JWT auth over Supabase (not Supabase Auth). Flow:
1. `POST /api/auth/login` — validates credentials, queries `users` table via `getSupabaseAdmin()`, returns JWT + user
2. `useAuth` hook stores token + user in `localStorage`
3. Protected API routes verify `Bearer` token with `verifyToken()` from `src/lib/auth.ts`

Supabase clients: `getSupabase()` (browser/public) and `getSupabaseAdmin()` (server/service role). Always use admin client in API routes, never expose it to the browser.

Required env vars:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
```

### Gamification (`src/lib/gamification.ts`, `src/types/index.ts`)

5-level system: Principiante (0pts) → Aprendiz (100) → Intermedio (300) → Avanzado (600) → Maestro (1000). Each video watched awards 20 pts (`PUNTOS_POR_VIDEO`). Level config lives in `LEVEL_CONFIG` in `src/types/index.ts`.

### Design system

Dark theme (`#0a0a1a`) for all classroom/map pages, light (`#f7f9ff`) for auth pages.

CSS variables (defined in `globals.css`):
- `--om-pink: #ec488a`, `--om-blue: #3db8fa`, `--om-purple: #9b54f9`, `--om-orange: #ffa737`
- `--font-display: 'Comfortaa'` (headings, buttons), `--font-body: 'Roboto'` (body text)

Tailwind v4 is configured — CSS variables are exposed as `text-om-pink`, `bg-om-blue`, etc. via `@theme inline` in `globals.css`. Panels use glassmorphism: `background: rgba(12,12,28,0.98)` + `backdropFilter: blur(24px)`.

### YouTube embedding

`src/lib/youtube.ts` exports `extractYoutubeId`, `getYoutubeEmbedUrl`, `isYoutubeUrl`. Classroom pages use a local `getYouTubeId()` regex inline — shows `hqdefault.jpg` thumbnail, click opens iframe overlay with autoplay.
