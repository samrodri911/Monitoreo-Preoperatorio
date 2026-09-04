<script setup lang="ts">
import { ref, computed } from 'vue';
import type { MaterialEducativo } from '../../types/database.types';
import { HelpCircle, ChevronDown, HeartHandshake } from 'lucide-vue-next';

const props = defineProps<{
  materiales?: MaterialEducativo[];
}>();

const defaultFaqs = [
  {
    id: 'faq-1',
    pregunta: '¿Sentiré dolor durante o después de la cirugía?',
    respuesta: 'Durante la cirugía NO sentirás ningún dolor, ya que estarás bajo anestesia general profunda monitoreada segundo a segundo por un médico anestesiólogo especialista.\n\nDespués de la cirugía es normal sentir una ligera molestia o distensión. En la sala de recuperación te suministraremos analgésicos intravenosos inmediatos para que estés completamente cómodo.',
  },
  {
    id: 'faq-2',
    pregunta: '¿Qué hago si tengo tos, fiebre o resfriado el día anterior?',
    respuesta: 'Si presentas fiebre, tos con flema o congestión fuerte el día anterior a tu cirugía, debes avisar inmediatamente a nuestro equipo de enfermería a través del botón de ayuda del portal.\n\nEl equipo evaluará la inflamación de tu vía respiratoria para decidir si es totalmente seguro continuar o si es conveniente reprogramar unos días para proteger tu salud.',
  },
  {
    id: 'faq-3',
    pregunta: '¿Puedo tomar agua con mis medicamentos de la mañana?',
    respuesta: 'Solo debes tomar los medicamentos que tu anestesiólogo o cirujano te haya indicado explícitamente durante la cita prequirúrgica (por ejemplo, antihipertensivos en dosis específica).\n\nSi te autorizaron tomarlo, hazlo únicamente con un solo sorbo de agua muy pequeño (máximo un trago) al menos 2 horas antes de tu hora de llegada.',
  },
  {
    id: 'faq-4',
    pregunta: '¿Quién me debe acompañar para el regreso a casa?',
    respuesta: 'Es un requisito obligatorio ingresar y salir del centro hospitalario con un adulto responsable de tu entera confianza.\n\nTras la anestesia no podrás conducir ni tomar transporte público tú solo. Tu acompañante escuchará las indicaciones médicas, reclamará la fórmula de medicamentos y te acompañará hasta tu hogar.',
  },
];

const faqs = computed(() => {
  const materialesFaq = props.materiales?.filter(m => m.categoria === 'faq');
  if (materialesFaq && materialesFaq.length > 0) {
    return materialesFaq.map(mat => ({
      id: mat.id,
      pregunta: mat.titulo,
      respuesta: mat.contenido_markdown || mat.descripcion_corta,
    }));
  }
  return defaultFaqs;
});

const openFaqs = ref<Record<string, boolean>>({
  'faq-1': true, // Primera FAQ desplegada por defecto
});

function toggleFaq(id: string) {
  openFaqs.value[id] = !openFaqs.value[id];
}
</script>

<template>
  <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
    
    <!-- Cabecera -->
    <div class="border-b border-slate-100 pb-4">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
        <HeartHandshake class="w-3.5 h-3.5" />
        Contención Humana y Preguntas Frecuentes
      </div>
      <h3 class="text-2xl font-bold text-slate-900">Respuestas Claras a tus Dudas Críticas</h3>
      <p class="text-sm text-slate-600 mt-1">
        Explicaciones transparentes y empáticas de nuestro equipo médico para disipar temores comunes antes de ingresar a quirófano.
      </p>
    </div>

    <!-- Acordeón de FAQs -->
    <div class="space-y-3">
      <div
        v-for="faq in faqs"
        :key="faq.id"
        class="border rounded-2xl transition-all overflow-hidden"
        :class="openFaqs[faq.id] ? 'border-teal-300 bg-teal-50/20 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'"
      >
        <button
          type="button"
          @click="toggleFaq(faq.id)"
          class="w-full p-4 sm:p-5 text-left font-bold text-base sm:text-lg text-slate-900 flex items-center justify-between gap-4 focus-ring cursor-pointer"
        >
          <span class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
              <HelpCircle class="w-4 h-4" />
            </div>
            <span>{{ faq.pregunta }}</span>
          </span>
          <ChevronDown
            class="w-5 h-5 text-slate-500 transition-transform duration-200 flex-shrink-0"
            :class="{ 'rotate-180 text-teal-600': openFaqs[faq.id] }"
          />
        </button>

        <div
          v-if="openFaqs[faq.id]"
          class="px-5 pb-5 pt-2 text-sm sm:text-base text-slate-700 leading-relaxed border-t border-teal-100/60 whitespace-pre-line"
        >
          {{ faq.respuesta }}
        </div>
      </div>
    </div>

  </div>
</template>
