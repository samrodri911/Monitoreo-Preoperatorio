<script setup lang="ts">
import { ref } from 'vue';
import { Image as ImageIcon, ZoomIn, X, Info } from 'lucide-vue-next';

defineProps<{
  title: string;
  description: string;
  imageUrl?: string | null;
  markdownContent?: string | null;
}>();

const isModalOpen = ref(false);
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
    <div>
      <!-- Cabecera -->
      <div class="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
            <ImageIcon class="w-4 h-4" />
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-teal-700 block">Infografía Didáctica</span>
            <h3 class="text-lg font-bold text-slate-900 leading-snug">{{ title }}</h3>
          </div>
        </div>

        <button
          v-if="imageUrl"
          type="button"
          @click="isModalOpen = true"
          class="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors focus-ring"
          title="Ampliar infografía"
        >
          <ZoomIn class="w-5 h-5" />
        </button>
      </div>

      <!-- Imagen / Infografía -->
      <div class="relative bg-slate-100 aspect-[16/9] overflow-hidden group cursor-pointer" @click="isModalOpen = true">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="title"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold text-sm gap-2">
          <ZoomIn class="w-5 h-5" />
          <span>Clic para ampliar imagen</span>
        </div>
      </div>

      <!-- Explicación de texto -->
      <div class="p-5 space-y-3">
        <p class="text-sm text-slate-600 leading-relaxed">
          {{ description }}
        </p>

        <div v-if="markdownContent" class="p-4 rounded-xl bg-teal-50/60 border border-teal-100 text-xs sm:text-sm text-teal-950 whitespace-pre-line leading-relaxed">
          <div class="flex items-center gap-1.5 font-bold text-teal-900 mb-1">
            <Info class="w-4 h-4 text-teal-600" />
            <span>Detalle Anatómico:</span>
          </div>
          {{ markdownContent }}
        </div>
      </div>
    </div>

    <!-- Modal para Zoom -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="isModalOpen = false"
    >
      <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 class="font-bold text-slate-900">{{ title }}</h4>
          <button
            @click="isModalOpen = false"
            class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus-ring"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-950">
          <img :src="imageUrl!" :alt="title" class="max-h-[75vh] object-contain rounded-lg" />
        </div>
      </div>
    </div>

  </div>
</template>
