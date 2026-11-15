<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { usePacienteStore } from '../../stores/pacienteStore'
import { useVoiceCall } from '../../composables/useVoiceCall'
import { usePautaAlarms } from '../../composables/usePautaAlarms'
import type { PautaConCheckin } from '../../types/database.types'
import {
  Watch,
  BellRing,
  CheckCircle2,
  Mic,
  MicOff,
  PhoneOff,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  Maximize2,
  Bot,
} from 'lucide-vue-next'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const pacienteStore = usePacienteStore()
const voiceCall = useVoiceCall()
const pautaAlarms = usePautaAlarms()

// Control de apertura del panel flotante
const internalOpen = ref(true)
const isPanelOpen = computed({
  get: () => (props.open !== undefined ? props.open : internalOpen.value),
  set: (val: boolean) => {
    internalOpen.value = val
    emit('update:open', val)
  },
})

export type WristbandLedMode =
  | 'idle'
  | 'call_blue'
  | 'call_listening'
  | 'call_thinking'
  | 'alarm_amber'
  | 'alarm_red'
  | 'confirm_green'

const activeAlarmPauta = ref<PautaConCheckin | null>(null)
const isConfirmGreen = ref(false)
const isWristbandSpeaking = ref(false)
const isVibrating = ref(false)
const lastConfirmedTitle = ref<string | null>(null)

// Estado del botón táctil único (detección de clic corto vs pulsación larga 1.4s)
const isPressingButton = ref(false)
const pressProgress = ref(0) // 0 a 100% durante los 1400ms
const LONG_PRESS_MS = 1400

let longPressTimer: ReturnType<typeof setTimeout> | null = null
let pressProgressInterval: ReturnType<typeof setInterval> | null = null
let alarmLoopInterval: ReturnType<typeof setInterval> | null = null
let confirmGreenTimeout: ReturnType<typeof setTimeout> | null = null
let longPressTriggered = false
let pressStartTime = 0

// Preguntas frecuentes para probar la voz con 1 clic
const preguntasFrecuentesDemo = [
  '¿Puedo tomar agua?',
  '¿A qué hora inicio el ayuno?',
  '¿Puedo tomar mi pastilla de la presión?',
  'Tengo nervios por la anestesia',
]

// Nombre de pila del paciente activo (ej. "Carlos")
const primerNombrePaciente = computed(() => {
  const full = pacienteStore.paciente?.nombre_completo?.trim()
  if (!full) return 'Carlos'
  return full.split(/\s+/)[0] || 'Carlos'
})

// Siguiente pauta pendiente para simular o confirmar
const siguientePautaPendiente = computed<PautaConCheckin | null>(() => {
  const pendientes = pacienteStore.pautas.filter(
    (p) => p.checkin?.estado !== 'completado'
  )
  if (pendientes.length === 0) return null
  const criticas = pendientes.filter((p) => p.es_critica)
  return criticas[0] || pendientes[0] || null
})

// Sincronizar si `usePautaAlarms` dispara una alarma desde el reloj o desde CheckinItem
watch(
  () => pautaAlarms.ringingAlarm.value,
  (ringing) => {
    if (ringing && activeAlarmPauta.value?.id !== ringing.pauta.id) {
      activarAlarmaEnPulsera(ringing.pauta, false)
    } else if (!ringing && activeAlarmPauta.value) {
      detenerAlarmaPulsera()
    }
  }
)

// Determinar si una pauta es crítica o vencida (Rojo vs Amarillo/Ámbar)
function esPautaCriticaOVencida(pauta: PautaConCheckin): boolean {
  if (pauta.es_critica) {
    const limiteMs = new Date(pauta.fecha_limite).getTime()
    if (!Number.isNaN(limiteMs) && limiteMs <= Date.now()) {
      return true
    }
    return true
  }
  return false
}

// Estado actual del LED RGB central multi-canal
const ledMode = computed<WristbandLedMode>(() => {
  if (isConfirmGreen.value) return 'confirm_green'
  if (activeAlarmPauta.value) {
    return esPautaCriticaOVencida(activeAlarmPauta.value)
      ? 'alarm_red'
      : 'alarm_amber'
  }
  if (voiceCall.isCallActive.value) {
    if (voiceCall.callStatus.value === 'listening') return 'call_listening'
    if (voiceCall.callStatus.value === 'thinking') return 'call_thinking'
    if (voiceCall.callStatus.value === 'transferred') return 'alarm_red'
    return 'call_blue'
  }
  return 'idle'
})

// Determinar si el altavoz de la pulsera está emitiendo voz de Sofi
const isSpeakerEmitting = computed(() => {
  if (isWristbandSpeaking.value) return true
  if (
    voiceCall.isCallActive.value &&
    (voiceCall.callStatus.value === 'speaking' ||
      voiceCall.callStatus.value === 'greeting')
  ) {
    return true
  }
  return false
})

