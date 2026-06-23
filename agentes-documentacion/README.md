# agentes-documentacion

Registro de todas las intervenciones de agentes de IA en el proyecto **Oveja Music World**.

## Estructura

```
agentes-documentacion/
├── README.md                        ← este archivo
├── INSTRUCCIONES-PARA-AGENTES.md   ← onboarding para cualquier agente
├── claude/                          ← Claude Code
│   └── YYYY-MM-DD.md
├── codex/                           ← GitHub Copilot / Codex
├── antigravity/                     ← Antigravity
└── ollama/                          ← Ollama
```

## Reglas

1. **Documentar cada acción** inmediatamente después de realizarla en `claude/YYYY-MM-DD.md`.
2. **Formato de entrada:**
   ```
   ## HH:MM — Título de la acción
   **Acción:** qué se hizo
   **Archivos tocados:** lista con ruta y motivo
   **Contexto:** por qué, qué problema resuelve
   **Pendiente / Próximo paso:** qué falta si quedó incompleto
   **Estado:** ✅ Completado | 🔄 En progreso | ⏸ Pausado | ❌ Fallido
   ```
3. **Snapshots para continuidad:** si el contexto se agota a medias, dejar estado `🔄 En progreso` con el campo "Pendiente" completo.
4. **Al retomar una sesión:** leer el archivo más reciente de `agentes-documentacion/claude/` y buscar la última entrada `🔄 En progreso`.

## Stack del proyecto

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion
- **Backend:** Next.js API Routes, Supabase (PostgreSQL + Storage)
- **3D:** Spline (`@splinetool/react-spline` v4)
- **Auth:** JWT custom sobre Supabase
- **Testing:** Jest + Testing Library
- **Pagos:** Wompi / Stripe
