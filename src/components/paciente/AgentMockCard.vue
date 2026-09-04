<script setup lang="ts">
import { Bot, Mic, Sparkles, Volume2 } from 'lucide-vue-next';
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

      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-teal-200 text-teal-700 shadow-xs">
        <Sparkles class="w-3 h-3 text-teal-600" />
        Fase 2: Próxima Integración
      </span>
    </div>

    <!-- Descripción empática -->
    <p class="text-sm text-slate-600 mb-5 leading-relaxed">
      Este espacio conectará con tu <strong>pulsera háptica wearable</strong> y el <strong>motor de Inteligencia Artificial</strong> para resolver dudas médicas las 24 horas y medir acústicamente tu tranquilidad antes de entrar al quirófano.
    </p>

    <!-- Mock interactivo visual de Micro-Comandos -->
    <div class="bg-white rounded-xl p-4 border border-teal-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <div class="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 relative">
          <Mic class="w-6 h-6" />
          <span class="absolute inset-0 rounded-full border-2 border-teal-500 animate-ping opacity-25"></span>
        </div>
        <div>
          <span class="text-xs font-semibold text-slate-400 block uppercase">Prueba a preguntar en voz alta:</span>
          <span class="text-sm font-bold text-slate-800 italic">"¿Puedo cepillarme los dientes durante el ayuno?"</span>
        </div>
      </div>

      <button
        type="button"
        disabled
        class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
      >
        <Volume2 class="w-4 h-4" />
        <span>Voz IA en Preparación</span>
      </button>
    </div>
  </div>
</template>