// Estado en vivo de la llamada con Sofi (idéntico a VoiceCallModal)
const callStatusBadge = computed(() => {
  switch (voiceCall.callStatus.value) {
    case 'greeting':
      return {
        color: 'bg-teal-500/20 text-teal-200 border-teal-400/40',
        dot: 'bg-teal-400 animate-pulse',
        text: 'Conectando con Sofi...',
        subtext: 'Iniciando acompañamiento en el altavoz de tu pulsera',
      }
    case 'listening':
      return {
        color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50',
        dot: 'bg-emerald-400 animate-ping',
        text: 'Escuchando... te atiendo con calma',
        subtext: 'Habla por tu micrófono, la pulsera te escucha',
      }
    case 'thinking':
      return {
        color: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
        dot: 'bg-amber-400 animate-pulse',
        text: 'Pensando...',
        subtext: 'Sofi consultando tu protocolo clínico...',
      }
    case 'speaking':
      return {
        color: 'bg-sky-500/20 text-sky-200 border-sky-400/50',
        dot: 'bg-sky-400 animate-pulse',
        text: 'Sofi Hablando...',
        subtext: 'Escucha con atención por el micro-altavoz',
      }
    case 'transferred':
      return {
        color: 'bg-rose-500/20 text-rose-200 border-rose-400/50',
        dot: 'bg-rose-500',
        text: 'Transferido a Enfermería (RD4)',
        subtext: 'Alerta prioritaria enviada a soporte humano',
      }
    case 'ending':
      return {
        color: 'bg-slate-500/20 text-slate-200 border-slate-400/40',
        dot: 'bg-slate-400',
        text: 'Finalizando llamada...',
        subtext: '¡Hasta pronto!',
      }
    case 'error':
      return {
        color: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
        dot: 'bg-rose-400',
        text: 'Aviso de voz',
        subtext: voiceCall.errorMessage.value || 'Micrófono no detectado',
      }
    default:
      return {
        color: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
        dot: 'bg-sky-400',
        text: 'Llamada Activa en Pulsera',
        subtext: 'Acompañamiento continuo manos libres',
      }
  }
})

// Etiqueta descriptiva externa (fuera del cuerpo de la pulsera)
const estadoSensorialLabel = computed(() => {
  switch (ledMode.value) {
    case 'confirm_green':
      return '🟢 Confirmación Exitosa • Check-in Cumplido'
    case 'alarm_red':
      return '🔴 Alerta Crítica • 1 Clic para Confirmar'
    case 'alarm_amber':
      return '🟡 Recordatorio de Pauta • 1 Clic para Confirmar'
    case 'call_listening':
      return '🟢 Sofi Escuchando (Micrófono Activo)'
    case 'call_thinking':
      return '🟡 Sofi Pensando Respuesta...'
    case 'call_blue':
      return '🔵 Sofi Hablando por el Altavoz'
    default:
      return '⚫ En Reposo (Monitoreo Pasivo)'
  }
})

// =========================================================================
// SÍNTESIS DE TONOS CON WEB AUDIO API (Cero archivos externos)
// =========================================================================
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  if (!AudioCtx) return null
  return new AudioCtx()
}

/**
 * Tono suave de aviso de alarma en la pulsera (doble pulso cálido)
 */
function playWristbandAlarmTone(isCritical = false) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const freqs = isCritical ? [740, 880, 740] : [587.33, 659.25]
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = isCritical ? 'triangle' : 'sine'
      const start = ctx.currentTime + idx * 0.16
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.15)
    })
  } catch {}
}

/**
 * Pitido breve de éxito al confirmar un check-in con 1 clic (LED Verde)
 */
function playConfirmSuccessBeep() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const notes = [523.25, 783.99, 1046.5]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const start = ctx.currentTime + idx * 0.09
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.24)
    })
  } catch {}
}

/**
 * Tono suave de conexión al conectar con Sofi
 */
function playCallConnectTone() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const notes = [440, 554.37, 659.25]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const start = ctx.currentTime + idx * 0.1
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.27)
    })
  } catch {}
}

/**
 * Tono breve de desconexión al colgar la llamada
 */
function playCallDisconnectTone() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const notes = [659.25, 493.88, 329.63]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const start = ctx.currentTime + idx * 0.09
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.22)
    })
  } catch {}
}

// =========================================================================
// GESTIÓN DE LLAMADA CON SOFI EN LA PULSERA
// =========================================================================
let lastAlarmConfirmedTime = 0

function iniciarLlamadaPulsera() {
  // BLOQUEO ABSOLUTO: Si hay alarma activa, o si se confirmó/apagó una alarma hace menos de 4 segundos, NUNCA iniciar llamada
  if (
    activeAlarmPauta.value ||
    pautaAlarms.ringingAlarm.value ||
    (Date.now() - lastAlarmConfirmedTime < 4000) ||
    isConfirmGreen.value
  ) {
    console.warn('[SmartWristbandSimulator] Bloqueo de seguridad: Llamada rechazada porque hay una alarma activa o recién confirmada.')
    return
  }

  isPanelOpen.value = true

  // Desbloqueo de síntesis de voz en el navegador por interacción del usuario
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume()
    } catch {}
  }

  playCallConnectTone()
  voiceCall.startWristbandCall({ showModal: false })
}

function finalizarLlamadaPulsera() {
  voiceCall.stopWristbandSpeech()
  voiceCall.hangUp()
  playCallDisconnectTone()
}

function enviarPreguntaRapida(pregunta: string) {
  if (!voiceCall.isCallActive.value) {
    iniciarLlamadaPulsera()
    setTimeout(() => {
      voiceCall.procesarTurnoDelPaciente(pregunta)
    }, 700)
  } else {
    voiceCall.procesarTurnoDelPaciente(pregunta)
  }
}

function abrirEnPantallaCompleta() {
  voiceCall.isCallModalOpen.value = true
}

