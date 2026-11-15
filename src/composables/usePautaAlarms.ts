import { ref, reactive } from 'vue'
import type { Pauta, PautaConCheckin, TipoAlarmaPauta } from '../types/database.types'

const STORAGE_KEY_PAUTA_ALARMS = 'tech_touch_pauta_alarms_v1'

export interface PautaAlarmConfig {
  pautaId: string
  tipo_alarma: TipoAlarmaPauta
  hora_alarma: string // "HH:mm" (24h), ej. "06:00"
  intervalo_minutos: number // ej. 60 (cada 1 hora), 30, 120
  alarma_activa: boolean
  es_ayuno_continuo: boolean // Si es ayuno, puede seguir recordando cada hora incluso tras iniciar el ayuno
  categoria_detectada: 'medicamento' | 'ayuno' | 'ducha_higiene' | 'admision_hito'
  nextTriggerMs: number // Timestamp del próximo disparo para recordatorios periódicos
  lastTriggeredKey?: string // Para evitar disparar dos veces en el mismo minuto
}

export interface ActiveRingingAlarm {
  pauta: PautaConCheckin
  config: PautaAlarmConfig
  triggeredAt: string
  motivo: string
}

// Estado global singleton para que todas las tarjetas y el banner compartan el mismo reloj de alarmas
const alarmsMap = reactive<Record<string, PautaAlarmConfig>>({})
const ringingAlarm = ref<ActiveRingingAlarm | null>(null)
const soundEnabled = ref<boolean>(true)
const voiceReadoutEnabled = ref<boolean>(true)
const currentTickMs = ref<number>(Date.now())

let tickerIntervalId: ReturnType<typeof setInterval> | null = null
let chimeIntervalId: ReturnType<typeof setInterval> | null = null

function loadSavedAlarms(): Record<string, PautaAlarmConfig> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAUTA_ALARMS)
    if (raw) {
      const parsed = JSON.parse(raw)
      Object.assign(alarmsMap, parsed)
      return parsed
    }
  } catch (e) {
    console.warn('[usePautaAlarms] Error leyendo alarmas guardadas:', e)
  }
  return {}
}

function persistAlarms() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_PAUTA_ALARMS, JSON.stringify(alarmsMap))
  } catch (e) {
    console.warn('[usePautaAlarms] Error guardando alarmas:', e)
  }
}

/**
 * Infiere inteligentemente el tipo de alarma según lo que el paciente debe hacer:
 * - Medicamento / Fármaco / Glucometría / Ingreso -> Alarma a HORA EXACTA (HH:mm)
 * - Ayuno / Ducharse con jabón / Preparación -> RECORDATORIO PERIÓDICO CADA HORA (60 min)
 */
