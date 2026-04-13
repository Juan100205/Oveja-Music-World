-- ================================================================
-- SEED: Migrar contenido estático de cursos.ts → Supabase
-- Ejecutar UNA VEZ en Supabase → SQL Editor
-- Incluye: Batería, Gym Musical, Piano, Violín, Canto,
--          Guitarra Adultos, Ciudad Musical (Iniciación)
-- ================================================================

-- ── 1. Cursos (crea si no existen) ───────────────────────────────
INSERT INTO cursos (id, nombre, emoji, orden) VALUES
  ('bateria',          'Batería',            '🥁', 0),
  ('gym-musical',      'Gym Musical',        '🏋️', 1),
  ('piano',            'Piano',              '🎹', 2),
  ('violin',           'Violín',             '🎻', 3),
  ('canto',            'Canto',              '🎤', 4),
  ('guitarra-adultos', 'Guitarra',           '🎸', 5),
  ('ciudad-musical',   'Iniciación Musical', '🎵', 6)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Instrumentos (crea si no existen) ─────────────────────────
INSERT INTO instrumentos (id, nombre, emoji, descripcion, color, glow, zona, curso_id, orden, activo)
VALUES
  ('piano',        'Piano',              '🎹', 'Teoría aplicada, lectura y repertorio',   '#ec488a', 'rgba(236,72,138,0.4)', 'clase', 'piano',           0, true),
  ('bateria',      'Batería',            '🥁', 'Ritmo, técnica y coordinación percusiva', '#3db8fa', 'rgba(61,184,250,0.4)', 'clase', 'bateria',          1, true),
  ('guitarra',     'Guitarra',           '🎸', 'Acordes, ritmo y canciones progresivas',  '#ffa737', 'rgba(255,167,55,0.4)', 'clase', 'guitarra-adultos', 2, true),
  ('violin',       'Violín',             '🎻', 'Postura, arco y técnica de cuerdas',      '#9b54f9', 'rgba(155,84,249,0.4)', 'clase', 'violin',           3, true),
  ('canto',        'Canto',              '🎤', 'Técnica vocal, respiración y repertorio', '#ec488a', 'rgba(236,72,138,0.4)', 'clase', 'canto',            4, true),
  ('introduccion', 'Iniciación Musical', '🎵', 'Fundamentos del lenguaje musical',        '#3db8fa', 'rgba(61,184,250,0.4)', 'clase', 'ciudad-musical',   5, true)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Limpiar módulos existentes para evitar duplicados ─────────
-- (CASCADE elimina secciones y recursos hijos automáticamente)
DELETE FROM modulos WHERE curso_id IN (
  'bateria','gym-musical','piano','violin','canto','guitarra-adultos','ciudad-musical'
);

-- ── 4. Insertar todo el contenido ────────────────────────────────
DO $$
DECLARE
  m  uuid;
  s  uuid;
BEGIN

-- ================================================================
-- 🥁 BATERÍA
-- ================================================================
INSERT INTO modulos (curso_id, nombre, orden) VALUES ('bateria', 'Nivel 1', 0) RETURNING id INTO m;

INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Fundamentos', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://drive.google.com/file/d/0B4jssYDGXDU_NkZacmVWbEp5dzg/view','drive',NULL,0),
  (s,'https://drive.google.com/file/d/0B4jssYDGXDU_YnlkTnF3c0Y4XzA/view','drive',NULL,1),
  (s,'https://drive.google.com/file/d/0B4jssYDGXDU_eE5XYkxKcy1waGc/view','drive',NULL,2),
  (s,'https://drive.google.com/file/d/0B4jssYDGXDU_SmZsaUVqTGgzT2s/view','drive',NULL,3),
  (s,'https://drive.google.com/file/d/0B4jssYDGXDU_cjAzbGt1VWdjVzg/view','drive',NULL,4),
  (s,'https://drive.google.com/file/d/0B4jssYDGXDU_MFVZbTNZbWVnQ1E/view','drive',NULL,5),
  (s,'https://drive.google.com/file/d/0B4jssYDGXDU_TzN3UFVKZjQtTmM/view','drive',NULL,6);

INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Recursos y práctica', 'gym', 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://drive.google.com/drive/folders/19-dKtIEKWNT8PRQniREYo5KAZceRZFot','drive',NULL,0),
  (s,'https://aprendomusica.com/const2/04dictadoRitmico/game.html','juego','Dictado rítmico',1);

INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Material complementario', 'gym', 2) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://drive.google.com/file/d/1mOcNWwC95beqMuOta9-dv2J_fQ_AZ3W4/view','drive',NULL,0),
  (s,'https://drive.google.com/file/d/1VEZ4JunjMGKp_8mFtvfY3djq-8yYOIrB/view','drive',NULL,1),
  (s,'https://drive.google.com/file/d/1RFAV9CqtjZxUUM_abL5eF8eAim4KhC4L/view','drive',NULL,2),
  (s,'https://drive.google.com/drive/u/1/folders/1L_2ox8f8sfGCAozXYlxO4a6gMltBRIbL','drive',NULL,3),
  (s,'https://drive.google.com/file/d/1B8ManFdsu2w1H1VW4s1nZoXhRAr7SDqC/view','drive',NULL,4),
  (s,'https://drive.google.com/file/d/16r_KwHZLEtxnBKLO4BFK6gNr6e-_4FZ6/view','drive',NULL,5),
  (s,'https://drive.google.com/file/d/1M7WNOcsp2GmrPGJco7Z4oI1lGov4_QmM/view','drive',NULL,6),
  (s,'https://drive.google.com/file/d/1l5Z0LBaf1JvbWb5s4tVRBQuTC42dN-1I/view','drive',NULL,7),
  (s,'https://drive.google.com/file/d/1TvnywQbsZt_mEgNt1-nchXXkoNCuDRTI/view','drive',NULL,8),
  (s,'https://drive.google.com/file/d/1RRuyEixM7xyFmTRFeOKDoSkVQtTE6gfN/view','drive',NULL,9),
  (s,'https://drive.google.com/file/d/19J2h98CHhqtoHaCuPJanY2Mcb6q0_Euj/view','drive',NULL,10),
  (s,'https://drive.google.com/file/d/1xdMQhU8TzbIh8sMM76t7_FPMkVZJTJMx/view','drive',NULL,11),
  (s,'https://drive.google.com/file/d/15z2K6CFEFH6CoH6d3xJ_RKX22sA_yu4c/view','drive',NULL,12),
  (s,'https://drive.google.com/file/d/15hBN7e2H7sJMfRZYaRIQh0i3UoIWaWXR/view','drive',NULL,13),
  (s,'https://drive.google.com/file/d/11eBL8ELXAXU3uNKeLUDj4OOONSYNqGds/view','drive',NULL,14),
  (s,'https://drive.google.com/file/d/19KYrdqa-T8fTSxj27waws_LjQ1FDms1k/view','drive',NULL,15);

-- ================================================================
-- 🏋️ GYM MUSICAL
-- ================================================================
INSERT INTO modulos (curso_id, nombre, orden) VALUES ('gym-musical', 'General', 0) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Recursos generales', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=5flxlEQ4YxY','video',NULL,0),
  (s,'https://www.sessiontown.com/es/juegos-aplicaciones-musica/metronomo','herramienta','Metrónomo',1),
  (s,'https://www.youtube.com/watch?v=T9c2kCGrJlo','video',NULL,2),
  (s,'https://www.youtube.com/watch?v=KJYAWpSLkC8','video',NULL,3);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('gym-musical', 'Nivel 1', 1) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Ejercicios', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=Z5ZV4eQkHqg','video',NULL,0),
  (s,'https://www.youtube.com/watch?v=Du2z_mSAREM','video',NULL,1),
  (s,'https://www.youtube.com/watch?v=1zME6I2XQV4','video',NULL,2),
  (s,'https://www.youtube.com/watch?v=Vkr4H1yRWfY','video',NULL,3),
  (s,'https://www.youtube.com/watch?v=DKTLXzqx3H8','video',NULL,4),
  (s,'https://www.youtube.com/watch?v=jDCoUpwqZFw','video',NULL,5),
  (s,'https://www.youtube.com/watch?v=G08RvhtzMe0','video',NULL,6),
  (s,'https://www.youtube.com/watch?v=pJzUtHtjWzw','video',NULL,7),
  (s,'https://www.youtube.com/watch?v=0hOnl2-oK5Q','video',NULL,8),
  (s,'https://www.youtube.com/watch?v=eePx88Ak60U','video',NULL,9),
  (s,'https://www.youtube.com/watch?v=41ViklVf3pM','video',NULL,10),
  (s,'https://www.youtube.com/watch?v=TNqstVeH9t8','video',NULL,11),
  (s,'https://www.youtube.com/watch?v=anosN4GXv58','video',NULL,12),
  (s,'https://www.youtube.com/watch?v=ZvnnFStzx4M','video',NULL,13);

