#!/usr/bin/env node
/**
 * Verificar por qué un recurso específico no aparece en el mapa
 *
 * Uso:
 *   node scripts/check-recurso.mjs --url="https://youtube.com/..."
 *   node scripts/check-recurso.mjs --id="uuid"
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);
const urlFilter = args.find(a => a.startsWith('--url='))?.split('=')[1];
const idFilter = args.find(a => a.startsWith('--id='))?.split('=')[1];

async function check() {
  console.log('🔍 Verificando recurso...\n');

  if (!urlFilter && !idFilter) {
    console.log('Uso: node scripts/check-recurso.mjs --url="https://..."');
    process.exit(1);
  }

  // Buscar recurso
  let query = supabase.from('recursos').select('*');
  if (idFilter) query = query.eq('id', idFilter);
  else query = query.like('url', `%${urlFilter}%`);

  const { data: recursos } = await query;

  if (!recursos || recursos.length === 0) {
    console.log('❌ Recurso no encontrado en la BD');
    process.exit(1);
  }

  for (const r of recursos) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📄 RECURSO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`ID:    ${r.id}`);
    console.log(`URL:   ${r.url}`);
    console.log(`Label: ${r.label || '⚠️ SIN LABEL'}`);
    console.log(`Tipo:  ${r.tipo}`);
    console.log('');

    // Traer sección
    const { data: s } = await supabase.from('secciones').select('*').eq('id', r.seccion_id).single();
    if (!s) { console.log('❌ Sección no existe'); continue; }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📑 SECCIÓN');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Nombre: ${s.nombre}`);
    console.log(`Zona:   ${s.zona || 'NULL (ambas)'}`);
    console.log('');

    // Problema de zona
    if (s.zona === 'gym') {
      console.log('⚠️  PROBLEMA: La sección tiene zona="gym"');
      console.log('    → No aparece en /escuela/clase (solo en /escuela/gym)');
      console.log('');
      console.log('💡 FIX:');
      console.log(`    UPDATE secciones SET zona = NULL WHERE id = '${s.id}';`);
      console.log('');
    }

    // Traer módulo
    const { data: m } = await supabase.from('modulos').select('*').eq('id', s.modulo_id).single();
    if (!m) { console.log('❌ Módulo no existe'); continue; }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📦 MÓDULO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Nombre:   ${m.nombre}`);
    console.log(`Curso ID: ${m.curso_id}`);
    console.log('');

    // Problema de práctica
    if (m.nombre.toLowerCase().includes('práctica')) {
      console.log('⚠️  PROBLEMA: El módulo contiene "práctica" en el nombre');
      console.log('    → En CLASE se filtran módulos de práctica');
      console.log('    → Aparece solo en GYM');
      console.log('');
      console.log('💡 SOLUCIÓN:');
      console.log('    1. Mover recurso a un módulo sin "práctica" en el nombre');
      console.log('    2. O ver en /escuela/gym en lugar de /escuela/clase');
      console.log('');
    }

    // Verificar instrumento
    const { data: inst } = await supabase.from('instrumentos').select('*').eq('curso_id', m.curso_id).eq('activo', true).single();
    if (!inst) {
      console.log('⚠️  PROBLEMA: No hay instrumento activo con ese curso_id');
      console.log('');
    } else {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🎸 INSTRUMENTO');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`ID:   ${inst.id}`);
      console.log(`Nombre: ${inst.nombre}`);
      console.log(`Zona: ${inst.zona}`);
      console.log('');
    }

    // Resumen
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN');
    console.log('═══════════════════════════════════════════════════════════════');

    const problemas = [];
    if (s.zona === 'gym') problemas.push('Sección con zona="gym" (solo aparece en gym)');
    if (m.nombre.toLowerCase().includes('práctica')) problemas.push('Módulo es de práctica (filtrado en clase)');
    if (!inst) problemas.push('No hay instrumento activo');
    if (!r.label) problemas.push('Recurso sin label');

    if (problemas.length === 0) {
      console.log('✅ Todo OK - El recurso debería aparecer en el mapa');
    } else {
      console.log('❌ PROBLEMAS ENCONTRADOS:');
      problemas.forEach(p => console.log(`   • ${p}`));
    }
    console.log('');
  }
}

check().catch(console.error);
