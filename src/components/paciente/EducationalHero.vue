<script setup lang="ts">
import { HeartHandshake, Clock, ShieldCheck, Home } from 'lucide-vue-next';

defineProps<{
  tipoCirugia?: string;
}>();
</script>

<template>
  <div class="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
    <!-- Círculos decorativos de fondo -->
    <div class="absolute -top-24 -right-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10 max-w-3xl">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30 mb-4">
        <HeartHandshake class="w-4 h-4 text-teal-300" />
        Información Clínica Empática y Despeje de Dudas (RD1)
      </div>

      <h2 class="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
        Todo lo que necesitas saber sobre tu {{ tipoCirugia || 'procedimiento' }}
      </h2>

      <p class="text-slate-200 text-base sm:text-lg leading-relaxed mb-6 font-normal">
        Entendemos que cualquier procedimiento quirúrgico genera inquietud. Esta sección fue diseñada por nuestro equipo clínico para explicarte, con palabras sencillas y transparentes, qué ocurrirá y por qué estás en las mejores manos.
      </p>

      <!-- Ficha de Datos Clave en Lenguaje Sencillo -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div class="p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-teal-500/30 text-teal-300 flex items-center justify-center flex-shrink-0">
            <Clock class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs uppercase font-bold tracking-wider text-teal-200 block">Duración Estimada</span>
            <span class="font-bold text-white">60 a 90 minutos</span>
          </div>
        </div>

        <div class="p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-teal-500/30 text-teal-300 flex items-center justify-center flex-shrink-0">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs uppercase font-bold tracking-wider text-teal-200 block">Tipo de Anestesia</span>
            <span class="font-bold text-white">General (Sueño seguro y sin dolor)</span>
          </div>
        </div>

        <div class="p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-teal-500/30 text-teal-300 flex items-center justify-center flex-shrink-0">
            <Home class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs uppercase font-bold tracking-wider text-teal-200 block">Recuperación</span>
            <span class="font-bold text-white">Ambulatoria (Regreso hoy mismo)</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
