<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { usePacienteStore } from '../stores/pacienteStore'
import { useChatStore } from '../stores/chat'
import {
  initialMockPacientes,
  initialMockCirugias,
  initialMockPersonalClinico,
  loadPersistedDynamicRecords,
  enrichPacienteWithMeta,
  enrichCirugiaWithMeta,
} from '../lib/mockData'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Paciente, Cirugia } from '../types/database.types'
import {
  HeartPulse,
  UserCheck,
  Stethoscope,
  KeyRound,
  CreditCard,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Building2,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const pacienteStore = usePacienteStore()
const chatStore = useChatStore()

// Tab activa: 'paciente' | 'medico'
const activeTab = ref<'paciente' | 'medico'>('paciente')

// --- Estado Formulario Paciente ---
const documentoInput = ref('')
const pinInput = ref('')
const showPatientPin = ref(false)
const docTouched = ref(false)
const pinTouched = ref(false)
const docError = ref('')
const pinError = ref('')
const patientFormError = ref('')

// --- Estado Formulario Médico ---
const emailInput = ref('')
const passwordInput = ref('')
const showMedicoPassword = ref(false)
const emailTouched = ref(false)
const passwordTouched = ref(false)
const emailError = ref('')
const passwordError = ref('')
const medicoFormError = ref('')

// --- Lista reactiva de pacientes disponibles para acceso rápido (semilla + creados) ---
const pacientesDisponibles = ref<Array<{ paciente: Paciente; cirugia?: Cirugia }>>([])

async function cargarPacientesDemo() {
  loadPersistedDynamicRecords()

  if (isSupabaseConfigured && supabase) {
    try {
      const [{ data: pacs }, { data: cirs }] = await Promise.all([
        supabase.from('pacientes').select('*').order('created_at', { ascending: false }),
        supabase.from('cirugias').select('*'),
      ])
      if (pacs && pacs.length > 0) {
        const cirMap = new Map<string, Cirugia>()
        for (const c of (cirs || []) as Cirugia[]) {
          cirMap.set(c.paciente_id, enrichCirugiaWithMeta(c))
        }
        pacientesDisponibles.value = (pacs as Paciente[]).map((p) => ({
          paciente: enrichPacienteWithMeta(p),
          cirugia: cirMap.get(p.id),
        }))
        return
      }
    } catch (e) {
      console.warn('[LoginView] Fallback a lista local de pacientes:', e)
    }
  }

  pacientesDisponibles.value = initialMockPacientes.map((p) => {
    const pac = enrichPacienteWithMeta(p)
    const cir = initialMockCirugias.find((c) => c.paciente_id === p.id)
    return {
      paciente: pac,
      cirugia: cir ? enrichCirugiaWithMeta(cir) : undefined,
    }
  })
}

onMounted(async () => {
  if (route.query.rol === 'medico') {
    activeTab.value = 'medico'
  }
  await cargarPacientesDemo()
})

const medicosDemo = computed(() => initialMockPersonalClinico)

// --- Validación en blur (si fue editado) y limpieza en input ---
function onDocumentoInput() {
  docTouched.value = true
  docError.value = ''
  patientFormError.value = ''
}

function onDocumentoBlur() {
  if (!docTouched.value) return
  if (!documentoInput.value.trim()) {
    docError.value = 'Ingresa tu número de documento o cédula.'
  } else if (documentoInput.value.trim().length < 4) {
    docError.value = 'El documento debe tener al menos 4 caracteres.'
  }
}

function onPinInput() {
  pinTouched.value = true
  pinError.value = ''
  patientFormError.value = ''
}

function onPinBlur() {
  if (!pinTouched.value) return
  if (!pinInput.value.trim()) {
    pinError.value = 'Ingresa tu PIN de 4 dígitos o código de cirugía (ej. CIR-104).'
  }
}

function onEmailInput() {
  emailTouched.value = true
  emailError.value = ''
  medicoFormError.value = ''
}

function onEmailBlur() {
  if (!emailTouched.value) return
  const val = emailInput.value.trim()
  if (!val) {
    emailError.value = 'Ingresa tu correo institucional.'
  } else if (!val.includes('@')) {
    emailError.value = 'Ingresa un formato de correo válido (ejemplo@hospital.org).'
  }
}

function onPasswordInput() {
  passwordTouched.value = true
  passwordError.value = ''
  medicoFormError.value = ''
}

function onPasswordBlur() {
  if (!passwordTouched.value) return
  if (!passwordInput.value) {
    passwordError.value = 'Ingresa tu contraseña institucional.'
  }
}

// --- Submit Paciente ---
async function handlePatientSubmit() {
  docTouched.value = true
  pinTouched.value = true
  onDocumentoBlur()
  onPinBlur()

  if (docError.value || pinError.value) return

  patientFormError.value = ''
  const ok = await authStore.loginPaciente(documentoInput.value, pinInput.value)

  if (!ok) {
    patientFormError.value = authStore.authError || 'No fue posible iniciar sesión.'
    return
  }

  if (authStore.pacienteId) {
    chatStore.clearChat()
    await pacienteStore.cargarDatosPaciente(authStore.pacienteId)
  }

  router.push('/paciente')
}

// --- Acceso rápido 1 clic Paciente ---
async function accesoRapidoPaciente(pac: Paciente, cir?: Cirugia) {
  documentoInput.value = pac.documento
  pinInput.value = pac.pin_acceso || cir?.codigo_cirugia || '1958'
  docError.value = ''
  pinError.value = ''
  patientFormError.value = ''

  const ok = await authStore.loginRapidoPaciente(pac.id)
  if (ok) {
    chatStore.clearChat()
    await pacienteStore.cargarDatosPaciente(pac.id)
    router.push('/paciente')
  }
}

// --- Submit Médico ---
async function handleMedicoSubmit() {
  emailTouched.value = true
  passwordTouched.value = true
  onEmailBlur()
  onPasswordBlur()

  if (emailError.value || passwordError.value) return

  medicoFormError.value = ''
  const ok = await authStore.loginMedico(emailInput.value, passwordInput.value)

  if (!ok) {
    medicoFormError.value = authStore.authError || 'Credenciales clínicas inválidas.'
    return
  }

  router.push('/clinica')
}

// --- Acceso rápido 1 clic Médico ---
async function accesoRapidoMedico(email: string, passwordDemo = 'Clinica2026*') {
  emailInput.value = email
  passwordInput.value = passwordDemo
  emailError.value = ''
  passwordError.value = ''
  medicoFormError.value = ''

  const ok = await authStore.loginMedico(email, passwordDemo)
  if (ok) {
    router.push('/clinica')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
    <!-- Top Branding Bar -->
    <header class="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 pb-6">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
          <HeartPulse class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-teal-700 block">
            Ecosistema Phygital Prequirúrgico
          </span>
          <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Tech-and-Touch
          </h1>
        </div>
      </div>

      <div class="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white/90 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
        <ShieldCheck class="w-4 h-4 text-teal-600 shrink-0" />
        <span>Portal Seguro de Acompañamiento y Gestión Clínica</span>
      </div>
    </header>

    <!-- Main Content Card -->
    <main class="max-w-5xl w-full mx-auto my-auto">
      <div class="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <!-- Columna Izquierda: Selector de Rol y Formulario -->
        <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <!-- Selector de Rol Dual (Tabs) -->
            <div
              role="tablist"
              aria-label="Tipo de acceso al ecosistema"
              class="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8 border border-slate-200/80"
            >
              <button
                type="button"
                role="tab"
                :aria-selected="activeTab === 'paciente'"
                aria-controls="panel-paciente"
                id="tab-paciente"
                @click="activeTab = 'paciente'"
                class="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer"
                :class="
                  activeTab === 'paciente'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                "
              >
                <UserCheck class="w-5 h-5 shrink-0" />
                <span>Soy Paciente</span>
              </button>

              <button
                type="button"
                role="tab"
                :aria-selected="activeTab === 'medico'"
                aria-controls="panel-medico"
                id="tab-medico"
                @click="activeTab = 'medico'"
                class="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer"
                :class="
                  activeTab === 'medico'
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                "
              >
                <Stethoscope class="w-5 h-5 shrink-0" />
                <span>Personal Clínico</span>
              </button>
            </div>

            <!-- ==========================================
                 PANEL A: INGRESO PACIENTE
                 ========================================== -->
            <section
              v-if="activeTab === 'paciente'"
              id="panel-paciente"
              role="tabpanel"
              aria-labelledby="tab-paciente"
            >
              <div class="mb-6">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
                  <Sparkles class="w-3.5 h-3.5 text-teal-600" />
                  Acompañamiento Personalizado + Asistente Sofi
                </span>
                <h2 id="login-paciente-title" class="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Bienvenido a tu Portal Prequirúrgico
                </h2>
                <p class="text-slate-600 text-sm sm:text-base mt-1">
                  Ingresa con tu número de documento y el PIN o Código de Cirugía entregado en tu consulta médica.
                </p>
              </div>

              <!-- Error general de autenticación -->
              <div
                v-if="patientFormError"
                role="alert"
                class="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-900 flex items-start gap-3"
              >
                <AlertCircle class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div class="text-sm font-medium">{{ patientFormError }}</div>
              </div>

              <form
                aria-labelledby="login-paciente-title"
                @submit.prevent="handlePatientSubmit"
                novalidate
                class="space-y-5"
              >
                <!-- Campo Documento -->
                <div>
                  <label
                    for="patient-doc"
                    class="block text-sm font-bold text-slate-800 mb-1.5"
                  >
                    Número de Documento / Cédula
                  </label>
                  <div class="relative">
                    <CreditCard class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="patient-doc"
                      name="username"
                      v-model="documentoInput"
                      type="text"
                      inputmode="numeric"
                      autocomplete="username"
                      autocorrect="off"
                      autocapitalize="none"
                      spellcheck="false"
                      required
                      placeholder="Ej: 79456123"
                      :aria-invalid="docError ? 'true' : 'false'"
                      aria-describedby="patient-doc-hint patient-doc-error"
                      @input="onDocumentoInput"
                      @blur="onDocumentoBlur"
                      class="w-full pl-12 pr-4 py-3.5 text-base font-medium bg-slate-50 border-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-colors"
                      :class="
                        docError
                          ? 'border-red-400 focus:border-red-600'
                          : 'border-slate-200 focus:border-teal-600'
                      "
                    />
                  </div>
                  <p id="patient-doc-hint" class="text-xs text-slate-500 mt-1">
                    Sin puntos ni espacios (tal como figura en tu documento de identidad).
                  </p>
                  <p
                    v-if="docError"
                    id="patient-doc-error"
                    role="alert"
                    class="text-xs font-bold text-red-600 mt-1"
                  >
                    {{ docError }}
                  </p>
                </div>

                <!-- Campo PIN o Código de Cirugía -->
                <div>
                  <label
                    for="patient-pin"
                    class="block text-sm font-bold text-slate-800 mb-1.5"
                  >
                    PIN de Acceso o Código de Cirugía
                  </label>
                  <div class="relative">
                    <KeyRound class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="patient-pin"
                      name="password"
                      v-model="pinInput"
                      :type="showPatientPin ? 'text' : 'password'"
                      autocomplete="current-password"
                      autocorrect="off"
                      autocapitalize="none"
                      spellcheck="false"
                      required
                      placeholder="Ej: 1958 o CIR-104"
                      :aria-invalid="pinError ? 'true' : 'false'"
                      aria-describedby="patient-pin-hint patient-pin-error"
                      @input="onPinInput"
                      @blur="onPinBlur"
                      class="w-full pl-12 pr-14 py-3.5 text-base font-medium bg-slate-50 border-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-colors"
                      :class="
                        pinError
                          ? 'border-red-400 focus:border-red-600'
                          : 'border-slate-200 focus:border-teal-600'
                      "
                    />
                    <button
                      type="button"
                      :aria-pressed="showPatientPin"
                      aria-label="Mostrar u ocultar PIN de acceso"
                      @click="showPatientPin = !showPatientPin"
                      class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                    >
                      <EyeOff v-if="showPatientPin" class="w-5 h-5" />
                      <Eye v-else class="w-5 h-5" />
                    </button>
                  </div>
                  <p id="patient-pin-hint" class="text-xs text-slate-500 mt-1">
                    Puedes usar tu PIN numérico de 4 dígitos (ej. <code class="font-mono font-bold text-slate-700">1958</code>) o el código de orden (ej. <code class="font-mono font-bold text-slate-700">CIR-104</code>).
                  </p>
                  <p
                    v-if="pinError"
                    id="patient-pin-error"
                    role="alert"
                    class="text-xs font-bold text-red-600 mt-1"
                  >
                    {{ pinError }}
                  </p>
                </div>

                <button
                  type="submit"
                  :disabled="authStore.isLoading"
                  class="w-full py-4 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-base sm:text-lg shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{{ authStore.isLoading ? 'Verificando expediente...' : 'Ingresar a mi Preparación Quirúrgica' }}</span>
                  <ArrowRight class="w-5 h-5" />
                </button>
              </form>
            </section>

            <!-- ==========================================
                 PANEL B: INGRESO PERSONAL CLÍNICO
                 ========================================== -->
            <section
              v-else
              id="panel-medico"
              role="tabpanel"
              aria-labelledby="tab-medico"
            >
              <div class="mb-6">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 mb-2">
                  <Building2 class="w-3.5 h-3.5 text-slate-700" />
                  Coordinación Quirúrgica y Triage Preoperatorio
                </span>
                <h2 id="login-medico-title" class="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Acceso Clínico Institucional
                </h2>
                <p class="text-slate-600 text-sm sm:text-base mt-1">
                  Monitorea el tablero semáforo en tiempo real y parametriza nuevos pacientes y cirugías.
                </p>
              </div>

              <!-- Error general médico -->
              <div
                v-if="medicoFormError"
                role="alert"
                class="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-900 flex items-start gap-3"
              >
                <AlertCircle class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div class="text-sm font-medium">{{ medicoFormError }}</div>
              </div>

              <form
                aria-labelledby="login-medico-title"
                @submit.prevent="handleMedicoSubmit"
                novalidate
                class="space-y-5"
              >
                <!-- Correo Institucional -->
                <div>
                  <label
                    for="medico-email"
                    class="block text-sm font-bold text-slate-800 mb-1.5"
                  >
                    Correo Institucional
                  </label>
                  <div class="relative">
                    <Mail class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="medico-email"
                      name="email"
                      v-model="emailInput"
                      type="email"
                      autocomplete="username"
                      autocorrect="off"
                      autocapitalize="none"
                      spellcheck="false"
                      required
                      placeholder="nombre.apellido@hospital.org"
                      :aria-invalid="emailError ? 'true' : 'false'"
                      aria-describedby="medico-email-error"
                      @input="onEmailInput"
                      @blur="onEmailBlur"
                      class="w-full pl-12 pr-4 py-3.5 text-base font-medium bg-slate-50 border-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-colors"
                      :class="
                        emailError
                          ? 'border-red-400 focus:border-red-600'
                          : 'border-slate-200 focus:border-slate-800'
                      "
                    />
                  </div>
                  <p
                    v-if="emailError"
                    id="medico-email-error"
                    role="alert"
                    class="text-xs font-bold text-red-600 mt-1"
                  >
                    {{ emailError }}
                  </p>
                </div>

                <!-- Contraseña -->
                <div>
                  <label
                    for="medico-password"
                    class="block text-sm font-bold text-slate-800 mb-1.5"
                  >
                    Contraseña
                  </label>
                  <div class="relative">
                    <Lock class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="medico-password"
                      name="password"
                      v-model="passwordInput"
                      :type="showMedicoPassword ? 'text' : 'password'"
                      autocomplete="current-password"
                      required
                      placeholder="••••••••••••"
                      :aria-invalid="passwordError ? 'true' : 'false'"
                      aria-describedby="medico-password-error"
                      @input="onPasswordInput"
                      @blur="onPasswordBlur"
                      class="w-full pl-12 pr-14 py-3.5 text-base font-medium bg-slate-50 border-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-colors"
                      :class="
                        passwordError
                          ? 'border-red-400 focus:border-red-600'
                          : 'border-slate-200 focus:border-slate-800'
                      "
                    />
                    <button
                      type="button"
                      :aria-pressed="showMedicoPassword"
                      aria-label="Mostrar u ocultar contraseña"
                      @click="showMedicoPassword = !showMedicoPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                    >
                      <EyeOff v-if="showMedicoPassword" class="w-5 h-5" />
                      <Eye v-else class="w-5 h-5" />
                    </button>
                  </div>
                  <p
                    v-if="passwordError"
                    id="medico-password-error"
                    role="alert"
                    class="text-xs font-bold text-red-600 mt-1"
                  >
                    {{ passwordError }}
                  </p>
                </div>

                <button
                  type="submit"
                  :disabled="authStore.isLoading"
                  class="w-full py-4 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-base sm:text-lg shadow-lg shadow-slate-900/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{{ authStore.isLoading ? 'Autenticando...' : 'Abrir Tablero de Control Clínico' }}</span>
                  <ArrowRight class="w-5 h-5" />
                </button>
              </form>
            </section>
          </div>

          <div class="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Estándar de Accesibilidad WCAG AA • Datos Protegidos</span>
            <router-link to="/hub" class="font-semibold text-teal-700 hover:underline">
              Acerca del proyecto
            </router-link>
          </div>
        </div>

        <!-- Columna Derecha: Tarjetas de Acceso Rápido (1 Clic) -->
        <aside class="lg:col-span-5 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between">
          <!-- Modo Paciente: Lista de Pacientes Activos -->
          <div v-if="activeTab === 'paciente'">
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-xs font-bold uppercase tracking-wider text-teal-400">
                Acceso Rápido para Pruebas (1 Clic)
              </span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold">
                {{ pacientesDisponibles.length }} expedientes
              </span>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">
              Expedientes Prequirúrgicos Activos
            </h3>
            <p class="text-xs text-slate-300 mb-5 leading-relaxed">
              Selecciona cualquier paciente (incluyendo los que acabes de registrar desde la vista médica) para autocompletar e iniciar sesión al instante:
            </p>

            <div class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              <button
                v-for="item in pacientesDisponibles"
                :key="item.paciente.id"
                type="button"
                @click="accesoRapidoPaciente(item.paciente, item.cirugia)"
                class="w-full text-left p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-teal-400 transition-all group cursor-pointer"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="font-bold text-white group-hover:text-teal-300 transition-colors flex items-center gap-2">
                      <span>{{ item.paciente.nombre_completo }}</span>
                      <span class="text-xs font-normal text-slate-400">({{ item.paciente.edad }} años)</span>
                    </div>
                    <p class="text-xs text-teal-300 font-medium mt-0.5">
                      {{ item.cirugia?.tipo_cirugia || 'Cirugía Programada' }}
                    </p>
                  </div>
                  <span class="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold shrink-0 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
                    Entrar →
                  </span>
                </div>

                <div class="mt-3 pt-2.5 border-t border-slate-700/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <span>
                    Doc: <strong class="font-mono text-white">{{ item.paciente.documento }}</strong>
                  </span>
                  <span>
                    PIN: <strong class="font-mono text-teal-300">{{ item.paciente.pin_acceso || '1958' }}</strong>
                  </span>
                  <span v-if="item.cirugia?.codigo_cirugia">
                    Cód: <strong class="font-mono text-amber-300">{{ item.cirugia.codigo_cirugia }}</strong>
                  </span>
                </div>
              </button>
            </div>
          </div>

          <!-- Modo Médico: Lista de Personal Clínico -->
          <div v-else>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-400">
                Credenciales Clínicas Demo (1 Clic)
              </span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                Equipo Quirúrgico
              </span>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">
              Personal Médico y Coordinación
            </h3>
            <p class="text-xs text-slate-300 mb-5 leading-relaxed">
              Haz clic en un perfil médico para entrar directamente al Tablero Semáforo y crear nuevas cirugías o pacientes:
            </p>

            <div class="space-y-3">
              <button
                v-for="med in medicosDemo"
                :key="med.id"
                type="button"
                @click="accesoRapidoMedico(med.email, med.password_Demo)"
                class="w-full text-left p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 transition-all group cursor-pointer"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="font-bold text-white group-hover:text-amber-300 transition-colors">
                      {{ med.nombre_completo }}
                    </div>
                    <p class="text-xs text-amber-300 font-medium mt-0.5">
                      {{ med.rol }} • {{ med.especialidad }}
                    </p>
                  </div>
                  <span class="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold shrink-0 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                    Ingresar →
                  </span>
                </div>

                <div class="mt-3 pt-2.5 border-t border-slate-700/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <span>
                    Usuario: <strong class="font-mono text-white">{{ med.email }}</strong>
                  </span>
                  <span>
                    Clave: <strong class="font-mono text-amber-300">{{ med.password_Demo || 'Clinica2026*' }}</strong>
                  </span>
                </div>
              </button>
            </div>
          </div>

          <!-- Nota informativa inferior -->
          <div class="mt-6 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300 space-y-1.5">
            <div class="flex items-center gap-2 font-bold text-white">
              <CheckCircle2 class="w-4 h-4 text-teal-400 shrink-0" />
              <span>Flujo Dinámico Fin-a-Fin Activo</span>
            </div>
            <p class="leading-relaxed text-slate-300">
              Todo paciente registrado desde el entorno médico genera su checklist horario automático, recibe contexto personalizado en <strong class="text-white">Sofi</strong> y puede iniciar sesión de inmediato con su Cédula y PIN.
            </p>
          </div>
        </aside>
      </div>
    </main>

    <footer class="max-w-5xl w-full mx-auto pt-6 text-center text-xs text-slate-500">
      Tech-and-Touch • Prevención de Cancelaciones Quirúrgicas y Mitigación de Ansiedad Preoperatoria
    </footer>
  </div>
</template>