-- ================================================================
-- 🎹 PIANO
-- ================================================================
INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 1: Introducción', 0) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Clase preparatoria 1', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=vgqXbVay2Lg','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Clase preparatoria 2', NULL, 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=4_AgUMhuHDQ','video',NULL,0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 2: Nivel 1 – Clases', 1) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Partituras', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://drive.google.com/drive/folders/0Byevmj7vkP25eGpJUDB6ZzluNjg','drive',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Cuckoo', NULL, 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=wKDi6doJOAE','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Lightly Row', NULL, 2) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=vwUS8vgvib0','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'French Children''s Song', NULL, 3) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=DDBYZUXJb9Y','video',NULL,0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 3: Nivel 1 – Práctica', 2) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Juegos', 'gym', 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://scratch.mit.edu/projects/146851449/fullscreen','juego',NULL,0),
  (s,'https://scratch.mit.edu/projects/68534384/fullscreen/','juego',NULL,1),
  (s,'https://scratch.mit.edu/projects/148731524/fullscreen/','juego',NULL,2),
  (s,'https://scratch.mit.edu/projects/150381452/fullscreen/','juego',NULL,3),
  (s,'https://scratch.mit.edu/projects/148560151/fullscreen','juego',NULL,4),
  (s,'https://scratch.mit.edu/projects/147139672/fullscreen/','juego',NULL,5),
  (s,'https://scratch.mit.edu/projects/146706397/fullscreen/','juego',NULL,6);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 4: Nivel 2 – Clases', 3) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Partituras', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://drive.google.com/drive/folders/0Byevmj7vkP25eGpJUDB6ZzluNjg','drive',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Go Tell Aunt Rody', NULL, 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=7FvCsYSbeio','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Mary Had a Little Lamb', NULL, 2) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=e26WIWVQ1nQ','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Cuckoo acompañamiento', NULL, 3) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=sTLq8dG7dl8','video',NULL,0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 5: Nivel 2 – Práctica', 4) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Obras de repaso', 'gym', 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=1j2REphfeKw','video',NULL,0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 6: Nivel 3 – Clases', 5) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'French Children''s Song acompañamiento', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=t0AoNrsRj4c','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Go Tell Aunt Rody acompañamiento', NULL, 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=52ehSFEDYGk','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Escalas', NULL, 2) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=ZKqtyC205K4','video',NULL,0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 8: Nivel 4 – Clases', 6) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Little Playmate', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=pywQJFpQzHo','video',NULL,0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 9: Nivel 4 – Práctica', 7) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Juegos', 'gym', 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'http://www.aprendomusica.com/m_aprendonotas.html','juego','Aprendo notas',0),
  (s,'https://aprendomusica.com/const2/04dictadoRitmico/game.html','juego','Dictado rítmico',1),
  (s,'http://www.aprendomusica.com/const2/44instrumsuena/game.html','juego','¿Qué instrumento suena?',2),
  (s,'http://www.aprendomusica.com/const2/30dictadoritmico1/game.html','juego','Dictado rítmico 1',3);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Repertorio', 'gym', 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=Vm3zltOg2jM','video','Allegretto 1',0),
  (s,'https://www.youtube.com/watch?v=tMz8-PV5v0I','video','Allegretto 2',1);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 10: Nivel 5 – Clases', 8) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Partituras', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://drive.google.com/drive/folders/0Byevmj7vkP25eGpJUDB6ZzluNjg','drive',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Allegretto', NULL, 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=Vm3zltOg2jM','video','Allegretto 1',0),
  (s,'https://www.youtube.com/watch?v=tMz8-PV5v0I','video','Allegretto 2',1);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 11: Nivel 5 – Práctica', 9) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Obras de repaso', 'gym', 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=eePx88Ak60U','video',NULL,0),
  (s,'https://www.youtube.com/watch?v=pJzUtHtjWzw','video',NULL,1),
  (s,'https://www.youtube.com/watch?v=m2htqTHcngY','video',NULL,2),
  (s,'https://www.youtube.com/watch?v=anosN4GXv58','video',NULL,3),
  (s,'https://www.youtube.com/watch?v=MjSUJq81v44','video',NULL,4);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Allegretto práctica', 'gym', 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=qLxxAvZjfDA','video',NULL,0),
  (s,'https://www.youtube.com/watch?v=vXI8PCn81AY','video',NULL,1);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Audiolibro', 'gym', 2) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=VS8vI6-iVTU','video',NULL,0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 12: Nivel 6 – Clases', 10) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Partituras', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://drive.google.com/drive/folders/0Byevmj7vkP25eGpJUDB6ZzluNjg','drive',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Allegro', NULL, 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=2-cq6rjs3XY','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Musette', NULL, 2) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=unFAUPGxfYc','video',NULL,0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('piano', 'Módulo 13: Nivel 6 – Práctica', 11) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Obras de repaso', 'gym', 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=EwvsFD-sJxQ','video',NULL,0),
  (s,'https://www.youtube.com/watch?v=KtvaAO1--fo','video',NULL,1),
  (s,'https://www.youtube.com/watch?v=F1QSK3q8olU','video',NULL,2),
  (s,'https://www.youtube.com/watch?v=CjUNHA25hGs','video',NULL,3);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Audiolibro', 'gym', 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=VS8vI6-iVTU','video',NULL,0);

