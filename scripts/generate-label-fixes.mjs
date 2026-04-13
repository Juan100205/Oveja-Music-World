#!/usr/bin/env node
/**
 * Genera SQL UPDATEs para agregar labels a recursos sin label
 * Basado en el nombre de la sección donde están ubicados
 *
 * Uso:
 *   node scripts/generate-label-fixes.mjs
 *   node scripts/generate-label-fixes.mjs --execute  (ejecuta los updates)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFile, writeFile } from 'fs/promises';

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
const shouldExecute = process.argv.includes('--execute');

// Generar label basado en la URL y el contexto
function generateLabel(url, seccionNombre, tipo) {
  // Si es un juego de Scratch conocido
  if (url.includes('scratch.mit.edu/projects/146851449')) return 'Juego: Notas musicales';
  if (url.includes('scratch.mit.edu/projects/68534384')) return 'Juego: Ritmo y tiempo';
  if (url.includes('scratch.mit.edu/projects/148731524')) return 'Juego: Entrenamiento auditivo';
  if (url.includes('scratch.mit.edu/projects/150381452')) return 'Juego: Memoria musical';
  if (url.includes('scratch.mit.edu/projects/148560151')) return 'Juego: Dictado melódico';
  if (url.includes('scratch.mit.edu/projects/147139672')) return 'Juego: Teoría musical';
  if (url.includes('scratch.mit.edu/projects/146706397')) return 'Juego: Práctica de intervalos';

  // Si es un juego de aprendomusica
  if (url.includes('m_aprendonotas')) return 'Juego: Aprendo notas';
  if (url.includes('dictadoRitmico')) return 'Juego: Dictado rítmico';
  if (url.includes('44instrumsuena')) return 'Juego: ¿Qué instrumento suena?';
  if (url.includes('30dictadoritmico1')) return 'Juego: Dictado rítmico 1';

  // Si es una carpeta de Drive
  if (url.includes('drive.google.com/drive/folders')) {
    if (seccionNombre.toLowerCase().includes('partitura')) return 'Carpeta de partituras';
    return 'Carpeta de recursos';
  }

  // Si es un archivo de Drive
  if (url.includes('drive.google.com/file')) {
    return `Material: ${seccionNombre}`;
  }

  // Videos - usar el nombre de la sección
  if (tipo === 'video') {
    // Si la sección tiene nombre descriptivo
    if (seccionNombre && !seccionNombre.match(/^[\d\s]+$/)) {
      return `${seccionNombre} - Tutorial`;
    }
    return 'Video tutorial';
  }

  // Default: tipo + nombre de sección
  return `${tipo.charAt(0).toUpperCase() + tipo.slice(1)}: ${seccionNombre}`;
}

async function main() {
  console.log('🔍 Buscando recursos sin label...\n');

  // Obtener todos los recursos sin label con su contexto
  const { data: recursos, error } = await supabase
    .from('recursos')
    .select('id, url, tipo, seccion:seccion_id(nombre, modulo:modulo_id(nombre, curso:cursos_id(nombre)))')
    .is('label', null);

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (!recursos || recursos.length === 0) {
    console.log('✅ Todos los recursos ya tienen label');
    return;
  }

  console.log(`⚠️  Encontrados ${recursos.length} recursos sin label:\n`);

  const updates = [];

  for (const r of recursos) {
    const seccionNombre = r.seccion?.nombre || 'Sin sección';
    const moduloNombre = r.seccion?.modulo?.nombre || 'Sin módulo';
    const cursoNombre = r.seccion?.modulo?.curso?.nombre || 'Sin curso';

    const label = generateLabel(r.url, seccionNombre, r.tipo);

    console.log(`📍 ${cursoNombre} > ${moduloNombre} > ${seccionNombre}`);
    console.log(`   URL: ${r.url.substring(0, 60)}...`);
    console.log(`   Label generado: "${label}"`);
    console.log('');

    updates.push({
      id: r.id,
      label,
      sql: `UPDATE recursos SET label = '${label.replace(/'/g, "''")}' WHERE id = '${r.id}';`
    });
  }

  // Generar archivo SQL
  const sqlContent = `-- Auto-generated fix for resources without labels
-- Generated: ${new Date().toISOString()}
-- Total updates: ${updates.length}

BEGIN;

${updates.map(u => u.sql).join('\n')}

COMMIT;

-- Verification
SELECT COUNT(*) as total, COUNT(label) as with_label FROM recursos;
`;

  await writeFile('scripts/generated-label-fixes.sql', sqlContent);
  console.log(`✅ SQL generado: scripts/generated-label-fixes.sql`);
  console.log(`   ${updates.length} UPDATEs listos para ejecutar`);

  // Si se pide ejecutar
  if (shouldExecute) {
    console.log('\n🚀 Ejecutando updates...\n');

    for (const u of updates) {
      const { error: updateError } = await supabase
        .from('recursos')
        .update({ label: u.label })
        .eq('id', u.id);

      if (updateError) {
        console.error(`❌ Error en ${u.id}: ${updateError.message}`);
      } else {
        console.log(`✅ Actualizado: ${u.label}`);
      }
    }

    console.log('\n✅ Proceso completado');
  } else {
    console.log('\n💡 Para ejecutar los cambios automáticamente:');
    console.log('   node scripts/generate-label-fixes.mjs --execute');
    console.log('\n💡 O copia el SQL generado y ejecútalo en Supabase SQL Editor');
  }
}

main().catch(console.error);
