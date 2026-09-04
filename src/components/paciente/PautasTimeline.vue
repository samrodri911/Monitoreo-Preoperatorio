<script setup lang="ts">
import { computed } from 'vue';
import type { PautaConCheckin } from '../../types/database.types';
import CheckinItem from './CheckinItem.vue';
import { CalendarClock } from 'lucide-vue-next';

const props = defineProps<{
  pautas: PautaConCheckin[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleCheckin', pautaId: string): void;
}>();

// Agrupar pautas por horas previas ordenadas
const pautasOrdenadas = computed(() => {
  return [...props.pautas].sort((a, b) => b.horas_previas - a.horas_previas);
});

const totalCriticas = computed(() => props.pautas.filter(p => p.es_critica).length);
const criticasCompletadas = computed(() => props.pautas.filter(p => p.es_critica && p.checkin?.estado === 'completado').length);
const progresoPct = computed(() => totalCriticas.value === 0 ? 100 : Math.round((criticasCompletadas.value / totalCriticas.value) * 100));
</script>

<template>
  <div class="space-y-6">
    
    <!-- Barra de Adherencia Quirúrgica -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock class="w-5 h-5 text-teal-600" />
            Cronograma Dosificado de Preparación
          </h2>
          <p class="text-sm text-slate-600">
            Pautas cronológicas obligatorias para garantizar la seguridad anestésica y quirúrgica.
          </p>
        </div>

        <div class="text-right flex-shrink-0">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Adherencia Crítica</span>
          <span class="text-lg font-extrabold text-teal-700">
            {{ criticasCompletadas }} de {{ totalCriticas }} verificadas ({{ progresoPct }}%)
          </span>
        </div>
      </div>

      <!-- Barra de Progreso -->
      <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          class="h-full transition-all duration-500 rounded-full"
          :class="progresoPct === 100 ? 'bg-emerald-500' : 'bg-teal-600'"
          :style="{ width: `${progresoPct}%` }"
        ></div>
      </div>
    </div>

    <!-- Lista Cronológica de Pautas -->
    <div class="space-y-4">
      <CheckinItem
        v-for="pauta in pautasOrdenadas"
        :key="pauta.id"
        :pauta="pauta"
        :disabled="disabled"
        @toggle="emit('toggleCheckin', $event)"
      />
    </div>

  </div>
</template>
