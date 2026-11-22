<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { PautaConCheckin } from '../../types/database.types'
import CheckinItem from './CheckinItem.vue'
import { usePautaAlarms } from '../../composables/usePautaAlarms'
import {
  CalendarClock,
  BellRing,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  Repeat,
  BellOff,
} from 'lucide-vue-next'

const props = defineProps<{
  pautas: PautaConCheckin[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleCheckin', pautaId: string): void
}>()

const {
  ringingAlarm,
  soundEnabled,
  voiceReadoutEnabled,
  getOrCreateConfig,
  dismissActiveAlarm,
  snoozeActiveAlarm,
  startAlarmWatcher,
} = usePautaAlarms()

let stopWatcher: (() => void) | null = null

onMounted(() => {
  stopWatcher = startAlarmWatcher(
    () => props.pautas,
    (pautaId) => emit('toggleCheckin', pautaId)
  )
})

onUnmounted(() => {
  if (stopWatcher) stopWatcher()
})

// Agrupar pautas por horas previas ordenadas
const pautasOrdenadas = computed(() => {
  return [...props.pautas].sort((a, b) => b.horas_previas - a.horas_previas)
})

const totalCriticas = computed(() => props.pautas.filter((p) => p.es_critica).length)
const criticasCompletadas = computed(
  () => props.pautas.filter((p) => p.es_critica && p.checkin?.estado === 'completado').length
)
const progresoPct = computed(() =>
  totalCriticas.value === 0 ? 100 : Math.round((criticasCompletadas.value / totalCriticas.value) * 100)
)

const resumenAlarmas = computed(() => {
  let horasExactas = 0
  let cadaHora = 0
  for (const p of props.pautas) {
    const cfg = getOrCreateConfig(p)
    if (!cfg.alarma_activa) continue
    if (cfg.tipo_alarma === 'hora_exacta') horasExactas++
    else cadaHora++
  }
  return { horasExactas, cadaHora, totalActivas: horasExactas + cadaHora }
})

function confirmarCheckinDesdeAlarma() {
  if (!ringingAlarm.value) return
  const targetPauta = ringingAlarm.value.pauta
  if (targetPauta.checkin?.estado !== 'completado') {
    emit('toggleCheckin', targetPauta.id)
  }
  dismissActiveAlarm()
}
</script>

<template>
  <div class="space-y-6">
    <!-- ====================================================================
         MODAL / ALERTA EMERGENTE CUANDO UNA ALARMA ESTÁ SONANDO EN VIVO
         ==================================================================== -->
    <div
      v-if="ringingAlarm"
      role="alert"
      aria-live="assertive"
      class="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="w-full max-w-xl rounded-3xl bg-slate-900 text-white border-2 border-amber-400 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        <!-- Encabezado con campana pulsante -->
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/30 animate-bounce shrink-0">
              <BellRing class="w-8 h-8" />
            </div>
            <div>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                {{ ringingAlarm.motivo }}
              </span>
              <h3 class="text-xl sm:text-2xl font-black text-white mt-1">
                {{ ringingAlarm.pauta.titulo }}
              </h3>
            </div>
          </div>

          <span class="px-3 py-1 rounded-xl bg-slate-800 text-teal-300 font-mono text-xs font-bold border border-slate-700 shrink-0">
            {{ ringingAlarm.triggeredAt }}
          </span>
        </div>

        <!-- Instrucción Clínica -->
        <div class="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-sm sm:text-base text-slate-100 leading-relaxed">
          {{ ringingAlarm.pauta.descripcion }}
        </div>

        <!-- Explicación según tipo de alarma -->
        <p class="text-xs text-slate-300">
          <template v-if="ringingAlarm.config.tipo_alarma === 'hora_exacta'">
            💊 <strong>Alarma de Hora Fija ({{ ringingAlarm.config.hora_alarma }}):</strong> Programada a esta hora específica para tu medicación o hito puntual.
          </template>
          <template v-else-if="ringingAlarm.config.es_vigilancia_continua">
            🔁 <strong>Recordatorio Recurrente de Ayuno (Cada {{ ringingAlarm.config.intervalo_minutos }} min):</strong> El ayuno no se finaliza con un solo check. Al apagar la alarma confirmas el cumplimiento de esta hora y el check se volverá a desmarcar automáticamente antes de la siguiente alarma para volver a avisarte.
          </template>
          <template v-else>
            🔁 <strong>Recordatorio Periódico (Cada {{ ringingAlarm.config.intervalo_minutos }} min):</strong> Te avisamos periódicamente para evitar olvidos antes de la cirugía.
          </template>
        </p>

        <!-- Botones de Acción Inmediata -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="snoozeActiveAlarm(15)"
            class="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Clock class="w-4 h-4" />
            <span>Recordar en 15 min</span>
          </button>

          <button
            type="button"
            @click="dismissActiveAlarm()"
            class="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BellOff class="w-4 h-4" />
            <span>Entendido (Silenciar aviso)</span>
          </button>

          <button
            type="button"
            @click="confirmarCheckinDesdeAlarma"
            class="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>
              {{
                ringingAlarm.config.es_vigilancia_continua
                  ? 'Apagar alarma y confirmar ayuno actual'
                  : '¡Ya lo hice! Marcar Cumplido'
              }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- ====================================================================
         BARRA DE ADHERENCIA QUIRÚRGICA Y CENTRO DE ALARMAS
         ==================================================================== -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock class="w-5 h-5 text-teal-600" />
            Cronograma Dosificado de Preparación y Alarmas Activas
          </h2>
          <p class="text-sm text-slate-600">
            Cada actividad cuenta con alarma a hora exacta (para medicamentos) o recordatorio periódico cada hora (para ayuno y ducha).
          </p>
        </div>

        <div class="text-left sm:text-right flex-shrink-0">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Adherencia Crítica
          </span>
          <span class="text-lg font-extrabold text-teal-700">
            {{ criticasCompletadas }} de {{ totalCriticas }} verificadas ({{ progresoPct }}%)
          </span>
        </div>
      </div>

      <!-- Barra de Progreso -->
      <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          class="h-full transition-all duration-500 rounded-full"
          :class="progresoPct === 100 ? 'bg-emerald-500' : 'bg-teal-600'"
          :style="{ width: `${progresoPct}%` }"
        ></div>
      </div>

      <!-- Resumen del Sistema de Alarmas y Controles de Sonido -->
      <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold">
            <Clock class="w-3.5 h-3.5 text-indigo-600" />
            <span>{{ resumenAlarmas.horasExactas }} Alarma(s) a Hora Fija (Medicamentos / Ingreso)</span>
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-bold">
            <Repeat class="w-3.5 h-3.5 text-amber-600" />
            <span>{{ resumenAlarmas.cadaHora }} Recordatorio(s) Cada Hora (Ayuno / Ducha)</span>
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            :aria-pressed="soundEnabled"
            @click="soundEnabled = !soundEnabled"
            class="px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            :class="
              soundEnabled
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            "
          >
            <Volume2 v-if="soundEnabled" class="w-3.5 h-3.5 text-teal-400" />
            <VolumeX v-else class="w-3.5 h-3.5" />
            <span>{{ soundEnabled ? 'Sonido Activo' : 'Sin Sonido' }}</span>
          </button>

          <button
            type="button"
            :aria-pressed="voiceReadoutEnabled"
            @click="voiceReadoutEnabled = !voiceReadoutEnabled"
            class="px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            :class="
              voiceReadoutEnabled
                ? 'bg-teal-50 text-teal-900 border-teal-300'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            "
          >
            <span>{{ voiceReadoutEnabled ? '🗣️ Voz de Alarma Activa' : '🗣️ Voz Silenciada' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Lista Cronológica de Pautas con Alarmas -->
    <div class="space-y-4">
      <CheckinItem
        v-for="pauta in pautasOrdenadas"
        :key="pauta.id"
        :pauta="pauta"
        :disabled="disabled"
        @toggle="emit('toggleCheckin', $event)"
      />
    </div>
  </div>
</template>