export function inferDefaultAlarmConfig(pauta: Pauta): PautaAlarmConfig {
  const texto = `${pauta.titulo} ${pauta.descripcion}`.toLowerCase()

  const esMedicamento =
    texto.includes('medicamento') ||
    texto.includes('fármaco') ||
    texto.includes('farmaco') ||
    texto.includes('pastilla') ||
    texto.includes('losartán') ||
    texto.includes('losartan') ||
    texto.includes('aspirina') ||
    texto.includes('anticoagulante') ||
    texto.includes('glucometría') ||
    texto.includes('glucometria') ||
    texto.includes('insulina') ||
    texto.includes('inhalador') ||
    texto.includes('hta') ||
    texto.includes('sorbo')

  const esAyuno =
    texto.includes('ayuno') ||
    texto.includes('sólido') ||
    texto.includes('solido') ||
    texto.includes('líquido') ||
    texto.includes('liquido') ||
    texto.includes('agua') ||
    texto.includes('dieta')

  const esDuchaOHigiene =
    texto.includes('ducha') ||
    texto.includes('baño') ||
    texto.includes('clorhexidina') ||
    texto.includes('jabón') ||
    texto.includes('jabon') ||
    texto.includes('rasurado') ||
    texto.includes('caminador') ||
    texto.includes('joyas') ||
    texto.includes('esmalte')

  // Calcular hora HH:mm sugerida a partir de fecha_limite
  let defaultHora = '07:00'
  if (pauta.hora_alarma) {
    defaultHora = pauta.hora_alarma
  } else if (pauta.fecha_limite) {
    const d = new Date(pauta.fecha_limite)
    if (!Number.isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      defaultHora = `${hh}:${mm}`
    }
  }

  if (pauta.tipo_alarma) {
    const intervalo = pauta.intervalo_minutos || 60
    return {
      pautaId: pauta.id,
      tipo_alarma: pauta.tipo_alarma,
      hora_alarma: defaultHora,
      intervalo_minutos: intervalo,
      alarma_activa: pauta.alarma_activa ?? true,
      es_ayuno_continuo: esAyuno,
      categoria_detectada: esMedicamento
        ? 'medicamento'
        : esAyuno
        ? 'ayuno'
        : esDuchaOHigiene
        ? 'ducha_higiene'
        : 'admision_hito',
      nextTriggerMs: Date.now() + intervalo * 60 * 1000,
    }
  }

  // Si es tomar/suspender medicamento específico -> Alarma a Hora Exacta
  if (esMedicamento) {
    return {
      pautaId: pauta.id,
      tipo_alarma: 'hora_exacta',
      hora_alarma: texto.includes('matutina') || texto.includes('sorbo') ? '06:00' : defaultHora,
      intervalo_minutos: 60,
      alarma_activa: true,
      es_ayuno_continuo: false,
      categoria_detectada: 'medicamento',
      nextTriggerMs: Date.now() + 60 * 60 * 1000,
    }
  }

  // Si es Ayuno o Ducharse -> Recordatorio Periódico cada 1 hora (60 min)
  if (esAyuno || esDuchaOHigiene) {
    const intervalo = 60 // Cada 1 hora por defecto
    return {
      pautaId: pauta.id,
      tipo_alarma: 'recordatorio_periodico',
      hora_alarma: defaultHora,
      intervalo_minutos: intervalo,
      alarma_activa: true,
      es_ayuno_continuo: esAyuno,
      categoria_detectada: esAyuno ? 'ayuno' : 'ducha_higiene',
      nextTriggerMs: Date.now() + intervalo * 60 * 1000,
    }
  }

  // Por defecto (ej. Presentación en Admisión) -> Hora Exacta según fecha_limite
  return {
    pautaId: pauta.id,
    tipo_alarma: 'hora_exacta',
    hora_alarma: defaultHora,
    intervalo_minutos: 60,
    alarma_activa: true,
    es_ayuno_continuo: false,
    categoria_detectada: 'admision_hito',
    nextTriggerMs: Date.now() + 60 * 60 * 1000,
  }
}

/**
 * Reproduce un tono de alarma médica armónico usando Web Audio API (sin requerir archivos externos)
 */
function playMedicalAlarmChime() {
  if (!soundEnabled.value || typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const notes = [523.25, 659.25, 783.99, 1046.5] // Acorde Do Mayor (C5, E5, G5, C6)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14)

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.14)
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + idx * 0.14 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.45)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + idx * 0.14)
      osc.stop(ctx.currentTime + idx * 0.14 + 0.48)
    })
  } catch (e) {
    console.warn('[usePautaAlarms] No se pudo reproducir el tono Web Audio:', e)
  }
}

function speakAlarmInstruction(pauta: PautaConCheckin, config: PautaAlarmConfig) {
  if (!voiceReadoutEnabled.value || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const prefix =
      config.tipo_alarma === 'hora_exacta'
        ? `Alarma programada de las ${config.hora_alarma}.`
        : `Recordatorio periódico de preparación.`
    const utterance = new SpeechSynthesisUtterance(
      `${prefix} ${pauta.titulo}. ${pauta.descripcion}`
    )
    utterance.lang = 'es-CO'
    utterance.rate = 1.05
    window.speechSynthesis.speak(utterance)
  } catch {
    // Fallback silencioso
  }
}

