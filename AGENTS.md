# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Mobile Support**: The 3D world is enabled for all devices. There is no screen-width restriction; the component attempts to render Spline regardless of the device type.

**Navigation Triggers**: In `/escuela`, panels open automatically when a specific variable (e.g., `IsOverSchool`) becomes `true` via hover, and close when it becomes `false`. No intermediate confirmation buttons are used.

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
/escuela/clase/[instrumento]          → classroom (SplineScene, no module preselected)
/escuela/clase/[instrumento]/[modulo] → classroom (SplineScene, module preselected)
/escuela/gym/[instrumento]            → gym sala (SplineScene)
```

**Exit panel**: In the classroom, stepping on the out-zone (`isOutingClass`) opens a panel with "Volver al Mapa" + a "CAMBIAR DE MÓDULO" list showing other modules of the same instrument for direct navigation.

### Data layer (`src/data/`)

Course content and instrument metadata use a **hybrid system** (Static fallback + Database priority).

- **Database Priority**: The `useInstrumentos` hook and the school views fetch data from the `instrumentos`, `modulos`, `secciones`, and `recursos` tables. If a record exists in the database with the same ID as a static one, the **database version takes precedence**.
- **Admin Management**: Use the `/admin` panel to create, edit, or delete instruments. Editing a static instrument "promotes" it to the database to allow customization.
- **Static files**: `src/data/cursos.ts`, `clases.ts`, and `gym.ts` remain as fallback defaults for when the database is empty or a specific item hasn't been "promoted" to DB yet.
- `TipoRecurso` values: `'video' | 'drive' | 'juego' | 'pdf' | 'imagen' | 'herramienta' | 'otro'`

### Classroom instrument fallback

In `src/app/escuela/clase/[instrumento]/page.tsx`, the `ClasePage` component first looks up the instrument in static `CLASES_CONFIG`. If not found (admin-created instruments), it fetches from `/api/instrumentos` and builds a `claseInfo` fallback (`claseInfo = clase ?? dbInstrumento`). All UI references use `claseInfo` instead of `clase`, ensuring admin-created instruments work identically to static ones.

### Admin panel overflow

The admin main wrapper (`src/app/admin/page.tsx`) uses `height: '100vh', overflowY: 'auto'` so all four tabs (Usuarios, Contenido, Instrumentos, Manual) scroll properly with the app's custom scrollbar styles.

### Auth & backend (`src/lib/`, `src/app/api/`)

Custom JWT auth over Supabase (not Supabase Auth). Flow:
1. `POST /api/auth/login` — validates credentials, queries `users` table via `getSupabaseAdmin()`, returns JWT + user
2. `POST /api/auth/register` — creates a new user with `role: 'student'`, `puntos: 0`, `nivel: 1`, no `cursos_acceso` or `clases_acceso`. Admin assigns instrument access later via `/admin`.
3. `useAuth` hook stores token + user in `localStorage`. Exports: `login()`, `register()`, `logout()`, `updateUser()`, `isAuthenticated`.
4. Protected API routes verify `Bearer` token with `verifyToken()` from `src/lib/auth.ts`

**Login page** (`src/app/login/page.tsx`): handles `mode: 'login' | 'register'` toggle with `AnimatePresence`. `RegisterForm.tsx` shows a success screen after registration (no auto-login — admin must assign permissions first).

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

### WASD Tutorial (`src/app/escuela/page.tsx`)

`WasdTutorialCard` is a centered modal overlay that appears after the `TapeteCard` is dismissed on first entry to `/escuela`. It shows keyboard controls (WASD, arrow keys, spacebar).

**Per-user counter**: stored in `localStorage` as `tutorial_wasd_{userId}`. Shows for the first 5 sessions per user; after that `dismissTapeteHint` skips it. Counter increments on dismiss via `incrementTutorialCount(userId)`.

### YouTube embedding

`src/lib/youtube.ts` exports `extractYoutubeId`, `getYoutubeEmbedUrl`, `isYoutubeUrl`. Classroom pages use a local `getYouTubeId()` regex inline — shows `hqdefault.jpg` thumbnail, click opens iframe overlay with autoplay.
