<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isSupabaseConfigured } from '../../lib/supabase';
import { usePacienteStore } from '../../stores/pacienteStore';
import { MOCK_PACIENTE_A_ID, MOCK_PACIENTE_B_ID } from '../../lib/mockData';
import { Activity, User, HeartHandshake, Database, PhoneCall, X, ShieldAlert, Phone } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const pacienteStore = usePacienteStore();
const showHelpModal = ref(false);

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
      
      <!-- HEADER PARA EL PORTAL DEL PACIENTE (Aislamiento Estricto de Roles) -->
      <div v-if="isPacienteRoute" class="flex items-center justify-between h-16">
        
        <!-- Logo & Marca del Paciente -->
        <router-link to="/" class="flex items-center gap-3 group focus-ring rounded-lg p-1">
          <div class="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:bg-teal-700 transition-colors">
            <HeartHandshake class="w-6 h-6" />
          </div>
          <div>
            <span class="text-lg font-bold text-slate-900 tracking-tight block leading-tight">Tech-and-Touch</span>
            <span class="text-xs font-semibold text-teal-700 block">Portal de Acompañamiento del Paciente</span>
          </div>
        </router-link>

        <!-- Datos del Paciente Activo (Centro del Header) -->
        <div class="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-xl bg-teal-50/70 border border-teal-100 text-xs">
          <User class="w-4 h-4 text-teal-600" />
          <div>
            <span class="font-bold text-slate-900 block leading-tight">
              {{ pacienteStore.paciente?.nombre_completo || 'Cargando paciente...' }}
            </span>
            <span class="text-slate-500 block leading-tight">
              {{ pacienteStore.cirugia?.nombre_sencillo || pacienteStore.cirugia?.tipo_cirugia }}
            </span>
          </div>
        </div>

        <!-- Acciones del Paciente & Selector Discreto de Testing -->
        <div class="flex items-center gap-3">
          
          <!-- Botón de Ayuda & Contacto 24/7 -->
          <button
            type="button"
            @click="showHelpModal = true"
            class="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm shadow-teal-600/20 transition-all focus-ring cursor-pointer"
          >
            <PhoneCall class="w-4 h-4 animate-bounce" />
            <span class="hidden sm:inline">Ayuda & Asistencia 24/7</span>
            <span class="sm:hidden">Ayuda</span>
          </button>

          <!-- Selector Discreto de Prueba (Testing de Casos) -->
          <div class="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <span class="text-slate-400 px-2 font-mono text-[11px]">Prueba:</span>
            <button
              @click="cambiarPaciente(MOCK_PACIENTE_A_ID)"
              class="px-2.5 py-1 rounded transition-colors focus-ring"
              :class="pacienteStore.currentPacienteId === MOCK_PACIENTE_A_ID ? 'bg-white shadow text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'"
              title="Cargar Paciente A: Carlos Mendoza (Cirugía en 48h)"
            >
              Carlos Mendoza (48h)
            </button>
            <button
              @click="cambiarPaciente(MOCK_PACIENTE_B_ID)"
              class="px-2.5 py-1 rounded transition-colors focus-ring"
              :class="pacienteStore.currentPacienteId === MOCK_PACIENTE_B_ID ? 'bg-white shadow text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'"
              title="Cargar Paciente B: Elena Restrepo (Cirugía en 6h)"
            >
              Elena Restrepo (6h)
            </button>
          </div>

          <!-- Salir al Hub -->
          <router-link
            to="/"
            class="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-ring text-xs font-semibold"
            title="Volver al Hub Principal"
          >
            Hub Demo
          </router-link>

        </div>

      </div>

      <!-- HEADER PARA EL TABLERO CLÍNICO Y HUB DEMO -->
      <div v-else class="flex items-center justify-between h-16">
        
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

        <!-- Navigation Links Clínicos -->
        <nav class="hidden md:flex items-center gap-1" aria-label="Navegación clínica">
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

        <!-- Supabase Live Status -->
        <div class="flex items-center gap-3">
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
            title="Operando en Modo Demo Local reactivo"
          >
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="font-medium">Modo Demo Local</span>
          </div>
        </div>

      </div>

    </div>
  </header>

  <!-- MODAL EMPÁTICO DE AYUDA Y ASISTENCIA 24/7 -->
  <div
    v-if="showHelpModal"
    class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    @click.self="showHelpModal = false"
  >
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Cabecera del Modal -->
      <div class="flex items-start justify-between border-b border-slate-100 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
            <PhoneCall class="w-6 h-6" />
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-teal-700 block">Líneas Directas Prequirúrgicas</span>
            <h3 class="text-xl font-bold text-slate-900">¿Tienes dudas o necesitas ayuda?</h3>
          </div>
        </div>

        <button
          @click="showHelpModal = false"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-ring"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Mensaje Tranquilizador -->
      <p class="text-sm text-slate-600 leading-relaxed">
        Nuestro equipo de enfermería y cirujanos está disponible las 24 horas para escucharte, resolver dudas sobre tu ayuno o medicamentos y brindarte total tranquilidad.
      </p>

      <!-- Directorio de Contacto Inmediato -->
      <div class="space-y-3">
        <!-- Línea Directa de Enfermería -->
        <a
          href="tel:+573009998877"
          class="flex items-center justify-between p-4 rounded-2xl bg-teal-50 border border-teal-200 hover:bg-teal-100/80 transition-colors group"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
              <Phone class="w-5 h-5" />
            </div>
            <div>
              <span class="font-bold text-slate-900 block text-base group-hover:text-teal-900">Enfermería de Turno 24/7</span>
              <span class="text-xs text-teal-700 font-medium">Asistencia sobre pautas y ayuno</span>
            </div>
          </div>
          <span class="text-sm font-mono font-bold text-teal-800">+57 300 999 8877</span>
        </a>

        <!-- Urgencias Quirúrgicas -->
        <a
          href="tel:+573158889900"
          class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors group"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center">
              <ShieldAlert class="w-5 h-5" />
            </div>
            <div>
              <span class="font-bold text-slate-900 block text-base">Coordinación Quirúrgica</span>
              <span class="text-xs text-slate-500">Cambios de fecha o síntomas repentinos</span>
            </div>
          </div>
          <span class="text-sm font-mono font-bold text-slate-800">+57 315 888 9900</span>
        </a>
      </div>

      <!-- Pie del Modal -->
      <div class="pt-2 border-t border-slate-100 text-center">
        <button
          @click="showHelpModal = false"
          class="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors focus-ring"
        >
          Cerrar Ventana de Ayuda
        </button>
      </div>

    </div>
  </div>
</template>