function stopChimeLoop() {
  if (chimeIntervalId) {
    clearInterval(chimeIntervalId)
    chimeIntervalId = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

loadSavedAlarms()

export function usePautaAlarms() {
  function getOrCreateConfig(pauta: Pauta): PautaAlarmConfig {
    if (!alarmsMap[pauta.id]) {
      alarmsMap[pauta.id] = inferDefaultAlarmConfig(pauta)
      persistAlarms()
    }
    return alarmsMap[pauta.id]
  }

  function updateAlarmConfig(
    pauta: Pauta,
    patch: Partial<Pick<PautaAlarmConfig, 'tipo_alarma' | 'hora_alarma' | 'intervalo_minutos' | 'alarma_activa'>>
  ) {
    const current = getOrCreateConfig(pauta)
    if (patch.tipo_alarma !== undefined) current.tipo_alarma = patch.tipo_alarma
    if (patch.hora_alarma !== undefined) current.hora_alarma = patch.hora_alarma
    if (patch.intervalo_minutos !== undefined) {
      current.intervalo_minutos = patch.intervalo_minutos
      current.nextTriggerMs = Date.now() + patch.intervalo_minutos * 60 * 1000
    }
    if (patch.alarma_activa !== undefined) {
      current.alarma_activa = patch.alarma_activa
      if (patch.alarma_activa && current.tipo_alarma === 'recordatorio_periodico') {
        current.nextTriggerMs = Date.now() + current.intervalo_minutos * 60 * 1000
      }
    }
    persistAlarms()
  }

  /**
   * Calcula el texto de cuenta regresiva para mostrar en la tarjeta de Check-in
   */
  function getCountdownLabel(pauta: PautaConCheckin): string {
    const cfg = getOrCreateConfig(pauta)
    if (!cfg.alarma_activa) return 'Alarma silenciada por el usuario'

    const isDone = pauta.checkin?.estado === 'completado'
    if (isDone && !cfg.es_ayuno_continuo) {
      return 'Actividad cumplida • Alarma finalizada'
    }

    const now = new Date(currentTickMs.value)

    if (cfg.tipo_alarma === 'hora_exacta') {
      const parts = (cfg.hora_alarma || '07:00').split(':')
      const targetH = Number(parts[0]) || 7
      const targetM = Number(parts[1]) || 0
      const target = new Date(now)
      target.setHours(targetH, targetM, 0, 0)
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1)
      }
      const diffSec = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
      const h = Math.floor(diffSec / 3600)
      const m = Math.floor((diffSec % 3600) / 60)
      return `Suena en ${h}h ${String(m).padStart(2, '0')}m (a las ${cfg.hora_alarma})`
    }

    // Recordatorio periódico (ej. cada hora para ayuno o ducha)
    const diffSec = Math.max(0, Math.floor((cfg.nextTriggerMs - currentTickMs.value) / 1000))
    const m = Math.floor(diffSec / 60)
    const s = diffSec % 60
    if (m >= 60) {
      const h = Math.floor(m / 60)
      const remM = m % 60
      return `Próximo recordatorio en ${h}h ${remM}m`
    }
    return `Próximo recordatorio en ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  }

  /**
   * Dispara inmediatamente una alarma (por horario cumplido o al presionar "Probar Alarma")
   */
  function triggerAlarmNow(pauta: PautaConCheckin, customMotivo?: string) {
    const cfg = getOrCreateConfig(pauta)
    stopChimeLoop()

    const nowStr = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const motivoDefault =
      cfg.tipo_alarma === 'hora_exacta'
        ? `⏰ Alarma de Hora Exacta (${cfg.hora_alarma}) — Medicamento / Hito Puntual`
        : cfg.categoria_detectada === 'ayuno'
        ? `🔁 Recordatorio Horario de Ayuno (Cada ${cfg.intervalo_minutos} min) — No ingerir alimentos ni líquidos`
        : `🔁 Recordatorio Periódico (Cada ${cfg.intervalo_minutos} min) — Pendiente por realizar`

    ringingAlarm.value = {
      pauta,
      config: cfg,
      triggeredAt: nowStr,
      motivo: customMotivo || motivoDefault,
    }

    playMedicalAlarmChime()
    speakAlarmInstruction(pauta, cfg)

    // Repetir el chime cada 4.5 segundos mientras el modal de alarma siga abierto
    chimeIntervalId = setInterval(() => {
      if (ringingAlarm.value) {
        playMedicalAlarmChime()
      } else {
        stopChimeLoop()
      }
    }, 4500)
  }

  function dismissActiveAlarm() {
    stopChimeLoop()
    if (ringingAlarm.value) {
      const cfg = ringingAlarm.value.config
      if (cfg.tipo_alarma === 'recordatorio_periodico') {
        cfg.nextTriggerMs = Date.now() + cfg.intervalo_minutos * 60 * 1000
        persistAlarms()
      }
    }
    ringingAlarm.value = null
  }

  function snoozeActiveAlarm(minutes = 15) {
    stopChimeLoop()
    if (ringingAlarm.value) {
      const cfg = ringingAlarm.value.config
      cfg.nextTriggerMs = Date.now() + minutes * 60 * 1000
      if (cfg.tipo_alarma === 'hora_exacta') {
        const snoozeDate = new Date(Date.now() + minutes * 60 * 1000)
        cfg.hora_alarma = `${String(snoozeDate.getHours()).padStart(2, '0')}:${String(
          snoozeDate.getMinutes()
        ).padStart(2, '0')}`
      }
      persistAlarms()
    }
    ringingAlarm.value = null
  }

  /**
   * Inicia el reloj vigilante de alarmas sobre la lista de pautas del paciente activo
   */
  function startAlarmWatcher(getPautas: () => PautaConCheckin[]) {
    if (tickerIntervalId) clearInterval(tickerIntervalId)

    tickerIntervalId = setInterval(() => {
      currentTickMs.value = Date.now()
      if (ringingAlarm.value) return // Ya hay una alarma sonando en pantalla

      const pautas = getPautas()
      const now = new Date()
      const hhmmNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const minuteKey = `${now.toDateString()}-${hhmmNow}`

      for (const p of pautas) {
        const cfg = getOrCreateConfig(p)
        if (!cfg.alarma_activa) continue

        const isCompleted = p.checkin?.estado === 'completado'
        // Si ya fue completada y no es un recordatorio continuo de ayuno, no sonar
        if (isCompleted && !cfg.es_ayuno_continuo) continue

        if (cfg.tipo_alarma === 'hora_exacta') {
          if (cfg.hora_alarma === hhmmNow && cfg.lastTriggeredKey !== minuteKey && now.getSeconds() < 10) {
            cfg.lastTriggeredKey = minuteKey
            persistAlarms()
            triggerAlarmNow(p)
            break
          }
        } else if (cfg.tipo_alarma === 'recordatorio_periodico') {
          if (currentTickMs.value >= cfg.nextTriggerMs) {
            cfg.nextTriggerMs = currentTickMs.value + cfg.intervalo_minutos * 60 * 1000
            persistAlarms()
            triggerAlarmNow(p)
            break
          }
        }
      }
    }, 1000)

    return () => {
      if (tickerIntervalId) {
        clearInterval(tickerIntervalId)
        tickerIntervalId = null
      }
      stopChimeLoop()
    }
  }

  return {
    alarmsMap,
    ringingAlarm,
    soundEnabled,
    voiceReadoutEnabled,
    currentTickMs,
    getOrCreateConfig,
    updateAlarmConfig,
    getCountdownLabel,
    triggerAlarmNow,
    dismissActiveAlarm,
    snoozeActiveAlarm,
    startAlarmWatcher,
  }
}
