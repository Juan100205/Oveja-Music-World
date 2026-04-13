-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Agregar labels a recursos existentes basados en contexto
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Videos de YouTube - usar nombre de la sección como label
UPDATE recursos
SET label = 'Video tutorial'
WHERE label IS NULL
  AND tipo = 'video'
  AND url LIKE '%youtube.com%';

-- 2. Drive folders - descripción genérica
UPDATE recursos
SET label = 'Carpeta de recursos'
WHERE label IS NULL
  AND tipo = 'drive'
  AND url LIKE '%drive.google.com%folder%'
  AND seccion_id IN (SELECT id FROM secciones WHERE nombre LIKE '%Partitura%');

-- 3. Juegos Scratch - basados en la URL
UPDATE recursos
SET label = 'Juego: Notas musicales'
WHERE label IS NULL
  AND tipo = 'juego'
  AND url LIKE '%scratch.mit.edu/projects/146851449%';

UPDATE recursos
SET label = 'Juego: Ritmo y tiempo'
WHERE label IS NULL
  AND tipo = 'juego'
  AND url LIKE '%scratch.mit.edu/projects/68534384%';

UPDATE recursos
SET label = 'Juego: Entrenamiento auditivo'
WHERE label IS NULL
  AND tipo = 'juego'
  AND url LIKE '%scratch.mit.edu/projects/148731524%';

UPDATE recursos
SET label = 'Juego: Memoria musical'
WHERE label IS NULL
  AND tipo = 'juego'
  AND url LIKE '%scratch.mit.edu/projects/150381452%';

UPDATE recursos
SET label = 'Juego: Dictado melódico'
WHERE label IS NULL
  AND tipo = 'juego'
  AND url LIKE '%scratch.mit.edu/projects/148560151%';

UPDATE recursos
SET label = 'Juego: Teoría musical'
WHERE label IS NULL
  AND tipo = 'juego'
  AND url LIKE '%scratch.mit.edu/projects/147139672%';

UPDATE recursos
SET label = 'Juego: Práctica de intervalos'
WHERE label IS NULL
  AND tipo = 'juego'
  AND url LIKE '%scratch.mit.edu/projects/146706397%';

-- 4. Otros drives (archivos sueltos)
UPDATE recursos
SET label = 'Material de estudio'
WHERE label IS NULL
  AND tipo = 'drive'
  AND url LIKE '%drive.google.com/file%';

-- 5. Para los videos que quedaron sin label, usar el nombre de la sección
-- Esto requiere hacer un update con JOIN a secciones

-- Ver cuántos quedan sin label
SELECT
    COUNT(*) as total,
    COUNT(label) as con_label,
    COUNT(*) - COUNT(label) as sin_label
FROM recursos;

-- Ver distribución por tipo
SELECT
    tipo,
    COUNT(*) as total,
    COUNT(label) as con_label,
    COUNT(*) - COUNT(label) as sin_label
FROM recursos
GROUP BY tipo;
