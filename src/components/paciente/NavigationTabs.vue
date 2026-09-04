<script setup lang="ts">
import { CalendarClock, GraduationCap } from 'lucide-vue-next';

defineProps<{
  activeTab: 'preparacion' | 'educacion';
  materialesCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:activeTab', tab: 'preparacion' | 'educacion'): void;
}>();
</script>

<template>
  <div class="border-b border-slate-200 bg-white rounded-2xl p-2 shadow-sm">
    <nav class="flex flex-col sm:flex-row gap-2" aria-label="Secciones del paciente">
      
      <!-- Pestaña 1: Conoce tu Cirugía (Educativo RD1) -->
      <button
        type="button"
        @click="emit('update:activeTab', 'educacion')"
        class="flex-1 py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all focus-ring cursor-pointer relative"
        :class="[
          activeTab === 'educacion'
            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        ]"
      >
        <GraduationCap class="w-5 h-5" />
        <span>Conoce tu Cirugía</span>
        <span
          class="text-xs px-2.5 py-0.5 rounded-full font-bold"
          :class="activeTab === 'educacion' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'"
        >
          Centro Educativo ({{ materialesCount }})
        </span>
      </button>

      <!-- Pestaña 2: Mi Preparación Activa -->
      <button
        type="button"
        @click="emit('update:activeTab', 'preparacion')"
        class="flex-1 py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all focus-ring cursor-pointer"
        :class="[
          activeTab === 'preparacion'
            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        ]"
      >
        <CalendarClock class="w-5 h-5" />
        <span>Mi Preparación Activa (Pautas & Check-ins)</span>
      </button>

    </nav>
  </div>
</template>
