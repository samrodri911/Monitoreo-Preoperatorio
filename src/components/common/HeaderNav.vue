<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isSupabaseConfigured } from '../../lib/supabase';
import { usePacienteStore } from '../../stores/pacienteStore';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chat';
import { useVoiceCall } from '../../composables/useVoiceCall';
import { useAnxietyMonitoring } from '../../composables/useAnxietyMonitoring';
import {
  Activity,
  User,
  HeartHandshake,
  Database,
  PhoneCall,
  X,
  ShieldAlert,
  Phone,
  LogOut,
  Stethoscope,
  ArrowLeft,
  AlertOctagon,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const pacienteStore = usePacienteStore();
const authStore = useAuthStore();
const chatStore = useChatStore();
const voiceCall = useVoiceCall();
const anxiety = useAnxietyMonitoring();

const isLoginRoute = computed(() => route.path === '/login');
const isPacienteRoute = computed(() => route.path.startsWith('/paciente'));

function handleLogout() {
  if (voiceCall.isCallModalOpen.value) {
    voiceCall.endCall();
  }
  anxiety.closeHelpDirectory();
  anxiety.closeSurveyModal();
  chatStore.clearChat();
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <header v-if="!isLoginRoute" class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- HEADER PARA EL PORTAL DEL PACIENTE (Aislamiento Estricto de Roles) -->
      <div v-if="isPacienteRoute" class="flex items-center justify-between h-16">
        
        <!-- Logo & Marca del Paciente -->
        <div class="flex items-center gap-3 p-1">
          <div class="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
            <HeartHandshake class="w-6 h-6" />
          </div>
          <div>
            <span class="text-lg font-bold text-slate-900 tracking-tight block leading-tight">PreCare</span>
            <span class="text-xs font-semibold text-teal-700 block">
              {{ authStore.isMedico ? 'Vista Previa del Paciente (Modo Médico)' : 'Portal de Acompañamiento del Paciente' }}
            </span>
          </div>
        </div>

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

        <!-- Acciones del Paciente y Cierre de Sesión -->
        <div class="flex items-center gap-2 sm:gap-2.5">
          
          <!-- Si es Médico previsualizando al paciente, botón para regresar al Tablero Clínico -->
          <router-link
            v-if="authStore.isMedico"
            to="/clinica"
            class="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
            title="Regresar al Tablero Clínico Semáforo"
          >
            <ArrowLeft class="w-4 h-4" />
            <span class="hidden md:inline">Tablero Clínico</span>
          </router-link>

          <!-- Botón Iniciar Llamada con Asistente (100% Voz) -->
          <button
            type="button"
            @click="voiceCall.openCall"
            class="px-3 py-2 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm shadow-emerald-600/25 transition-all focus-ring cursor-pointer hover:scale-105 active:scale-95"
            title="Iniciar llamada de voz directa con el Asistente Sofi (Manos libres)"
          >
            <PhoneCall class="w-4 h-4 animate-bounce" />
            <span class="hidden sm:inline">Llamar a Sofi</span>
            <span class="sm:hidden">Llamar</span>
          </button>

          <!-- Botón de Ayuda & Contacto 24/7 -->
          <button
            type="button"
            @click="anxiety.openHelpDirectory()"
            class="px-2.5 py-2 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all focus-ring cursor-pointer"
            title="Directorio de líneas de atención"
          >
            <Phone class="w-4 h-4 text-teal-700" />
            <span class="hidden xl:inline">Directorio Ayuda</span>
          </button>

          <!-- Botón Cerrar Sesión -->
          <button
            type="button"
            @click="handleLogout"
            class="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors focus-ring cursor-pointer"
            title="Cerrar sesión activa y volver al ingreso"
          >
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">Cerrar Sesión</span>
          </button>

        </div>

      </div>

      <!-- HEADER PARA EL TABLERO CLÍNICO Y HUB -->
      <div v-else class="flex items-center justify-between h-16">
        
        <!-- Logo & Brand -->
        <router-link to="/clinica" class="flex items-center gap-3 group focus-ring rounded-lg p-1">
          <div class="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:bg-teal-700 transition-colors">
            <HeartHandshake class="w-6 h-6" />
          </div>
          <div>
            <span class="text-lg font-bold text-slate-900 tracking-tight block leading-tight">PreCare</span>
            <span class="text-xs font-medium text-teal-700 block">Coordinación Quirúrgica Hospitalaria</span>
          </div>
        </router-link>

        <!-- Navigation Links Clínicos -->
        <nav class="hidden md:flex items-center gap-1" aria-label="Navegación clínica">
          <router-link
            to="/clinica"
            class="px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors focus-ring"
            :class="route.path === '/clinica' ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <Activity class="w-4 h-4" />
            Tablero Semáforo
          </router-link>

          <router-link
            to="/paciente"
            class="px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors focus-ring"
            :class="isPacienteRoute ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <User class="w-4 h-4" />
            Vista Previa Paciente
          </router-link>

          <router-link
            to="/hub"
            class="px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors focus-ring"
            :class="route.path === '/hub' ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            Arquitectura
          </router-link>
        </nav>

        <!-- Info Médico + Supabase Status + Cerrar Sesión -->
        <div class="flex items-center gap-2.5">
          <div
            v-if="authStore.medicoData"
            class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs"
          >
            <Stethoscope class="w-4 h-4 text-teal-700" />
            <div>
              <span class="font-bold text-slate-900 block leading-tight">{{ authStore.medicoData.nombre_completo }}</span>
              <span class="text-[11px] text-slate-500 block leading-tight">{{ authStore.medicoData.rol }}</span>
            </div>
          </div>

          <div
            v-if="isSupabaseConfigured"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
            title="Conectado a la base de datos Supabase en tiempo real"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Database class="w-3.5 h-3.5" />
            <span class="hidden xl:inline">Supabase Live</span>
          </div>
          <div
            v-else
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300"
            title="Operando en Modo Demo Local reactivo"
          >
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="hidden sm:inline font-medium">Modo Local</span>
          </div>

          <button
            v-if="authStore.isAuthenticated"
            type="button"
            @click="handleLogout"
            class="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cerrar sesión activa"
          >
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">Cerrar Sesión</span>
          </button>
          <router-link
            v-else
            to="/login"
            class="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm transition-colors"
          >
            Iniciar Sesión
          </router-link>
        </div>

      </div>

    </div>
  </header>

  <!-- MODAL EMPÁTICO DE AYUDA Y ASISTENCIA 24/7 (GLOBAL - TAMBIÉN DISPARABLE POR IA SOFI) -->
  <div
    v-if="anxiety.isHelpDirectoryOpen.value"
    role="dialog"
    aria-modal="true"
    class="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    @click.self="anxiety.closeHelpDirectory()"
  >
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto border-2"
      :class="anxiety.helpDirectoryContext.value?.urgente ? 'border-rose-400' : 'border-teal-100'"
    >
      
      <!-- Cabecera del Modal -->
      <div class="flex items-start justify-between border-b border-slate-100 pb-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            :class="anxiety.helpDirectoryContext.value?.urgente ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-teal-100 text-teal-700'"
          >
            <AlertOctagon v-if="anxiety.helpDirectoryContext.value?.urgente" class="w-6 h-6" />
            <PhoneCall v-else class="w-6 h-6" />
          </div>
          <div>
            <span
              class="text-xs font-bold uppercase tracking-wider block"
              :class="anxiety.helpDirectoryContext.value?.urgente ? 'text-rose-700' : 'text-teal-700'"
            >
              {{ anxiety.helpDirectoryContext.value?.urgente ? 'PreCare • Directorio de Apoyo Inmediato' : 'PreCare • Líneas Directas Prequirúrgicas' }}
            </span>
            <h3 class="text-xl font-bold text-slate-900">
              {{ anxiety.helpDirectoryContext.value?.urgente ? 'No estás solo, estamos aquí contigo' : '¿Tienes dudas o necesitas ayuda?' }}
            </h3>
          </div>
        </div>

        <button
          type="button"
          @click="anxiety.closeHelpDirectory()"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-ring cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Banner de Contención Automática cuando Sofi detectó ansiedad / miedo / deseo de cancelar -->
      <div
        v-if="anxiety.helpDirectoryContext.value?.urgente"
        class="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5"
      >
        <p class="text-xs font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
          <ShieldAlert class="w-4 h-4 text-rose-600 shrink-0" />
          <span>Activación Automática por Detección Emocional</span>
        </p>
        <p class="text-sm text-rose-950 leading-snug">
          {{ anxiety.helpDirectoryContext.value.motivo }}
        </p>
        <p v-if="anxiety.helpDirectoryContext.value.alertaEnviadaMedico" class="text-xs font-bold text-rose-700 pt-1">
          ✓ Ya enviamos una notificación prioritaria a tu equipo médico en PreCare para acompañarte.
        </p>
      </div>

      <!-- Mensaje Tranquilizador -->
      <p class="text-sm text-slate-600 leading-relaxed">
        Nuestro equipo de enfermería, psicología prequirúrgica y cirujanos está disponible las 24 horas para escucharte, resolver dudas y brindarte total tranquilidad antes de tu procedimiento.
      </p>

      <!-- Directorio de Contacto Inmediato -->
      <div class="space-y-3">
        <!-- Línea Directa de Enfermería -->
        <a
          href="tel:+573009998877"
          class="flex items-center justify-between p-4 rounded-2xl bg-teal-50 border border-teal-200 hover:bg-teal-100/80 transition-colors group"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Phone class="w-5 h-5" />
            </div>
            <div>
              <span class="font-bold text-slate-900 block text-base group-hover:text-teal-900">Enfermería de Turno 24/7</span>
              <span class="text-xs text-teal-700 font-medium">Acompañamiento inmediato, pautas y ayuno</span>
            </div>
          </div>
          <span class="text-sm font-mono font-bold text-teal-800 shrink-0">+57 300 999 8877</span>
        </a>

        <!-- Línea de Apoyo Emocional / Psicología Prequirúrgica -->
        <a
          href="tel:+573107776655"
          class="flex items-center justify-between p-4 rounded-2xl bg-rose-50/70 border border-rose-200 hover:bg-rose-100/80 transition-colors group"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <HeartHandshake class="w-5 h-5" />
            </div>
            <div>
              <span class="font-bold text-slate-900 block text-base group-hover:text-rose-900">Apoyo Emocional Prequirúrgico</span>
              <span class="text-xs text-rose-700 font-medium">Manejo de miedo, ansiedad o dudas sobre operarte</span>
            </div>
          </div>
          <span class="text-sm font-mono font-bold text-rose-800 shrink-0">+57 310 777 6655</span>
        </a>

        <!-- Coordinación Quirúrgica -->
        <a
          href="tel:+573158889900"
          class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors group"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
              <ShieldAlert class="w-5 h-5" />
            </div>
            <div>
              <span class="font-bold text-slate-900 block text-base">Coordinación Quirúrgica</span>
              <span class="text-xs text-slate-500">Cambios de fecha, cancelaciones o síntomas</span>
            </div>
          </div>
          <span class="text-sm font-mono font-bold text-slate-800 shrink-0">+57 315 888 9900</span>
        </a>
      </div>

      <!-- Pie del Modal -->
      <div class="pt-2 border-t border-slate-100 text-center">
        <button
          type="button"
          @click="anxiety.closeHelpDirectory()"
          class="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors focus-ring cursor-pointer"
        >
          Cerrar Directorio de Ayuda
        </button>
      </div>

    </div>
  </div>
</template>
