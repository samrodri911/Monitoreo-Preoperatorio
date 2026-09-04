<script setup lang="ts">
import { ClipboardCheck, Shirt, Stethoscope, Bed, Home, CheckCircle2 } from 'lucide-vue-next';

const steps = [
  {
    step: 1,
    time: '2 horas antes',
    title: 'Admisión y Registro Seguro',
    description: 'Llegas a la clínica acompañado. En recepción revisan tus documentos, te colocan el brazalete con tu nombre y te asignan tu casillero seguro.',
    icon: ClipboardCheck,
    color: 'teal',
  },
  {
    step: 2,
    time: '1 hora antes',
    title: 'Preparación Prequirúrgica',
    description: 'Pasas al área vestier y te pones la bata cómoda. La enfermera te canaliza una pequeña vía para suero e hidratación. Conocerás a tu anestesiólogo.',
    icon: Shirt,
    color: 'teal',
  },
  {
    step: 3,
    time: 'Hora de la Cirugía',
    title: 'Paso a Quirófano',
    description: 'Ingresas a una sala limpia y aclimatada. El equipo médico se presenta. El anestesiólogo te administrará medicación relajante y una mascarilla de oxígeno: te quedarás dormido en segundos.',
    icon: Stethoscope,
    color: 'emerald',
  },
  {
    step: 4,
    time: 'Posoperatorio Inmediato',
    title: 'Sala de Recuperación (URPA)',
    description: 'Despertarás arropado con mantas térmicas y acompañado por una enfermera. Te administraremos analgésicos inmediatos para que no sientas dolor alguno.',
    icon: Bed,
    color: 'teal',
  },
  {
    step: 5,
    time: 'Mismo día',
    title: 'Alta Médica y Regreso a Casa',
    description: 'Una vez toleres un vaso de líquido y puedas caminar con apoyo, el cirujano te entregará tu fórmula médica y te irás a descansar a casa con tu familia.',
    icon: Home,
    color: 'teal',
  },
];
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
    <div class="border-b border-slate-100 pb-4">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
        <CheckCircle2 class="w-3.5 h-3.5" />
        Previsibilidad y Reducción del Estrés
      </div>
      <h3 class="text-xl font-bold text-slate-900">¿Qué pasará minuto a minuto el día de tu cirugía?</h3>
      <p class="text-sm text-slate-600 mt-1">
        Conoce el recorrido seguro dentro de la clínica para que nada te tome por sorpresa.
      </p>
    </div>

    <!-- Timeline Vertical de Estaciones -->
    <div class="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-teal-200">
      
      <div
        v-for="st in steps"
        :key="st.step"
        class="relative group"
      >
        <!-- Icono / Badge de Paso -->
        <div
          class="absolute -left-6 sm:-left-8 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-sm"
          :class="st.step === 3 ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-teal-600 ring-4 ring-teal-100'"
        >
          {{ st.step }}
        </div>

        <!-- Contenido de la Estación -->
        <div class="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 hover:bg-teal-50/40 hover:border-teal-300 transition-colors">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h4 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <component :is="st.icon" class="w-4 h-4 text-teal-600 flex-shrink-0" />
              {{ st.title }}
            </h4>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-white text-teal-800 border border-slate-200">
              {{ st.time }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {{ st.description }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>
