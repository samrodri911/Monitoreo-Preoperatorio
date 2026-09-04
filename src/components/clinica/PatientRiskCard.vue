<script setup lang="ts">
import { computed } from 'vue';
import type { CirugiaConDetalle } from '../../types/database.types';
import SemaforoBadge from './SemaforoBadge.vue';
import { Clock, Phone, User, ChevronRight, ShieldAlert } from 'lucide-vue-next';

const props = defineProps<{
  cirugia: CirugiaConDetalle;
}>();

const emit = defineEmits<{
  (e: 'seleccionarPaciente', pacienteId: string): void;
}>();

// Calcular horas restantes para la cirugía
const horasRestantes = computed(() => {
  const diff = new Date(props.cirugia.fecha_programada).getTime() - Date.now();
  const horas = Math.round(diff / (1000 * 3600));
  return horas;
});

const pautasCriticasTotales = computed(() => props.cirugia.pautas.filter(p => p.es_critica).length);
const pautasCriticasCompletadas = computed(() => props.cirugia.pautas.filter(p => p.es_critica && p.checkin?.estado === 'completado').length);

const alertaActiva = computed(() => {
  return props.cirugia.alertas.find(a => !a.atendida && (a.nivel === 'rojo' || a.nivel === 'amarillo'));
});
</script>

<template>
  <div
    class="bg-white rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md p-6"
    :class="[
      cirugia.semaforo === 'rojo'
        ? 'border-rose-300 ring-1 ring-rose-300/50 bg-gradient-to-r from-rose-50/20 via-white to-white'
        : cirugia.semaforo === 'amarillo'
        ? 'border-amber-300 ring-1 ring-amber-300/50 bg-gradient-to-r from-amber-50/20 via-white to-white'
        : 'border-slate-200 hover:border-teal-300'
    ]"
  >
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      
      <!-- Información del Paciente y Cirugía -->
      <div class="flex-1 space-y-3">
        <div class="flex flex-wrap items-center gap-2.5">
          <SemaforoBadge :nivel="cirugia.semaforo" />

          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
            <Clock class="w-3.5 h-3.5 text-slate-500" />
            Cirugía en:
            <strong :class="horasRestantes <= 8 ? 'text-rose-700 font-black' : 'text-slate-900'">
              {{ horasRestantes > 0 ? `~${horasRestantes} horas` : 'En curso' }}
            </strong>
          </span>

          <span class="text-xs text-slate-500">
            ID: {{ cirugia.paciente.documento }}
          </span>
        </div>

        <div>
          <h3 class="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User class="w-5 h-5 text-slate-400" />
            {{ cirugia.paciente.nombre_completo }}
            <span class="text-xs font-normal text-slate-500">({{ cirugia.paciente.edad }} años)</span>
          </h3>
          <p class="text-sm font-semibold text-teal-700 mt-0.5">
            Procedimiento: {{ cirugia.tipo_cirugia }}
          </p>
        </div>

        <!-- Alerta de Riesgo Inmediato -->
        <div
          v-if="alertaActiva"
          class="p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-start gap-2.5 border"
          :class="alertaActiva.nivel === 'rojo' ? 'bg-rose-100/70 text-rose-950 border-rose-200' : 'bg-amber-100/70 text-amber-950 border-amber-200'"
        >
          <ShieldAlert class="w-4 h-4 flex-shrink-0 mt-0.5" :class="alertaActiva.nivel === 'rojo' ? 'text-rose-600' : 'text-amber-600'" />
          <div>
            <strong>Alerta Clínica:</strong> {{ alertaActiva.mensaje }}
          </div>
        </div>

        <!-- Contacto del Paciente -->
        <div class="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
          <span class="flex items-center gap-1.5 font-medium">
            <Phone class="w-3.5 h-3.5 text-teal-600" />
            {{ cirugia.paciente.telefono }}
          </span>
          <span class="text-slate-300">•</span>
          <span>
            Acompañante: <strong class="text-slate-700">{{ cirugia.paciente.contacto_emergencia }}</strong>
          </span>
        </div>
      </div>

      <!-- Resumen de Pautas y Acciones -->
      <div class="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
        
        <!-- Medidor de Pautas Críticas -->
        <div class="text-left sm:text-right">
          <span class="text-xs uppercase font-bold text-slate-400 block tracking-wider">Pautas Críticas</span>
          <div class="flex items-center gap-2 mt-0.5">
            <span
              class="text-xl font-black"
              :class="cirugia.pautasCriticasPendientes > 0 ? 'text-rose-600' : 'text-emerald-600'"
            >
              {{ pautasCriticasCompletadas }} / {{ pautasCriticasTotales }}
            </span>
            <span class="text-xs font-semibold text-slate-500">verificadas</span>
          </div>
          <span
            v-if="cirugia.pautasCriticasPendientes > 0"
            class="text-[11px] font-bold text-rose-600 block mt-0.5"
          >
            ⚠️ {{ cirugia.pautasCriticasPendientes }} pauta(s) crítica(s) sin confirmar
          </span>
          <span v-else class="text-[11px] font-bold text-emerald-600 block mt-0.5">
            ✓ Protocolo en regla
          </span>
        </div>

        <!-- Botón Ver / Gestionar Paciente -->
        <button
          type="button"
          @click="emit('seleccionarPaciente', cirugia.paciente.id)"
          class="px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 transition-colors focus-ring cursor-pointer"
        >
          <span>Abrir Vista Paciente</span>
          <ChevronRight class="w-4 h-4" />
        </button>

      </div>

    </div>
  </div>
</template>
