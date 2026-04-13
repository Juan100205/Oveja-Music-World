#!/usr/bin/env node
/**
 * Script para debuggear por qué un recurso no aparece en el mapa
 * Busca por URL o ID de recurso y traza todo el camino
 *
 * Uso:
 *   node scripts/debug-recurso.mjs --url="https://youtube.com/watch?v=..."
 *   node scripts/debug-recurso.mjs --id="uuid-del-recurso"
 */

import { createClient } from '@supabase/suppliance-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const urlFilter = args.find(a => a.startsWith('--url='))?.split('=')[1];
const idFilter = args.find(a => a.startsWith('--id='))?.split('=')[1];

async function debugRecurso() {
  console.log('🔍 DEBUGGER DE RECURSO\n');

  if (!urlFilter && !idFilter) {
    console.log('Uso:');
    console.log('  node scripts/debug-recurso.mjs --url="https://..."');
    console.log('  node scripts/debug-recurso.mjs --id="uuid"');
    process.exit(1);
  }

  // Buscar el recurso
  let query = supabase.from('recursos').select('*');
  if (idFilter) {
    query = query.eq('id', idFilter);
  } else if (urlFilter) {
    query = query.like('url', `%${urlFilter}%`);
  }

  const { data: recursos, error } = await query;

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (!recursos || recursos.length === 0) {
    console.log('❌ No se encontró el recurso');
    console.log(`   Buscando: ${idFilter || urlFilter}`);
    process.exit(1);
  }

  for (const recurso of recursos) {
    console.log('═'.repeat(60));
    console.log('📄 RECURSO ENCONTRADO');
    console.log('═'.repeat(60));
    console.log(`   ID:       ${recurso.id}`);
    console.log(`   URL:      ${recurso.url}`);
    console.log(`   Tipo:     ${recurso.tipo}`);
    console.log(`   Label:    ${recurso.label || '⚠️ SIN LABEL'}`);
    console.log(`   Orden:    ${recurso.orden}`);
    console.log(`   Sección:  ${recurso.seccion_id}`);

    // Buscar la sección
    const { data: seccion } = await supabase
      .from('secciones')
      .select('*')
      .eq('id', recurso.seccion_id)
      .single();

    if (!seccion) {
      console.log('\n   ❌ ERROR: La sección no existe en la BD!');
      console.log(`      Sección ID: ${recurso.seccion_id}`);
      continue;
    }

    console.log('\n   📑 SECCIÓN:');
    console.log(`      ID:       ${seccion.id}`);
    console.log(`      Nombre:   ${seccion.nombre}`);
    console.log(`      Zona:     ${seccion.zona || 'NULL (ambas)'}`);
    console.log(`      Orden:    ${seccion.orden}`);
    console.log(`      Módulo:   ${seccion.modulo_id}`);

    // Buscar el módulo
    const { data: modulo } = await supabase
      .from('modulos')
      .select('*')
      .eq('id', seccion.modulo_id)
      .single();

    if (!modulo) {
      console.log('\n   ❌ ERROR: El módulo no existe en la BD!');
      console.log(`      Módulo ID: ${seccion.modulo_id}`);
      continue;
    }

    console.log('\n   📦 MÓDULO:');
    console.log(`      ID:       ${modulo.id}`);
    console.log(`      Nombre:   ${modulo.nombre}`);
    console.log(`      Orden:    ${modulo.orden}`);
    console.log(`      Curso:    ${modulo.curso_id}`);

    // Buscar el curso
    const { data: curso } = await supabase
      .from('cursos')
      .select('*')
      .eq('id', modulo.curso_id)
      .single();

    if (!curso) {
      console.log('\n   ❌ ERROR: El curso no existe en la BD!');
      console.log(`      Curso ID: ${modulo.curso_id}`);
      continue;
    }

    console.log('\n   🎸 CURSO:');
    console.log(`      ID:       ${curso.id}`);
    console.log(`      Nombre:   ${curso.nombre}`);
    console.log(`      Emoji:    ${curso.emoji}`);

    // Verificar si aparece en la API
    console.log('\n' + '═'.repeat(60));
    console.log('🔗 VERIFICACIÓN API');
    console.log('═'.repeat(60));

    const apiUrl = `/api/content?id=${curso.id}`;
    console.log(`   Endpoint: ${apiUrl}`);
    console.log(`   El curso_id "${curso.id}" debe coincidir con el que se pasa en el URL`);

    // Verificar zona
    console.log('\n   📍 ZONA:');
    if (seccion.zona === 'clase') {
      console.log('      ✅ Aparece en: /escuela/clase/[instrumento]');
      console.log('      ❌ No aparece en: /escuela/gym/[instrumento]');
    } else if (seccion.zona === 'gym') {
      console.log('      ❌ No aparece en: /escuela/clase/[instrumento]');
      console.log('      ✅ Aparece en: /escuela/gym/[instrumento]');
    } else {
      console.log('      ✅ Aparece en: AMBAS (clase y gym)');
    }

    // Verificar si hay más recursos en la misma sección
    const { data: otrosRecursos } = await supabase
      .from('recursos')
      .select('id, label, url')
      .eq('seccion_id', seccion.id);

    console.log(`\n   📊 Esta sección tiene ${otrosRecursos?.length || 0} recursos:`);
    otrosRecursos?.forEach((r, i) => {
      const marker = r.id === recurso.id ? '👉' : '  ';
      console.log(`      ${marker} ${i + 1}. ${r.label || 'SIN LABEL'} (${r.url.substring(0, 50)}...)`);
    });

    // Posibles problemas
    console.log('\n' + '═'.repeat(60));
    console.log('⚠️  POSIBLES PROBLEMAS');
    console.log('═'.repeat(60));

    const problemas = [];

    if (!recurso.label) {
      problemas.push('❌ El recurso no tiene label (aparecerá sin título)');
    }

    if (seccion.zona === 'gym') {
      problemas.push('⚠️  La sección tiene zona="gym" - solo aparece en el gym, no en clase');
    }

    // Verificar si el curso_id coincide con algún instrumento
    const { data: instrumentos } = await supabase
      .from('instrumentos')
      .select('*')
      .eq('curso_id', curso.id);

    if (!instrumentos || instrumentos.length === 0) {
      problemas.push(`❌ No hay instrumentos con curso_id="${curso.id}"`);
      problemas.push('   El instrumento debe tener curso_id que coincida con el curso');
    } else {
      console.log(`   ✅ Hay ${instrumentos.length} instrumento(s) con este curso_id:`);
      instrumentos.forEach(inst => {
        console.log(`      - ${inst.id}: ${inst.nombre} (zona: ${inst.zona})`);
      });
    }

    if (problemas.length === 0) {
      console.log('   ✅ No se detectaron problemas obvios');
    } else {
      problemas.forEach(p => console.log(`   ${p}`));
    }

    // Solución
    console.log('\n' + '═'.repeat(60));
    console.log('🔧 SQL PARA REFERENCIA');
    console.log('═'.repeat(60));
    console.log(`   -- Ver recurso:`);
    console.log(`   SELECT * FROM recursos WHERE id = '${recurso.id}';`);
    console.log(`\n   -- Ver sección:`);
    console.log(`   SELECT * FROM secciones WHERE id = '${seccion.id}';`);
    console.log(`\n   -- Ver módulo:`);
    console.log(`   SELECT * FROM modulos WHERE id = '${modulo.id}';`);
    console.log(`\n   -- Ver curso:`);
    console.log(`   SELECT * FROM cursos WHERE id = '${curso.id}';`);
    console.log(`\n   -- Ver instrumentos de este curso:`);
    console.log(`   SELECT * FROM instrumentos WHERE curso_id = '${curso.id}';`);
  }

  console.log('\n');
}

debugRecurso().catch(console.error);
