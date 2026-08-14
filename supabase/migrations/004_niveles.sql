-- ═══════════════════════════════════════════════════════════════
--  Migration 004: Configuración de niveles editable desde /admin
--  Ejecutar en Supabase → SQL Editor
--
--  Define cuántos puntos se necesitan para subir de nivel.
--  La API lee esta tabla (con fallback a LEVEL_CONFIG en src/types
--  si la tabla está vacía o da error).
-- ═══════════════════════════════════════════════════════════════

-- 1. Tabla de configuración de niveles
CREATE TABLE IF NOT EXISTS config_niveles (
  nivel              INT PRIMARY KEY,
  puntos_requeridos  INT NOT NULL,
  nombre             TEXT NOT NULL
);

-- 2. Seed con los valores por defecto (no sobrescribe si ya existen)
INSERT INTO config_niveles (nivel, puntos_requeridos, nombre) VALUES
  (1, 0,    'Principiante'),
  (2, 100,  'Aprendiz'),
  (3, 300,  'Intermedio'),
  (4, 600,  'Avanzado'),
  (5, 1000, 'Maestro')
ON CONFLICT (nivel) DO NOTHING;

-- 3. RLS: lectura pública (cualquier rol lee; escritura vía service role/API)
ALTER TABLE config_niveles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_niveles_public_read"
  ON config_niveles FOR SELECT USING (true);

-- Verificación:
-- SELECT * FROM config_niveles ORDER BY nivel;
