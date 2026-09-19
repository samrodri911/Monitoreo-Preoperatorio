<script setup lang="ts">
import { Bot, Mic, Sparkles, MessageSquare, PhoneCall } from 'lucide-vue-next';
import { useChatStore } from '../../stores/chat';
import { useVoiceCall } from '../../composables/useVoiceCall';

const chatStore = useChatStore();
const voiceCall = useVoiceCall();

function startVoiceCall() {
  voiceCall.openCall();
}

function openChat() {
  chatStore.toggleChat(true);
}
</script>

<template>
  <div class="rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/80 via-white to-sky-50/60 p-6 sm:p-7 shadow-sm relative overflow-hidden space-y-4">
    <!-- Etiqueta superior -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
          <Bot class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-teal-800 block">Asistente Virtual Phygital</span>
          <span class="text-base font-bold text-slate-900">Acompañante de Voz & Contención "Tech-and-Touch"</span>
        </div>
      </div>

      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-2xs">
        <Sparkles class="w-3.5 h-3.5 text-emerald-600" />
        Llamada 100% Manos Libres
      </span>
    </div>

    <!-- Descripción empática -->
    <p class="text-sm text-slate-600 leading-relaxed">
      Conéctate en tiempo real con <strong>Sofi</strong> en una llamada de voz directa para resolver cualquier inquietud sobre tu ayuno, medicamentos y maleta quirúrgica sin necesidad de escribir ni leer textos densos.
    </p>

    <!-- Mock interactivo visual de Micro-Comandos -->
    <div class="bg-white rounded-2xl p-4 sm:p-5 border border-teal-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      <div
        @click="startVoiceCall"
        class="flex items-center gap-3.5 w-full md:w-auto cursor-pointer group hover:opacity-90 transition-opacity"
        title="Clic para iniciar llamada de voz con el Asistente"
      >
        <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 relative group-hover:bg-emerald-200 transition-colors shadow-xs">
          <Mic class="w-6 h-6" />
          <span class="absolute inset-0 rounded-2xl border-2 border-emerald-500 animate-ping opacity-30"></span>
        </div>
        <div>
          <span class="text-xs font-bold text-slate-400 block uppercase tracking-wider">Llamada continua por voz:</span>
          <span class="text-sm font-bold text-teal-900 group-hover:text-emerald-700 transition-colors">
            "Pregúntale a Sofi sobre tu preparación prequirúrgica"
          </span>
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="flex items-center gap-2.5 w-full md:w-auto">
        <button
          type="button"
          @click="startVoiceCall"
          class="flex-1 md:flex-initial px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all focus-ring cursor-pointer hover:scale-105 active:scale-95"
        >
          <PhoneCall class="w-4 h-4 animate-bounce" />
          <span>Iniciar llamada con Asistente</span>
        </button>

        <button
          type="button"
          @click="openChat"
          class="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors focus-ring cursor-pointer"
          title="Abrir chat tradicional escrito"
        >
          <MessageSquare class="w-4 h-4 text-teal-700" />
          <span class="hidden sm:inline">Chat Escrito</span>
        </button>
      </div>
    </div>
  </div>
</template>
