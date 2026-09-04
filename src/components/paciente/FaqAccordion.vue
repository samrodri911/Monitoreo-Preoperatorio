<script setup lang="ts">
import { ref } from 'vue';
import { HelpCircle, ChevronDown, HeartHandshake } from 'lucide-vue-next';

interface FaqItem {
  id: string;
  pregunta: string;
  respuesta: string;
}

const faqs: FaqItem[] = [
  {
    id: 'faq-1',
    pregunta: '¿Sentiré dolor mientras me operan?',
    respuesta: 'No, bajo ninguna circunstancia. Durante todo el procedimiento estarás bajo efecto de anestesia general administrada por un médico anestesiólogo dedicado exclusivamente a cuidar tu bienestar y signos vitales. Al despertar, el equipo de enfermería te administrará analgésicos intravenosos si sientes la más mínima molestia.',
  },
  {
    id: 'faq-2',
    pregunta: '¿Por qué es tan estricto el ayuno de 8 horas? ¿Ni siquiera agua?',
    respuesta: 'El ayuno estricto es la regla de oro de la seguridad quirúrgica. Cuando te duermes con anestesia, los reflejos naturales que cierran tu vía digestiva se relajan. Si hubiera restos de comida o líquidos en el estómago, podrían devolverse hacia los pulmones (broncoaspiración). Mantener el estómago 100% vacío salva vidas.',
  },
  {
    id: 'faq-3',
    pregunta: '¿Qué hago si siento mucho miedo o taquicardia antes de entrar?',
    respuesta: 'Es una reacción biológica completamente normal: el cuerpo no sabe distinguir entre una cirugía curativa y una amenaza externa. Puedes practicar la respiración 4-7-8 (inhala por la nariz en 4 segundos, mantén el aire 7 segundos y exhala despacio por la boca en 8 segundos). Además, apenas llegues a preparación, infórmale al anestesiólogo: te suministrará un ansiolítico suave muy agradable para que te sientas en paz.',
  },
  {
    id: 'faq-4',
    pregunta: '¿Cuándo podré volver a comer sólidos después de la cirugía?',
    respuesta: 'Generalmente a las 2 o 4 horas de haber despertado en recuperación, se te ofrecerá un primer sorbo de agua o té claro. Si lo toleras sin náuseas, esa misma noche o al día siguiente iniciarás una dieta blanda (caldos claros, gelatina, puré). En pocos días volverás a tu alimentación habitual.',
  },
];

const openFaqs = ref<Record<string, boolean>>({
  'faq-1': true, // primera abierta por defecto
});

function toggleFaq(id: string) {
  openFaqs.value[id] = !openFaqs.value[id];
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
    <div class="border-b border-slate-100 pb-4">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
        <HeartHandshake class="w-3.5 h-3.5" />
        Contención Humana y Preguntas Frecuentes
      </div>
      <h3 class="text-xl font-bold text-slate-900">Respuestas Claras a tus Mayores Dudas</h3>
      <p class="text-sm text-slate-600 mt-1">
        Explicaciones directas y empáticas de nuestro equipo médico para despejar cualquier temor.
      </p>
    </div>

    <!-- Acordeón de FAQs -->
    <div class="space-y-3">
      <div
        v-for="faq in faqs"
        :key="faq.id"
        class="border rounded-xl transition-colors overflow-hidden"
        :class="openFaqs[faq.id] ? 'border-teal-300 bg-teal-50/20' : 'border-slate-200 bg-white hover:border-slate-300'"
      >
        <button
          type="button"
          @click="toggleFaq(faq.id)"
          class="w-full p-4 text-left font-bold text-sm sm:text-base text-slate-900 flex items-center justify-between gap-3 focus-ring cursor-pointer"
        >
          <span class="flex items-center gap-2">
            <HelpCircle class="w-4 h-4 text-teal-600 flex-shrink-0" />
            {{ faq.pregunta }}
          </span>
          <ChevronDown
            class="w-5 h-5 text-slate-500 transition-transform duration-200 flex-shrink-0"
            :class="{ 'rotate-180 text-teal-600': openFaqs[faq.id] }"
          />
        </button>

        <div
          v-if="openFaqs[faq.id]"
          class="px-4 pb-4 pt-1 text-sm sm:text-base text-slate-700 leading-relaxed border-t border-teal-100/60"
        >
          {{ faq.respuesta }}
        </div>
      </div>
    </div>
  </div>
</template>
