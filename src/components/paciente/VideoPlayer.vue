<script setup lang="ts">
import { PlayCircle, ShieldCheck, Film } from 'lucide-vue-next';

defineProps<{
  title: string;
  description: string;
  videoUrl?: string | null;
}>();
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
    <div class="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
          <Film class="w-4 h-4" />
        </div>
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-teal-700 block">Cápsula Audiovisual Breve</span>
          <h3 class="text-lg font-bold text-slate-900 leading-snug">{{ title }}</h3>
        </div>
      </div>

      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
        Video Oficial Clínico
      </span>
    </div>

    <!-- Contenedor 16:9 del Video -->
    <div class="relative w-full aspect-video bg-slate-900 flex items-center justify-center">
      <iframe
        v-if="videoUrl"
        :src="videoUrl"
        :title="title"
        class="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
      <div v-else class="text-center p-8 text-slate-400">
        <PlayCircle class="w-12 h-12 mx-auto mb-2 text-slate-500" />
        <p class="text-sm">Video en proceso de carga por el equipo médico.</p>
      </div>
    </div>

    <!-- Descripción y Consejo Clínico -->
    <div class="p-5 bg-slate-50 border-t border-slate-100">
      <p class="text-sm sm:text-base text-slate-700 leading-relaxed">
        {{ description }}
      </p>
      <div class="mt-3 flex items-center gap-2 text-xs font-semibold text-teal-800">
        <ShieldCheck class="w-4 h-4 text-teal-600" />
        <span>Consejo: Puedes pausar el video en cualquier momento para compartirlo con tu familia o acompañante.</span>
      </div>
    </div>
  </div>
</template>
