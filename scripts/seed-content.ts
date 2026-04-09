/**
 * Seed de contenido — migra cursos.ts → Supabase
 *
 * Uso:
 *   npx tsx scripts/seed-content.ts
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { CURSOS } from '../src/data/cursos'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('❌  Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(url, key)

async function seed() {
  console.log('🌱 Iniciando seed de contenido...\n')
  let totalRecursos = 0

  for (let ci = 0; ci < CURSOS.length; ci++) {
    const curso = CURSOS[ci]
    process.stdout.write(`📚 ${curso.emoji} ${curso.nombre} ... `)

    // Upsert curso
    const { error: ce } = await db.from('cursos').upsert(
      { id: curso.id, nombre: curso.nombre, emoji: curso.emoji, orden: ci },
      { onConflict: 'id' }
    )
    if (ce) { console.error(`\n  ❌ ${ce.message}`); continue }

    for (let mi = 0; mi < curso.modulos.length; mi++) {
      const modulo = curso.modulos[mi]

      // Upsert módulo
      const { error: me } = await db.from('modulos').upsert(
        { id: modulo.id, curso_id: curso.id, nombre: modulo.nombre, orden: mi },
        { onConflict: 'id' }
      )
      if (me) { console.error(`\n  ❌ modulo ${modulo.id}: ${me.message}`); continue }

      for (let si = 0; si < modulo.secciones.length; si++) {
        const seccion = modulo.secciones[si]

        // Buscar sección existente por modulo + orden
        const { data: existing } = await db
          .from('secciones')
          .select('id')
          .eq('modulo_id', modulo.id)
          .eq('orden', si)
          .maybeSingle()

        let seccionId: string

        if (existing) {
          await db.from('secciones')
            .update({ nombre: seccion.nombre, zona: seccion.zona ?? null })
            .eq('id', existing.id)
          seccionId = existing.id
        } else {
          const { data, error: se } = await db.from('secciones')
            .insert({ modulo_id: modulo.id, nombre: seccion.nombre, zona: seccion.zona ?? null, orden: si })
            .select('id')
            .single()
          if (se || !data) { console.error(`\n  ❌ sección: ${se?.message}`); continue }
          seccionId = data.id
        }

        // Limpiar recursos existentes y re-insertar
        await db.from('recursos').delete().eq('seccion_id', seccionId)

        for (let ri = 0; ri < seccion.recursos.length; ri++) {
          const rec = seccion.recursos[ri]
          const { error: re } = await db.from('recursos').insert({
            seccion_id: seccionId,
            url: rec.url,
            tipo: rec.tipo,
            label: rec.label ?? null,
            orden: ri,
          })
          if (re) console.error(`\n    ❌ recurso: ${re.message}`)
          else totalRecursos++
        }
      }
    }
    console.log('✅')
  }

  console.log(`\n🎉 Seed completado — ${CURSOS.length} cursos, ${totalRecursos} recursos`)
}

seed().catch(err => { console.error('❌ Fatal:', err); process.exit(1) })
