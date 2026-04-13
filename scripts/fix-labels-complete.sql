-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX COMPLETO: Generar labels automáticos basados en secciones
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 1: Introducción
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE recursos SET label = 'Clase preparatoria 1' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Clase preparatoria 1'
);

UPDATE recursos SET label = 'Clase preparatoria 2' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Clase preparatoria 2'
);

UPDATE recursos SET label = 'Video de clase' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'rtshnswethwet'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 2: Nivel 1 - Clases
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE recursos SET label = 'Carpeta de partituras' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Partituras' AND r.tipo = 'drive'
);

UPDATE recursos SET label = 'Cuckoo - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Cuckoo'
);

UPDATE recursos SET label = 'Lightly Row - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Lightly Row'
);

UPDATE recursos SET label = 'French Children''s Song - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'French Children''s Song'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 3: Nivel 1 - Práctica (GYM)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Juegos Scratch
UPDATE recursos SET label = 'Juego: Notas musicales' WHERE url LIKE '%scratch.mit.edu/projects/146851449%';
UPDATE recursos SET label = 'Juego: Ritmo y tiempo' WHERE url LIKE '%scratch.mit.edu/projects/68534384%';
UPDATE recursos SET label = 'Juego: Entrenamiento auditivo' WHERE url LIKE '%scratch.mit.edu/projects/148731524%';
UPDATE recursos SET label = 'Juego: Memoria musical' WHERE url LIKE '%scratch.mit.edu/projects/150381452%';
UPDATE recursos SET label = 'Juego: Dictado melódico' WHERE url LIKE '%scratch.mit.edu/projects/148560151%';
UPDATE recursos SET label = 'Juego: Teoría musical' WHERE url LIKE '%scratch.mit.edu/projects/147139672%';
UPDATE recursos SET label = 'Juego: Práctica de intervalos' WHERE url LIKE '%scratch.mit.edu/projects/146706397%';

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 4: Nivel 2 - Clases
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE recursos SET label = 'Go Tell Aunt Rody - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    JOIN modulos m ON m.id = s.modulo_id
    WHERE r.label IS NULL AND s.nombre = 'Go Tell Aunt Rody' AND m.nombre LIKE '%Nivel 2%'
);

UPDATE recursos SET label = 'Mary Had a Little Lamb - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Mary Had a Little Lamb'
);

UPDATE recursos SET label = 'Cuckoo acompañamiento - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Cuckoo acompañamiento'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 5: Nivel 2 - Práctica
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE recursos SET label = 'Obras de repaso - Video 1' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Obras de repaso' AND r.url LIKE '%1j2REphfeKw%'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 6: Nivel 3 - Clases
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE recursos SET label = 'French Children''s Song acompañamiento - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'French Children''s Song acompañamiento'
);

UPDATE recursos SET label = 'Go Tell Aunt Rody acompañamiento - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Go Tell Aunt Rody acompañamiento'
);

UPDATE recursos SET label = 'Escalas - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Escalas'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 8: Nivel 4 - Clases
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE recursos SET label = 'Little Playmate - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Little Playmate'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 9: Nivel 4 - Práctica (GYM)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Estos ya tienen labels correctos en tu BD

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 10: Nivel 5 - Clases
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE recursos SET label = 'Carpeta de partituras' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    JOIN modulos m ON m.id = s.modulo_id
    WHERE r.label IS NULL AND s.nombre = 'Partituras' AND m.nombre LIKE '%Nivel 5%'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 11: Nivel 5 - Práctica (GYM)
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE recursos SET label = 'Obras de repaso - Video' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Obras de repaso'
);

UPDATE recursos SET label = 'Allegretto práctica - Video' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Allegretto práctica'
);

UPDATE recursos SET label = 'Audiolibro' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    JOIN modulos m ON m.id = s.modulo_id
    WHERE r.label IS NULL AND s.nombre = 'Audiolibro' AND m.nombre LIKE '%Nivel 5%'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 12: Nivel 6 - Clases
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE recursos SET label = 'Carpeta de partituras' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    JOIN modulos m ON m.id = s.modulo_id
    WHERE r.label IS NULL AND s.nombre = 'Partituras' AND m.nombre LIKE '%Nivel 6%'
);

UPDATE recursos SET label = 'Allegro - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Allegro'
);

UPDATE recursos SET label = 'Musette - Tutorial' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    WHERE r.label IS NULL AND s.nombre = 'Musette'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO 13: Nivel 6 - Práctica (GYM)
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE recursos SET label = 'Obras de repaso - Video' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    JOIN modulos m ON m.id = s.modulo_id
    WHERE r.label IS NULL AND s.nombre = 'Obras de repaso' AND m.nombre LIKE '%Nivel 6%'
);

UPDATE recursos SET label = 'Audiolibro' WHERE id IN (
    SELECT r.id FROM recursos r
    JOIN secciones s ON s.id = r.seccion_id
    JOIN modulos m ON m.id = s.modulo_id
    WHERE r.label IS NULL AND s.nombre = 'Audiolibro' AND m.nombre LIKE '%Nivel 6%'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- LIMPIEZA: Para cualquier recurso que aún no tenga label, usar nombre genérico
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE recursos SET label = 'Recurso de ' || tipo WHERE label IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
    COUNT(*) as total_recursos,
    COUNT(label) as con_label,
    COUNT(*) - COUNT(label) as sin_label
FROM recursos;
