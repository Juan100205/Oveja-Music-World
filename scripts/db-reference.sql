-- ═══════════════════════════════════════════════════════════════════════════════
-- OVEJA MUSIC WORLD - DIAGRAMA DE RELACIONES Y QUERIES DE REFERENCIA
-- ═══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │                         ESTRUCTURA DE DATOS                                 │
-- │                                                                             │
-- │   CURSOS (instrumentos)                                                     │
-- │   ├── id (TEXT) PK                                                         │
-- │   ├── nombre (TEXT)          "Piano", "Guitarra"                           │
-- │   ├── emoji (TEXT)           "🎹", "🎸"                                     │
-- │   └── orden (INT)                                                          │
-- │         │                                                                   │
-- │         │ 1:N                                                               │
-- │         ▼                                                                   │
-- │   MÓDULOS (carpetas de nivel)                                               │
-- │   ├── id (TEXT) PK                                                         │
-- │   ├── curso_id (TEXT) FK ───────────────────┐                              │
-- │   ├── nombre (TEXT)          "Nivel 1", "Gym"│                              │
-- │   └── orden (INT)                            │                              │
-- │         │                                    │                              │
-- │         │ 1:N                               │                              │
-- │         ▼                                   │                              │
-- │   SECCIONES (temas/clases)                  │                              │
-- │   ├── id (UUID) PK                          │                              │
-- │   ├── modulo_id (TEXT) FK ──────────────────┤                              │
-- │   ├── nombre (TEXT)          "Do Mayor", "Ejercicio 1"                     │
-- │   ├── zona (TEXT)            'clase' | 'gym' | NULL                        │
-- │   │                          NULL = aparece en ambas                       │
-- │   └── orden (INT)                                                           │
-- │         │                                                                   │
-- │         │ 1:N                                                               │
-- │         ▼                                                                   │
-- │   RECURSOS (videos, PDFs, etc.)                                             │
-- │   ├── id (UUID) PK                                                          │
-- │   ├── seccion_id (UUID) FK ─────────────────┐                               │
-- │   ├── url (TEXT)                           │                               │
-- │   ├── tipo (TEXT)                          │  'video', 'drive', 'juego'    │
-- │   ├── label (TEXT)          <-- NOMBRE      │   'pdf', 'imagen', etc.       │
-- │   │                         VISIBLE EN UI  │                               │
-- │   ├── orden (INT)                          │                               │
-- │   └── interacciones (JSONB)                │  [{at_seconds, mensaje, tipo}]│
-- │                                            │                               │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- ═══════════════════════════════════════════════════════════════════════════════
-- QUERIES ÚTILES PARA DIAGNÓSTICO
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Ver árbol completo de un instrumento
SELECT
    c.nombre as curso,
    c.emoji,
    m.nombre as modulo,
    s.nombre as seccion,
    s.zona,
    r.url as recurso_url,
    r.tipo as recurso_tipo,
    r.label as recurso_label
FROM cursos c
JOIN modulos m ON m.curso_id = c.id
JOIN secciones s ON s.modulo_id = m.id
LEFT JOIN recursos r ON r.seccion_id = s.id
WHERE c.id = 'piano'  -- cambiar por tu curso
ORDER BY m.orden, s.orden, r.orden;

-- 2. Recursos SIN label (problema: no se muestra título en UI)
SELECT r.id, r.url, r.tipo, s.nombre as seccion, m.nombre as modulo, c.nombre as curso
FROM recursos r
JOIN secciones s ON s.id = r.seccion_id
JOIN modulos m ON m.id = s.modulo_id
JOIN cursos c ON c.id = m.curso_id
WHERE r.label IS NULL OR r.label = ''
ORDER BY c.nombre, m.orden, s.orden;

-- 3. Recursos CON label (para ver ejemplos correctos)
SELECT r.id, r.url, r.label, r.tipo, s.nombre as seccion
FROM recursos r
JOIN secciones s ON s.id = r.seccion_id
WHERE r.label IS NOT NULL
ORDER BY s.orden, r.orden
LIMIT 10;

-- 4. Contar recursos por curso
SELECT c.nombre, COUNT(r.id) as total_recursos
FROM cursos c
JOIN modulos m ON m.curso_id = c.id
JOIN secciones s ON s.modulo_id = m.id
LEFT JOIN recursos r ON r.seccion_id = s.id
GROUP BY c.nombre;

-- 5. Ver secciones SIN recursos
SELECT s.id, s.nombre, m.nombre as modulo, c.nombre as curso
FROM secciones s
JOIN modulos m ON m.id = s.modulo_id
JOIN cursos c ON c.id = m.curso_id
LEFT JOIN recursos r ON r.seccion_id = s.id
WHERE r.id IS NULL;

-- 6. Verificar columnas de recursos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'recursos'
ORDER BY ordinal_position;

-- 7. Agregar label a recursos que no tienen (ejemplo)
-- UPDATE recursos SET label = 'Video tutorial' WHERE id = 'uuid-aqui';

-- 8. Buscar recurso por URL parcial
SELECT r.*, s.nombre as seccion, m.nombre as modulo
FROM recursos r
JOIN secciones s ON s.id = r.seccion_id
JOIN modulos m ON m.id = s.modulo_id
WHERE r.url LIKE '%youtube.com/watch?v=ABC123%';

-- 9. Ver interacciones de un recurso específico
SELECT id, url, label, interacciones
FROM recursos
WHERE id = 'uuid-aqui';

-- 10. Duplicar recursos de una sección a otra
-- INSERT INTO recursos (seccion_id, url, tipo, label, orden)
-- SELECT 'nueva-seccion-uuid', url, tipo, label, orden
-- FROM recursos
-- WHERE seccion_id = 'seccion-original-uuid';

-- ═══════════════════════════════════════════════════════════════════════════════
-- POSIBLES PROBLEMAS Y SOLUCIONES
-- ═══════════════════════════════════════════════════════════════════════════════

-- PROBLEMA: Recursos se guardan en admin pero no aparecen en el mapa
-- CAUSA:   La columna se llama 'label' en BD pero el código buscaba 'nombre'
-- SOLUCIÓN: Corregido en src/app/api/content/route.ts línea 51
--          Antes: .select('id, url, tipo, nombre, orden')
--          Después: .select('id, url, tipo, label, orden')

-- PROBLEMA: Recursos sin título en la UI
-- CAUSA:    El campo label está NULL
-- DIAGNÓSTICO: Query #2 arriba
-- SOLUCIÓN: UPDATE recursos SET label = 'Título descriptivo' WHERE id = '...';

-- PROBLEMA: Sección no aparece en clase o gym
-- CAUSA:    El campo 'zona' no está configurado correctamente
-- VALORES:  'clase' = solo en escuela/clase
--           'gym'   = solo en gym
--           NULL    = ambas

-- PROBLEMA: Orden incorrecto de módulos/secciones/recursos
-- SOLUCIÓN: Verificar que la columna 'orden' tenga valores secuenciales
--           UPDATE modulos SET orden = 0 WHERE id = '...';
