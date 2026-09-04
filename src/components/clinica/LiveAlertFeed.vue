<script setup lang="ts">
import type { Alerta } from '../../types/database.types';
import { AlertOctagon, CheckCircle2, ShieldAlert, Clock } from 'lucide-vue-next';

defineProps<{
  alertas: Alerta[];
}>();

const emit = defineEmits<{
  (e: 'marcarAtendida', alertaId: string): void;
}>();

function formatTime(isoStr: string) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
    <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
          <ShieldAlert class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-900">Feed de Alertas Quirúrgicas en Vivo</h3>
          <span class="text-xs text-slate-500">Notificaciones automáticas en tiempo real</span>
        </div>
      </div>

      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
        Sincronizado vía Realtime
      </span>
    </div>

    <!-- Lista de Alertas -->
    <div class="space-y-3">
      <div
        v-for="alerta in alertas"
        :key="alerta.id"
        class="p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        :class="[
          alerta.atendida
            ? 'bg-slate-50 border-slate-200 opacity-60'
            : alerta.nivel === 'rojo'
            ? 'bg-rose-50/80 border-rose-300'
            : alerta.nivel === 'amarillo'
            ? 'bg-amber-50/80 border-amber-300'
            : 'bg-emerald-50/80 border-emerald-300'
        ]"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            :class="[
              alerta.nivel === 'rojo'
                ? 'bg-rose-600 text-white'
                : alerta.nivel === 'amarillo'
                ? 'bg-amber-600 text-white'
                : 'bg-emerald-600 text-white'
            ]"
          >
            <AlertOctagon v-if="alerta.nivel === 'rojo'" class="w-4 h-4" />
            <ShieldAlert v-else-if="alerta.nivel === 'amarillo'" class="w-4 h-4" />
            <CheckCircle2 v-else class="w-4 h-4" />
          </div>

          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <span
                class="text-xs font-black uppercase tracking-wider"
                :class="alerta.nivel === 'rojo' ? 'text-rose-900' : alerta.nivel === 'amarillo' ? 'text-amber-900' : 'text-emerald-900'"
              >
                Nivel {{ alerta.nivel }}
              </span>
              <span class="text-xs text-slate-400">•</span>
              <span class="text-xs text-slate-500 flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ formatTime(alerta.created_at) }}
              </span>
              <span v-if="alerta.atendida" class="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                Atendida
              </span>
            </div>
            <p class="text-sm font-medium text-slate-800 leading-snug">
              {{ alerta.mensaje }}
            </p>
          </div>
        </div>

        <button
          v-if="!alerta.atendida && (alerta.nivel === 'rojo' || alerta.nivel === 'amarillo')"
          type="button"
          @click="emit('marcarAtendida', alerta.id)"
          class="sm:self-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-2xs focus-ring cursor-pointer flex-shrink-0"
        >
          Marcar como Atendida
        </button>
      </div>
    </div>
  </div>
</template>