// =========================================================================
// GESTIÓN DE ALARMAS Y CHECK-INS
// =========================================================================
function activarAlarmaEnPulsera(pauta: PautaConCheckin, speakWithSofi = true) {
  if (voiceCall.isCallActive.value) {
    voiceCall.hangUp()
  }

  detenerAlarmaPulsera()
  isConfirmGreen.value = false
  activeAlarmPauta.value = pauta
  isVibrating.value = true

  const critica = esPautaCriticaOVencida(pauta)
  playWristbandAlarmTone(critica)

  alarmLoopInterval = setInterval(() => {
    if (activeAlarmPauta.value) {
      playWristbandAlarmTone(critica)
    } else {
      detenerAlarmaPulsera()
    }
  }, 4200)

  if (speakWithSofi) {
    const recordatorioVoz = `Hola ${primerNombrePaciente.value}, es hora de tu pauta: ${pauta.titulo}. ${pauta.descripcion}. Presiona el botón de tu pulsera para confirmar.`
    voiceCall.speakWristbandReminder(recordatorioVoz, {
      onStart: () => {
        isWristbandSpeaking.value = true
      },
      onEnded: () => {
        isWristbandSpeaking.value = false
      },
    })
  }
}

function detenerAlarmaPulsera() {
  if (alarmLoopInterval) {
    clearInterval(alarmLoopInterval)
    alarmLoopInterval = null
  }
  isVibrating.value = false
  isWristbandSpeaking.value = false
  activeAlarmPauta.value = null
}

async function simularAlarmaPautaPendiente() {
  isPanelOpen.value = true
  let target = siguientePautaPendiente.value

  if (!target && pacienteStore.pautas.length > 0) {
    const primera =
      pacienteStore.pautas.find((p) => p.es_critica) || pacienteStore.pautas[0]
    if (primera) {
      await pacienteStore.toggleCheckin(primera.id)
      target =
        pacienteStore.pautas.find((p) => p.id === primera.id) || primera
    }
  }

  if (target) {
    activarAlarmaEnPulsera(target, true)
  }
}

async function confirmarPautaConUnClic() {
  lastAlarmConfirmedTime = Date.now()
  clearPressTimers()
  isPressingButton.value = false
  pressProgress.value = 0
  longPressTriggered = false

  const pautaPorConfirmar =
    activeAlarmPauta.value || pautaAlarms.ringingAlarm.value?.pauta
  if (!pautaPorConfirmar) return

  voiceCall.stopWristbandSpeech()
  detenerAlarmaPulsera()
  if (pautaAlarms.ringingAlarm.value) {
    pautaAlarms.dismissActiveAlarm()
  }

  isConfirmGreen.value = true
  lastConfirmedTitle.value = pautaPorConfirmar.titulo
  playConfirmSuccessBeep()

  if (confirmGreenTimeout) clearTimeout(confirmGreenTimeout)
  confirmGreenTimeout = setTimeout(() => {
    isConfirmGreen.value = false
  }, 2500)

  await pacienteStore.completarCheckin(pautaPorConfirmar.id)
}

// =========================================================================
// INTERACCIÓN CON EL BOTÓN TÁCTIL ÚNICO
// 1 Clic: Confirmar pauta si hay alarma sonando, o Colgar llamada activa.
// En reposo: Muestra aviso de mantener presionado. NUNCA inicia llamada por clic corto.
// Mantener (1.4s): Iniciar llamada con Sofi (o colgar si ya está activa).
// =========================================================================
const showHoldHint = ref(false)
let holdHintTimeout: ReturnType<typeof setTimeout> | null = null
let lastShortClickTime = 0

function playHoldHintTone() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, ctx.currentTime)
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.18)
  } catch {}
}

function mostrarAvisoMantenerPresionado() {
  playHoldHintTone()
  showHoldHint.value = true
  if (holdHintTimeout) clearTimeout(holdHintTimeout)
  holdHintTimeout = setTimeout(() => {
    showHoldHint.value = false
  }, 3200)
}

function handleButtonClick(e?: MouseEvent) {
  if (e) {
    e.preventDefault()
    e.stopPropagation()
  }

  // SIEMPRE limpiar cualquier temporizador de pulsación pendiente en un clic
  clearPressTimers()
  isPressingButton.value = false
  pressProgress.value = 0

  // Si se completó una pulsación larga real, ya fue atendida por su propio temporizador
  if (longPressTriggered) {
    longPressTriggered = false
    return
  }

  ejecutarAccionClicCorto()
}

function handleButtonPointerDown(e: PointerEvent) {
  if (e.button !== 0) return

  clearPressTimers()
  longPressTriggered = false
  pressProgress.value = 0

  // Si hay una alarma sonando o se acaba de apagar hace menos de 4s, NO permitir temporizador de llamada
  if (
    activeAlarmPauta.value ||
    pautaAlarms.ringingAlarm.value ||
    (Date.now() - lastAlarmConfirmedTime < 4000) ||
    isConfirmGreen.value
  ) {
    return
  }

  try {
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
  } catch {}

  // Desbloqueo anticipado de audio en el gesto del usuario
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume()
    } catch {}
  }

  isPressingButton.value = true
  pressStartTime = Date.now()

  pressProgressInterval = setInterval(() => {
    const elapsed = Date.now() - pressStartTime
    pressProgress.value = Math.min(100, Math.round((elapsed / LONG_PRESS_MS) * 100))
  }, 40)

  longPressTimer = setTimeout(() => {
    // Validar que el botón sigue efectivamente presionado y que transcurrió el tiempo real
    if (isPressingButton.value && (Date.now() - pressStartTime) >= (LONG_PRESS_MS - 50)) {
      longPressTriggered = true
      pressProgress.value = 100
      clearPressTimers()
      ejecutarAccionPulsacionLarga()
    } else {
      clearPressTimers()
      isPressingButton.value = false
      pressProgress.value = 0
    }
  }, LONG_PRESS_MS)
}

