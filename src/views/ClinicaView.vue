<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useClinicaStore } from '../stores/clinicaStore';
import { usePacienteStore } from '../stores/pacienteStore';
import { useChatStore } from '../stores/chat';
import PatientRiskCard from '../components/clinica/PatientRiskCard.vue';
import LiveAlertFeed from '../components/clinica/LiveAlertFeed.vue';
import NuevaCirugiaForm from '../components/clinica/NuevaCirugiaForm.vue';
import CatalogoCirugiasModal from '../components/clinica/CatalogoCirugiasModal.vue';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Users,
  RefreshCw,
  Radio,
  UserPlus,
  BookOpen,
  HeartPulse,
  PhoneCall,
  CheckCircle2,
  Mic,
  ClipboardCheck,
} from 'lucide-vue-next';

const router = useRouter();
const clinicaStore = useClinicaStore();
const pacienteStore = usePacienteStore();
const chatStore = useChatStore();
let unsubRealtime: (() => void) | null = null;

function formatOrigenReporte(origen: string) {
  if (origen === 'llamada_ia') return 'Llamada IA Sofi';
  if (origen === 'chat_ia') return 'Chat IA Sofi';
  if (origen === 'encuesta_pulsera') return 'Encuesta Pulsera (Voz)';
  return 'Encuesta Rápida (Web)';
}

