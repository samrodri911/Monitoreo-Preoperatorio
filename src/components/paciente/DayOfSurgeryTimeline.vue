<script setup lang="ts">
import { computed } from 'vue';
import type { MaterialEducativo } from '../../types/database.types';
import { ClipboardCheck, Shirt, Stethoscope, Bed, Home, CheckCircle2 } from 'lucide-vue-next';

const props = defineProps<{
  materiales?: MaterialEducativo[];
}>();

// Pasos por defecto si no vienen dinámicos de la DB
const defaultSteps = [
  {
    step: 1,
    time: '2 horas antes',
    title: '1. Ingreso y Admisión',
    description: 'Llegas a la clínica con tu acompañante. En recepción revisan tus documentos (cédula, orden médica y exámenes prequirúrgicos), te colocan tu brazalete de identificación clínica y te asignan tu casillero o habitación.',
    icon: ClipboardCheck,
  },
  {
    step: 2,
    time: '1 hora antes',
    title: '2. Preparación Inmediata',
    description: 'Pasas al área vestier y te pones la bata cómoda y gorro antiséptico. La enfermera canaliza una vía venosa pequeña en tu brazo para hidratación. El anestesiólogo te saludará y responderá tus preguntas.',
    icon: Shirt,
  },
  {
    step: 3,
    time: 'Hora de la Cirugía',
    title: '3. Entrada a Quirófano',
    description: 'Ingresas a la sala quirúrgica climatizada. El equipo se presenta. El anestesiólogo te colocará una mascarilla de oxígeno suave y medicación relajante por la vena: te quedarás dormido en segundos sin sentir dolor.',
    icon: Stethoscope,
  },
  {
    step: 4,
    time: 'Posoperatorio Inmediato',
    title: '4. Sala de Recuperación (URPA)',
    description: 'Despertarás arropado con mantas térmicas confortables y acompañado por una enfermera. Te administraremos analgésicos inmediatos para asegurar tu total comodidad.',
    icon: Bed,
  },
  {
    step: 5,
    time: 'Mismo día',
    title: '5. Criterios de Alta y Regreso',
    description: 'Una vez toleres un vaso de líquido y puedas caminar con asistencia, el cirujano firmará tu alta con las pautas domiciliarias. Saldrás acompañado por tu familiar en transporte privado.',
    icon: Home,
  },
];

const steps = computed(() => {
  const materialesRecorrido = props.materiales?.filter(m => m.categoria === 'recorrido');
  if (materialesRecorrido && materialesRecorrido.length > 0) {
    const sorted = [...materialesRecorrido].sort((a, b) => a.orden_visualizacion - b.orden_visualizacion);
    const icons = [ClipboardCheck, Shirt, Stethoscope, Bed, Home];
    return sorted.map((mat, index) => ({
      step: index + 1,
      time: index === 0 ? '2 horas antes' : index === 1 ? '1 hora antes' : index === 2 ? 'En quirófano' : index === 3 ? 'En URPA' : 'Alta médica',
      title: mat.titulo,
      description: mat.contenido_markdown || mat.descripcion_corta,
      icon: icons[index % icons.length],
    }));
  }
  return defaultSteps;
});
</script>

<template>
  <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
    
    <!-- Cabecera -->
    <div class="border-b border-slate-100 pb-4">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
        <CheckCircle2 class="w-3.5 h-3.5" />
        Previsibilidad y Reducción del Estrés (RD1)
      </div>
      <h3 class="text-2xl font-bold text-slate-900">El Recorrido de tu Cirugía Paso a Paso</h3>
      <p class="text-sm text-slate-600 mt-1">
        Conoce cada estación del hospital para que nada te tome por sorpresa, desde la admisión hasta tu regreso a casa.
      </p>
    </div>

    <!-- Timeline Vertical de Estaciones -->
    <div class="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-teal-200">
      
      <div
        v-for="st in steps"
        :key="st.step"
        class="relative group"
      >
        <!-- Icono / Badge de Paso -->
        <div
          class="absolute -left-6 sm:-left-8 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-md transition-transform group-hover:scale-110"
          :class="st.step === 3 ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-teal-600 ring-4 ring-teal-100'"
        >
          {{ st.step }}
        </div>

        <!-- Tarjeta de la Estación -->
        <div class="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:bg-teal-50/40 hover:border-teal-300 transition-colors space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h4 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <component :is="st.icon" class="w-5 h-5 text-teal-600 flex-shrink-0" />
              {{ st.title }}
            </h4>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white text-teal-800 border border-slate-200 shadow-2xs">
              {{ st.time }}
            </span>
          </div>
          <p class="text-sm text-slate-600 leading-relaxed">
            {{ st.description }}
          </p>
        </div>

      </div>

    </div>
  </div>
</template>
