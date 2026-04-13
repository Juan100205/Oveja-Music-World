# 🔍 Flujo de un Recurso: Desde el Admin hasta el Mapa

## Diagrama del Problema

```
ADMIN (Guarda recurso)
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. POST /api/admin/content/recursos                                         │
│     Body: { seccion_id, url, tipo, label, interacciones }                    │
│                                                                              │
│  2. Guardado en BD: tabla "recursos"                                         │
│     ✅ Recurso se guarda correctamente                                        │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    ▼
MAPA DEL ESTUDIANTE (No aparece el recurso)
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. Usuario hace clic en "Piano"                                              │
│     Navega a: /escuela/clase/piano                                          │
│                                                                              │
│  4. Página busca datos:                                                       │
│     const clase = CLASES_CONFIG.find(c => c.id === 'piano')                 │
│     → Encuentra: { id: 'piano', cursoId: 'piano' }                          │
│                                                                              │
│  5. Página llama a API:                                                       │
│     fetch(`/api/content?id=${clase.cursoId}`)                               │
│     → fetch('/api/content?id=piano')                                        │
│                                                                              │
│  6. API busca en BD:                                                          │
│     SELECT * FROM modulos WHERE curso_id = 'piano'                          │
│                                                                              │
│  🔴 PROBLEMA #1: Si no hay módulos con curso_id='piano', devuelve vacío       │
│                                                                              │
│  7. Si hay módulos, busca secciones:                                         │
│     SELECT * FROM secciones WHERE modulo_id = '...'                         │
│                                                                              │
│  8. Si hay secciones, busca recursos:                                          │
│     SELECT * FROM recursos WHERE seccion_id = '...'                         │
│                                                                              │
│  🔴 PROBLEMA #2: Si la sección tiene zona='gym', no aparece en clase          │
│                                                                              │
│  9. Mezcla datos estáticos + BD:                                              │
│     Los datos de BD sobreescriben a los estáticos                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔴 Posibles Causas del Problema

### Causa #1: El módulo tiene `curso_id` incorrecto

Si en la BD tienes:
```sql
-- Módulo con curso_id incorrecto
INSERT INTO modulos (id, curso_id, nombre) 
VALUES ('modulo-1', 'piano-curso', 'Nivel 1');
```

Pero la clase piano busca:
```javascript
// En CLASES_CONFIG
{ id: 'piano', cursoId: 'piano' }  // <-- busca 'piano', no 'piano-curso'
```

**Solución:** El `curso_id` debe coincidir EXACTAMENTE.

### Causa #2: La sección tiene `zona='gym'`

Si la sección tiene `zona='gym'`, solo aparece en `/escuela/gym/piano`, NO en `/escuela/clase/piano`.

**Solución:** Cambiar la zona a `'clase'` o `NULL`.

```sql
-- Ver zona actual
SELECT nombre, zona FROM secciones WHERE id = '...';

-- Cambiar zona
UPDATE secciones SET zona = NULL WHERE id = '...';  -- NULL = aparece en ambas
UPDATE secciones SET zona = 'clase' WHERE id = '...';  -- Solo en clase
```

### Causa #3: No hay instrumento con ese `curso_id`

Para que aparezca en el selector del mapa, debe existir un instrumento (en tabla `instrumentos` o en datos estáticos) con `curso_id` que coincida.

**Solución:** Crear el instrumento si no existe:
```sql
INSERT INTO instrumentos (id, nombre, emoji, descripcion, color, glow, zona, curso_id, activo, orden)
VALUES ('piano', 'Piano', '🎹', 'Teoría aplicada', '#ec488a', 'rgba(236,72,138,0.45)', 'clase', 'piano', true, 0);
```

## 🛠️ Scripts de Diagnóstico

### Verificar conexión completa de un recurso:

```bash
node scripts/debug-recurso.mjs --url="https://youtube.com/watch?v=..."
```

O si conoces el ID:
```bash
node scripts/debug-recurso.mjs --id="uuid-del-recurso"
```

### Ver toda la estructura de un curso:

```sql
-- Ver todo el árbol de piano
SELECT 
    c.id as curso_id,
    c.nombre as curso,
    m.id as modulo_id,
    m.nombre as modulo,
    s.id as seccion_id,
    s.nombre as seccion,
    s.zona,
    r.id as recurso_id,
    r.label,
    r.url
FROM cursos c
LEFT JOIN modulos m ON m.curso_id = c.id
LEFT JOIN secciones s ON s.modulo_id = m.id
LEFT JOIN recursos r ON r.seccion_id = s.id
WHERE c.id = 'piano'
ORDER BY m.orden, s.orden, r.orden;
```

### Ver instrumentos disponibles:

```sql
-- Ver instrumentos activos
SELECT id, nombre, zona, curso_id, activo 
FROM instrumentos 
WHERE activo = true;

-- Ver si hay instrumentos para el curso 'piano'
SELECT * FROM instrumentos WHERE curso_id = 'piano';
```

## ✅ Checklist para que un recurso aparezca

Para que un recurso aparezca en `/escuela/clase/piano`:

- [ ] El recurso existe en la tabla `recursos`
- [ ] La sección existe y tiene `modulo_id` correcto
- [ ] El módulo existe y tiene `curso_id = 'piano'`
- [ ] La sección tiene `zona = 'clase'` o `zona IS NULL` (no 'gym')
- [ ] Hay un instrumento con `curso_id = 'piano'` y `activo = true`

Para que aparezca en `/escuela/gym`:

- [ ] La sección tiene `zona = 'gym'` o `zona IS NULL`
- [ ] Hay un instrumento gym con ese `curso_id`

## 🚨 Casos Especiales

### Guitarra
```javascript
// En CLASES_CONFIG
{ id: 'guitarra', cursoId: 'guitarra-adultos' }  // <-- NOTA: 'guitarra-adultos', no 'guitarra'
```

Si agregas recursos a `curso_id = 'guitarra'`, no aparecerán porque la clase busca `'guitarra-adultos'`.

### Introducción Musical
```javascript
{ id: 'introduccion', cursoId: 'ciudad-musical' }
```

## 🎯 Solución Rápida

Si agregaste un recurso y no aparece:

1. **Verifica el curso_id del módulo:**
```sql
SELECT m.id, m.nombre, m.curso_id 
FROM modulos m
JOIN secciones s ON s.modulo_id = m.id
JOIN recursos r ON r.seccion_id = s.id
WHERE r.url LIKE '%parte-de-url%';
```

2. **Verifica el cursoId de la clase:**
```javascript
// En src/data/clases.ts
CLASES_CONFIG.find(c => c.id === 'piano')?.cursoId  // Debe coincidir con m.curso_id
```

3. **Si no coinciden, actualiza el módulo:**
```sql
UPDATE modulos SET curso_id = 'piano' WHERE id = 'id-del-modulo';
```

4. **Verifica la zona de la sección:**
```sql
SELECT nombre, zona FROM secciones WHERE id = 'id-de-la-seccion';
-- Si es 'gym', cambia a NULL: UPDATE secciones SET zona = NULL WHERE id = '...';
```
