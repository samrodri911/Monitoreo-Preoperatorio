<script setup lang="ts">
import { computed, onUnmounted } from 'vue';
import { useVoiceCall } from '../../composables/useVoiceCall';
import { usePacienteStore } from '../../stores/pacienteStore';
import {
  PhoneOff,
  Mic,
  MicOff,
  ShieldAlert,
  Phone,
  Sparkles,
  HeartHandshake,
  Bot
} from 'lucide-vue-next';

const voiceCall = useVoiceCall();
const pacienteStore = usePacienteStore();

onUnmounted(() => {
  console.log('[VoiceCall] VoiceCallModal desmontado');
  voiceCall.hangUp();
});

const statusBadge = computed(() => {
  switch (voiceCall.callStatus.value) {
    case 'greeting':
      return {
        color: 'bg-teal-500/20 text-teal-200 border-teal-400/40',
        dot: 'bg-teal-400 animate-pulse',
        text: 'Conectando con Sofi...',
        subtext: 'Iniciando tu acompañamiento preoperatorio'
      };
    case 'listening':
      return {
        color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50',
        dot: 'bg-emerald-400 animate-ping',
        text: 'Escuchando... te atiendo con calma',
        subtext: 'Habla con naturalidad, no necesitas tocar nada'
      };
    case 'thinking':
      return {
        color: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
        dot: 'bg-amber-400 animate-pulse',
        text: 'Pensando...',
        subtext: 'Preparando la mejor recomendación clínica para ti'
      };
    case 'speaking':
      return {
        color: 'bg-sky-500/20 text-sky-200 border-sky-400/50',
        dot: 'bg-sky-400 animate-pulse',
        text: 'Hablando...',
        subtext: 'Escucha con atención las indicaciones de Sofi'
      };
    case 'transferred':
      return {
        color: 'bg-rose-500/20 text-rose-200 border-rose-400/50',
        dot: 'bg-rose-500',
        text: 'Transferencia a Soporte de Enfermería (RD4)',
        subtext: 'Tu tranquilidad es prioridad. Te enlazamos con un profesional humano.'
      };
    case 'ending':
      return {
        color: 'bg-slate-500/20 text-slate-200 border-slate-400/40',
        dot: 'bg-slate-400',
        text: 'Finalizando llamada...',
        subtext: '¡Hasta pronto!'
      };
    case 'error':
      return {
        color: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
        dot: 'bg-rose-400',
        text: 'Aviso del sistema de voz',
        subtext: voiceCall.errorMessage.value || 'Ocurrió un inconveniente con el micrófono'
      };
    default:
      return {
        color: 'bg-slate-500/20 text-slate-200 border-slate-400/40',
        dot: 'bg-slate-400',
        text: 'Llamada activa',
        subtext: 'Acompañamiento preoperatorio continuo'
      };
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="voiceCall.isCallModalOpen.value"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-heading"
      >
        <!-- Tarjeta Central de Llamada Inmersiva -->
        <div
          class="relative w-full max-w-xl h-[90vh] max-h-[760px] bg-gradient-to-b from-slate-900 via-teal-950/70 to-slate-950 rounded-3xl border border-teal-500/30 shadow-2xl flex flex-col justify-between p-6 sm:p-8 text-white overflow-hidden"
        >
          <!-- Efectos luminosos de fondo -->
          <div
            class="absolute -top-32 -left-32 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none transition-all duration-700"
            :class="{
              'bg-emerald-500/25': voiceCall.callStatus.value === 'listening',
              'bg-amber-500/25': voiceCall.callStatus.value === 'thinking',
              'bg-sky-500/25': voiceCall.callStatus.value === 'speaking',
              'bg-rose-500/25': voiceCall.callStatus.value === 'transferred'
            }"
          ></div>
          <div class="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Cabecera de la llamada -->
          <div class="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-teal-600/80 border border-teal-400/40 flex items-center justify-center text-teal-200 shadow-md">
                <Bot class="w-5 h-5" />
              </div>
              <div>
                <h2 id="call-heading" class="text-base font-bold text-white flex items-center gap-2">
                  <span>Sofi</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30 font-medium">
                    Asistente IA
                  </span>
                </h2>
                <p class="text-xs text-slate-300">
                  {{ pacienteStore.paciente?.nombre_completo || 'Paciente' }} • {{ pacienteStore.cirugia?.nombre_sencillo || pacienteStore.cirugia?.tipo_cirugia }}
                </p>
              </div>
            </div>

            <!-- Contador de Duración -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-mono font-bold text-teal-200">
              <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span>{{ voiceCall.callDurationFormatted.value }}</span>
            </div>
          </div>

          <!-- Cuerpo Central: Avatar / Esfera Visual Reactiva (CERO TEXTO) -->
          <div class="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-auto py-6">
            
            <!-- Esfera central animada de respiración -->
            <div class="relative flex items-center justify-center my-6">
              <!-- Ondas concéntricas expansivas según estado -->
              <div
                v-if="voiceCall.callStatus.value === 'listening' || voiceCall.callStatus.value === 'speaking'"
                class="absolute w-56 h-56 rounded-full opacity-30 animate-ping pointer-events-none"
                :class="voiceCall.callStatus.value === 'listening' ? 'bg-emerald-500/40' : 'bg-sky-500/40'"
                :style="{ animationDuration: voiceCall.callStatus.value === 'speaking' ? '1.5s' : '2.5s' }"
              ></div>

              <div
                class="absolute w-44 h-44 rounded-full blur-xl opacity-60 transition-all duration-500"
                :class="{
                  'bg-emerald-500': voiceCall.callStatus.value === 'listening',
                  'bg-amber-400': voiceCall.callStatus.value === 'thinking',
                  'bg-sky-400': voiceCall.callStatus.value === 'speaking',
                  'bg-rose-500': voiceCall.callStatus.value === 'transferred',
                  'bg-teal-400': voiceCall.callStatus.value === 'greeting' || voiceCall.callStatus.value === 'idle'
                }"
              ></div>

              <!-- Orbe Principal con gradiente y sombras -->
              <div
                class="relative w-36 h-36 rounded-full flex items-center justify-center shadow-2xl border-4 transition-all duration-500 transform"
                :class="{
                  'border-emerald-300/80 bg-gradient-to-br from-emerald-600 to-teal-900 scale-105 shadow-emerald-500/40': voiceCall.callStatus.value === 'listening',
                  'border-amber-300/80 bg-gradient-to-br from-amber-600 to-amber-950 scale-100 shadow-amber-500/40 animate-pulse': voiceCall.callStatus.value === 'thinking',
                  'border-sky-300/80 bg-gradient-to-br from-sky-600 to-blue-950 scale-110 shadow-sky-500/40': voiceCall.callStatus.value === 'speaking',
                  'border-rose-300/80 bg-gradient-to-br from-rose-700 to-rose-950 scale-100 shadow-rose-500/50': voiceCall.callStatus.value === 'transferred',
                  'border-teal-300/80 bg-gradient-to-br from-teal-600 to-slate-900 scale-100 shadow-teal-500/30': voiceCall.callStatus.value === 'greeting' || voiceCall.callStatus.value === 'idle'
                }"
              >
                <!-- Icono representativo central -->
                <ShieldAlert v-if="voiceCall.callStatus.value === 'transferred'" class="w-16 h-16 text-rose-200 animate-bounce" />
                <Sparkles v-else-if="voiceCall.callStatus.value === 'thinking'" class="w-16 h-16 text-amber-200 animate-spin" style="animation-duration: 6s" />
                <HeartHandshake v-else class="w-16 h-16 text-white transition-transform duration-300" />
              </div>
            </div>

            <!-- Visualizador armónico de barras de audio -->
            <div class="flex items-center gap-1.5 h-10 my-4" aria-hidden="true">
              <div
                v-for="i in 12"
                :key="i"
                class="w-1.5 rounded-full transition-all duration-150"
                :class="{
                  'bg-emerald-400': voiceCall.callStatus.value === 'listening',
                  'bg-amber-400': voiceCall.callStatus.value === 'thinking',
                  'bg-sky-400': voiceCall.callStatus.value === 'speaking',
                  'bg-rose-400': voiceCall.callStatus.value === 'transferred',
                  'bg-teal-400/50': voiceCall.callStatus.value === 'greeting' || voiceCall.callStatus.value === 'idle'
                }"
                :style="{
                  height: voiceCall.callStatus.value === 'speaking' || (voiceCall.callStatus.value === 'listening' && voiceCall.audioLevel.value > 20)
                    ? `${Math.max(8, Math.min(38, Math.sin(i * 0.8 + voiceCall.audioLevel.value * 0.1) * 20 + voiceCall.audioLevel.value * 0.3))}px`
                    : '6px'
                }"
              ></div>
            </div>

            <!-- Indicador de Estado en Letra Grande y Clara (WCAG) -->
            <div class="space-y-1.5 max-w-md px-4">
              <div
                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border transition-colors"
                :class="statusBadge.color"
              >
                <span class="w-2.5 h-2.5 rounded-full" :class="statusBadge.dot"></span>
                <span>{{ statusBadge.text }}</span>
              </div>
              <p class="text-xs sm:text-sm text-slate-300 font-medium">
                {{ statusBadge.subtext }}
              </p>
            </div>

            <!-- Mensaje de Micrófono Silenciado -->
            <div
              v-if="voiceCall.isMuted.value && voiceCall.callStatus.value !== 'transferred'"
              class="mt-3 px-3.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center gap-1.5"
            >
              <MicOff class="w-3.5 h-3.5" />
              <span>Tu micrófono está silenciado</span>
            </div>

            <!-- TARJETA DE TRANSFERENCIA A ENFERMERÍA (RD4) -->
            <div
              v-if="voiceCall.callStatus.value === 'transferred'"
              class="mt-4 p-4 rounded-2xl bg-rose-950/70 border border-rose-400/50 text-left max-w-md w-full space-y-3 animate-in fade-in zoom-in-95 duration-200"
            >
              <div class="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <Phone class="w-4 h-4 text-rose-400" />
                <span>Líneas Directas de Enfermería de Turno 24/7</span>
              </div>
              <p class="text-xs text-rose-100 leading-relaxed">
                Hemos enviado una <strong>alerta prioritaria</strong> a nuestro equipo asistencial. Puedes llamar de inmediato a cualquiera de estas líneas directas:
              </p>
              <div class="space-y-2 pt-1">
                <a
                  href="tel:+573009998877"
                  class="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-rose-300/40 text-xs sm:text-sm font-bold text-white transition-colors"
                >
                  <span>🏥 Enfermería General</span>
                  <span class="font-mono text-emerald-300">+57 300 999 8877</span>
                </a>
                <a
                  href="tel:+573158889900"
                  class="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-rose-300/40 text-xs sm:text-sm font-bold text-white transition-colors"
                >
                  <span>🩺 Coordinación Quirúrgica</span>
                  <span class="font-mono text-emerald-300">+57 315 888 9900</span>
                </a>
              </div>
            </div>

          </div>

          <!-- Barra Inferior de Controles (Accesibilidad para Adultos Mayores) -->
          <div class="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <!-- Botón de Transferencia de Rescate (RD4) -->
            <button
              type="button"
              @click="voiceCall.transferToNurse('Paciente pulsó el botón de rescate de enfermería')"
              :disabled="voiceCall.callStatus.value === 'transferred'"
              class="w-full sm:w-auto px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md focus-ring"
              :class="voiceCall.callStatus.value === 'transferred'
                ? 'bg-white/10 text-slate-400 border border-white/10 cursor-not-allowed'
                : 'bg-rose-600/90 hover:bg-rose-700 text-white border border-rose-400/40 hover:scale-105 active:scale-95 cursor-pointer shadow-rose-600/30'"
            >
              <ShieldAlert class="w-5 h-5 text-white" />
              <span>Hablar con Enfermería (Humano)</span>
            </button>

            <!-- Controles de Audio y Colgar -->
            <div class="flex items-center gap-4">
              <!-- Botón Silenciar Micrófono -->
              <button
                type="button"
                @click="voiceCall.toggleMute"
                :disabled="voiceCall.callStatus.value === 'transferred'"
                class="w-14 h-14 rounded-full flex items-center justify-center transition-all focus-ring"
                :class="voiceCall.isMuted.value
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'"
                :title="voiceCall.isMuted.value ? 'Activar micrófono' : 'Silenciar micrófono'"
                aria-label="Silenciar o activar micrófono"
              >
                <MicOff v-if="voiceCall.isMuted.value" class="w-6 h-6" />
                <Mic v-else class="w-6 h-6" />
              </button>

              <!-- Botón Colgar / Finalizar Llamada -->
              <button
                type="button"
                @click="voiceCall.hangUp"
                class="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition-all hover:scale-105 active:scale-95 focus-ring cursor-pointer"
                title="Colgar llamada"
                aria-label="Colgar llamada"
              >
                <PhoneOff class="w-7 h-7" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
