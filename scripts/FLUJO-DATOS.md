# 🐑 Oveja Music World - Flujo de Datos

## Diagrama de Relaciones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITECTURA DE DATOS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CURSOS (instrumentos)                                                     │
│   ┌─────────────────────────────────────┐                                    │
│   │ id (TEXT) PK                       │  "piano", "guitarra", "bateria"     │
│   │ nombre (TEXT)                      │  "Piano", "Guitarra Acústica"     │
│   │ emoji (TEXT)                       │  "🎹", "🎸", "🥁"                  │
│   │ orden (INT)                        │  Para ordenar en el selector      │
│   └─────────────────────────────────────┘                                    │
│                              │                                              │
│                              │ 1:N                                          │
│                              ▼                                              │
│   MÓDULOS (niveles/carpetas)                                                │
│   ┌─────────────────────────────────────┐                                    │
│   │ id (TEXT) PK                       │  "piano-nivel-1", "gym-musical"   │
│   │ curso_id (TEXT) FK ────────────────┼───┐                               │
│   │ nombre (TEXT)                      │   │  "Nivel 1", "Gym", "Teoría"   │
│   │ orden (INT)                        │   │                               │
│   └─────────────────────────────────────┘   │                               │
│                              │              │                               │
│                              │ 1:N          │                               │
│                              ▼              │                               │
│   SECCIONES (temas/clases)                    │                               │
│   ┌─────────────────────────────────────┐    │                               │
│   │ id (UUID) PK                       │    │                               │
│   │ modulo_id (TEXT) FK ──────────────┼────┘                               │
│   │ nombre (TEXT)                      │       "Do Mayor", "Ejercicio 1"     │
│   │ zona (TEXT)                        │       'clase' | 'gym' | NULL      │
│   │ orden (INT)                        │       NULL = aparece en ambas     │
│   └─────────────────────────────────────┘                                    │
│                              │                                              │
│                              │ 1:N                                          │
│                              ▼                                              │
│   RECURSOS (videos, archivos, etc.)                                          │
│   ┌─────────────────────────────────────┐                                    │
│   │ id (UUID) PK                       │                                    │
│   │ seccion_id (UUID) FK ──────────────┼───┐                               │
│   │ url (TEXT)                         │   │  URL del video/drive/etc      │
│   │ tipo (TEXT)                        │   │  'video', 'drive', 'juego'... │
│   │ label (TEXT) ◄─────────────────────┼───┼── NOMBRE VISIBLE EN UI ❗     │
│   │ orden (INT)                        │   │                               │
│   │ interacciones (JSONB)              │   │  [{at_seconds, mensaje}]      │
│   └─────────────────────────────────────┘   │                               │
│                                             │                               │
└─────────────────────────────────────────────┼───────────────────────────────┘
                                              │
┌─────────────────────────────────────────────┼───────────────────────────────┐
│              FLUJO DE LA APLICACIÓN          │                               │
├─────────────────────────────────────────────┼───────────────────────────────┤
│                                             │                               │
│  ADMIN PANEL                                │                               │
│  ├── POST /api/admin/content/recursos     │                               │
│  │   Body: { seccion_id, url, tipo, label, │                               │
│  │           interacciones }              │                               │
│  │                                          │                               │
│  └── PATCH /api/admin/content/recursos/id │                               │
│      Body: { url, tipo, label,            │                               │
│              interacciones }               │                               │
│                    │                        │                               │
│                    ▼                        │                               │
│  Supabase: tabla "recursos"                 │                               │
│                    │                        │                               │
│                    │ 1. Guarda en BD        │                               │
│                    ▼                        │                               │
│  MAPA GAMIFICADO                            │                               │
│  ├── GET /api/content?id=piano            │                               │
│  │   └─▶ Query: SELECT ... FROM recursos   │                               │
│  │      WHERE seccion_id = '...'            │                               │
│  │                                          │                               │
│  └── Response: { modulos: [{                │                               │
│         id, nombre,                        │                               │
│         secciones: [{                       │                               │
│           nombre, zona,                    │                               │
│           recursos: [{                      │                               │
│             url, tipo,                       │                               │
│             label ◄─────────────────────────┘
│           }]
│         }]
│       }]}
│
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚨 Problema Reciente y Solución

### El Bug
```typescript
// ❌ ERROR en src/app/api/content/route.ts (línea 51)
.select('id, url, tipo, nombre, orden')  // 'nombre' NO EXISTE en la BD!

// ✅ CORREGIDO
.select('id, url, tipo, label, orden')    // 'label' ES la columna correcta
```

**Impacto:** Los recursos se guardaban correctamente en el admin, pero al mostrarlos en el mapa gamificado aparecían sin título (sin `label`).

### Verificación
Para verificar que la columna existe:
```sql
-- En Supabase SQL Editor
SELECT column_name FROM information_schema.columns
WHERE table_name = 'recursos';
-- Debe mostrar: id, seccion_id, url, tipo, label, orden, interacciones
```

## 🛠️ Scripts de Diagnóstico

### 1. Inspeccionar toda la BD
```bash
node scripts/db-inspector.mjs
```

### 2. Ver recursos sin label
```bash
node scripts/db-inspector.mjs --fix-label
```

### 3. Ver estadísticas
```bash
node scripts/db-inspector.mjs --stats
```

### 4. Filtrar por curso específico
```bash
node scripts/db-inspector.mjs --curso=piano
```

## 📍 Campos Importantes

### `zona` en secciones
| Valor | Aparece en |
|-------|-----------|
| `'clase'` | Solo /escuela/clase |
| `'gym'` | Solo /escuela/gym |
| `NULL` | Ambos |

### `label` en recursos
- **Si es NULL**: El recurso aparece sin título en la UI
- **Si tiene valor**: Se muestra como título del recurso
- **Recomendación**: Siempre poner un label descriptivo

## 🔗 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/app/api/admin/content/recursos/route.ts` | Crear recursos (admin) |
| `src/app/api/admin/content/recursos/[id]/route.ts` | Actualizar recursos (admin) |
| `src/app/api/content/route.ts` | Leer recursos para el mapa gamificado |
| `src/data/cursos.ts` | Datos estáticos (fallback) |
| `src/data/gym.ts` | Configuración del gym |
| `src/types/index.ts` | Tipos de TypeScript |

## 🐛 Debugging

Si un recurso no aparece:

1. **Verificar que existe en BD:**
```sql
SELECT * FROM recursos WHERE url LIKE '%parte-de-la-url%';
```

2. **Verificar la relación completa:**
```sql
SELECT r.id, r.url, r.label, s.nombre as seccion, m.nombre as modulo, c.nombre as curso
FROM recursos r
JOIN secciones s ON s.id = r.seccion_id
JOIN modulos m ON m.id = s.modulo_id
JOIN cursos c ON c.id = m.curso_id
WHERE r.url LIKE '%parte-de-la-url%';
```

3. **Verificar la zona de la sección:**
```sql
SELECT nombre, zona FROM secciones WHERE id = 'uuid-de-la-seccion';
-- Si zona='clase' y estás en el gym, no aparecerá
```

4. **Verificar el orden:**
```sql
SELECT nombre, orden FROM recursos WHERE seccion_id = 'uuid' ORDER BY orden;
-- El orden debe ser: 0, 1, 2, 3... sin saltos
```
