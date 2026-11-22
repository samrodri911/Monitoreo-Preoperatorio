import { ref, reactive } from 'vue'
import type { Pauta, PautaConCheckin, TipoAlarmaPauta } from '../types/database.types'

const STORAGE_KEY_PAUTA_ALARMS = 'precare_pauta_alarms_v1'

export interface PautaAlarmConfig {
  pautaId: string
  tipo_alarma: TipoAlarmaPauta
  hora_alarma: string // "HH:mm" (24h), ej. "06:00"
  intervalo_minutos: number // ej. 60 (cada 1 hora), 30, 120
  alarma_activa: boolean
  es_ayuno_continuo: boolean // retrocompatibilidad
  es_vigilancia_continua: boolean // True si es ayuno u otra condición continua que no se finaliza con un solo check
  categoria_detectada: 'medicamento' | 'ayuno' | 'ducha_higiene' | 'admision_hito'
  nextTriggerMs: number // Timestamp del próximo disparo para recordatorios periódicos
  uncheckBeforeMs: number // Timestamp exacto en el que el check se desmarca antes de que suene la alarma
  lastTriggeredKey?: string // Para evitar disparar dos veces en el mismo minuto
  lastConfirmedMs?: number // Timestamp de la última confirmación del ciclo
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
 * Calcula con cuánta anticipación debe desmarcarse automáticamente una pauta de ayuno
 * antes de que vuelva a sonar la siguiente alarma recurrente.
 */
export function computeUncheckLeadMs(intervalMinutes: number): number {
  if (intervalMinutes <= 15) return 2 * 60 * 1000 // 2 minutos antes
  if (intervalMinutes <= 30) return 3 * 60 * 1000 // 3 minutos antes
  return 5 * 60 * 1000 // 5 minutos antes para 1 hora (60 min) o más
}

/**
 * Infiere inteligentemente el tipo de alarma según lo que el paciente debe hacer:
 * - Medicamento / Fármaco / Glucometría / Ingreso -> Alarma a HORA EXACTA (HH:mm)
 * - Ayuno / Conducta Continua -> RECORDATORIO PERIÓDICO CADA HORA (no se finaliza para siempre; se desmarca antes de sonar)
 * - Ducharse con jabón / Higiene -> Recordatorio periódico o según pauta
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
    texto.includes('dieta') ||
    texto.includes('no comer') ||
    texto.includes('no ingerir') ||
    texto.includes('sin alimentos')

  // Regla Clínica: El ayuno o abstinencia es un proceso continuo que no se puede "marcar como listo" definitivamente
  const esVigilanciaContinua =
    pauta.es_vigilancia_continua !== undefined
      ? Boolean(pauta.es_vigilancia_continua)
      : esAyuno || texto.includes('abstinencia') || (pauta.tipo_alarma === 'recordatorio_periodico' && esAyuno)

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

  // 1. Si es vigilancia continua (Ayuno): OBLIGATORIO recordatorio periódico cada hora
  if (esVigilanciaContinua) {
    const intervalo = pauta.intervalo_minutos || 60
    const nextTrigger = Date.now() + intervalo * 60 * 1000
    return {
      pautaId: pauta.id,
      tipo_alarma: 'recordatorio_periodico',
      hora_alarma: defaultHora,
      intervalo_minutos: intervalo,
      alarma_activa: pauta.alarma_activa ?? true,
      es_ayuno_continuo: true,
      es_vigilancia_continua: true,
      categoria_detectada: 'ayuno',
      nextTriggerMs: nextTrigger,
      uncheckBeforeMs: nextTrigger - computeUncheckLeadMs(intervalo),
    }
  }

  if (pauta.tipo_alarma) {
    const intervalo = pauta.intervalo_minutos || 60
    const nextTrigger = Date.now() + intervalo * 60 * 1000
    return {
      pautaId: pauta.id,
      tipo_alarma: pauta.tipo_alarma,
      hora_alarma: defaultHora,
      intervalo_minutos: intervalo,
      alarma_activa: pauta.alarma_activa ?? true,
      es_ayuno_continuo: false,
      es_vigilancia_continua: false,
      categoria_detectada: esMedicamento
        ? 'medicamento'
        : esDuchaOHigiene
        ? 'ducha_higiene'
        : 'admision_hito',
      nextTriggerMs: nextTrigger,
      uncheckBeforeMs: nextTrigger - computeUncheckLeadMs(intervalo),
    }
  }

  // Si es tomar/suspender medicamento específico -> Alarma a Hora Exacta
  if (esMedicamento) {
    const nextTrigger = Date.now() + 60 * 60 * 1000
    return {
      pautaId: pauta.id,
      tipo_alarma: 'hora_exacta',
      hora_alarma: texto.includes('matutina') || texto.includes('sorbo') ? '06:00' : defaultHora,
      intervalo_minutos: 60,
      alarma_activa: true,
      es_ayuno_continuo: false,
      es_vigilancia_continua: false,
      categoria_detectada: 'medicamento',
      nextTriggerMs: nextTrigger,
      uncheckBeforeMs: nextTrigger - computeUncheckLeadMs(60),
    }
  }

  // Si es Ducharse -> Recordatorio Periódico cada 1 hora (60 min)
  if (esDuchaOHigiene) {
    const intervalo = 60
    const nextTrigger = Date.now() + intervalo * 60 * 1000
    return {
      pautaId: pauta.id,
      tipo_alarma: 'recordatorio_periodico',
      hora_alarma: defaultHora,
      intervalo_minutos: intervalo,
      alarma_activa: true,
      es_ayuno_continuo: false,
      es_vigilancia_continua: false,
      categoria_detectada: 'ducha_higiene',
      nextTriggerMs: nextTrigger,
      uncheckBeforeMs: nextTrigger - computeUncheckLeadMs(intervalo),
    }
  }

  // Por defecto (ej. Presentación en Admisión) -> Hora Exacta según fecha_limite
  const nextTrigger = Date.now() + 60 * 60 * 1000
  return {
    pautaId: pauta.id,
    tipo_alarma: 'hora_exacta',
    hora_alarma: defaultHora,
    intervalo_minutos: 60,
    alarma_activa: true,
    es_ayuno_continuo: false,
    es_vigilancia_continua: false,
    categoria_detectada: 'admision_hito',
    nextTriggerMs: nextTrigger,
    uncheckBeforeMs: nextTrigger - computeUncheckLeadMs(60),
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
    if (isDone && !cfg.es_vigilancia_continua) {
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

    if (cfg.es_vigilancia_continua && isDone) {
      const uncheckDiffSec = Math.max(0, Math.floor((cfg.uncheckBeforeMs - currentTickMs.value) / 1000))
      const uncheckM = Math.floor(uncheckDiffSec / 60)
      const uncheckS = uncheckDiffSec % 60
      if (m >= 60) {
        const h = Math.floor(m / 60)
        const remM = m % 60
        return `Próxima alarma en ${h}h ${remM}m (se desmarca en ${uncheckM}m)`
      }
      if (uncheckM > 0) {
        return `Próxima alarma en ${String(m).padStart(2, '0')}m (se desmarca en ${uncheckM}m)`
      }
      return `Próxima alarma en ${String(m).padStart(2, '0')}m (se desmarca en ${uncheckS}s)`
    }

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
  function triggerAlarmNow(
    pauta: PautaConCheckin,
    customMotivo?: string,
    onAutoUncheck?: (pautaId: string) => void
  ) {
    const cfg = getOrCreateConfig(pauta)
    stopChimeLoop()

    // Si es vigilancia continua (ayuno) y estaba marcada como completada, se desmarca de inmediato al sonar
    if (cfg.es_vigilancia_continua && pauta.checkin?.estado === 'completado') {
      if (onAutoUncheck) {
        onAutoUncheck(pauta.id)
      } else if (pauta.checkin) {
        pauta.checkin.estado = 'pendiente'
        pauta.checkin.fecha_respuesta = null
      }
    }

    const nowStr = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const motivoDefault =
      cfg.tipo_alarma === 'hora_exacta'
        ? `⏰ Alarma de Hora Exacta (${cfg.hora_alarma}) — Medicamento / Hito Puntual`
        : cfg.es_vigilancia_continua
        ? `🔁 Alarma Horaria de Ayuno (Cada ${cfg.intervalo_minutos} min) — Recordatorio no finalizable, confirmar cumplimiento actual`
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

  function dismissActiveAlarm(onConfirmPauta?: (pautaId: string) => void) {
    stopChimeLoop()
    if (ringingAlarm.value) {
      const cfg = ringingAlarm.value.config
      const targetPauta = ringingAlarm.value.pauta
      if (cfg.tipo_alarma === 'recordatorio_periodico' || cfg.es_vigilancia_continua) {
        const intervalMs = (cfg.intervalo_minutos || 60) * 60 * 1000
        cfg.nextTriggerMs = Date.now() + intervalMs
        cfg.uncheckBeforeMs = cfg.nextTriggerMs - computeUncheckLeadMs(cfg.intervalo_minutos || 60)
        cfg.lastConfirmedMs = Date.now()
        persistAlarms()
      }
      if (onConfirmPauta) {
        onConfirmPauta(targetPauta.id)
      }
    }
    ringingAlarm.value = null
  }

  function snoozeActiveAlarm(minutes = 15) {
    stopChimeLoop()
    if (ringingAlarm.value) {
      const cfg = ringingAlarm.value.config
      cfg.nextTriggerMs = Date.now() + minutes * 60 * 1000
      cfg.uncheckBeforeMs = cfg.nextTriggerMs - computeUncheckLeadMs(minutes)
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
  function startAlarmWatcher(
    getPautas: () => PautaConCheckin[],
    onAutoUncheck?: (pautaId: string) => void
  ) {
    if (tickerIntervalId) clearInterval(tickerIntervalId)

    tickerIntervalId = setInterval(() => {
      currentTickMs.value = Date.now()
      const nowMs = currentTickMs.value
      const pautas = getPautas()

      // =========================================================================
      // REGLA CLÍNICA: Pautas de vigilancia continua (ej. Ayuno) no son definitivas
      // Se desmarcan automáticamente antes de que vuelva a sonar la siguiente alarma
      // =========================================================================
      for (const p of pautas) {
        const cfg = getOrCreateConfig(p)
        if (!cfg.alarma_activa || !cfg.es_vigilancia_continua) continue

        if (p.checkin?.estado === 'completado') {
          if (nowMs >= cfg.uncheckBeforeMs || nowMs >= cfg.nextTriggerMs) {
            console.log(
              `[usePautaAlarms] Auto-desmarcando ${p.titulo} antes de la próxima alarma periódica (faltan <5 min)`
            )
            if (onAutoUncheck) {
              onAutoUncheck(p.id)
            } else if (p.checkin) {
              p.checkin.estado = 'pendiente'
              p.checkin.fecha_respuesta = null
            }
          }
        }
      }

      if (ringingAlarm.value) return // Ya hay una alarma sonando en pantalla

      const now = new Date()
      const hhmmNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const minuteKey = `${now.toDateString()}-${hhmmNow}`

      for (const p of pautas) {
        const cfg = getOrCreateConfig(p)
        if (!cfg.alarma_activa) continue

        const isCompleted = p.checkin?.estado === 'completado'
        // Si ya fue completada y no es vigilancia continua, no sonar
        if (isCompleted && !cfg.es_vigilancia_continua) continue

        if (cfg.tipo_alarma === 'hora_exacta') {
          if (cfg.hora_alarma === hhmmNow && cfg.lastTriggeredKey !== minuteKey && now.getSeconds() < 10) {
            cfg.lastTriggeredKey = minuteKey
            persistAlarms()
            triggerAlarmNow(p, undefined, onAutoUncheck)
            break
          }
        } else if (cfg.tipo_alarma === 'recordatorio_periodico') {
          if (nowMs >= cfg.nextTriggerMs) {
            const intervalMs = (cfg.intervalo_minutos || 60) * 60 * 1000
            cfg.nextTriggerMs = nowMs + intervalMs
            cfg.uncheckBeforeMs = cfg.nextTriggerMs - computeUncheckLeadMs(cfg.intervalo_minutos || 60)
            persistAlarms()

            if (cfg.es_vigilancia_continua && isCompleted && onAutoUncheck) {
              onAutoUncheck(p.id)
            }

            triggerAlarmNow(p, undefined, onAutoUncheck)
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
