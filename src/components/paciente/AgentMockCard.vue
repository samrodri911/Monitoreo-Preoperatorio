<script setup lang="ts">
import { Bot, Mic, Sparkles, MessageSquare } from 'lucide-vue-next';
import { useChatStore } from '../../stores/chat';

const chatStore = useChatStore();

const sampleQuestion = '¿Puedo cepillarme los dientes durante el ayuno?';

function askSample() {
  chatStore.openChatWithMessage(sampleQuestion);
}

function openChat() {
  chatStore.toggleChat(true);
}
</script>

<template>
  <div class="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 via-white to-sky-50/50 p-6 shadow-sm relative overflow-hidden">
    <!-- Etiqueta superior -->
    <div class="flex items-center justify-between gap-2 mb-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
          <Bot class="w-4 h-4" />
        </div>
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-teal-800 block">Asistente Virtual Phygital</span>
          <span class="text-sm font-semibold text-slate-900">Acompañante de Voz & Contención "Tech-and-Touch"</span>
        </div>
      </div>

      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-xs">
        <Sparkles class="w-3 h-3 text-emerald-600" />
        Disponible Ahora
      </span>
    </div>

    <!-- Descripción empática -->
    <p class="text-sm text-slate-600 mb-5 leading-relaxed">
      Conéctate con <strong>Sofi</strong>, tu asistente clínico de Inteligencia Artificial para resolver dudas sobre tu ayuno, medicamentos y maleta quirúrgica las 24 horas.
    </p>

    <!-- Mock interactivo visual de Micro-Comandos -->
    <div class="bg-white rounded-xl p-4 border border-teal-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
      <div
        @click="askSample"
        class="flex items-center gap-3 w-full sm:w-auto cursor-pointer group hover:opacity-90 transition-opacity"
        title="Clic para consultar esto con el asistente"
      >
        <div class="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 relative group-hover:bg-teal-200 transition-colors">
          <Mic class="w-6 h-6" />
          <span class="absolute inset-0 rounded-full border-2 border-teal-500 animate-ping opacity-25"></span>
        </div>
        <div>
          <span class="text-xs font-semibold text-slate-400 block uppercase">Prueba a preguntar:</span>
          <span class="text-sm font-bold text-teal-800 group-hover:text-teal-900 underline decoration-teal-300 underline-offset-2 italic">
            "{{ sampleQuestion }}"
          </span>
        </div>
      </div>

      <button
        type="button"
        @click="openChat"
        class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-teal-600/20 transition-all focus-ring cursor-pointer"
      >
        <MessageSquare class="w-4 h-4" />
        <span>Abrir Asistente IA</span>
      </button>
    </div>
  </div>
</template>
