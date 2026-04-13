-- ═══════════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO COMPLETO: Por qué un recurso no aparece en el mapa
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- Reemplaza 'piano' con el instrumento que estás probando
SET SESSION "app.instrumento" = 'piano';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. VERIFICAR INSTRUMENTOS DISPONIBLES
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'INSTRUMENTOS DISPONIBLES' as seccion;
SELECT
    id,
    nombre,
    zona,
    curso_id,
    activo,
    CASE
        WHEN zona = 'clase' THEN 'Solo en /escuela/clase'
        WHEN zona = 'gym' THEN 'Solo en /escuela/gym'
        WHEN zona = 'ambos' OR zona IS NULL THEN 'Ambas ubicaciones'
        ELSE 'Zona desconocida: ' || zona
    END as aparece_en
FROM instrumentos
WHERE activo = true
ORDER BY orden;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. VER CURSOS Y SU CONFIGURACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '' as espacio;
SELECT 'CURSOS CONFIGURADOS' as seccion;
SELECT
    id,
    nombre,
    emoji,
    orden
FROM cursos
ORDER BY orden;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. VER MÓDULOS POR CURSO
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '' as espacio;
SELECT 'MÓDULOS POR CURSO (con conteo de secciones)' as seccion;
SELECT
    c.id as curso_id,
    c.nombre as curso,
    m.id as modulo_id,
    m.nombre as modulo,
    m.orden,
    (SELECT COUNT(*) FROM secciones WHERE modulo_id = m.id) as num_secciones,
    (SELECT COUNT(*) FROM recursos r
     JOIN secciones s ON s.id = r.seccion_id
     WHERE s.modulo_id = m.id) as num_recursos
FROM cursos c
JOIN modulos m ON m.curso_id = c.id
ORDER BY c.orden, m.orden;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. VER SECCIONES CON SU ZONA (IMPORTANTE!)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '' as espacio;
SELECT 'SECCIONES Y SUS ZONAS (zona=clase→solo clase, zona=gym→solo gym, null→ambas)' as seccion;
SELECT
    c.nombre as curso,
    m.nombre as modulo,
    s.nombre as seccion,
    s.id as seccion_id,
    COALESCE(s.zona, 'NULL (ambas)') as zona,
    s.orden,
    (SELECT COUNT(*) FROM recursos WHERE seccion_id = s.id) as num_recursos
FROM cursos c
JOIN modulos m ON m.curso_id = c.id
JOIN secciones s ON s.modulo_id = m.id
ORDER BY c.orden, m.orden, s.orden;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. VER RECURSOS SIN LABEL (aparecen sin título)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '' as espacio;
SELECT 'RECURSOS SIN LABEL (aparecen sin título en la UI)' as seccion;
SELECT
    r.id,
    LEFT(r.url, 60) as url,
    r.tipo,
    r.label,
    s.nombre as seccion,
    m.nombre as modulo,
    c.nombre as curso
FROM recursos r
JOIN secciones s ON s.id = r.seccion_id
JOIN modulos m ON m.id = s.modulo_id
JOIN cursos c ON c.id = m.curso_id
WHERE r.label IS NULL OR r.label = ''
ORDER BY c.nombre, m.orden, s.orden, r.orden;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. VER TODOS LOS RECURSOS CON SU RUTA COMPLETA
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '' as espacio;
SELECT 'TODOS LOS RECURSOS (ruta completa)' as seccion;
SELECT
    c.nombre as curso,
    m.nombre as modulo,
    s.nombre as seccion,
    COALESCE(s.zona, 'ambas') as zona,
    r.label,
    r.tipo,
    LEFT(r.url, 50) as url_preview,
    CASE
        WHEN r.label IS NULL THEN '⚠️ SIN LABEL'
        ELSE '✓ OK'
    END as status
