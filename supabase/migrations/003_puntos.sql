-- Migration 003: Add configurable puntos (points) to resources
-- Run this in your Supabase SQL editor

-- 1. Add puntos column to recursos (nullable — falls back to PUNTOS_POR_TIPO constant)
ALTER TABLE recursos
  ADD COLUMN IF NOT EXISTS puntos INT;

-- 2. Create video_cards table if not exists
CREATE TABLE IF NOT EXISTS video_cards (
  recurso_url TEXT PRIMARY KEY,
  cards       JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Verify
-- SELECT id, url, tipo, puntos FROM recursos LIMIT 5;