-- ================================================================
-- 🎻 VIOLÍN
-- ================================================================
INSERT INTO modulos (curso_id, nombre, orden) VALUES ('violin', 'Módulo 1: Preparatorio', 0) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Pre-Violín (Fundamentos)', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=pyRN-sKkHig','video',NULL,0),
  (s,'https://www.youtube.com/watch?v=hF5HZtMo8q4','video',NULL,1),
  (s,'https://www.youtube.com/watch?v=rJa5CIa16l4','video',NULL,2),
  (s,'https://www.youtube.com/watch?v=KKU3vkLJzzg','video',NULL,3),
  (s,'https://www.youtube.com/watch?v=UnAVQHnnEIU','video',NULL,4);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('violin', 'Módulo 2: Nivel 1 – Clases', 1) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Clases', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=xjNi8pT31ns','video','Clase 1',0),
  (s,'https://www.youtube.com/watch?v=lYGrXpl-BKA','video','Clase 2',1),
  (s,'https://www.youtube.com/watch?v=1fXiHC7l-QE','video','Clase 3',2);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('violin', 'Módulo 3: Nivel 1 – Práctica', 2) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Ejercicios técnicos', 'gym', 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=fVrQsbuqsZ4','video','Concierto para la cuerda A',0),
  (s,'https://www.youtube.com/watch?v=v3pa8JzJ2Io','video','Canción para el arco / Ubicación de notas',1);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Repertorio inicial', 'gym', 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=Rubs0HnN6_8','video','Canciones pre-Estrellita',0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('violin', 'Módulo 4: Nivel 2 – Clases', 3) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Clase base', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=1fXiHC7l-QE','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Estrellita', NULL, 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=ljAg3fF7sME','video','Estrellita + Variaciones',0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('violin', 'Módulo 5: Nivel 2 – Práctica', 4) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Repertorio principal', 'gym', 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=ljAg3fF7sME','video','Estrellita',0),
  (s,'https://www.youtube.com/watch?v=DQwlRgQCJpc','video','Variación A',1),
  (s,'https://www.youtube.com/watch?v=-UUoBjF25qU','video','Variación B',2),
  (s,'https://www.youtube.com/watch?v=GGAKO44KFPE','video','Variación C',3);

