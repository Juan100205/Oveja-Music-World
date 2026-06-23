# INSTRUCCIONES PARA AGENTES — Oveja Music World

Bienvenido, agente. Este documento te permite retomar el trabajo sin necesidad de re-explicación.

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/                     Login / Register
│   ├── admin/                      Panel de administración
│   ├── escuela/                    Escuela (3D world)
│   │   ├── page.tsx                Mapa principal con Spline
│   │   ├── clase/[instrumento]/    Salón de clases con Spline
│   │   ├── gym/[instrumento]/      Sala de gym con Spline
│   │   ├── gym/page.tsx            Gym versión anterior
│   │   └── visor/page.tsx          Visor standalone de recursos
│   └── api/                        API routes
├── components/
│   ├── spline/                     SplineScene wrapper
│   ├── video/                      VideoPlayer, VideoPlayerWithCards
│   └── gamification/               LevelProgressPanel, etc.
├── hooks/                          useAuth, useProgress, useInstrumentos
├── lib/                            supabase, auth, gamification, env
├── data/                           Static fallback data
└── types/                          TypeScript interfaces
```

## 🧠 Convenciones clave

- **Spline ↔ React bridge**: `flushSync` obligatorio al setear estado desde `onVariableChange`
- **Recursos (recursos)**: 7 tipos (`video`, `drive`, `juego`, `pdf`, `imagen`, `herramienta`, `otro`). Híbrido static fallback + DB.
- **Gamificación**: 5 niveles, 20 pts por video, `PUNTOS_POR_TIPO` en `types/index.ts`
- **Auth**: JWT custom, `verifyToken()` en API routes, `useAuth` hook en cliente
- **Tailwind v4**: Variables CSS en `@theme inline`
- **Sin `allow-same-origin`** en sandbox de iframes por seguridad

## 🧪 Testing

```bash
npm test              # Jest
npm run test:coverage # Coverage
```

## ⚙️ Comandos

```bash
npm run dev           # Dev server (puerto 3000)
npm run build         # Production build
npm run lint          # ESLint
```

## 📋 Última sesión

Revisar `agentes-documentacion/claude/` para el archivo más reciente.
