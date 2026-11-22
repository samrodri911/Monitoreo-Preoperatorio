<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { usePacienteStore } from '../../stores/pacienteStore';
import { useAnxietyMonitoring } from '../../composables/useAnxietyMonitoring';
import { useVoiceCall } from '../../composables/useVoiceCall';
import type { NivelAnsiedad } from '../../types/database.types';
import {
  HeartHandshake,
  X,
  Send,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  Clock,
  Watch,
} from 'lucide-vue-next';

const pacienteStore = usePacienteStore();
const anxiety = useAnxietyMonitoring();
const voiceCall = useVoiceCall();

type EstadoAnimoOption = {
  id: 'tranquilo' | 'nervioso' | 'mucho_miedo';
  emoji: string;
  label: string;
  desc: string;
  nivel: NivelAnsiedad;
  puntaje: number;
};

const opcionesAnimo: EstadoAnimoOption[] = [
  {
    id: 'tranquilo',
    emoji: '😌',
    label: 'Tranquilo y listo',
    desc: 'Me siento bien acompañado',
    nivel: 'baja',
    puntaje: 2,
  },
  {
    id: 'nervioso',
    emoji: '😟',
    label: 'Un poco nervioso',
    desc: 'Tengo algunas dudas normales',
    nivel: 'moderada',
    puntaje: 6,
  },
  {
    id: 'mucho_miedo',
    emoji: '😰',
    label: 'Con mucho miedo',
    desc: 'Siento ansiedad fuerte o temor',
    nivel: 'alta',
    puntaje: 9,
  },
];

const opcionesPreocupacion = [
  'La anestesia',
  'Sentir dolor',
  'La recuperación',
  'Ayuno o preparación',
  'Ninguna en especial',
];

type CancelacionOption = {
  id: 'no' | 'duda' | 'si_cancelar';
  label: string;
  riesgo: boolean;
};

const opcionesCancelacion: CancelacionOption[] = [
  { id: 'no', label: 'No, estoy seguro de mi cirugía', riesgo: false },
  { id: 'duda', label: 'Lo he dudado un poco', riesgo: false },
  { id: 'si_cancelar', label: 'Sí, pienso en cancelar o necesito ayuda urgente', riesgo: true },
];

const selectedAnimo = ref<EstadoAnimoOption['id'] | null>(null);
const selectedPreocupacion = ref<string>('Ninguna en especial');
const selectedCancelacion = ref<CancelacionOption['id']>('no');
const comentarioBreve = ref('');
const isSubmitting = ref(false);
const submittedSuccess = ref(false);
const submittedWasUrgent = ref(false);

const primerNombre = computed(() => {
  const full = pacienteStore.paciente?.nombre_completo || 'Paciente';
  return full.split(' ')[0];
});

const canSubmit = computed(() => Boolean(selectedAnimo.value) && !isSubmitting.value);

watch(
  () => anxiety.isSurveyModalOpen.value,
  (open) => {
    if (open) {
      selectedAnimo.value = null;
      selectedPreocupacion.value = 'Ninguna en especial';
      selectedCancelacion.value = 'no';
      comentarioBreve.value = '';
      submittedSuccess.value = false;
      submittedWasUrgent.value = false;
    }
  }
);

async function enviarEncuesta() {
  if (!selectedAnimo.value || !pacienteStore.paciente) return;
  isSubmitting.value = true;

  const animoObj = opcionesAnimo.find((o) => o.id === selectedAnimo.value)!;
  const cancelObj = opcionesCancelacion.find((o) => o.id === selectedCancelacion.value)!;

  const riesgoCancelacion = cancelObj.riesgo || animoObj.nivel === 'alta';
  const nivelFinal: NivelAnsiedad = cancelObj.riesgo
    ? 'alta'
    : selectedCancelacion.value === 'duda' && animoObj.nivel === 'baja'
    ? 'moderada'
    : animoObj.nivel;

  const puntajeFinal = cancelObj.riesgo
    ? 10
    : selectedCancelacion.value === 'duda'
    ? Math.max(animoObj.puntaje, 7)
    : animoObj.puntaje;

  const estadoAnimoTexto = cancelObj.riesgo
    ? `${animoObj.label} • Piensa en cancelar la cirugía`
    : selectedCancelacion.value === 'duda'
    ? `${animoObj.label} • Con dudas sobre continuar`
    : animoObj.label;

  await anxiety.registrarReporteAnsiedad({
    paciente: pacienteStore.paciente,
    cirugia: pacienteStore.cirugia,
    origen: 'encuesta_rapida',
    nivel: nivelFinal,
    riesgoCancelacion,
    puntaje: puntajeFinal,
    estadoAnimo: estadoAnimoTexto,
    preocupacionPrincipal: selectedPreocupacion.value,
    fraseDetectada: cancelObj.riesgo
      ? 'El paciente indicó en la encuesta rápida que piensa en cancelar o requiere ayuda urgente.'
      : null,
    palabrasClave: cancelObj.riesgo
      ? ['encuesta: riesgo de cancelación', selectedPreocupacion.value]
      : [animoObj.label, selectedPreocupacion.value],
    comentarioPaciente: comentarioBreve.value.trim() || null,
  });

  isSubmitting.value = false;
  submittedSuccess.value = true;
  submittedWasUrgent.value = riesgoCancelacion || nivelFinal === 'alta';

  if (submittedWasUrgent.value) {
    // Cerrar encuesta y desplegar inmediatamente el Directorio de Ayuda con aviso de alerta enviada al médico
    setTimeout(() => {
      anxiety.closeSurveyModal();
      anxiety.openHelpDirectory({
        urgente: true,
        origen: 'encuesta_rapida',
        motivo: cancelObj.riesgo
          ? 'Notamos en tu chequeo que estás pensando en cancelar o necesitas hablar urgente. Ya notificamos con prioridad a tu equipo médico.'
          : 'Notamos en tu chequeo que sientes mucha ansiedad o miedo antes de tu cirugía. Ya notificamos a tu médico para acompañarte.',
        alertaEnviadaMedico: true,
      });
    }, 1200);
  }
}

