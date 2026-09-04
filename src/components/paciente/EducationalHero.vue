<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Cirugia, Paciente } from '../../types/database.types';
import { HeartHandshake, Clock, ShieldCheck, Home, Calendar, Activity } from 'lucide-vue-next';

const props = defineProps<{
  cirugia: Cirugia | null;
  paciente: Paciente | null;
}>();

const now = ref(Date.now());
let intervalId: any = null;

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

const diffMs = computed(() => {
  if (!props.cirugia?.fecha_programada) return 0;
  const target = new Date(props.cirugia.fecha_programada).getTime();
  return Math.max(0, target - now.value);
});

const isPassed = computed(() => diffMs.value <= 0);

const days = computed(() => Math.floor(diffMs.value / (1000 * 60 * 60 * 24)));
const hours = computed(() => Math.floor((diffMs.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
const minutes = computed(() => Math.floor((diffMs.value % (1000 * 60 * 60)) / (1000 * 60)));
const seconds = computed(() => Math.floor((diffMs.value % (1000 * 60)) / 1000));

function formatFecha(fechaStr?: string) {
  if (!fechaStr) return '';
  const date = new Date(fechaStr);
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div class="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden space-y-6">
    <!-- Círculos decorativos de fondo -->
    <div class="absolute -top-24 -right-24 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Título Empático en Lenguaje Claro -->
    <div class="relative z-10 max-w-4xl space-y-3">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30">
        <HeartHandshake class="w-4 h-4 text-teal-300" />
        Centro Educativo Preoperatorio Empático (RD1)
      </div>

      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
        {{ cirugia?.nombre_sencillo || cirugia?.tipo_cirugia || 'Cirugía Programada' }}
      </h1>

      <div class="flex flex-wrap items-center gap-3 text-slate-200 text-sm capitalize">
        <span class="inline-flex items-center gap-1.5 font-medium bg-white/10 px-3 py-1 rounded-xl border border-white/15">
          <Calendar class="w-4 h-4 text-teal-300" />
          {{ formatFecha(cirugia?.fecha_programada) }}
        </span>
        <span class="text-slate-400 font-mono text-xs">Nombre médico: {{ cirugia?.tipo_cirugia }}</span>
      </div>
    </div>

    <!-- CUENTA REGRESIVA DINÁMICA INTEGRADA -->
    <div class="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-5 relative z-10">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-teal-500/30 text-teal-300 flex items-center justify-center flex-shrink-0">
            <Clock class="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-teal-200 block">Tiempo Restante para tu Ingreso</span>
            <span class="text-sm font-medium text-slate-200">
              {{ isPassed ? 'Procedimiento en curso o finalizado' : 'Mantén la calma y sigue tus pautas de preparación.' }}
            </span>
          </div>
        </div>

        <!-- Reloj Digital Segmentado -->
        <div class="flex items-center gap-2 sm:gap-3 self-center md:self-auto">
          <div class="flex flex-col items-center px-3.5 py-2 rounded-xl bg-white/15 border border-white/20 min-w-[64px]">
            <span class="text-2xl sm:text-3xl font-black font-mono tracking-tight">{{ String(days).padStart(2, '0') }}</span>
            <span class="text-[10px] uppercase font-bold tracking-widest text-teal-200">Días</span>
          </div>
          <span class="text-xl font-bold opacity-60">:</span>
          <div class="flex flex-col items-center px-3.5 py-2 rounded-xl bg-white/15 border border-white/20 min-w-[64px]">
            <span class="text-2xl sm:text-3xl font-black font-mono tracking-tight">{{ String(hours).padStart(2, '0') }}</span>
            <span class="text-[10px] uppercase font-bold tracking-widest text-teal-200">Horas</span>
          </div>
          <span class="text-xl font-bold opacity-60">:</span>
          <div class="flex flex-col items-center px-3.5 py-2 rounded-xl bg-white/15 border border-white/20 min-w-[64px]">
            <span class="text-2xl sm:text-3xl font-black font-mono tracking-tight">{{ String(minutes).padStart(2, '0') }}</span>
            <span class="text-[10px] uppercase font-bold tracking-widest text-teal-200">Min</span>
          </div>
          <span class="text-xl font-bold opacity-60">:</span>
          <div class="flex flex-col items-center px-3.5 py-2 rounded-xl bg-white/15 border border-white/20 min-w-[64px]">
            <span class="text-2xl sm:text-3xl font-black font-mono tracking-tight">{{ String(seconds).padStart(2, '0') }}</span>
            <span class="text-[10px] uppercase font-bold tracking-widest text-teal-200">Seg</span>
          </div>
        </div>

      </div>
    </div>

    <!-- TARJETAS DE INDICADORES CLAVE ACCESIBLES -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 relative z-10 text-sm">
      
      <!-- 1. Tipo de Anestesia y Sensación -->
      <div class="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1.5">
        <div class="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck class="w-4 h-4" />
          <span>Tipo de Anestesia</span>
        </div>
        <span class="font-bold text-white block text-base leading-snug">
          {{ cirugia?.tipo_anestesia || 'Anestesia General (Sueño profundo)' }}
        </span>
        <p class="text-xs text-slate-300 leading-relaxed pt-1">
          {{ cirugia?.sensacion_anestesia || 'Sentirás una suave calidez en el brazo y te dormirás plácidamente sin sentir molestia alguna.' }}
        </p>
      </div>

      <!-- 2. Duración Estimada -->
      <div class="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1.5">
        <div class="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
          <Clock class="w-4 h-4" />
          <span>Duración Estimada</span>
        </div>
        <span class="font-bold text-white block text-lg">
          {{ cirugia?.duracion_estimada || '60 a 90 minutos' }}
        </span>
        <p class="text-xs text-slate-300 leading-relaxed">
          Tiempo aproximado de trabajo quirúrgico en sala.
        </p>
      </div>

      <!-- 3. Tiempo en Sala de Recuperación -->
      <div class="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1.5">
        <div class="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
          <Activity class="w-4 h-4" />
          <span>Recuperación en Sala</span>
        </div>
        <span class="font-bold text-white block text-base leading-snug">
          {{ cirugia?.tiempo_recuperacion_sala || '1 a 2 horas en URPA' }}
        </span>
        <p class="text-xs text-slate-300 leading-relaxed">
          Despertar tibio con mantas térmicas y analgésicos inmediatos.
        </p>
      </div>

      <!-- 4. Días de Incapacidad Estimados -->
      <div class="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1.5">
        <div class="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
          <Home class="w-4 h-4" />
          <span>Incapacidad Estimada</span>
        </div>
        <span class="font-bold text-white block text-base leading-snug">
          {{ cirugia?.dias_incapacidad_estimados || '3 a 5 días de reposo' }}
        </span>
        <p class="text-xs text-slate-300 leading-relaxed">
          Retorno progresivo a tus actividades cotidianas en casa.
        </p>
      </div>

    </div>

  </div>
</template>
