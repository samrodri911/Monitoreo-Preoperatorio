<script setup lang="ts">
import type { PautaConCheckin } from '../../types/database.types';
import { Check, Clock, AlertTriangle, ShieldCheck } from 'lucide-vue-next';

const props = defineProps<{
  pauta: PautaConCheckin;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle', pautaId: string): void;
}>();

const isCompleted = () => props.pauta.checkin?.estado === 'completado';

function formatHora(fechaIso?: string) {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) + ')';
}
</script>

<template>
  <div
    class="p-5 rounded-2xl border transition-all duration-200"
    :class="[
      isCompleted()
        ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
        : pauta.es_critica
        ? 'bg-white border-amber-300 shadow-sm hover:border-amber-400'
        : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
    ]"
  >
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      
      <!-- Contenido de la Pauta -->
      <div class="flex-1 space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <!-- Badge de Etapa Temporal -->
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
            <Clock class="w-3.5 h-3.5 text-slate-500" />
            -{{ pauta.horas_previas }}h antes
          </span>

          <!-- Badge de Crítica vs Recomendación -->
          <span
            v-if="pauta.es_critica"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
          >
            <AlertTriangle class="w-3.5 h-3.5 text-amber-600" />
            Pauta Crítica Quirúrgica
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600"
          >
            Recomendación de Confort
          </span>

          <!-- Badge de Completada -->
          <span
            v-if="isCompleted()"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800"
          >
            <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
            Verificado
          </span>
        </div>

        <!-- Título -->
        <h3
          class="text-lg font-bold tracking-tight text-slate-900 transition-colors"
          :class="{ 'line-through text-slate-500': isCompleted() }"
        >
          {{ pauta.titulo }}
        </h3>

        <!-- Descripción didáctica -->
        <p class="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
          {{ pauta.descripcion }}
        </p>

        <!-- Información de respuesta u observaciones -->
        <div v-if="pauta.checkin?.fecha_respuesta" class="text-xs text-emerald-700 font-medium pt-1">
          ✓ Confirmado el {{ formatHora(pauta.checkin.fecha_respuesta) }}
          <span v-if="pauta.checkin?.observaciones" class="block text-slate-500 mt-0.5">
            Nota: "{{ pauta.checkin.observaciones }}"
          </span>
        </div>
      </div>

      <!-- Botón de Check-in Háptico Visual (Gran accesibilidad) -->
      <div class="flex-shrink-0">
        <button
          type="button"
          @click="emit('toggle', pauta.id)"
          :disabled="disabled"
          class="w-full md:w-auto px-5 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all transform active:scale-95 focus-ring cursor-pointer"
          :class="[
            isCompleted()
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/25'
          ]"
        >
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center border transition-colors"
            :class="isCompleted() ? 'bg-white text-emerald-600 border-white' : 'bg-white/20 border-white/40 text-transparent'"
          >
            <Check class="w-4 h-4 stroke-[3]" />
          </div>
          <span>{{ isCompleted() ? 'Cumplido con éxito' : 'Marcar como Cumplido' }}</span>
        </button>
      </div>

    </div>
  </div>
</template>