function handleButtonPointerUp(e?: PointerEvent) {
  if (e) {
    try {
      (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId)
    } catch {}
  }
  clearPressTimers()
  isPressingButton.value = false
  pressProgress.value = 0
}

function handleButtonPointerCancel(e?: PointerEvent) {
  if (e) {
    try {
      (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId)
    } catch {}
  }
  clearPressTimers()
  isPressingButton.value = false
  pressProgress.value = 0
  longPressTriggered = false
}

function clearPressTimers() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  if (pressProgressInterval) {
    clearInterval(pressProgressInterval)
    pressProgressInterval = null
  }
}

function ejecutarAccionClicCorto() {
  const now = Date.now()
  if (now - lastShortClickTime < 350) return
  lastShortClickTime = now

  // 1. Si hay una alarma sonando -> Confirmar check-in y apagar alarma (¡NUNCA inicia llamada!)
  if (activeAlarmPauta.value || pautaAlarms.ringingAlarm.value) {
    confirmarPautaConUnClic()
    return
  }

  // 2. Si ya está en llamada -> Colgar llamada
  if (voiceCall.isCallActive.value) {
    finalizarLlamadaPulsera()
    return
  }

  // 3. Si está en reposo -> La llamada NUNCA se activa con un simple clic.
  // Debe mantenerse presionado 1.4s para evitar llamadas accidentales.
  mostrarAvisoMantenerPresionado()
}

function ejecutarAccionPulsacionLarga() {
  clearPressTimers()
  isPressingButton.value = false
  pressProgress.value = 0

  // Bloqueo estricto si hay o hubo alarma reciente
  if (
    activeAlarmPauta.value ||
    pautaAlarms.ringingAlarm.value ||
    (Date.now() - lastAlarmConfirmedTime < 4000) ||
    isConfirmGreen.value
  ) {
    return
  }

  // Desbloqueo de síntesis de voz en el navegador por interacción del usuario
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume()
    } catch {}
  }

  // 1. Si ya está en llamada -> Colgar llamada
  if (voiceCall.isCallActive.value) {
    finalizarLlamadaPulsera()
    return
  }

  // 2. En reposo -> Iniciar llamada con Sofi por pulsación sostenida (1.4s)
  iniciarLlamadaPulsera()
}

onUnmounted(() => {
  clearPressTimers()
  detenerAlarmaPulsera()
  if (confirmGreenTimeout) clearTimeout(confirmGreenTimeout)
  if (holdHintTimeout) clearTimeout(holdHintTimeout)
})
</script>