function llamarASofiDesdeEncuesta() {
  anxiety.closeSurveyModal();
  voiceCall.openCall();
}
</script>

<template>
  <div
    v-if="anxiety.isSurveyModalOpen.value"
    role="dialog"
    aria-modal="true"
    aria-labelledby="precare-survey-title"
    class="fixed inset-0 z-[95] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    @click.self="anxiety.closeSurveyModal()"
  >
    <div class="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-teal-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
      <!-- Cabecera cálida y poco invasiva -->
      <div class="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white px-6 py-5 flex items-start justify-between gap-4">
        <div class="space-y-1.5">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/20 text-white border border-white/30">
              <HeartHandshake class="w-3.5 h-3.5" />
              PreCare • Chequeo Rápido (15 seg)
            </span>
            <span
              v-if="anxiety.surveyTriggerReason.value !== 'manual'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/25 text-amber-100 border border-amber-300/40"
            >
              <Clock class="w-3 h-3" />
              {{
                anxiety.surveyTriggerReason.value === 'desde_pulsera'
                  ? 'Transferida desde tu pulsera PreCare'
                  : anxiety.surveyTriggerReason.value === 'simulacion_mitad_tiempo'
                  ? 'Simulación Portal Web (50% sin contacto IA)'
                  : 'Mitad del tiempo previo • Chequeo PreCare'
              }}
            </span>
          </div>
          <h2 id="precare-survey-title" class="text-xl sm:text-2xl font-black tracking-tight">
            Hola {{ primerNombre }}, ¿cómo te sientes para tu cirugía?
          </h2>
          <p class="text-xs sm:text-sm text-teal-50/90 leading-snug">
            Notamos que aún no hemos conversado con Sofi. Responder esto toma solo unos segundos y ayuda a tu médico a cuidarte mejor.
          </p>
        </div>

        <button
          type="button"
          @click="anxiety.closeSurveyModal()"
          class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
          aria-label="Cerrar encuesta"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Aviso de sincronización con pulsera (solo si aplica) -->
      <div
        v-if="(anxiety.surveyTriggerReason.value === 'auto_mitad_tiempo' || anxiety.surveyTriggerReason.value === 'desde_pulsera') && !submittedSuccess"
        class="px-6 py-2.5 bg-slate-900 text-teal-200 text-xs flex items-center justify-between gap-2 border-b border-slate-800"
      >
        <div class="flex items-center gap-2">
          <Watch class="w-4 h-4 text-teal-400 shrink-0 animate-pulse" />
          <span v-if="anxiety.surveyTriggerReason.value === 'desde_pulsera'">
            Transferida por solicitud tuya desde la llamada en tu <strong>pulsera inteligente PreCare</strong>.
          </span>
          <span v-else>
            Sofi también notificó a tu <strong>pulsera inteligente PreCare</strong> para que puedas responder por voz si lo prefieres.
          </span>
        </div>
      </div>

      <!-- ESTADO: ENVIADO CON ÉXITO -->
      <div v-if="submittedSuccess" class="p-8 text-center space-y-4">
        <div
          class="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
          :class="submittedWasUrgent ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'"
        >
          <ShieldAlert v-if="submittedWasUrgent" class="w-9 h-9 animate-pulse" />
          <CheckCircle2 v-else class="w-9 h-9" />
        </div>

        <h3 class="text-xl font-extrabold text-slate-900">
          {{
            submittedWasUrgent
              ? '¡Ya avisamos de inmediato a tu equipo médico!'
              : '¡Gracias por contarnos cómo te sientes!'
          }}
        </h3>

        <p class="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          {{
            submittedWasUrgent
              ? 'Tu respuesta se envió como prioridad urgente al tablero médico. En un momento abriremos el Directorio de Ayuda directa para que puedas hablar con enfermería ahora mismo.'
              : 'Tu médico ya recibió tu estado emocional en el tablero PreCare. Recuerda que Sofi está disponible 24/7 si te surge cualquier duda.'
          }}
        </p>

        <div v-if="!submittedWasUrgent" class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            @click="llamarASofiDesdeEncuesta"
            class="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
          >
            <PhoneCall class="w-4 h-4" />
            <span>Hablar con Sofi</span>
          </button>
          <button
            type="button"
            @click="anxiety.closeSurveyModal()"
            class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer"
          >
            Continuar en mi portal
          </button>
        </div>
      </div>

      <!-- FORMULARIO RÁPIDO (3 PREGUNTAS VISUALES) -->
      <form v-else @submit.prevent="enviarEncuesta" class="p-6 space-y-5">
        <!-- Pregunta 1: Nivel Emocional -->
        <div class="space-y-2.5">
          <label class="block text-sm font-extrabold text-slate-900">
            1. ¿Cómo describirías tu tranquilidad hoy? <span class="text-rose-500">*</span>
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              v-for="opt in opcionesAnimo"
              :key="opt.id"
              type="button"
              @click="selectedAnimo = opt.id"
              class="p-3.5 rounded-2xl border-2 text-left sm:text-center transition-all cursor-pointer flex sm:flex-col items-center gap-3 sm:gap-1.5"
              :class="[
                selectedAnimo === opt.id
                  ? opt.id === 'mucho_miedo'
                    ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200'
                    : opt.id === 'nervioso'
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                    : 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                  : 'border-slate-200 hover:border-teal-300 bg-white',
              ]"
            >
              <span class="text-3xl leading-none">{{ opt.emoji }}</span>
              <div>
                <span class="block text-sm font-extrabold text-slate-900">{{ opt.label }}</span>
                <span class="block text-[11px] text-slate-500">{{ opt.desc }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Pregunta 2: Principal inquietud -->
        <div class="space-y-2">
          <label class="block text-sm font-extrabold text-slate-900">
            2. ¿Hay algo que te genere más inquietud?
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="item in opcionesPreocupacion"
              :key="item"
              type="button"
              @click="selectedPreocupacion = item"
              class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer"
              :class="
                selectedPreocupacion === item
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              "
            >
              {{ item }}
            </button>
          </div>
        </div>

        <!-- Pregunta 3: Riesgo de cancelación -->
        <div class="space-y-2">
          <label class="block text-sm font-extrabold text-slate-900">
            3. ¿Has pensado en aplazar o cancelar tu cirugía?
          </label>
          <div class="space-y-2">
            <button
              v-for="opt in opcionesCancelacion"
              :key="opt.id"
              type="button"
              @click="selectedCancelacion = opt.id"
              class="w-full px-4 py-2.5 rounded-xl border-2 text-left text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-between gap-2"
              :class="[
                selectedCancelacion === opt.id
                  ? opt.riesgo
                    ? 'border-rose-500 bg-rose-50 text-rose-900'
                    : opt.id === 'duda'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-emerald-500 bg-emerald-50 text-emerald-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              ]"
            >
              <span>{{ opt.label }}</span>
              <span
                class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                :class="
                  selectedCancelacion === opt.id
                    ? opt.riesgo
                      ? 'border-rose-600 bg-rose-600'
                      : 'border-teal-600 bg-teal-600'
                    : 'border-slate-300'
                "
              >
                <span v-if="selectedCancelacion === opt.id" class="w-1.5 h-1.5 rounded-full bg-white"></span>
              </span>
            </button>
          </div>
        </div>

        <!-- Comentario breve opcional -->
        <div>
          <label for="survey-optional-note" class="block text-xs font-bold text-slate-600 mb-1">
            ¿Deseas dejarle una nota rápida a tu médico? (Opcional)
          </label>
          <input
            id="survey-optional-note"
            v-model="comentarioBreve"
            type="text"
            placeholder="Ej. Me da miedo no despertar de la anestesia / Todo bien por ahora..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <!-- Footer de acciones -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            @click="llamarASofiDesdeEncuesta"
            class="px-3.5 py-2.5 rounded-xl text-xs font-bold text-teal-700 hover:bg-teal-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles class="w-4 h-4" />
            <span>Prefiero hablar por voz con Sofi</span>
          </button>

          <button
            type="submit"
            :disabled="!canSubmit"
            class="px-6 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
              selectedCancelacion === 'si_cancelar' || selectedAnimo === 'mucho_miedo'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25'
            "
          >
            <Send class="w-4 h-4" />
            <span>Enviar respuesta a mi médico</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
