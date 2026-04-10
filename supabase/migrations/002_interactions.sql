-- Migration 002: Add interaction points to recursos
-- Run this in your Supabase SQL editor

ALTER TABLE recursos
  ADD COLUMN IF NOT EXISTS interacciones JSONB DEFAULT '[]';

-- Index for querying by URL (used in GET /api/content/interactions)
CREATE INDEX IF NOT EXISTS recursos_url_idx ON recursos (url);

-- Verify
-- SELECT id, url, tipo, interacciones FROM recursos LIMIT 5;
