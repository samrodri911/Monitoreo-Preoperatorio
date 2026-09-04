<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isSupabaseConfigured } from '../../lib/supabase';
import { usePacienteStore } from '../../stores/pacienteStore';
import { MOCK_PACIENTE_A_ID, MOCK_PACIENTE_B_ID } from '../../lib/mockData';
import { Activity, User, HeartHandshake, Database } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const pacienteStore = usePacienteStore();

const isPacienteRoute = computed(() => route.path.startsWith('/paciente'));

function cambiarPaciente(id: string) {
  pacienteStore.cargarDatosPaciente(id);
  if (!isPacienteRoute.value) {
    router.push('/paciente');
  }
}
</script>

<template>
  <header class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <!-- Logo & Brand -->
        <router-link to="/" class="flex items-center gap-3 group focus-ring rounded-lg p-1">
          <div class="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:bg-teal-700 transition-colors">
            <HeartHandshake class="w-6 h-6" />
          </div>
          <div>
            <span class="text-lg font-bold text-slate-900 tracking-tight block leading-tight">Tech-and-Touch</span>
            <span class="text-xs font-medium text-teal-700 block">Ecosistema Prequirúrgico Inclusivo</span>
          </div>
        </router-link>

        <!-- Navigation Links -->
        <nav class="hidden md:flex items-center gap-1" aria-label="Navegación principal">
          <router-link
            to="/"
            class="px-3 py-2 rounded-lg text-sm font-semibold transition-colors focus-ring"
            :class="route.path === '/' ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            Hub Demo
          </router-link>

          <router-link
            to="/paciente"
            class="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors focus-ring"
            :class="isPacienteRoute ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <User class="w-4 h-4" />
            Portal del Paciente
          </router-link>

          <router-link
            to="/clinica"
            class="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors focus-ring"
            :class="route.path === '/clinica' ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <Activity class="w-4 h-4" />
            Tablero Hospitalario
          </router-link>
        </nav>

        <!-- Status & Patient Switcher -->
        <div class="flex items-center gap-3">
          <!-- Switcher de Pacientes para Demostración -->
          <div class="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <span class="text-slate-500 px-2">Ver como:</span>
            <button
              @click="cambiarPaciente(MOCK_PACIENTE_A_ID)"
              class="px-2.5 py-1 rounded transition-colors focus-ring"
              :class="pacienteStore.currentPacienteId === MOCK_PACIENTE_A_ID ? 'bg-white shadow text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'"
              title="Cirugía en 48h - Preparación al día"
            >
              🟢 Carlos (-48h)
            </button>
            <button
              @click="cambiarPaciente(MOCK_PACIENTE_B_ID)"
              class="px-2.5 py-1 rounded transition-colors focus-ring"
              :class="pacienteStore.currentPacienteId === MOCK_PACIENTE_B_ID ? 'bg-white shadow text-red-700 font-bold' : 'text-slate-600 hover:text-slate-900'"
              title="Cirugía en 6h - Ayuno Crítico Pendiente"
            >
              🔴 Elena (-6h)
            </button>
          </div>

          <!-- Badge de Estado de Supabase -->
          <div
            v-if="isSupabaseConfigured"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
            title="Conectado a la base de datos Supabase en tiempo real"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Database class="w-3.5 h-3.5" />
            <span class="hidden lg:inline">Supabase Live</span>
          </div>
          <div
            v-else
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300"
            title="Operando en Modo Demo Local reactivo mientras configuras tus claves en .env.local"
          >
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="font-medium">Modo Demo Local</span>
          </div>
        </div>

      </div>
    </div>
  </header>
</template>
