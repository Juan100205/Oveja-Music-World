#!/usr/bin/env node
/**
 * TEST COMPLETO: Flujo de recurso desde Admin hasta Mapa
 *
 * Este script simula:
 * 1. Crear un recurso de prueba
 * 2. Verificar la cadena de conexiones
 * 3. Llamar a la API de contenido
 * 4. Reportar dónde falla
 *
 * Uso:
 *   node scripts/test-flujo-completo.mjs
 *   node scripts/test-flujo-completo.mjs --curso=piano
 *   node scripts/test-flujo-completo.mjs --dry-run  (no crea nada, solo verifica)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const args = process.argv.slice(2);
const cursoTarget = args.find(a => a.startsWith('--curso='))?.split('=')[1] || 'piano';
const dryRun = args.includes('--dry-run');

let testResults = [];

function log(section, status, message) {
  const icon = status === '✅' ? '✅' : status === '❌' ? '❌' : status === '⚠️' ? '⚠️' : '🔍';
  const color = status === '✅' ? '\x1b[32m' : status === '❌' ? '\x1b[31m' : status === '⚠️' ? '\x1b[33m' : '\x1b[36m';
  const reset = '\x1b[0m';
  console.log(`${color}${icon}\x1b[0m [${section}] ${message}`);
  testResults.push({ section, status, message });
}

async function testFlujo() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧪 TEST COMPLETO: Flujo Admin → Mapa Interactivo');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Curso objetivo: ${cursoTarget}`);
  console.log(`Modo: ${dryRun ? 'SIMULACIÓN (no crea datos)' : 'REAL (crea datos de prueba)'}`);
  console.log('');

  let testRecursoId = null;
  let testSeccionId = null;

  try {
    // ═══════════════════════════════════════════════════════════════
    // FASE 1: VERIFICAR ESTRUCTURA BASE
    // ═══════════════════════════════════════════════════════════════
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('FASE 1: Verificar estructura base');
    console.log('───────────────────────────────────────────────────────────────\n');

    // 1.1 Verificar que existe el curso
    const { data: curso } = await supabase
      .from('cursos')
      .select('*')
      .eq('id', cursoTarget)
      .single();

    if (!curso) {
      log('CURSO', '❌', `No existe el curso '${cursoTarget}' en la BD`);
      log('CURSO', '💡', `Cursos disponibles: ${(await supabase.from('cursos').select('id, nombre')).data?.map(c => c.id).join(', ')}`);
      throw new Error('Curso no existe');
    }
    log('CURSO', '✅', `Encontrado: ${curso.nombre} (${curso.id})`);

    // 1.2 Verificar que existe el instrumento
    const { data: instrumento } = await supabase
      .from('instrumentos')
      .select('*')
      .eq('curso_id', cursoTarget)
      .eq('activo', true)
      .single();

    if (!instrumento) {
      log('INSTRUMENTO', '❌', `No hay instrumento activo con curso_id='${cursoTarget}'`);

      const { data: instrumentosActivos } = await supabase
        .from('instrumentos')
        .select('id, nombre, curso_id, activo')
        .eq('activo', true);

      log('INSTRUMENTO', '💡', `Instrumentos activos: ${instrumentosActivos?.map(i => `${i.id}(curso:${i.curso_id})`).join(', ')}`);

      if (!dryRun) {
        log('INSTRUMENTO', '🔧', `Creando instrumento de prueba...`);
        const { data: newInst, error } = await supabase.from('instrumentos').insert({
          id: cursoTarget,
          nombre: curso.nombre,
          emoji: curso.emoji || '🎵',
          descripcion: 'Instrumento de prueba',
          color: '#ec488a',
          glow: 'rgba(236,72,138,0.45)',
          zona: 'clase',
          curso_id: cursoTarget,
          activo: true,
          orden: 0
        }).select().single();

        if (error) {
          log('INSTRUMENTO', '❌', `Error creando instrumento: ${error.message}`);
        } else {
          log('INSTRUMENTO', '✅', `Instrumento creado: ${newInst.id}`);
        }
      }
    } else {
      log('INSTRUMENTO', '✅', `Encontrado: ${instrumento.nombre} (zona: ${instrumento.zona})`);
    }

    // 1.3 Verificar módulos
    const { data: modulos } = await supabase
      .from('modulos')
      .select('*')
      .eq('curso_id', cursoTarget)
      .order('orden');

    if (!modulos || modulos.length === 0) {
      log('MÓDULOS', '❌', `No hay módulos para curso_id='${cursoTarget}'`);

      if (!dryRun) {
        log('MÓDULOS', '🔧', `Creando módulo de prueba...`);
        const { data: newMod, error } = await supabase.from('modulos').insert({
          id: `${cursoTarget}-test-modulo`,
          curso_id: cursoTarget,
          nombre: 'Módulo de Prueba',
          orden: 0
        }).select().single();

        if (error) {
          log('MÓDULOS', '❌', `Error creando módulo: ${error.message}`);
          throw new Error('No se pudo crear módulo');
        }

        log('MÓDULOS', '✅', `Módulo creado: ${newMod.id}`);

        // Crear sección también
        log('SECCIÓN', '🔧', `Creando sección de prueba...`);
        const { data: newSec, error: secError } = await supabase.from('secciones').insert({
          id: `${cursoTarget}-test-seccion`,
          modulo_id: newMod.id,
          nombre: 'Sección de Prueba',
          zona: 'clase',
          orden: 0
        }).select().single();

        if (secError) {
          log('SECCIÓN', '❌', `Error creando sección: ${secError.message}`);
          throw new Error('No se pudo crear sección');
        }

        log('SECCIÓN', '✅', `Sección creada: ${newSec.id}`);
        testSeccionId = newSec.id;
      } else {
        log('MÓDULOS', '⚠️', 'Simulación: Se crearía módulo y sección de prueba');
        testSeccionId = 'seccion-simulada';
      }
    } else {
      log('MÓDULOS', '✅', `${modulos.length} módulos encontrados`);
      modulos.forEach(m => log('MÓDULOS', '  ', `  - ${m.nombre} (${m.id})`));

      // Usar el primer módulo
      const { data: secciones } = await supabase
        .from('secciones')
        .select('*')
        .eq('modulo_id', modulos[0].id)
        .order('orden');

      if (!secciones || secciones.length === 0) {
        log('SECCIONES', '❌', `El módulo ${modulos[0].id} no tiene secciones`);

        if (!dryRun) {
          log('SECCIÓN', '🔧', `Creando sección de prueba...`);
          const { data: newSec, error } = await supabase.from('secciones').insert({
            modulo_id: modulos[0].id,
            nombre: 'Sección de Prueba',
            zona: 'clase',
            orden: 0
          }).select().single();

          if (error) {
            log('SECCIÓN', '❌', `Error creando sección: ${error.message}`);
            throw new Error('No se pudo crear sección');
          }

          log('SECCIÓN', '✅', `Sección creada: ${newSec.id}`);
          testSeccionId = newSec.id;
        }
      } else {
        log('SECCIONES', '✅', `${secciones.length} secciones encontradas`);
        secciones.forEach(s => {
          const zonaInfo = s.zona ? `[zona: ${s.zona}]` : '[zona: null (ambas)]';
          log('SECCIONES', '  ', `  - ${s.nombre} ${zonaInfo}`);
        });

        // Usar primera sección disponible
        testSeccionId = secciones[0].id;
        log('TEST', '✅', `Usando sección existente: ${secciones[0].nombre}`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 2: CREAR RECURSO DE PRUEBA
    // ═══════════════════════════════════════════════════════════════
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('FASE 2: Crear recurso de prueba');
    console.log('───────────────────────────────────────────────────────────────\n');

    if (!testSeccionId) {
      throw new Error('No hay sección disponible para el test');
    }

    const testUrl = `https://www.youtube.com/watch?v=TEST${Date.now()}`;

    if (dryRun) {
      log('RECURSO', '⚠️', `Modo simulación: No se crea recurso`);
      log('RECURSO', '💡', `Se crearía en sección ${testSeccionId}:`);
      log('RECURSO', '  ', `  URL: ${testUrl}`);
      log('RECURSO', '  ', `  Label: "Video de prueba"`);
      log('RECURSO', '  ', `  Tipo: video`);
    } else {
      log('RECURSO', '🔧', `Creando recurso de prueba...`);

      const { data: recurso, error } = await supabase.from('recursos').insert({
        seccion_id: testSeccionId,
        url: testUrl,
        tipo: 'video',
        label: 'Video de prueba - TEST',
        orden: 0,
        interacciones: []
      }).select().single();

      if (error) {
        log('RECURSO', '❌', `Error creando recurso: ${error.message}`);
        throw error;
      }

      testRecursoId = recurso.id;
      log('RECURSO', '✅', `Creado: ${recurso.id}`);
      log('RECURSO', '  ', `  URL: ${recurso.url}`);
      log('RECURSO', '  ', `  Sección: ${recurso.seccion_id}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 3: VERIFICAR API DE CONTENIDO
    // ═══════════════════════════════════════════════════════════════
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('FASE 3: Verificar API de contenido');
    console.log('───────────────────────────────────────────────────────────────\n');

    // Verificar que el curso tiene datos
    const { data: apiData, error: apiError } = await supabase
      .from('modulos')
      .select(`
        id, nombre, orden,
        secciones:secciones (
          id, nombre, zona, orden,
          recursos:recursos (id, url, tipo, label, orden)
        )
      `)
      .eq('curso_id', cursoTarget)
      .order('orden');

    if (apiError) {
      log('API', '❌', `Error consultando datos: ${apiError.message}`);
    } else if (!apiData || apiData.length === 0) {
      log('API', '❌', `No hay módulos para curso_id='${cursoTarget}'`);
    } else {
      log('API', '✅', `Datos encontrados en BD`);

      let totalRecursos = 0;
      let totalSecciones = 0;
      let recursosEncontrados = [];

      apiData.forEach(mod => {
        log('API', '  ', `📦 ${mod.nombre} (${mod.id})`);
        mod.secciones?.forEach(sec => {
          totalSecciones++;
          const zonaInfo = sec.zona || 'null (ambas)';
          log('API', '  ', `   📑 ${sec.nombre} [zona: ${zonaInfo}]`);

          sec.recursos?.forEach(rec => {
            totalRecursos++;
            const isTest = rec.url?.includes('TEST');
            const marker = isTest ? '👉 TEST:' : '     ';
            log('API', isTest ? '✅' : '  ', `${marker} ${rec.label || 'SIN LABEL'} (${rec.tipo})`);

            if (isTest) {
              recursosEncontrados.push(rec);
            }
          });
        });
      });

      log('API', '✅', `Total: ${apiData.length} módulos, ${totalSecciones} secciones, ${totalRecursos} recursos`);

      if (!dryRun && testRecursoId) {
        if (recursosEncontrados.length > 0) {
          log('TEST', '✅', `✅ RECURSO DE PRUEBA ENCONTRADO EN API`);
          log('TEST', '✅', `   ID: ${recursosEncontrados[0].id}`);
          log('TEST', '✅', `   Label: ${recursosEncontrados[0].label}`);
          log('TEST', '✅', `   URL: ${recursosEncontrados[0].url}`);
        } else {
          log('TEST', '❌', `❌ RECURSO DE PRUEBA NO ENCONTRADO EN API`);
          log('TEST', '❌', `   Se creó pero no aparece en la consulta`);

          // Diagnóstico adicional
          const { data: rawRecurso } = await supabase
            .from('recursos')
            .select('*')
            .eq('id', testRecursoId)
            .single();

          if (rawRecurso) {
            log('TEST', '💡', `El recurso existe en BD:`);
            log('TEST', '  ', `  seccion_id: ${rawRecurso.seccion_id}`);
            log('TEST', '  ', `  label: ${rawRecurso.label}`);

            // Verificar sección
            const { data: secCheck } = await supabase
              .from('secciones')
              .select('*, modulo:modulo_id(curso_id)')
              .eq('id', rawRecurso.seccion_id)
              .single();

            if (secCheck) {
              log('TEST', '💡', `La sección existe:`);
              log('TEST', '  ', `  nombre: ${secCheck.nombre}`);
              log('TEST', '  ', `  zona: ${secCheck.zona || 'null'}`);
              log('TEST', '  ', `  modulo_id: ${secCheck.modulo_id}`);
              log('TEST', '  ', `  curso_id: ${secCheck.modulo?.curso_id}`);

              if (secCheck.modulo?.curso_id !== cursoTarget) {
                log('TEST', '❌', `❌ PROBLEMA DETECTADO:`);
                log('TEST', '❌', `   El curso del módulo (${secCheck.modulo?.curso_id})`);
                log('TEST', '❌', `   NO coincide con el objetivo (${cursoTarget})`);
                log('TEST', '💡', `   FIX: UPDATE modulos SET curso_id = '${cursoTarget}' WHERE id = '${secCheck.modulo_id}';`);
              }

              if (secCheck.zona === 'gym') {
                log('TEST', '⚠️', `⚠️ La sección tiene zona='gym'`);
                log('TEST', '⚠️', `   Solo aparecerá en /escuela/gym, NO en /escuela/clase`);
                log('TEST', '💡', `   FIX: UPDATE secciones SET zona = NULL WHERE id = '${secCheck.id}';`);
              }
            }
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 4: VERIFICAR CONFIGURACIÓN ESTÁTICA
    // ═══════════════════════════════════════════════════════════════
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('FASE 4: Verificar configuración estática (CLASES_CONFIG)');
    console.log('───────────────────────────────────────────────────────────────\n');

    // Leer el archivo de clases
    const clasesContent = await import('../src/data/clases.ts').catch(() => null);

    if (!clasesContent) {
      log('CONFIG', '⚠️', 'No se pudo leer CLASES_CONFIG');
    } else {
      // Buscar en el archivo directamente
      const fs = await import('fs');
      const content = fs.readFileSync('./src/data/clases.ts', 'utf8');

      const claseMatch = content.match(new RegExp(`id:\\s*['"]${cursoTarget}['"]`, 'i'));

      if (!claseMatch) {
        log('CONFIG', '❌', `No se encontró clase '${cursoTarget}' en CLASES_CONFIG`);
        log('CONFIG', '💡', 'Clases disponibles en el archivo:');
        const matches = content.matchAll(/id:\s*['"]([^'"]+)['"]/g);
        for (const m of matches) {
          log('CONFIG', '  ', `  - ${m[1]}`);
        }
      } else {
        const fullMatch = content.substring(content.indexOf(claseMatch[0]) - 200, content.indexOf(claseMatch[0]) + 200);
        const cursoIdMatch = fullMatch.match(/cursoId:\s*['"]([^'"]+)['"]/);

        if (cursoIdMatch) {
          const staticCursoId = cursoIdMatch[1];
          log('CONFIG', '✅', `CLASES_CONFIG.id = '${cursoTarget}'`);
          log('CONFIG', '✅', `CLASES_CONFIG.cursoId = '${staticCursoId}'`);

          if (staticCursoId !== cursoTarget) {
            log('CONFIG', '⚠️', `⚠️ El cursoId es diferente al id de la clase`);
            log('CONFIG', '💡', `   La API buscará: /api/content?id=${staticCursoId}`);
            log('CONFIG', '💡', `   Los módulos deben tener: curso_id = '${staticCursoId}'`);

            // Verificar si hay módulos con ese curso_id
            const { data: modCheck } = await supabase
              .from('modulos')
              .select('id, nombre')
              .eq('curso_id', staticCursoId);

            if (!modCheck || modCheck.length === 0) {
              log('CONFIG', '❌', `❌ No hay módulos con curso_id='${staticCursoId}'`);
              log('CONFIG', '❌', `   Este es el problema: el cursoId de la clase`);
              log('CONFIG', '❌', `   no coincide con ningún curso_id en la BD`);
            } else {
              log('CONFIG', '✅', `   Hay ${modCheck.length} módulos con ese curso_id`);
            }
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 5: LIMPIEZA (si no es dry-run)
    // ═══════════════════════════════════════════════════════════════
    if (!dryRun && testRecursoId) {
      console.log('\n───────────────────────────────────────────────────────────────');
      console.log('FASE 5: Limpieza');
      console.log('───────────────────────────────────────────────────────────────\n');

      log('CLEANUP', '🗑️', `Eliminando recurso de prueba...`);
      await supabase.from('recursos').delete().eq('id', testRecursoId);
      log('CLEANUP', '✅', `Recurso eliminado`);

      // Solo eliminar sección/módulo si los creamos nosotros
      if (testSeccionId && testSeccionId.includes('test')) {
        log('CLEANUP', '🗑️', `Eliminando sección de prueba...`);
        await supabase.from('secciones').delete().eq('id', testSeccionId);
        log('CLEANUP', '✅', `Sección eliminada`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN
    // ═══════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN DEL TEST');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const exitos = testResults.filter(r => r.status === '✅').length;
    const errores = testResults.filter(r => r.status === '❌').length;
    const advertencias = testResults.filter(r => r.status === '⚠️').length;

    console.log(`Resultados: ${exitos} ✅ | ${errores} ❌ | ${advertencias} ⚠️`);
    console.log('');

    if (errores > 0) {
      console.log('❌ PROBLEMAS DETECTADOS:');
      testResults.filter(r => r.status === '❌').forEach(r => {
        console.log(`   ❌ [${r.section}] ${r.message}`);
      });
      console.log('');
      console.log('💡 SOLUCIONES COMUNES:');
      console.log('   1. Verificar que el curso_id de los módulos coincida con CLASES_CONFIG.cursoId');
      console.log('   2. Verificar que las secciones tengan zona=NULL (o zona="clase" para clase)');
      console.log('   3. Verificar que exista un instrumento activo con ese curso_id');
    } else if (advertencias > 0) {
      console.log('⚠️ Funciona pero hay advertencias (revisar zona, labels, etc.)');
    } else {
      console.log('✅ Todo funciona correctamente');
    }

    console.log('');

  } catch (err) {
    console.error('\n❌ ERROR EN TEST:', err.message);
    console.error(err);
    process.exit(1);
  }
}

testFlujo();
