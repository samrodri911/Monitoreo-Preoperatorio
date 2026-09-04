<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-vue-next';

const props = defineProps<{
  targetDateStr?: string;
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
  if (!props.targetDateStr) return 0;
  const target = new Date(props.targetDateStr).getTime();
  return Math.max(0, target - now.value);
});

const isImminent = computed(() => diffMs.value < 12 * 3600 * 1000 && diffMs.value > 0);
const isPassed = computed(() => diffMs.value <= 0);

const days = computed(() => Math.floor(diffMs.value / (1000 * 60 * 60 * 24)));
const hours = computed(() => Math.floor((diffMs.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
const minutes = computed(() => Math.floor((diffMs.value % (1000 * 60 * 60)) / (1000 * 60)));
const seconds = computed(() => Math.floor((diffMs.value % (1000 * 60)) / 1000));
</script>

<template>
  <div
    class="rounded-2xl p-5 border shadow-sm transition-all"
    :class="[
      isImminent
        ? 'bg-amber-50/80 border-amber-300'
        : isPassed
        ? 'bg-emerald-50/80 border-emerald-300'
        : 'bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white border-teal-700'
    ]"
  >
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      
      <!-- Label -->
      <div class="flex items-center gap-3 text-center sm:text-left">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          :class="isImminent ? 'bg-amber-500 text-white' : isPassed ? 'bg-emerald-600 text-white' : 'bg-white/10 text-teal-300'"
        >
          <Clock v-if="!isImminent && !isPassed" class="w-6 h-6" />
          <AlertTriangle v-else-if="isImminent" class="w-6 h-6" />
          <CheckCircle2 v-else class="w-6 h-6" />
        </div>
        <div>
          <span
            class="text-xs font-bold uppercase tracking-wider block"
            :class="isImminent ? 'text-amber-800' : isPassed ? 'text-emerald-800' : 'text-teal-200'"
          >
            Cuenta Regresiva al Quirófano
          </span>
          <span
            class="text-sm font-medium block"
            :class="isImminent ? 'text-amber-900' : isPassed ? 'text-emerald-900' : 'text-slate-300'"
          >
            {{ isPassed ? 'Procedimiento en curso o finalizado' : isImminent ? '¡Etapa crítica final! Mantén reposo y ayuno.' : 'Tiempo restante para tu ingreso hospitalario' }}
          </span>
        </div>
      </div>

      <!-- Reloj Digital Segmentado -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Días -->
        <div
          class="flex flex-col items-center px-3 py-2 rounded-xl border min-w-[64px]"
          :class="isImminent ? 'bg-white text-amber-900 border-amber-200' : 'bg-white/10 text-white border-white/15'"
        >
          <span class="text-2xl sm:text-3xl font-black font-mono tracking-tight">{{ String(days).padStart(2, '0') }}</span>
          <span class="text-[10px] uppercase font-bold tracking-widest opacity-80">Días</span>
        </div>

        <span class="text-xl font-bold opacity-60">:</span>

        <!-- Horas -->
        <div
          class="flex flex-col items-center px-3 py-2 rounded-xl border min-w-[64px]"
          :class="isImminent ? 'bg-white text-amber-900 border-amber-200' : 'bg-white/10 text-white border-white/15'"
        >
          <span class="text-2xl sm:text-3xl font-black font-mono tracking-tight">{{ String(hours).padStart(2, '0') }}</span>
          <span class="text-[10px] uppercase font-bold tracking-widest opacity-80">Horas</span>
        </div>

        <span class="text-xl font-bold opacity-60">:</span>

        <!-- Minutos -->
        <div
          class="flex flex-col items-center px-3 py-2 rounded-xl border min-w-[64px]"
          :class="isImminent ? 'bg-white text-amber-900 border-amber-200' : 'bg-white/10 text-white border-white/15'"
        >
          <span class="text-2xl sm:text-3xl font-black font-mono tracking-tight">{{ String(minutes).padStart(2, '0') }}</span>
          <span class="text-[10px] uppercase font-bold tracking-widest opacity-80">Min</span>
        </div>

        <span class="text-xl font-bold opacity-60">:</span>

        <!-- Segundos -->
        <div
          class="flex flex-col items-center px-3 py-2 rounded-xl border min-w-[64px]"
          :class="isImminent ? 'bg-white text-amber-900 border-amber-200' : 'bg-white/10 text-white border-white/15'"
        >
          <span class="text-2xl sm:text-3xl font-black font-mono tracking-tight">{{ String(seconds).padStart(2, '0') }}</span>
          <span class="text-[10px] uppercase font-bold tracking-widest opacity-80">Seg</span>
        </div>
      </div>

    </div>
  </div>
</template>
