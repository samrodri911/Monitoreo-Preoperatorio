<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useClinicaStore } from '../stores/clinicaStore';
import { usePacienteStore } from '../stores/pacienteStore';
import PatientRiskCard from '../components/clinica/PatientRiskCard.vue';
import LiveAlertFeed from '../components/clinica/LiveAlertFeed.vue';
import { ShieldCheck, AlertTriangle, AlertOctagon, Users, RefreshCw, Radio } from 'lucide-vue-next';

const router = useRouter();
const clinicaStore = useClinicaStore();
const pacienteStore = usePacienteStore();
let unsubRealtime: (() => void) | null = null;

onMounted(async () => {
  await clinicaStore.cargarTablero();
  unsubRealtime = clinicaStore.iniciarSuscripcionRealtime();
});

onUnmounted(() => {
  if (unsubRealtime) unsubRealtime();
});

function verPaciente(pacienteId: string) {
  pacienteStore.cargarDatosPaciente(pacienteId);
  router.push('/paciente');
}
</script>

<template>
  <div class="min-h-screen pb-16 pt-6 bg-slate-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
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

        <button
          type="button"
          @click="clinicaStore.cargarTablero"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors focus-ring cursor-pointer self-start md:self-auto"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': clinicaStore.isLoading }" />
          <span>Actualizar Datos</span>
        </button>
      </div>

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

        <!-- Columna de Alertas en Vivo (1 columna en LG) -->
        <div class="lg:col-span-1">
          <div class="sticky top-20">
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
