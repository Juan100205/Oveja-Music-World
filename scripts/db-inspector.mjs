#!/usr/bin/env node
/**
 * Script para inspeccionar la estructura completa de la BD
 * Muestra: cursos → módulos → secciones → recursos
 *
 * Uso:
 *   node scripts/db-inspector.mjs              # Muestra todo
 *   node scripts/db-inspector.mjs --curso=piano # Filtra por curso
 *   node scripts/db-inspector.mjs --recursos     # Solo recursos con URL
 *   node scripts/db-inspector.mjs --fix-label    # Muestra recursos sin label
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parsear argumentos
const args = process.argv.slice(2);
const filterCurso = args.find(a => a.startsWith('--curso='))?.split('=')[1];
const showOnlyRecursos = args.includes('--recursos');
const showFixLabel = args.includes('--fix-label');
const showStats = args.includes('--stats');

async function getTableStructure(tableName) {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable, column_default')
    .eq('table_name', tableName)
    .order('ordinal_position');

  if (error) return { error: error.message };
  return data;
}

async function inspect() {
  console.log('🔍 OVEJA MUSIC WORLD - DB INSPECTOR\n');
  console.log(`📡 URL: ${supabaseUrl}`);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}\n`);

  // ═══════════════════════════════════════════════════════════════
  // 1. ESTRUCTURA DE TABLAS
  // ═══════════════════════════════════════════════════════════════
  console.log('═'.repeat(60));
  console.log('📋 ESTRUCTURA DE TABLAS');
  console.log('═'.repeat(60));

  const tables = ['cursos', 'modulos', 'secciones', 'recursos'];
  for (const table of tables) {
    console.log(`\n🗂️  Tabla: ${table.toUpperCase()}`);
    const cols = await getTableStructure(table);
    if (cols.error) {
      console.log(`   ❌ Error: ${cols.error}`);
    } else {
      cols.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   • ${col.column_name.padEnd(15)} ${col.data_type.padEnd(12)} ${nullable}${defaultVal}`);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. CONTAR REGISTROS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n═'.repeat(60));
  console.log('📊 CONTADORES');
  console.log('═'.repeat(60));

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ${table.padEnd(12)}: ❌ ${error.message}`);
    } else {
      console.log(`   ${table.padEnd(12)}: ${count} registros`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. ÁRBOL COMPLETO: CURSOS → MÓDULOS → SECCIONES → RECURSOS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n═'.repeat(60));
  console.log('🌳 ÁRBOL DE CONTENIDO');
  console.log('═'.repeat(60));

  let query = supabase.from('cursos').select('*').order('orden');
  if (filterCurso) {
    query = query.eq('id', filterCurso);
  }

  const { data: cursos, error: cursosError } = await query;

  if (cursosError) {
    console.log(`❌ Error cargando cursos: ${cursosError.message}`);
    return;
  }

  if (!cursos || cursos.length === 0) {
    console.log('⚠️ No hay cursos' + (filterCurso ? ` con id="${filterCurso}"` : ''));
    return;
  }

  for (const curso of cursos) {
    console.log(`\n🎸 CURSO: ${curso.id}`);
    console.log(`   Nombre: ${curso.nombre} ${curso.emoji || ''}`);
    console.log(`   Orden:  ${curso.orden}`);

    const { data: modulos } = await supabase
      .from('modulos')
      .select('*')
      .eq('curso_id', curso.id)
      .order('orden');

    if (!modulos || modulos.length === 0) {
      console.log('   └─ ⚠️ Sin módulos');
      continue;
    }

    for (const modulo of modulos) {
      console.log(`\n   📦 MÓDULO: ${modulo.id}`);
      console.log(`      Nombre: ${modulo.nombre}`);
      console.log(`      Orden:  ${modulo.orden}`);

      const { data: secciones } = await supabase
        .from('secciones')
        .select('*')
        .eq('modulo_id', modulo.id)
        .order('orden');

      if (!secciones || secciones.length === 0) {
        console.log('      └─ ⚠️ Sin secciones');
        continue;
      }

      for (const seccion of secciones) {
        const zonaStr = seccion.zona ? ` [zona: ${seccion.zona}]` : '';
        console.log(`\n      📑 SECCIÓN: ${seccion.id.substring(0, 8)}...`);
        console.log(`         Nombre: ${seccion.nombre}${zonaStr}`);
        console.log(`         Orden:  ${seccion.orden}`);

        const { data: recursos } = await supabase
          .from('recursos')
          .select('*')
          .eq('seccion_id', seccion.id)
          .order('orden');

        if (!recursos || recursos.length === 0) {
          console.log('         └─ ⚠️ Sin recursos');
          continue;
        }

        for (const recurso of recursos) {
          const labelStr = recurso.label ? ` | label: "${recurso.label.substring(0, 30)}"` : ' | ⚠️ SIN LABEL';
          const tipoIcon = {
            video: '🎬',
            drive: '📁',
            juego: '🎮',
            pdf: '📄',
            imagen: '🖼️',
            herramienta: '🔧',
            otro: '📎'
          }[recurso.tipo] || '📎';

          console.log(`         └─ ${tipoIcon} ${recurso.tipo.padEnd(12)} ${recurso.url.substring(0, 50).padEnd(52)}${labelStr}`);

          // Mostrar interacciones si existen
          if (recurso.interacciones && Array.isArray(recurso.interacciones) && recurso.interacciones.length > 0) {
            recurso.interacciones.forEach(int => {
              console.log(`            💬 @${int.at_seconds}s: ${int.mensaje.substring(0, 40)}${int.mensaje.length > 40 ? '...' : ''}`);
            });
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. RECURSOS SIN LABEL (para diagnóstico)
  // ═══════════════════════════════════════════════════════════════
  if (showFixLabel || showStats) {
    console.log('\n\n═'.repeat(60));
    console.log('⚠️ RECURSOS SIN LABEL (pueden no aparecer bien en la UI)');
    console.log('═'.repeat(60));

    const { data: allRecursos } = await supabase.from('recursos').select('*, seccion:seccion_id(nombre, modulo:modulo_id(nombre, curso:cursos_id(nombre)))');

    // Como no podemos hacer joins complejos fácilmente, hacemos un approach manual
    const { data: recursosSinLabel } = await supabase
      .from('recursos')
      .select('*')
      .is('label', null);

    if (!recursosSinLabel || recursosSinLabel.length === 0) {
      console.log('✅ Todos los recursos tienen label');
    } else {
      console.log(`❌ ${recursosSinLabel.length} recursos sin label:\n`);
      for (const r of recursosSinLabel) {
        const { data: seccion } = await supabase.from('secciones').select('nombre, modulo_id').eq('id', r.seccion_id).single();
        const moduloNombre = seccion?.modulo_id ? (await supabase.from('modulos').select('nombre, curso_id').eq('id', seccion.modulo_id).single()).data?.nombre : '?';
        console.log(`   - ID: ${r.id}`);
        console.log(`     URL: ${r.url.substring(0, 60)}`);
        console.log(`     Ubicación: ${moduloNombre} > ${seccion?.nombre || '?'}`);
        console.log(`     Acción: UPDATE recursos SET label='Descripción' WHERE id='${r.id}';`);
        console.log('');
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. ESTADÍSTICAS RÁPIDAS
  // ═══════════════════════════════════════════════════════════════
  if (showStats) {
    console.log('\n\n═'.repeat(60));
    console.log('📈 ESTADÍSTICAS');
    console.log('═'.repeat(60));

    // Por tipo
    const { data: porTipo } = await supabase.from('recursos').select('tipo');
    if (porTipo) {
      const counts = {};
      porTipo.forEach(r => { counts[r.tipo] = (counts[r.tipo] || 0) + 1; });
      console.log('\nPor tipo:');
      Object.entries(counts).forEach(([tipo, count]) => {
        console.log(`   ${tipo.padEnd(12)}: ${count}`);
      });
    }

    // Con/sin interacciones
    const { data: todos } = await supabase.from('recursos').select('interacciones');
    if (todos) {
      const conInt = todos.filter(r => r.interacciones && r.interacciones.length > 0).length;
      console.log(`\nCon interacciones: ${conInt}`);
      console.log(`Sin interacciones: ${todos.length - conInt}`);
    }
  }

  console.log('\n✅ Inspección completada\n');
}

inspect().catch(console.error);
