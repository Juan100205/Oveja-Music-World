-- ═══════════════════════════════════════════════════════════════
--  Oveja Music World — Tablas de contenido
--  Ejecutar en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Cursos (instrumentos)
CREATE TABLE IF NOT EXISTS cursos (
  id     TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  emoji  TEXT DEFAULT '',
  orden  INT  DEFAULT 0
);

-- Módulos dentro de cada curso
CREATE TABLE IF NOT EXISTS modulos (
  id       TEXT PRIMARY KEY,
  curso_id TEXT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  nombre   TEXT NOT NULL,
  orden    INT  DEFAULT 0
);

-- Secciones dentro de cada módulo
CREATE TABLE IF NOT EXISTS secciones (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id TEXT NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  nombre    TEXT NOT NULL,
  zona      TEXT CHECK (zona IN ('clase', 'gym')),  -- NULL = aparece en ambas
  orden     INT  DEFAULT 0
);

-- Recursos dentro de cada sección
CREATE TABLE IF NOT EXISTS recursos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seccion_id UUID NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  tipo       TEXT NOT NULL DEFAULT 'otro'
             CHECK (tipo IN ('video','drive','juego','pdf','imagen','herramienta','otro')),
  label      TEXT,
  orden      INT  DEFAULT 0
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_modulos_curso    ON modulos(curso_id);
CREATE INDEX IF NOT EXISTS idx_secciones_modulo ON secciones(modulo_id);
CREATE INDEX IF NOT EXISTS idx_recursos_seccion ON recursos(seccion_id);

-- RLS activado — solo lectura pública, escritura vía service role (API)
ALTER TABLE cursos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE secciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cursos_public_read"    ON cursos    FOR SELECT USING (true);
CREATE POLICY "modulos_public_read"   ON modulos   FOR SELECT USING (true);
CREATE POLICY "secciones_public_read" ON secciones FOR SELECT USING (true);
CREATE POLICY "recursos_public_read"  ON recursos  FOR SELECT USING (true);
