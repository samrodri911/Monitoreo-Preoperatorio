<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { usePacienteStore } from '../stores/pacienteStore';
import { useAuthStore } from '../stores/authStore';
import EducationalHero from '../components/paciente/EducationalHero.vue';
import NavigationTabs from '../components/paciente/NavigationTabs.vue';
import PautasTimeline from '../components/paciente/PautasTimeline.vue';
import AgentMockCard from '../components/paciente/AgentMockCard.vue';
import ConoceTuCirugia from '../components/paciente/ConoceTuCirugia.vue';
import DayOfSurgeryTimeline from '../components/paciente/DayOfSurgeryTimeline.vue';
import HospitalBagChecklist from '../components/paciente/HospitalBagChecklist.vue';
import FaqAccordion from '../components/paciente/FaqAccordion.vue';
import ChatAssistant from '../components/paciente/ChatAssistant.vue';
import VoiceCallModal from '../components/paciente/VoiceCallModal.vue';
import SmartWristbandSimulator from '../components/paciente/SmartWristbandSimulator.vue';
import { Loader2, Stethoscope, Sparkles, Watch } from 'lucide-vue-next';

const pacienteStore = usePacienteStore();
const authStore = useAuthStore();
const activeTab = ref<'preparacion' | 'educacion'>('educacion'); // Abre en la pestaña de educación preoperatoria por defecto
const isWristbandSimulatorOpen = ref(false);
let unsubRealtime: (() => void) | null = null;

onMounted(async () => {
  if (authStore.isPaciente && authStore.pacienteId) {
    if (!pacienteStore.paciente || pacienteStore.currentPacienteId !== authStore.pacienteId) {
      await pacienteStore.cargarDatosPaciente(authStore.pacienteId);
    }
  } else if (!pacienteStore.paciente) {
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
        <!-- Barra Superior de Acceso Rápido al Simulador Pulsera Phygital -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-2xl border border-slate-800 shadow-sm">
          <div class="flex items-center gap-2.5 text-xs">
            <span class="w-2 h-2 rounded-full bg-teal-400"></span>
            <span class="font-bold text-slate-200">
              Dispositivo Wearable Vinculado:
            </span>
            <span class="text-teal-300 font-semibold hidden sm:inline">
              Pulsera Inteligente de Mínima Fricción (Sin Pantalla • Audio + LED + Botón Único)
            </span>
          </div>
          <button
            type="button"
            :aria-expanded="isWristbandSimulatorOpen"
            @click="isWristbandSimulatorOpen = !isWristbandSimulatorOpen"
            class="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Watch class="w-3.5 h-3.5" />
            <span>
              {{ isWristbandSimulatorOpen ? 'Minimizar Pulsera Phygital' : 'Probar Simulador Pulsera Phygital' }}
            </span>
          </button>
        </div>

        <!-- 1. FICHA DE PRESENTACIÓN EMPÁTICA Y HERO CON CUENTA REGRESIVA E INDICADORES (RD1) -->
        <EducationalHero
          :cirugia="pacienteStore.cirugia"
          :paciente="pacienteStore.paciente"
        />

        <!-- Nota Clínica Personalizada del Cirujano Tratante y Perfil del Paciente (sincronizada con Sofi) -->
        <div
          v-if="pacienteStore.cirugia?.notas_medicas || pacienteStore.cirugia?.medico_tratante"
          class="bg-white rounded-2xl border-2 border-teal-200/80 shadow-xs p-5 space-y-3"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                <Stethoscope class="w-5 h-5" />
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-extrabold uppercase tracking-wider text-teal-800">
                    Indicación Personalizada de tu Cirujano
                  </span>
                  <span
                    v-if="pacienteStore.cirugia?.medico_tratante"
                    class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800"
                  >
                    {{ pacienteStore.cirugia.medico_tratante }}
                  </span>
                </div>
                <p v-if="pacienteStore.cirugia?.notas_medicas" class="text-sm font-medium text-slate-800 mt-1">
                  "{{ pacienteStore.cirugia.notas_medicas }}"
                </p>
              </div>
            </div>

            <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold shrink-0 self-start sm:self-center">
              <Sparkles class="w-3.5 h-3.5 text-teal-600" />
              <span>Sofi conoce tu perfil y esta indicación</span>
            </div>
          </div>

          <!-- Resumen de Datos Específicos Registrados del Paciente -->
          <div
            v-if="
              pacienteStore.paciente?.grupo_sanguineo ||
              pacienteStore.paciente?.alergias ||
              pacienteStore.paciente?.medicacion_habitual ||
              (pacienteStore.paciente?.comorbilidades && pacienteStore.paciente.comorbilidades.length > 0)
            "
            class="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs"
          >
            <span class="text-slate-400 font-bold uppercase text-[11px]">Tu ficha clínica registrada:</span>
            <span
              v-if="pacienteStore.paciente?.grupo_sanguineo"
              class="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-extrabold"
            >
              Grupo/RH: {{ pacienteStore.paciente.grupo_sanguineo }}
            </span>
            <span
              v-for="com in pacienteStore.paciente?.comorbilidades || []"
              :key="com"
              class="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200"
            >
              {{ com }}
            </span>
            <span
              v-if="pacienteStore.paciente?.alergias"
              class="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-semibold"
            >
              Alergias: {{ pacienteStore.paciente.alergias }}
            </span>
            <span
              v-if="pacienteStore.paciente?.medicacion_habitual"
              class="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 font-semibold"
            >
              Medicación base: {{ pacienteStore.paciente.medicacion_habitual }}
            </span>
          </div>
        </div>

        <!-- 2. SELECTOR DE SECCIONES (Pestañas: "Conoce tu Cirugía" vs "Mi Preparación Activa") -->
        <NavigationTabs
          :active-tab="activeTab"
          :materiales-count="pacienteStore.materiales.length"
          @update:active-tab="activeTab = $event"
        />

        <!-- CONTENIDO PESTAÑA 1: CONOCE TU CIRUGÍA (CENTRO EDUCATIVO PREOPERATORIO RD1) -->
        <div v-show="activeTab === 'educacion'" class="space-y-8 animate-in fade-in duration-300">
          
          <!-- Módulo Multimedia: Video e Infografía Adaptado al Procedimiento -->
          <ConoceTuCirugia
            :video-recurso="videoRecurso"
            :infografia-recurso="infografiaRecurso"
          />

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
          <AgentMockCard @open-wristband="isWristbandSimulatorOpen = true" />
        </div>

      </template>

    </div>

    <!-- Simulador Interactivo de la Pulsera Inteligente de Mínima Fricción -->
    <SmartWristbandSimulator v-model:open="isWristbandSimulatorOpen" />

    <!-- Asistente Virtual Prequirúrgico Local (Ollama) -->
    <ChatAssistant />

    <!-- Modal de Llamada 100% de Voz (Cero Texto / RD4 Rescate Asistencial) -->
    <VoiceCallModal />
  </div>
</template>