-- ================================================================
-- 🎤 CANTO
-- ================================================================
INSERT INTO modulos (curso_id, nombre, orden) VALUES ('canto', 'Módulo 1: Introducción al Canto', 0) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Introducción al curso', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=8W-wlXI14hI','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Técnica vocal y respiración', NULL, 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=DCQ4AO6d_hI','video',NULL,0),
  (s,'https://www.youtube.com/watch?v=UXJrvPtLtEE','video',NULL,1),
  (s,'https://www.youtube.com/watch?v=PraxvMFqC8A','video',NULL,2),
  (s,'https://www.youtube.com/watch?v=hHxnmidwgxU','video',NULL,3),
  (s,'https://www.youtube.com/watch?v=mXxhVVG6rI4','video',NULL,4),
  (s,'https://www.youtube.com/watch?v=sQ1wgX-OjvI','video',NULL,5),
  (s,'https://www.youtube.com/watch?v=MN4lBsyU5gU','video',NULL,6);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Anatomía (soporte vocal)', NULL, 2) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://upload.wikimedia.org/wikipedia/commons/b/b4/Rotation_Maxilla.gif','imagen','Maxilar',0),
  (s,'https://upload.wikimedia.org/wikipedia/commons/4/44/Rotation_palatine_bone.gif','imagen','Hueso palatino',1),
  (s,'https://upload.wikimedia.org/wikipedia/commons/4/4c/Rotation_sphenoid_bone.gif','imagen','Hueso esfenoides',2),
  (s,'https://upload.wikimedia.org/wikipedia/commons/1/14/Rotation_Vomer_bone.gif','imagen','Vómer',3),
  (s,'https://upload.wikimedia.org/wikipedia/commons/9/9e/Rotation_ethmoid.gif','imagen','Etmoides',4);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Molde vocal', NULL, 3) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=YrcGGd3CmFs','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Introducción al calentamiento', NULL, 4) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=x3wRS4zzwu0','video',NULL,0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('canto', 'Módulo 2: Nivel 1 – Clases', 1) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Calentamiento básico', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=QVTkPfzegIA','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Cómo estudiar el texto', NULL, 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=zTqFLMTLrnA','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Repertorio: La Cumbia Cienaguera', NULL, 2) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=sWVb36VNH1Y','video','Canción completa',0),
  (s,'https://www.youtube.com/watch?v=B0YnEBSj4Ts','video','Parte 1',1),
  (s,'https://www.youtube.com/watch?v=bQVVLPsK-is','video','Parte 2 y 3',2);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('canto', 'Módulo 3: Nivel 1 – Práctica', 2) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Calentamiento práctico', 'gym', 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=QVTkPfzegIA','video',NULL,0);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Práctica repertorio', 'gym', 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=sWVb36VNH1Y','video','La Cumbia Cienaguera',0),
  (s,'https://www.youtube.com/watch?v=RYQkiN7bTk4','video','Karaoke',1);

-- ================================================================
-- 🎸 GUITARRA ADULTOS
-- ================================================================
INSERT INTO modulos (curso_id, nombre, orden) VALUES ('guitarra-adultos', 'Nivel 1', 0) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Videos', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=9MuJWGdNSKs','video',NULL,0),
  (s,'https://www.youtube.com/watch?v=lEdGusuww2w','video',NULL,1),
  (s,'https://www.youtube.com/watch?v=wc5a_kRGmaA','video',NULL,2),
  (s,'https://www.youtube.com/watch?v=extlxolJLXU','video',NULL,3);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Material (Drive)', NULL, 1) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://drive.google.com/file/d/1PBYVmeCUiPYTAbfJB04ZRvCw_zMJc0di/view','drive',NULL,0),
  (s,'https://drive.google.com/file/d/1Wsw6olRZH6UCGlSQUupv4q8sj8ahyY7x/view','drive',NULL,1),
  (s,'https://drive.google.com/file/d/1wVhpThsWJFtqFiUirppUQoyhDmWAeq68/view','drive',NULL,2),
  (s,'https://drive.google.com/file/d/1cnV9rbHgZB97pK4u4MWhN-nSOof8mG_q/view','drive',NULL,3),
  (s,'https://drive.google.com/file/d/1R8P3lE5RedWx0hi9IHQCDeHnwHtmCBOc/view','drive',NULL,4),
  (s,'https://drive.google.com/file/d/1ZJHq_jNXf9OHGVs_H8a8vNp1yQli3Pi8/view','drive',NULL,5);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Ejercicios y Partituras', NULL, 2) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://ovejamusic.com/wp-content/uploads/2023/09/Estreellita-1.pdf','pdf','Estrellita',0),
  (s,'https://ovejamusic.com/wp-content/uploads/2023/09/Ejercicio-No2.pdf','pdf','Ejercicio No. 2',1),
  (s,'https://ovejamusic.com/wp-content/uploads/2023/09/Lightly-Row.pdf','pdf','Lightly Row',2),
  (s,'https://ovejamusic.com/wp-content/uploads/2023/09/Cumpleanos-en-C-Ver.2.pdf','pdf','Cumpleaños en C',3),
  (s,'https://ovejamusic.com/wp-content/uploads/2023/09/CUMPLEANOS-C-Armonia.pdf','pdf','Cumpleaños en C – Armonía',4);
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Recursos visuales', NULL, 3) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://ovejamusic.com/wp-content/uploads/2023/09/Captura-de-pantalla-2023-09-13-a-las-12.41.26-p.m.png','imagen',NULL,0);