<template>
  <aside
    aria-label="Simulador Pulsera Phygital de Mínima Fricción"
    class="fixed bottom-5 left-4 sm:left-6 z-40 max-w-[370px] w-[calc(100vw-2rem)] sm:w-[360px] select-none"
  >
    <!-- Barra Plegada / Cabecera Flotante del Simulador -->
    <div
      class="rounded-3xl bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/90 shadow-2xl overflow-hidden transition-all duration-300"
      :class="{
        'ring-2 ring-amber-400/90': ledMode === 'alarm_amber',
        'ring-2 ring-rose-500/90': ledMode === 'alarm_red',
        'ring-2 ring-sky-400/90': ledMode === 'call_blue',
        'ring-2 ring-emerald-400/90': ledMode === 'call_listening' || ledMode === 'confirm_green',
      }"
    >
      <!-- Encabezado con Botón Toggle para Abrir / Minimizar -->
      <div
        class="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 cursor-pointer"
        @click="isPanelOpen = !isPanelOpen"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors"
            :class="{
              'bg-slate-800 border-slate-700 text-teal-400': ledMode === 'idle',
              'bg-sky-500/20 border-sky-400 text-sky-300': ledMode === 'call_blue',
              'bg-emerald-500/20 border-emerald-400 text-emerald-300': ledMode === 'call_listening' || ledMode === 'confirm_green',
              'bg-amber-500/20 border-amber-400 text-amber-300': ledMode === 'call_thinking' || ledMode === 'alarm_amber',
              'bg-rose-500/20 border-rose-400 text-rose-300': ledMode === 'alarm_red',
            }"
          >
            <Watch class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-extrabold tracking-wide text-white truncate">
                Pulsera Phygital
              </span>
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :class="{
                  'bg-slate-500': ledMode === 'idle',
                  'bg-sky-400': ledMode === 'call_blue',
                  'bg-emerald-400 animate-ping': ledMode === 'call_listening',
                  'bg-amber-400 animate-pulse': ledMode === 'call_thinking' || ledMode === 'alarm_amber',
                  'bg-rose-500': ledMode === 'alarm_red',
                  'bg-emerald-400': ledMode === 'confirm_green',
                }"
              ></span>
            </div>
            <p class="text-[11px] text-slate-400 truncate">
              {{ estadoSensorialLabel }}
            </p>
          </div>
        </div>

        <button
          type="button"
          :aria-expanded="isPanelOpen"
          :aria-label="isPanelOpen ? 'Minimizar simulador de pulsera' : 'Abrir simulador de pulsera'"
          @click.stop="isPanelOpen = !isPanelOpen"
          class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <ChevronDown v-if="isPanelOpen" class="w-4 h-4" />
          <ChevronUp v-else class="w-4 h-4" />
        </button>
      </div>

      <!-- Cuerpo Desplegable del Simulador -->
      <div v-show="isPanelOpen" class="p-4 space-y-4 max-h-[82vh] overflow-y-auto">
        <!-- ===============================================================
             RENDERIZADO INDUSTRIAL CSS/SVG DE LA PULSERA SIN PANTALLA
             (Carcasa 70mm x 40mm a escala, correa texturizada, altavoz, LED RGB y botón único)
             =============================================================== -->
        <div class="relative flex flex-col items-center justify-center py-2 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800/80 shadow-inner">
          <!-- Indicador sutil de progreso de pulsación larga -->
          <div
            v-if="isPressingButton && pressProgress > 10"
            class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-sky-950/90 border border-sky-500/60 text-[10px] font-bold text-sky-300 flex items-center gap-1"
          >
            <span>Manteniendo... {{ Math.ceil(((100 - pressProgress) * 1.4) / 100 * 10) / 10 }}s</span>
          </div>

          <!-- Correa Superior en Silicona Negra Texturizada -->
          <div
            class="w-[82px] h-8 rounded-t-xl wristband-strap border-x border-t border-neutral-800 shadow-md flex flex-col justify-evenly items-center py-1"
            aria-hidden="true"
          >
            <div class="w-10 h-1 rounded-full bg-neutral-950/90 border border-neutral-800/70"></div>
            <div class="w-10 h-1 rounded-full bg-neutral-950/90 border border-neutral-800/70"></div>
          </div>

          <!-- Carcasa Principal Ergonómica en Polímero Negro Mate (70mm x 40mm a escala) -->
          <div
            class="relative w-[138px] h-[236px] rounded-[36px] wristband-body border-2 border-neutral-700/80 shadow-2xl flex flex-col items-center justify-between py-6 px-4"
            :class="{ 'wristband-haptic-vibrate': isVibrating }"
          >
            <!-- Bisel interior metálico mate -->
            <div
              class="pointer-events-none absolute inset-1.5 rounded-[30px] border border-white/[0.06]"
              aria-hidden="true"
            ></div>

            <!-- 1. PARRILLA SUPERIOR DE ALTAVOZ (Micro-altavoz dinámico + ondas acústicas) -->
            <div class="relative flex items-center justify-center w-16 h-16 mt-0.5" aria-hidden="true">
              <!-- Ondas acústicas expansivas cuando Sofi habla por la pulsera -->
              <template v-if="isSpeakerEmitting">
                <span class="speaker-wave speaker-wave-1"></span>
                <span class="speaker-wave speaker-wave-2"></span>
              </template>

              <!-- Patrón circular concéntrico de micro-perforaciones en SVG -->
              <svg
                viewBox="0 0 64 64"
                class="w-14 h-14 relative z-10"
                aria-hidden="true"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="25"
                  fill="#0a0d12"
                  stroke="#262930"
                  stroke-width="1.2"
                />
                <circle cx="32" cy="32" r="2.2" fill="#030406" />
                <!-- Anillo interior (6 micro-perforaciones) -->
                <circle cx="32" cy="22" r="2" fill="#030406" />
                <circle cx="40.6" cy="27" r="2" fill="#030406" />
                <circle cx="40.6" cy="37" r="2" fill="#030406" />
                <circle cx="32" cy="42" r="2" fill="#030406" />
                <circle cx="23.4" cy="37" r="2" fill="#030406" />
                <circle cx="23.4" cy="27" r="2" fill="#030406" />
                <!-- Anillo exterior (12 micro-perforaciones) -->
                <circle cx="32" cy="13" r="1.8" fill="#030406" />
                <circle cx="41.5" cy="15.5" r="1.8" fill="#030406" />
                <circle cx="48.5" cy="22.5" r="1.8" fill="#030406" />
                <circle cx="51" cy="32" r="1.8" fill="#030406" />
                <circle cx="48.5" cy="41.5" r="1.8" fill="#030406" />
                <circle cx="41.5" cy="48.5" r="1.8" fill="#030406" />
                <circle cx="32" cy="51" r="1.8" fill="#030406" />
                <circle cx="22.5" cy="48.5" r="1.8" fill="#030406" />
                <circle cx="15.5" cy="41.5" r="1.8" fill="#030406" />
                <circle cx="13" cy="32" r="1.8" fill="#030406" />
                <circle cx="15.5" cy="22.5" r="1.8" fill="#030406" />
                <circle cx="22.5" cy="15.5" r="1.8" fill="#030406" />
              </svg>
            </div>

            <!-- 2. LED RGB CENTRAL (Indicador Multi-canal con halo realista) -->
            <div class="relative flex items-center justify-center my-1" aria-hidden="true">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                :class="{
                  'led-diode-idle': ledMode === 'idle',
                  'led-diode-blue': ledMode === 'call_blue',
                  'led-diode-listening': ledMode === 'call_listening',
                  'led-diode-thinking': ledMode === 'call_thinking',
                  'led-diode-amber': ledMode === 'alarm_amber',
                  'led-diode-red': ledMode === 'alarm_red',
                  'led-diode-green': ledMode === 'confirm_green',
                }"
              >
                <div
                  class="w-3.5 h-3.5 rounded-full transition-colors duration-200"
                  :class="{
                    'bg-neutral-700/70': ledMode === 'idle',
                    'bg-sky-200': ledMode === 'call_blue',
                    'bg-emerald-200': ledMode === 'call_listening' || ledMode === 'confirm_green',
                    'bg-amber-200': ledMode === 'call_thinking' || ledMode === 'alarm_amber',
                    'bg-rose-200': ledMode === 'alarm_red',
                  }"
                ></div>
              </div>
            </div>

            <!-- 3. BOTÓN TÁCTIL ÚNICO FRONTAL (1 clic o mantener presionado) -->
            <div class="relative flex items-center justify-center mb-0.5">
              <!-- Anillo SVG de carga durante pulsación larga -->
              <svg
                v-if="isPressingButton"
                viewBox="0 0 68 68"
                class="w-16 h-16 absolute -inset-1 -rotate-90 pointer-events-none"
                aria-hidden="true"
              >
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.25)"
                  stroke-width="3"
                />
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke="#38bdf8"
                  stroke-width="3"
                  stroke-linecap="round"
                  :stroke-dasharray="188.5"
                  :stroke-dashoffset="188.5 - (188.5 * pressProgress) / 100"
                />
              </svg>

              <button
                type="button"
                :aria-label="
                  activeAlarmPauta
                    ? 'Confirmar pauta activa y apagar alarma con 1 clic'
                    : voiceCall.isCallActive.value
                    ? 'Colgar llamada con Sofi con 1 clic'
                    : 'Mantén presionado 1.4 segundos para iniciar llamada con Sofi'
                "
                @click="handleButtonClick"
                @pointerdown="handleButtonPointerDown"
                @pointerup="handleButtonPointerUp"
                @pointerleave="handleButtonPointerCancel"
                @pointercancel="handleButtonPointerCancel"
                class="w-14 h-14 rounded-full tactile-button flex items-center justify-center transition-transform duration-100 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                :class="{ 'scale-95': isPressingButton }"
              >
                <span
                  class="w-9 h-9 rounded-full border border-neutral-600/70 bg-gradient-to-b from-neutral-900 to-neutral-800 shadow-inner block"
                  aria-hidden="true"
                ></span>
              </button>
            </div>
          </div>

          <!-- Correa Inferior en Silicona Negra Texturizada -->
          <div
            class="w-[82px] h-8 rounded-b-xl wristband-strap border-x border-b border-neutral-800 shadow-md flex flex-col justify-evenly items-center py-1"
            aria-hidden="true"
          >
            <div class="w-10 h-1 rounded-full bg-neutral-950/90 border border-neutral-800/70"></div>
            <div class="w-10 h-1 rounded-full bg-neutral-950/90 border border-neutral-800/70"></div>
          </div>
        </div>

        <!-- Aviso interactivo si el usuario hace clic corto en reposo -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-1 scale-95"
        >
          <div
            v-if="showHoldHint && !voiceCall.isCallActive.value && !activeAlarmPauta"
            class="px-3 py-2 rounded-xl bg-sky-950/95 border border-sky-400/80 text-sky-200 text-[11px] font-bold text-center shadow-lg flex items-center justify-center gap-1.5"
          >
            <Sparkles class="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />
            <span>Mantén presionado el botón (1.4s) para hablar con Sofi</span>
          </div>
        </transition>

        <!-- Guía Visual Mínima de Gestos debajo del dispositivo -->
        <p class="text-[11px] text-center font-semibold text-slate-300 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 leading-snug">
          <strong class="text-teal-300">Botón Físico:</strong>
          {{
            voiceCall.isCallActive.value
              ? 'Presiona 1 Clic para Colgar la Llamada'
              : activeAlarmPauta
              ? 'Presiona 1 Clic para Confirmar Pauta y Apagar Alarma'
              : 'Mantén presionado (1.4s) para Hablar con Sofi'
          }}
        </p>

        <!-- ===============================================================
             REPLICACIÓN COMPLETA DE LA LLAMADA CON SOFI EN LA PULSERA
             (Ecualizador, Estado en Vivo, Diálogo, Preguntas Rápidas y Controles)
             =============================================================== -->
        <div
          v-if="voiceCall.isCallActive.value"
          class="p-3.5 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-sky-400/50 shadow-lg space-y-3"
        >
          <!-- Encabezado de la llamada en la pulsera -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-teal-600/80 border border-teal-400/40 flex items-center justify-center text-teal-200">
                <Bot class="w-4 h-4" />
              </div>
              <div>
                <span class="text-xs font-bold text-white block">Sofi • Altavoz Pulsera</span>
                <span class="text-[10px] text-slate-400 font-mono">100% Manos Libres</span>
              </div>
            </div>

            <!-- Contador de duración -->
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-mono font-bold text-teal-200">
              <span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              <span>{{ voiceCall.callDurationFormatted.value }}</span>
            </div>
          </div>

          <!-- Badge de Estado Dinámico -->
          <div class="space-y-1">
            <div
              class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors"
              :class="callStatusBadge.color"
            >
              <span class="w-2 h-2 rounded-full" :class="callStatusBadge.dot"></span>
              <span>{{ callStatusBadge.text }}</span>
            </div>
            <p class="text-[11px] text-slate-300 font-medium">
              {{ callStatusBadge.subtext }}
            </p>
            <div
              v-if="voiceCall.errorMessage.value"
              class="p-2 rounded-lg bg-rose-500/20 border border-rose-400/40 text-[11px] text-rose-200 mt-1"
            >
              {{ voiceCall.errorMessage.value }}
            </div>
          </div>

          <!-- Visualizador Armónico de 12 Barras de Audio (Idéntico a VoiceCallModal) -->
          <div class="flex items-center justify-center gap-1 h-8 bg-slate-950/60 rounded-xl p-2 border border-slate-800/80" aria-hidden="true">
            <div
              v-for="i in 12"
              :key="i"
              class="w-1.5 rounded-full transition-all duration-150"
              :class="{
                'bg-emerald-400': voiceCall.callStatus.value === 'listening',
                'bg-amber-400': voiceCall.callStatus.value === 'thinking',
                'bg-sky-400': voiceCall.callStatus.value === 'speaking',
                'bg-rose-400': voiceCall.callStatus.value === 'transferred',
                'bg-teal-400/50': voiceCall.callStatus.value === 'greeting' || voiceCall.callStatus.value === 'idle',
              }"
              :style="{
                height:
                  voiceCall.callStatus.value === 'speaking' ||
                  (voiceCall.callStatus.value === 'listening' && voiceCall.audioLevel.value > 20)
                    ? `${Math.max(6, Math.min(28, Math.sin(i * 0.8 + voiceCall.audioLevel.value * 0.1) * 14 + voiceCall.audioLevel.value * 0.22))}px`
                    : '4px',
              }"
            ></div>
          </div>

          <!-- Burbuja de Transcripción y Diálogo en Vivo -->
          <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1.5 max-h-28 overflow-y-auto">
            <p v-if="voiceCall.lastUserTranscript.value" class="text-emerald-300 leading-snug">
              <strong>Tú:</strong> "{{ voiceCall.lastUserTranscript.value }}"
            </p>
            <p class="text-sky-200 leading-snug">
              <strong>Sofi:</strong>
              "{{ voiceCall.lastAssistantResponse.value || 'Te escucho por el altavoz de tu pulsera...' }}"
            </p>
          </div>

          <!-- Preguntas Rápidas de Prueba (Simulación con 1 Clic) -->
          <div class="space-y-1.5 pt-1">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Preguntas de Prueba Rápida (1 Clic):
            </span>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="pregunta in preguntasFrecuentesDemo"
                :key="pregunta"
                type="button"
                @click="enviarPreguntaRapida(pregunta)"
                class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-400 text-[11px] text-teal-200 transition-colors cursor-pointer text-left"
              >
                "{{ pregunta }}"
              </button>
            </div>
          </div>

          <!-- Botonera de Controles de la Llamada -->
          <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <!-- Silenciar Micrófono -->
            <button
              type="button"
              @click="voiceCall.toggleMute"
              class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border"
              :class="
                voiceCall.isMuted.value
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              "
            >
              <MicOff v-if="voiceCall.isMuted.value" class="w-3.5 h-3.5" />
              <Mic v-else class="w-3.5 h-3.5 text-emerald-400" />
              <span>{{ voiceCall.isMuted.value ? 'Silenciado' : 'Micrófono' }}</span>
            </button>

            <!-- Abrir en Pantalla Completa -->
            <button
              type="button"
              @click="abrirEnPantallaCompleta"
              class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Abrir la llamada con Sofi en pantalla completa"
            >
              <Maximize2 class="w-3.5 h-3.5 text-sky-400" />
              <span class="hidden sm:inline">Pantalla Completa</span>
            </button>

            <!-- Colgar Llamada -->
            <button
              type="button"
              @click="finalizarLlamadaPulsera"
              class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-rose-600/30"
            >
              <PhoneOff class="w-3.5 h-3.5" />
              <span>Colgar</span>
            </button>
          </div>
        </div>

        <!-- Tarjeta de Contexto de Alarma Activa -->
        <div
          v-else-if="activeAlarmPauta"
          class="p-3 rounded-xl bg-amber-500/15 border border-amber-400/50 space-y-1.5"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <BellRing class="w-3.5 h-3.5" />
              <span>Alarma Activa en Pulsera</span>
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-200">
              -{{ activeAlarmPauta.horas_previas }}h
            </span>
          </div>
          <p class="text-xs font-bold text-white leading-snug">
            {{ activeAlarmPauta.titulo }}
          </p>
          <p class="text-[11px] text-amber-100/90 leading-snug">
            Haz <strong>1 clic en el botón circular</strong> de la pulsera para confirmar y marcar el check-in.
          </p>
        </div>

        <!-- Tarjeta de Confirmación Exitosa -->
        <div
          v-else-if="isConfirmGreen && lastConfirmedTitle"
          class="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/50 flex items-center gap-2.5"
        >
          <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
          <div class="min-w-0">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block">
              ¡Check-in Confirmado desde la Pulsera!
            </span>
            <p class="text-xs font-bold text-white truncate">
              {{ lastConfirmedTitle }}
            </p>
          </div>
        </div>

        <!-- ===============================================================
             PANEL DE CONTROL DE DEMOSTRACIÓN
             =============================================================== -->
        <div class="pt-2 border-t border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span class="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles class="w-3 h-3 text-teal-400" />
              <span>Demostración en Tiempo Real</span>
            </span>
            <span class="font-bold text-teal-300">
              {{ pacienteStore.pautasCompletadas.length }}/{{ pacienteStore.pautas.length }} cumplidas ({{ pacienteStore.porcentajeCumplimiento }}%)
            </span>
          </div>

          <!-- BOTÓN PRINCIPAL 1: LLAMAR A SOFI DESDE LA PULSERA -->
          <button
            v-if="!voiceCall.isCallActive.value"
            type="button"
            @click="iniciarLlamadaPulsera"
            class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md shadow-teal-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
          >
            <PhoneCall class="w-4 h-4 animate-bounce" />
            <span>Llamar a Sofi desde la Pulsera (Manos Libres)</span>
          </button>

          <!-- BOTÓN PRINCIPAL 2: SIMULAR ALARMA DE PAUTA -->
          <button
            type="button"
            @click="simularAlarmaPautaPendiente"
            class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <BellRing class="w-4 h-4" />
            <span>Simular Alarma de Pauta Pendiente</span>
          </button>

          <p v-if="siguientePautaPendiente" class="text-[11px] text-slate-400 truncate text-center">
            Próxima a simular: <strong class="text-slate-200">{{ siguientePautaPendiente.titulo }}</strong>
          </p>
          <p v-else class="text-[11px] text-emerald-400 font-semibold text-center flex items-center justify-center gap-1">
            <RotateCcw class="w-3 h-3" />
            <span>Todas cumplidas (simulación sobre pauta crítica)</span>
          </p>

          <!-- BOTÓN COLGAR CUANDO LA LLAMADA ESTÁ ACTIVA -->
          <button
            v-if="voiceCall.isCallActive.value"
            type="button"
            @click="finalizarLlamadaPulsera"
            class="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-rose-600/30"
          >
            <PhoneOff class="w-3.5 h-3.5" />
            <span>Colgar Llamada de Sofi</span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* Polímero negro mate de grado médico */