FROM cursos c
JOIN modulos m ON m.curso_id = c.id
JOIN secciones s ON s.modulo_id = m.id
JOIN recursos r ON r.seccion_id = s.id
ORDER BY c.orden, m.orden, s.orden, r.orden
LIMIT 50;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. VERIFICAR COHERENCIA: Instrumentos vs Cursos vs Módulos
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '' as espacio;
SELECT 'COHERENCIA: ¿Todos los instrumentos tienen cursos y módulos?' as seccion;
SELECT
    i.id as instrumento_id,
    i.nombre as instrumento,
    i.curso_id,
    i.zona as instrumento_zona,
    CASE
        WHEN c.id IS NULL THEN '❌ Curso NO existe'
        ELSE '✓ Curso existe'
    END as curso_existe,
    CASE
        WHEN m.cuenta > 0 THEN '✓ Tiene ' || m.cuenta || ' módulos'
        ELSE '❌ Sin módulos'
    END as tiene_modulos,
    CASE
        WHEN s.cuenta > 0 THEN '✓ Tiene ' || s.cuenta || ' secciones'
        ELSE '❌ Sin secciones'
    END as tiene_secciones
FROM instrumentos i
LEFT JOIN cursos c ON c.id = i.curso_id
LEFT JOIN (
    SELECT curso_id, COUNT(*) as cuenta
    FROM modulos GROUP BY curso_id
) m ON m.curso_id = i.curso_id
LEFT JOIN (
    SELECT m2.curso_id, COUNT(*) as cuenta
    FROM secciones s2
    JOIN modulos m2 ON m2.id = s2.modulo_id
    GROUP BY m2.curso_id
) s ON s.curso_id = i.curso_id
WHERE i.activo = true
ORDER BY i.orden;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. PROBLEMAS DETECTADOS (resumen)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '' as espacio;
SELECT 'RESUMEN DE PROBLEMAS' as seccion;

-- Instrumentos sin curso
SELECT '' as espacio;
SELECT 'Instrumentos con curso_id que no existe en tabla cursos:' as problema;
SELECT i.id, i.nombre, i.curso_id
FROM instrumentos i
LEFT JOIN cursos c ON c.id = i.curso_id
WHERE i.activo = true AND c.id IS NULL;

-- Cursos sin módulos
SELECT '' as espacio;
SELECT 'Cursos sin módulos (no tendrán contenido):' as problema;
SELECT c.id, c.nombre
FROM cursos c
LEFT JOIN modulos m ON m.curso_id = c.id
WHERE m.id IS NULL;

-- Módulos sin secciones
SELECT '' as espacio;
SELECT 'Módulos sin secciones:' as problema;
SELECT m.id, m.nombre, m.curso_id
FROM modulos m
LEFT JOIN secciones s ON s.modulo_id = m.id
WHERE s.id IS NULL;

-- Secciones sin recursos
SELECT '' as espacio;
SELECT 'Secciones sin recursos:' as problema;
SELECT s.id, s.nombre, m.nombre as modulo
FROM secciones s
JOIN modulos m ON m.id = s.modulo_id
LEFT JOIN recursos r ON r.seccion_id = s.id
WHERE r.id IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. INSTRUCCIONES PARA CORREGIR
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '' as espacio;
SELECT 'INSTRUCCIONES PARA CORREGIR' as seccion;
SELECT '1. Si un instrumento tiene curso_id incorrecto:' as instruccion;
SELECT '   UPDATE instrumentos SET curso_id = ''piano'' WHERE id = ''piano'';' as sql;

SELECT '' as espacio;
SELECT '2. Si una sección tiene zona incorrecta:' as instruccion;
SELECT '   UPDATE secciones SET zona = NULL WHERE id = ''uuid-seccion'';' as sql;
SELECT '   -- NULL = ambas, ''clase'' = solo clase, ''gym'' = solo gym' as nota;

SELECT '' as espacio;
SELECT '3. Si un recurso no tiene label:' as instruccion;
SELECT '   UPDATE recursos SET label = ''Título descriptivo'' WHERE id = ''uuid-recurso'';' as sql;

SELECT '' as espacio;
SELECT '4. Verificar que todo está conectado:' as instruccion;
SELECT '   Recurso -> Sección -> Módulo -> Curso -> Instrumento' as flujo;