function formatHoraCorta(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

const showNuevaCirugiaModal = ref(false);
const showCatalogoModal = ref(false);
const preselectedCatalogoId = ref<string | null>(null);

function abrirCatalogoDesdeFormulario() {
  showNuevaCirugiaModal.value = false;
  showCatalogoModal.value = true;
}

function usarCirugiaParaNuevoPaciente(catalogoId: string) {
  preselectedCatalogoId.value = catalogoId;
  showCatalogoModal.value = false;
  showNuevaCirugiaModal.value = true;
}

onMounted(async () => {
  await clinicaStore.cargarTablero();
  unsubRealtime = clinicaStore.iniciarSuscripcionRealtime();
});

onUnmounted(() => {
  if (unsubRealtime) unsubRealtime();
});

async function verPaciente(pacienteId: string) {
  showNuevaCirugiaModal.value = false;
  chatStore.clearChat();
  await pacienteStore.cargarDatosPaciente(pacienteId);
  router.push('/paciente');
}
</script>

<template>
  <div class="min-h-screen pb-16 pt-6 bg-slate-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      <!-- NOTIFICACIÓN URGENTE: RIESGO DE CANCELACIÓN EMOCIONAL / ANSIEDAD ALTA -->
      <div
        v-if="clinicaStore.reportesUrgentesSinRevisar.length > 0"
        role="alert"
        aria-live="assertive"
        class="rounded-2xl bg-rose-600 text-white p-5 shadow-xl shadow-rose-600/25 border-2 border-rose-400 space-y-3 animate-in fade-in duration-300"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 animate-bounce">
              <AlertOctagon class="w-6 h-6 text-white" />
            </div>
            <div>
              <span class="text-[11px] font-black uppercase tracking-wider text-rose-100 block">
                🚨 NOTIFICACIÓN URGENTE PRECARE • RIESGO DE CANCELACIÓN DE CIRUGÍA
              </span>
              <h2 class="text-lg sm:text-xl font-black tracking-tight">
                {{ clinicaStore.reportesUrgentesSinRevisar.length }} paciente(s) requieren contacto emocional inmediato
              </h2>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full bg-white text-rose-700 font-black text-xs uppercase">
            Prioridad Roja
          </span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="rep in clinicaStore.reportesUrgentesSinRevisar"
            :key="rep.id"
            class="bg-rose-950/35 border border-rose-300/40 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="font-black text-white text-sm">{{ rep.paciente_nombre }}</span>
                <span class="px-2 py-0.5 rounded-md bg-white/15 font-bold text-[11px]">
                  {{ formatOrigenReporte(rep.origen) }}
                </span>
                <span class="text-rose-200 font-mono">{{ formatHoraCorta(rep.created_at) }}</span>
              </div>
              <p class="text-sm font-bold text-rose-50">
                {{ rep.estado_animo }}
                <span v-if="rep.preocupacion_principal" class="font-normal text-rose-200">
                  — {{ rep.preocupacion_principal }}
                </span>
              </p>
              <p v-if="rep.frase_detectada" class="text-xs italic text-rose-100 bg-black/20 px-2.5 py-1.5 rounded-lg">
                "{{ rep.frase_detectada }}"
              </p>
              <p v-if="rep.comentario_paciente" class="text-xs text-rose-100">
                Nota del paciente: "{{ rep.comentario_paciente }}"
              </p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="verPaciente(rep.paciente_id)"
                class="px-3.5 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneCall class="w-3.5 h-3.5" />
                <span>Ver Paciente</span>
              </button>
              <button
                type="button"
                @click="clinicaStore.marcarReporteAnsiedadRevisado(rep.id)"
                class="px-3.5 py-2 rounded-xl bg-rose-900/70 hover:bg-rose-900 text-white border border-rose-300/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 class="w-3.5 h-3.5" />
                <span>Marcar Atendido</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Cabecera del Tablero -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
            <Radio class="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            Monitoreo Centralizado de Quirófano
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tablero Clínico Semáforo de Riesgo
          </h1>
          <p class="text-sm sm:text-base text-slate-600 mt-1">
            Detección predictiva de desviaciones en pautas preoperatorias para evitar cancelaciones de cirugías.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            @click="clinicaStore.cargarTablero"
            class="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors focus-ring cursor-pointer"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': clinicaStore.isLoading }" />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            @click="showCatalogoModal = true"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all focus-ring cursor-pointer"
          >
            <BookOpen class="w-4 h-4 text-teal-400" />
            <span>Catálogo de Cirugías ({{ clinicaStore.catalogoCirugias.length }})</span>
          </button>

          <button
            type="button"
            @click="showNuevaCirugiaModal = true"
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all focus-ring cursor-pointer"
          >
            <UserPlus class="w-4 h-4" />
            <span>Registrar Paciente y Cirugía</span>
          </button>
        </div>
      </div>

      <!-- Modal Gestor del Catálogo General de Cirugías (Protocolos Base Reutilizables) -->
      <CatalogoCirugiasModal
        :open="showCatalogoModal"
        @close="showCatalogoModal = false"
        @select-for-new-patient="usarCirugiaParaNuevoPaciente($event)"
      />

      <!-- Modal para Crear / Parametrizar Paciente (Usando Cirugía Base + Personalización) -->
      <NuevaCirugiaForm
        :open="showNuevaCirugiaModal"
        :preselected-catalogo-id="preselectedCatalogoId"
        @close="showNuevaCirugiaModal = false"
        @open-catalogo="abrirCatalogoDesdeFormulario"
        @open-patient-preview="verPaciente($event)"
      />

      <!-- Tarjetas de Métricas Ejecutivas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Cirugías -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
            <Users class="w-6 h-6" />
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Programadas</span>
            <span class="text-2xl sm:text-3xl font-black text-slate-900">{{ clinicaStore.resumen.total }}</span>
          </div>
        </div>

        <!-- Semáforo Verde -->
        <div class="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-800 block">🟢 En Regla (Verde)</span>
            <span class="text-2xl sm:text-3xl font-black text-emerald-700">{{ clinicaStore.resumen.verdes }}</span>
          </div>
        </div>

        <!-- Semáforo Amarillo -->
        <div class="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-amber-800 block">🟡 Alerta Leve (Amarillo)</span>
            <span class="text-2xl sm:text-3xl font-black text-amber-700">{{ clinicaStore.resumen.amarillos }}</span>
          </div>
        </div>

        <!-- Semáforo Rojo -->
        <div class="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
            <AlertOctagon class="w-6 h-6" />
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-rose-800 block">🔴 Riesgo Crítico (Rojo)</span>
            <span class="text-2xl sm:text-3xl font-black text-rose-700">{{ clinicaStore.resumen.rojos }}</span>
          </div>
        </div>
      </div>

      <!-- Filtros del Semáforo -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Filtrar:</span>
        <button
          @click="clinicaStore.filtroSemaforo = 'todos'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors focus-ring"
          :class="clinicaStore.filtroSemaforo === 'todos' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
        >
          Todos ({{ clinicaStore.cirugias.length }})
        </button>
        <button
          @click="clinicaStore.filtroSemaforo = 'rojo'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors focus-ring"
          :class="clinicaStore.filtroSemaforo === 'rojo' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'"
        >
          🔴 Riesgo Crítico ({{ clinicaStore.resumen.rojos }})
        </button>
        <button
          @click="clinicaStore.filtroSemaforo = 'amarillo'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors focus-ring"
          :class="clinicaStore.filtroSemaforo === 'amarillo' ? 'bg-amber-500 text-white shadow-xs' : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'"
        >
          🟡 Alertas Leves ({{ clinicaStore.resumen.amarillos }})
        </button>
        <button
          @click="clinicaStore.filtroSemaforo = 'verde'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors focus-ring"
          :class="clinicaStore.filtroSemaforo === 'verde' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'"
        >
          🟢 Preparados ({{ clinicaStore.resumen.verdes }})
        </button>
      </div>

      <!-- Grilla Principal: Tarjetas de Pacientes + Feed de Alertas en Vivo -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Columna de Pacientes Monitoreados (2 columnas en LG) -->
        <div class="lg:col-span-2 space-y-4">
          <div v-if="clinicaStore.cirugiasFiltradas.length === 0" class="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            No hay pacientes en la categoría seleccionada.
          </div>

          <PatientRiskCard
            v-for="cir in clinicaStore.cirugiasFiltradas"
            :key="cir.id"
            :cirugia="cir"
            @seleccionar-paciente="verPaciente($event)"
          />
        </div>

        <!-- Columna de Alertas en Vivo + Monitoreo de Ansiedad (1 columna en LG) -->
        <div class="lg:col-span-1">
          <div class="sticky top-20 space-y-5">
            <!-- Feed de Respuestas de Ansiedad (Llamada IA Sofi + Encuesta Rápida) -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3.5">
              <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <HeartPulse class="w-4 h-4" />
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-slate-900">Reportes de Ansiedad</h3>
                    <span class="text-[11px] text-slate-500">Llamadas IA Sofi y Encuestas 50%</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {{ clinicaStore.reportesAnsiedad.length }}
                </span>
              </div>

              <div v-if="clinicaStore.reportesAnsiedad.length === 0" class="text-xs text-slate-500 text-center py-4">
                Aún no se han recibido respuestas de ansiedad desde llamadas IA o encuestas rápidas.
              </div>

              <div v-else class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                <div
                  v-for="rep in clinicaStore.reportesAnsiedad"
                  :key="rep.id"
                  class="p-3 rounded-xl border text-xs space-y-1.5 transition-all"
                  :class="[
                    rep.revisado_medico
                      ? 'bg-slate-50 border-slate-200 opacity-70'
                      : rep.es_urgente || rep.riesgo_cancelacion
                      ? 'bg-rose-50 border-rose-300'
                      : rep.nivel === 'moderada'
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-emerald-50 border-emerald-200',
                  ]"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-extrabold text-slate-900 truncate">{{ rep.paciente_nombre }}</span>
                    <span class="text-[10px] font-mono text-slate-500 shrink-0">{{ formatHoraCorta(rep.created_at) }}</span>
                  </div>

                  <div class="flex flex-wrap items-center gap-1.5">
                    <span
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase"
                      :class="
                        rep.es_urgente || rep.riesgo_cancelacion
                          ? 'bg-rose-600 text-white'
                          : rep.nivel === 'moderada'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      "
                    >
                      {{ rep.riesgo_cancelacion ? '🚨 Urgente' : `Ansiedad ${rep.nivel}` }} ({{ rep.puntaje }}/10)
                    </span>

                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                      <Mic v-if="rep.origen === 'llamada_ia' || rep.origen === 'encuesta_pulsera'" class="w-2.5 h-2.5 text-teal-600" />
                      <ClipboardCheck v-else class="w-2.5 h-2.5 text-indigo-600" />
                      {{ formatOrigenReporte(rep.origen) }}
                    </span>
                  </div>

                  <p class="font-semibold text-slate-800 leading-snug">{{ rep.estado_animo }}</p>
                  <p v-if="rep.frase_detectada" class="italic text-slate-600 leading-snug">
                    "{{ rep.frase_detectada }}"
                  </p>
                  <p v-if="rep.comentario_paciente" class="text-slate-600 leading-snug">
                    Nota: "{{ rep.comentario_paciente }}"
                  </p>

                  <div v-if="!rep.revisado_medico" class="pt-1 flex justify-end">
                    <button
                      type="button"
                      @click="clinicaStore.marcarReporteAnsiedadRevisado(rep.id)"
                      class="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[10px] cursor-pointer"
                    >
                      Marcar revisado
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <LiveAlertFeed
              :alertas="clinicaStore.alertas"
              @marcar-atendida="clinicaStore.marcarAlertaAtendida($event)"
            />
          </div>
        </div>

      </div>

    </div>
  </div>
</template>