-- ================================================================
-- 🎵 CIUDAD MUSICAL (Iniciación Musical)
-- ================================================================
INSERT INTO modulos (curso_id, nombre, orden) VALUES ('ciudad-musical', 'Introducción', 0) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Test de conexión musical', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES (s,'https://www.youtube.com/watch?v=_7-zXWlfm7w','video',NULL,0);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('ciudad-musical', 'Nivel 1', 1) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Clases', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=-0WLDkqAa9w','video','Clase 1',0),
  (s,'https://www.youtube.com/watch?v=jvezmaHm4_g','video','Clase 2',1),
  (s,'https://www.youtube.com/watch?v=MaFRPPeVY9I','video','Clase 3',2),
  (s,'https://www.youtube.com/watch?v=rym04Hc2MAM','video','Clase 4',3),
  (s,'https://www.youtube.com/watch?v=IEbo8adbHC0','video','Clase 5',4),
  (s,'https://www.youtube.com/watch?v=xtI_msYn-io','video','Clase 6',5),
  (s,'https://www.youtube.com/watch?v=dNuRA_hH7VM','video','Clase 7',6),
  (s,'https://www.youtube.com/watch?v=HF5OPZ5DXHQ','video','Clase 8',7),
  (s,'https://www.youtube.com/watch?v=1PASoxxDepI','video','Clase 9',8),
  (s,'https://www.youtube.com/watch?v=mdYIwgDb0FQ','video','Clase 10',9),
  (s,'https://www.youtube.com/watch?v=U0UlhwqIe2I','video','Clase 11',10),
  (s,'https://www.youtube.com/watch?v=yCDXP1oQGNE','video','Clase 12',11),
  (s,'https://www.youtube.com/watch?v=UwhIN-VBzmI','video','Clase 13',12);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('ciudad-musical', 'Nivel 2', 2) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Clases', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=fCV7rxVKhr8','video','Clase 1',0),
  (s,'https://www.youtube.com/watch?v=mTYIYk3rQGg','video','Clase 3',1),
  (s,'https://www.youtube.com/watch?v=1HevlFQlex0','video','Clase 5',2),
  (s,'https://www.youtube.com/watch?v=rG9HAl_faTE','video','Clase 6',3),
  (s,'https://www.youtube.com/watch?v=Muu28qArYmU','video','Clase 7',4),
  (s,'https://www.youtube.com/watch?v=ZxuO_apX460','video','Clase 8',5),
  (s,'https://www.youtube.com/watch?v=po_mymNMPBI','video','Clase 9',6),
  (s,'https://www.youtube.com/watch?v=B8JxDzjZEsk','video','Clase 10',7),
  (s,'https://www.youtube.com/watch?v=orzfocmPF_c','video','Clase 11',8),
  (s,'https://www.youtube.com/watch?v=3ATBAi7NXPU','video','Clase 12',9);

INSERT INTO modulos (curso_id, nombre, orden) VALUES ('ciudad-musical', 'Nivel 3', 3) RETURNING id INTO m;
INSERT INTO secciones (modulo_id, nombre, zona, orden) VALUES (m, 'Clases', NULL, 0) RETURNING id INTO s;
INSERT INTO recursos (seccion_id, url, tipo, label, orden) VALUES
  (s,'https://www.youtube.com/watch?v=Z_noro-8FP0','video','Clase 1',0),
  (s,'https://www.youtube.com/watch?v=6BUySlrAMv8','video','Clase 2',1),
  (s,'https://www.youtube.com/watch?v=OBEOCos-vkQ','video','Clase 3',2),
  (s,'https://www.youtube.com/watch?v=Ml8rbNr1TIE','video','Clase 4',3),
  (s,'https://www.youtube.com/watch?v=snexwZpNkcc','video','Clase 5',4),
  (s,'https://www.youtube.com/watch?v=32t1t60I0XA','video','Clase 6',5),
  (s,'https://www.youtube.com/watch?v=__Vw31ow6Fc','video','Clase 7',6),
  (s,'https://www.youtube.com/watch?v=LChMWpVBXaE','video','Clase 9',7);

END $$;
