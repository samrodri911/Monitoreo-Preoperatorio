<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { usePacienteStore } from '../stores/pacienteStore';
import EducationalHero from '../components/paciente/EducationalHero.vue';
import NavigationTabs from '../components/paciente/NavigationTabs.vue';
import PautasTimeline from '../components/paciente/PautasTimeline.vue';
import AgentMockCard from '../components/paciente/AgentMockCard.vue';
import VideoPlayer from '../components/paciente/VideoPlayer.vue';
import InfographicViewer from '../components/paciente/InfographicViewer.vue';
import DayOfSurgeryTimeline from '../components/paciente/DayOfSurgeryTimeline.vue';
import HospitalBagChecklist from '../components/paciente/HospitalBagChecklist.vue';
import FaqAccordion from '../components/paciente/FaqAccordion.vue';
import { Loader2 } from 'lucide-vue-next';

const pacienteStore = usePacienteStore();
const activeTab = ref<'preparacion' | 'educacion'>('educacion'); // Abre en la pestaña de educación preoperatoria por defecto
let unsubRealtime: (() => void) | null = null;

onMounted(async () => {
  if (!pacienteStore.paciente) {
    await pacienteStore.cargarDatosPaciente();
  }
  unsubRealtime = pacienteStore.iniciarSuscripcionRealtime();
});

onUnmounted(() => {
  if (unsubRealtime) unsubRealtime();
});

// Recursos educativos clasificados
const videoRecurso = computed(() => {
  return pacienteStore.materiales.find(m => m.tipo_recurso === 'video');
});

const infografiaRecurso = computed(() => {
  return pacienteStore.materiales.find(m => m.tipo_recurso === 'infografia');
});

const materialesRecorrido = computed(() => {
  return pacienteStore.materiales.filter(m => m.categoria === 'recorrido');
});

const materialesFaq = computed(() => {
  return pacienteStore.materiales.filter(m => m.categoria === 'faq');
});
</script>

<template>
  <div class="min-h-screen pb-20 pt-6 bg-slate-50">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      <!-- Estado de Carga -->
      <div v-if="pacienteStore.isLoading" class="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <Loader2 class="w-10 h-10 text-teal-600 animate-spin mx-auto mb-3" />
        <p class="text-slate-600 font-medium">Cargando protocolo prequirúrgico personalizado...</p>
      </div>

      <template v-else>
        
        <!-- 1. FICHA DE PRESENTACIÓN EMPÁTICA Y HERO CON CUENTA REGRESIVA E INDICADORES (RD1) -->
        <EducationalHero
          :cirugia="pacienteStore.cirugia"
          :paciente="pacienteStore.paciente"
        />

        <!-- 2. SELECTOR DE SECCIONES (Pestañas: "Conoce tu Cirugía" vs "Mi Preparación Activa") -->
        <NavigationTabs
          :active-tab="activeTab"
          :materiales-count="pacienteStore.materiales.length"
          @update:active-tab="activeTab = $event"
        />

        <!-- CONTENIDO PESTAÑA 1: CONOCE TU CIRUGÍA (CENTRO EDUCATIVO PREOPERATORIO RD1) -->
        <div v-show="activeTab === 'educacion'" class="space-y-8 animate-in fade-in duration-300">
          
          <!-- Módulo Multimedia: Video e Infografía -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Reproductor de Video Explicativo -->
            <VideoPlayer
              v-if="videoRecurso"
              :title="videoRecurso.titulo"
              :description="videoRecurso.descripcion_corta"
              :video-url="videoRecurso.url_recurso"
            />

            <!-- Visor de Infografía Anatómica de Mínima Invasión -->
            <InfographicViewer
              v-if="infografiaRecurso"
              :title="infografiaRecurso.titulo"
              :description="infografiaRecurso.descripcion_corta"
              :image-url="infografiaRecurso.url_recurso"
              :markdown-content="infografiaRecurso.contenido_markdown"
            />
          </div>

          <!-- Guía Paso a Paso: "El Recorrido de tu Cirugía" -->
          <DayOfSurgeryTimeline
            :materiales="materialesRecorrido"
          />

          <!-- Checklist Interactivo: "Qué empacar en tu maleta" -->
          <HospitalBagChecklist />

          <!-- Preguntas Frecuentes (FAQ) Interactivas -->
          <FaqAccordion
            :materiales="materialesFaq"
          />

        </div>

        <!-- CONTENIDO PESTAÑA 2: MI PREPARACIÓN ACTIVA (DOSIFICACIÓN DE PAUTAS & CHECK-INS) -->
        <div v-show="activeTab === 'preparacion'" class="space-y-6 animate-in fade-in duration-300">
          <PautasTimeline
            :pautas="pacienteStore.pautas"
            :disabled="pacienteStore.isSyncing"
            @toggle-checkin="pacienteStore.toggleCheckin($event)"
          />

          <!-- Placeholder Agente IA de Voz / Wearable -->
          <AgentMockCard />
        </div>

      </template>

    </div>
  </div>
</template>
