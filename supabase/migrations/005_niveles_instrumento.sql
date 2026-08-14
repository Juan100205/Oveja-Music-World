-- ═══════════════════════════════════════════════════════════════
--  Migration 005: Niveles y puntos por instrumento
--  Ejecutar en Supabase → SQL Editor (después de 004_niveles.sql)
--
--  1. config_niveles: cada instrumento puede tener su propia tabla de
--     puntos por nivel (columna instrumento_id; NULL = configuración
--     global/predeterminada).
--  2. users: columna puntos_por_instrumento (JSONB) para acumular
--     puntos por separado en cada instrumento.
-- ═══════════════════════════════════════════════════════════════

-- 1. La PK (nivel) pasa a ser UNIQUE (instrumento_id, nivel) para
--    permitir varias configuraciones (global + una por instrumento).
ALTER TABLE config_niveles DROP CONSTRAINT IF EXISTS config_niveles_pkey;

ALTER TABLE config_niveles ADD COLUMN IF NOT EXISTS instrumento_id TEXT;

ALTER TABLE config_niveles ADD CONSTRAINT config_niveles_instrumento_nivel_unique
  UNIQUE (instrumento_id, nivel);

-- 2. Puntos acumulados por instrumento por usuario (JSONB: { "piano": 120, ... })
ALTER TABLE users ADD COLUMN IF NOT EXISTS puntos_por_instrumento JSONB NOT NULL DEFAULT '{}';

-- Verificación:
-- SELECT * FROM config_niveles ORDER BY instrumento_id, nivel;
