<script setup lang="ts">
import type { Paciente, Cirugia } from '../../types/database.types';
import { Calendar, User, Phone, ShieldAlert, Sparkles } from 'lucide-vue-next';

defineProps<{
  paciente: Paciente | null;
  cirugia: Cirugia | null;
}>();

function formatFecha(fechaStr?: string) {
  if (!fechaStr) return '';
  const date = new Date(fechaStr);
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
          <Sparkles class="w-3.5 h-3.5" />
          Programa Quirúrgico Seguro
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {{ cirugia?.tipo_cirugia || 'Cargando procedimiento...' }}
        </h1>
        <p class="text-slate-600 mt-1 flex items-center gap-2 text-sm sm:text-base capitalize">
          <Calendar class="w-4 h-4 text-teal-600 flex-shrink-0" />
          {{ formatFecha(cirugia?.fecha_programada) }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span class="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          Estado: {{ cirugia?.estado?.replace('_', ' ') || 'Programada' }}
        </span>
      </div>
    </div>

    <!-- Metadatos del Paciente -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-sm">
      <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
        <User class="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
        <div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Paciente</span>
          <span class="font-bold text-slate-900 block text-base">{{ paciente?.nombre_completo }}</span>
          <span class="text-xs text-slate-500">Doc: {{ paciente?.documento }} • {{ paciente?.edad }} años</span>
        </div>
      </div>

      <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
        <Phone class="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
        <div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Contacto Paciente</span>
          <span class="font-medium text-slate-900 block text-base">{{ paciente?.telefono }}</span>
          <span class="text-xs text-slate-500">Línea de monitoreo</span>
        </div>
      </div>

      <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
        <ShieldAlert class="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
        <div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Acompañante de Apoyo</span>
          <span class="font-medium text-slate-900 block text-base">{{ paciente?.contacto_emergencia }}</span>
          <span class="text-xs text-teal-700 font-medium">Notificación asistida</span>
        </div>
      </div>
    </div>
  </div>
</template>