.wristband-body {
  background: radial-gradient(
    120% 90% at 30% 18%,
    #262930 0%,
    #16181d 52%,
    #0c0d10 100%
  );
  box-shadow:
    0 20px 35px -10px rgba(0, 0, 0, 0.8),
    inset 0 2px 3px rgba(255, 255, 255, 0.12),
    inset 0 -4px 8px rgba(0, 0, 0, 0.85);
}

/* Correa de silicona negra texturizada */
.wristband-strap {
  background: repeating-linear-gradient(
    180deg,
    #14161a 0px,
    #14161a 3px,
    #0d0f12 3px,
    #0d0f12 6px
  );
}

/* Botón táctil único físico en relieve */
.tactile-button {
  background: linear-gradient(145deg, #23272f, #111318);
  border: 1.5px solid #343944;
  box-shadow:
    0 5px 12px rgba(0, 0, 0, 0.75),
    inset 0 1px 1px rgba(255, 255, 255, 0.14);
}

/* Estados del Diodo LED RGB Central */
.led-diode-idle {
  background: radial-gradient(circle, #27272a 0%, #18181b 75%);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.9);
}

.led-diode-green {
  background: radial-gradient(circle, #34d399 0%, #059669 70%);
  box-shadow:
    0 0 16px 5px rgba(16, 185, 129, 0.85),
    0 0 32px 10px rgba(16, 185, 129, 0.45);
}

.led-diode-listening {
  background: radial-gradient(circle, #34d399 0%, #059669 70%);
  box-shadow:
    0 0 18px 6px rgba(52, 211, 153, 0.85),
    0 0 34px 12px rgba(16, 185, 129, 0.45);
  animation: led-pulse-blue 1.3s ease-in-out infinite;
}

.led-diode-thinking {
  background: radial-gradient(circle, #fbbf24 0%, #d97706 70%);
  box-shadow:
    0 0 16px 5px rgba(251, 191, 36, 0.85),
    0 0 30px 10px rgba(245, 158, 11, 0.4);
  animation: led-blink-slow 0.9s ease-in-out infinite;
}

.led-diode-blue {
  background: radial-gradient(circle, #38bdf8 0%, #0284c7 70%);
  box-shadow:
    0 0 18px 6px rgba(56, 189, 248, 0.85),
    0 0 34px 12px rgba(14, 165, 233, 0.45);
  animation: led-pulse-blue 1.2s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 3s;
  }
}

.led-diode-amber {
  background: radial-gradient(circle, #fbbf24 0%, #d97706 70%);
  box-shadow:
    0 0 18px 6px rgba(251, 191, 36, 0.9),
    0 0 36px 12px rgba(245, 158, 11, 0.5);
  animation: led-blink-slow 1.1s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 2.5s;
  }
}

.led-diode-red {
  background: radial-gradient(circle, #fb7185 0%, #e11d48 70%);
  box-shadow:
    0 0 20px 7px rgba(244, 63, 94, 0.92),
    0 0 38px 14px rgba(225, 29, 72, 0.55);
  animation: led-blink-slow 0.85s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 2.2s;
  }
}

/* Ondas acústicas expansivas alrededor de la parrilla del altavoz */
.speaker-wave {
  position: absolute;
  inset: 2px;
  border-radius: 9999px;
  border: 1.5px solid rgba(56, 189, 248, 0.65);
  pointer-events: none;
  opacity: 0;
  @media (prefers-reduced-motion: no-preference) {
    animation: acoustic-ripple 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  }
}

.speaker-wave-2 {
  animation-delay: 0.75s;
}

/* Micro-vibración háptica de la carcasa (motor tipo moneda) */
.wristband-haptic-vibrate {
  @media (prefers-reduced-motion: no-preference) {
    animation: haptic-buzz 0.9s ease-in-out infinite;
  }
}

@keyframes led-pulse-blue {
  0%,
  100% {
    opacity: 0.72;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}

@keyframes led-blink-slow {
  0%,
  100% {
    opacity: 1;
    transform: scale(1.05);
  }
  50% {
    opacity: 0.35;
    transform: scale(0.92);
  }
}

@keyframes acoustic-ripple {
  0% {
    transform: scale(0.85);
    opacity: 0.85;
  }
  100% {
    transform: scale(1.45);
    opacity: 0;
  }
}

@keyframes haptic-buzz {
  0%,
  55%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  10% {
    transform: translate3d(-1.5px, 0.5px, 0) rotate(-0.6deg);
  }
  20% {
    transform: translate3d(1.5px, -0.5px, 0) rotate(0.6deg);
  }
  30% {
    transform: translate3d(-1.5px, -0.5px, 0) rotate(-0.5deg);
  }
  40% {
    transform: translate3d(1.5px, 0.5px, 0) rotate(0.5deg);
  }
}
</style>
