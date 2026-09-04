<script setup lang="ts">
import type { AlertaNivel } from '../../types/database.types';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-vue-next';

defineProps<{
  nivel: AlertaNivel;
  showText?: boolean;
}>();
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border shadow-xs"
    :class="[
      nivel === 'verde'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
        : nivel === 'amarillo'
        ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
        : 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
    ]"
  >
    <!-- Punto o Icono -->
    <span
      class="w-2.5 h-2.5 rounded-full flex-shrink-0"
      :class="[
        nivel === 'verde'
          ? 'bg-emerald-500'
          : nivel === 'amarillo'
          ? 'bg-amber-500'
          : 'bg-rose-600 ring-4 ring-rose-200'
      ]"
    ></span>

    <component
      :is="nivel === 'verde' ? ShieldCheck : nivel === 'amarillo' ? AlertTriangle : AlertOctagon"
      class="w-4 h-4"
    />

    <span v-if="showText !== false">
      {{ nivel === 'verde' ? 'Óptimo (Verde)' : nivel === 'amarillo' ? 'Alerta (Amarillo)' : 'Riesgo Crítico (Rojo)' }}
    </span>
  </span>
</template>
