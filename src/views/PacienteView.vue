<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { usePacienteStore } from '../stores/pacienteStore';
import ProcedureCard from '../components/paciente/ProcedureCard.vue';
import CountdownTimer from '../components/paciente/CountdownTimer.vue';
import NavigationTabs from '../components/paciente/NavigationTabs.vue';
import PautasTimeline from '../components/paciente/PautasTimeline.vue';
import AgentMockCard from '../components/paciente/AgentMockCard.vue';
import EducationalHero from '../components/paciente/EducationalHero.vue';
import VideoPlayer from '../components/paciente/VideoPlayer.vue';
import InfographicViewer from '../components/paciente/InfographicViewer.vue';
import HospitalBagChecklist from '../components/paciente/HospitalBagChecklist.vue';
import DayOfSurgeryTimeline from '../components/paciente/DayOfSurgeryTimeline.vue';
import FaqAccordion from '../components/paciente/FaqAccordion.vue';
import { Loader2, ArrowLeft } from 'lucide-vue-next';

const pacienteStore = usePacienteStore();
const activeTab = ref<'preparacion' | 'educacion'>('preparacion');
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
</script>

<template>
  <div class="min-h-screen pb-16 pt-6">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      <!-- Barra Superior / Regreso -->
      <div class="flex items-center justify-between">
        <router-link
          to="/"
          class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors focus-ring rounded-lg p-1"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Volver al Hub Demo</span>
        </router-link>

        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500 font-medium">Semáforo de Adherencia:</span>
          <span
            class="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border"
            :class="[
              pacienteStore.semaforoIndividual === 'verde'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : pacienteStore.semaforoIndividual === 'amarillo'
                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
            ]"
          >
            ● {{ pacienteStore.semaforoIndividual }}
          </span>
        </div>
      </div>

      <!-- Estado de Carga -->
      <div v-if="pacienteStore.isLoading" class="p-16 text-center bg-white rounded-2xl border border-slate-200">
        <Loader2 class="w-10 h-10 text-teal-600 animate-spin mx-auto mb-3" />
        <p class="text-slate-600 font-medium">Cargando protocolo prequirúrgico personalizado...</p>
      </div>

      <template v-else>
        <!-- 1. Tarjeta Médica del Procedimiento -->
        <ProcedureCard
          :paciente="pacienteStore.paciente"
          :cirugia="pacienteStore.cirugia"
        />

        <!-- 2. Contador Regresivo Dinámico -->
        <CountdownTimer
          :target-date-str="pacienteStore.cirugia?.fecha_programada"
        />

        <!-- 3. Selector de Pestañas (Preparación vs RD1 Conoce tu Cirugía) -->
        <NavigationTabs
          :active-tab="activeTab"
          :materiales-count="pacienteStore.materiales.length"
          @update:active-tab="activeTab = $event"
        />

        <!-- CONTENIDO PESTAÑA 1: MI PREPARACIÓN ACTIVA -->
        <div v-show="activeTab === 'preparacion'" class="space-y-6">
          <PautasTimeline
            :pautas="pacienteStore.pautas"
            :disabled="pacienteStore.isSyncing"
            @toggle-checkin="pacienteStore.toggleCheckin($event)"
          />

          <!-- Placeholder Agente IA de Voz / Wearable -->
          <AgentMockCard />
        </div>

        <!-- CONTENIDO PESTAÑA 2: CONOCE TU CIRUGÍA (RD1) -->
        <div v-show="activeTab === 'educacion'" class="space-y-6">
          <!-- Hero Educativo Amigable -->
          <EducationalHero
            :tipo-cirugia="pacienteStore.cirugia?.tipo_cirugia"
          />

          <!-- Galería Multimedia (Video e Infografía) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Reproductor de Video -->
            <VideoPlayer
              v-if="videoRecurso"
              :title="videoRecurso.titulo"
              :description="videoRecurso.descripcion_corta"
              :video-url="videoRecurso.url_recurso"
            />

            <!-- Visor de Infografía Anatómica -->
            <InfographicViewer
              v-if="infografiaRecurso"
              :title="infografiaRecurso.titulo"
              :description="infografiaRecurso.descripcion_corta"
              :image-url="infografiaRecurso.url_recurso"
              :markdown-content="infografiaRecurso.contenido_markdown"
            />
          </div>

          <!-- Guía Interactiva de la Maleta Hospitalaria -->
          <HospitalBagChecklist />

          <!-- Paso a Paso del Día de la Cirugía -->
          <DayOfSurgeryTimeline />

          <!-- Preguntas Frecuentes y Manejo del Miedo -->
          <FaqAccordion />
        </div>

      </template>

    </div>
  </div>
</template>
