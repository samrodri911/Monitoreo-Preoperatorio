<script setup lang="ts">
import { useRouter } from 'vue-router';
import { usePacienteStore } from '../stores/pacienteStore';
import { MOCK_PACIENTE_A_ID, MOCK_PACIENTE_B_ID } from '../lib/mockData';
import { isSupabaseConfigured } from '../lib/supabase';
import { Activity, Sparkles, CheckCircle2, AlertOctagon, ArrowRight, Database, Layers } from 'lucide-vue-next';

const router = useRouter();
const pacienteStore = usePacienteStore();

function navegarAPaciente(pacienteId: string) {
  pacienteStore.cargarDatosPaciente(pacienteId);
  router.push('/paciente');
}
</script>

<template>
  <div class="min-h-screen pb-20 pt-10 bg-slate-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      <!-- Hero Principal del Proyecto -->
      <div class="text-center max-w-3xl mx-auto space-y-4">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
          <Sparkles class="w-4 h-4 text-teal-600" />
          Metodología TRIZ • Principio de Segmentación & Anticipación (RD1)
        </div>

        <h1 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Ecosistema Phygital Inclusivo <span class="text-teal-600">"Tech-and-Touch"</span>
        </h1>

        <p class="text-base sm:text-lg text-slate-600 leading-relaxed">
          Plataforma preoperatoria para educar al paciente, disipar la ansiedad anticipatoria y predecir en tiempo real el riesgo de cancelaciones de cirugías por fallos en ayuno o asepsia.
        </p>
      </div>

      <!-- Estado de Supabase / Modo Offline -->
      <div
        class="p-4 rounded-2xl border text-sm flex flex-col sm:flex-row items-center justify-between gap-4"
        :class="isSupabaseConfigured ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-amber-50 border-amber-300 text-amber-950'"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="isSupabaseConfigured ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'"
          >
            <Database class="w-5 h-5" />
          </div>
          <div>
            <strong class="block font-bold">
              {{ isSupabaseConfigured ? '✓ Conexión Activa con Supabase PostgreSQL & WebSockets' : '⚡ Modo Demo Reactivo Activo (Supabase en espera de credenciales)' }}
            </strong>
            <span class="text-xs opacity-90 block">
              {{ isSupabaseConfigured ? 'Los cambios se persisten directamente en tu base de datos cloud.' : 'El sistema emula la sincronización en tiempo real internamente. Puedes probar todos los flujos ahora mismo y pegar tus claves en .env.local cuando Supabase se recupere.' }}
            </span>
          </div>
        </div>

        <span class="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border bg-white"
          :class="isSupabaseConfigured ? 'text-emerald-700 border-emerald-300' : 'text-amber-700 border-amber-300'">
          {{ isSupabaseConfigured ? 'Cloud Live' : 'Local Fallback' }}
        </span>
      </div>

      <!-- Selector de Experiencias / Vistas Clave -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Tarjeta 1: Caso A (Carlos Mendoza - 48h - Verde) -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                Semáforo Verde
              </span>
              <span class="text-xs font-bold text-slate-400">-48 Horas</span>
            </div>

            <h3 class="text-xl font-bold text-slate-900">Carlos Alberto Mendoza</h3>
            <p class="text-xs text-slate-500">Colecistectomía Laparoscópica</p>

            <p class="text-sm text-slate-600 leading-relaxed">
              Paciente con pautas al día. Ideal para explorar el <strong>Centro Educativo (RD1)</strong>: video explicativo, infografía anatómica y checklist de maleta.
            </p>
          </div>

          <button
            type="button"
            @click="navegarAPaciente(MOCK_PACIENTE_A_ID)"
            class="mt-6 w-full py-3 px-4 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2 transition-colors focus-ring cursor-pointer"
          >
            <span>Ver Portal del Paciente</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Tarjeta 2: Caso B (Elena Restrepo - 6h - Rojo) -->
        <div class="bg-white rounded-3xl border border-rose-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                <AlertOctagon class="w-3.5 h-3.5 text-rose-600" />
                Semáforo Rojo
              </span>
              <span class="text-xs font-bold text-rose-600">-6 Horas</span>
            </div>

            <h3 class="text-xl font-bold text-slate-900">Elena María Restrepo</h3>
            <p class="text-xs text-slate-500">Artroplastia Total de Cadera</p>

            <p class="text-sm text-slate-600 leading-relaxed">
              <strong>Riesgo crítico de cancelación:</strong> Pauta de Ayuno Estricto (-8h) vencida sin confirmación. Pruébalo para ver la alerta hospitalaria en vivo.
            </p>
          </div>

          <button
            type="button"
            @click="navegarAPaciente(MOCK_PACIENTE_B_ID)"
            class="mt-6 w-full py-3 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 transition-colors focus-ring cursor-pointer"
          >
            <span>Ver Caso en Riesgo</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Tarjeta 3: Tablero Clínico Semáforo -->
        <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                <Activity class="w-3.5 h-3.5 text-teal-400" />
                Control Hospitalario
              </span>
              <span class="text-xs font-bold text-teal-400">Tiempo Real</span>
            </div>

            <h3 class="text-xl font-bold text-white">Tablero Clínico Semáforo</h3>
            <p class="text-xs text-teal-200">Enfermería & Cirujanos</p>

            <p class="text-sm text-slate-300 leading-relaxed">
              Vista centralizada para monitorear todos los quirófanos programados, predecir cancelaciones y recibir alertas instantáneas cuando el paciente reporta sus check-ins.
            </p>
          </div>

          <router-link
            to="/clinica"
            class="mt-6 w-full py-3 px-4 rounded-xl font-bold text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center gap-2 transition-colors focus-ring"
          >
            <span>Abrir Tablero Hospitalario</span>
            <ArrowRight class="w-4 h-4" />
          </router-link>
        </div>

      </div>

      <!-- Guía de Prueba Rápida de Sincronización en Tiempo Real -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
            <Layers class="w-4 h-4" />
          </div>
          <h4 class="font-bold text-slate-900 text-base">¿Cómo probar la reactividad en tiempo real ahora mismo?</h4>
        </div>
        <ol class="text-sm text-slate-600 space-y-2 pl-6 list-decimal leading-relaxed">
          <li>Abre una ventana de navegador en <code class="px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 font-mono font-bold">/clinica</code>.</li>
          <li>Abre otra ventana al lado en <code class="px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 font-mono font-bold">/paciente</code> seleccionando a <strong>Elena Restrepo</strong>.</li>
          <li>En la vista de Elena, haz clic en <strong>"Marcar como Cumplido"</strong> en la pauta de <em>Ayuno Estricto de Sólidos</em>.</li>
          <li>¡Observa la ventana de <code class="px-1.5 py-0.5 bg-slate-100 rounded text-teal-800 font-mono font-bold">/clinica</code>! El semáforo de Elena cambiará automáticamente de 🔴 Rojo a 🟢 Verde sin recargar la página.</li>
        </ol>
      </div>

    </div>
  </div>
</template>
