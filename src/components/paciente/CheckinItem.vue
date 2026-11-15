<script setup lang="ts">
import { computed } from 'vue'
import type { PautaConCheckin, TipoAlarmaPauta } from '../../types/database.types'
import { usePautaAlarms } from '../../composables/usePautaAlarms'
import {
  Check,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Bell,
  BellOff,
  Repeat,
  Volume2,
  Pill,
  Droplets,
} from 'lucide-vue-next'

const props = defineProps<{
  pauta: PautaConCheckin
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', pautaId: string): void
}>()

const {
  getOrCreateConfig,
  updateAlarmConfig,
  getCountdownLabel,
  triggerAlarmNow,
} = usePautaAlarms()

const alarmConfig = computed(() => getOrCreateConfig(props.pauta))
const countdownText = computed(() => getCountdownLabel(props.pauta))

const isCompleted = () => props.pauta.checkin?.estado === 'completado'

function formatHora(fechaIso?: string) {
  if (!fechaIso) return ''
  const d = new Date(fechaIso)
  return (
    d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) +
    ' (' +
    d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) +
    ')'
  )
}

function handleToggleAlarmaActiva() {
  updateAlarmConfig(props.pauta, {
    alarma_activa: !alarmConfig.value.alarma_activa,
  })
}

function handleChangeTipoAlarma(nuevoTipo: TipoAlarmaPauta) {
  updateAlarmConfig(props.pauta, {
    tipo_alarma: nuevoTipo,
    alarma_activa: true,
  })
}

function handleChangeHoraExacta(event: Event) {
  const val = (event.target as HTMLInputElement).value
  if (val) {
    updateAlarmConfig(props.pauta, {
      hora_alarma: val,
      alarma_activa: true,
    })
  }
}

function handleChangeIntervalo(event: Event) {
  const val = Number((event.target as HTMLSelectElement).value)
  if (val > 0) {
    updateAlarmConfig(props.pauta, {
      intervalo_minutos: val,
      alarma_activa: true,
    })
  }
}
</script>

<template>
  <div
    class="p-5 rounded-2xl border transition-all duration-200 space-y-4"
    :class="[
      isCompleted()
        ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
        : pauta.es_critica
        ? 'bg-white border-amber-300 shadow-sm hover:border-amber-400'
        : 'bg-white border-slate-200 shadow-sm hover:border-slate-300',
    ]"
  >
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Contenido Principal de la Pauta -->
      <div class="flex-1 space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <!-- Badge de Etapa Temporal -->
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
            <Clock class="w-3.5 h-3.5 text-slate-500" />
            -{{ pauta.horas_previas }}h antes
          </span>

          <!-- Badge de Crítica vs Recomendación -->
          <span
            v-if="pauta.es_critica"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
          >
            <AlertTriangle class="w-3.5 h-3.5 text-amber-600" />
            Pauta Crítica Quirúrgica
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600"
          >
            Recomendación de Preparación
          </span>

          <!-- Naturaleza de la Actividad Detectada -->
          <span
            v-if="alarmConfig.categoria_detectada === 'medicamento'"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200"
          >
            <Pill class="w-3.5 h-3.5 text-indigo-600" />
            Fármaco / Hora Puntual
          </span>
          <span
            v-else-if="alarmConfig.categoria_detectada === 'ayuno' || alarmConfig.categoria_detectada === 'ducha_higiene'"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200"
          >
            <Droplets class="w-3.5 h-3.5 text-teal-600" />
            {{
              alarmConfig.categoria_detectada === 'ayuno'
                ? 'Vigilancia Continua de Ayuno'
                : 'Higiene / Alistamiento'
            }}
          </span>

          <!-- Badge de Completada -->
          <span
            v-if="isCompleted()"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800"
          >
            <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
            Verificado
          </span>
        </div>

        <!-- Título -->
        <h3
          class="text-lg font-bold tracking-tight text-slate-900 transition-colors"
          :class="{ 'line-through text-slate-500': isCompleted() }"
        >
          {{ pauta.titulo }}
        </h3>

        <!-- Descripción didáctica -->
        <p class="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
          {{ pauta.descripcion }}
        </p>

        <!-- Información de respuesta u observaciones -->
        <div v-if="pauta.checkin?.fecha_respuesta" class="text-xs text-emerald-700 font-medium pt-1">
          ✓ Confirmado el {{ formatHora(pauta.checkin.fecha_respuesta) }}
          <span v-if="pauta.checkin?.observaciones" class="block text-slate-500 mt-0.5">
            Nota: "{{ pauta.checkin.observaciones }}"
          </span>
        </div>
      </div>

      <!-- Botón de Check-in Háptico Visual -->
      <div class="flex-shrink-0">
        <button
          type="button"
          @click="emit('toggle', pauta.id)"
          :disabled="disabled"
          class="w-full md:w-auto px-5 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all transform active:scale-95 focus-ring cursor-pointer"
          :class="[
            isCompleted()
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/25',
          ]"
        >
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center border transition-colors"
            :class="
              isCompleted()
                ? 'bg-white text-emerald-600 border-white'
                : 'bg-white/20 border-white/40 text-transparent'
            "
          >
            <Check class="w-4 h-4 stroke-[3]" />
          </div>
          <span>{{ isCompleted() ? 'Cumplido con éxito' : 'Marcar como Cumplido' }}</span>
        </button>
      </div>
    </div>

    <!-- ======================================================================
         PANEL DE ALARMA CON TIEMPO Y RECORDATORIOS INTELIGENTES
         ====================================================================== -->
    <div
      class="pt-3.5 border-t flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl p-3.5 transition-colors"
      :class="
        alarmConfig.alarma_activa
          ? 'bg-slate-900 text-white border-slate-800'
          : 'bg-slate-100 text-slate-600 border-slate-200'
      "
    >
      <!-- Izquierda: Estado de Alarma + Selector de Modo (Hora Exacta vs Cada Hora) -->
      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Botón Activar / Silenciar Alarma -->
        <button
          type="button"
          :aria-pressed="alarmConfig.alarma_activa"
          @click="handleToggleAlarmaActiva"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
          :class="
            alarmConfig.alarma_activa
              ? 'bg-teal-500 text-slate-950 hover:bg-teal-400'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          "
        >
          <Bell v-if="alarmConfig.alarma_activa" class="w-3.5 h-3.5" />
          <BellOff v-else class="w-3.5 h-3.5" />
          <span>{{ alarmConfig.alarma_activa ? 'Alarma Activa' : 'Silenciada' }}</span>
        </button>

        <!-- Selector de Modo: Hora Exacta (Medicamentos) vs Recordatorio Periódico (Ayuno/Ducha) -->
        <div
          class="inline-flex items-center rounded-xl p-0.5 border text-xs"
          :class="
            alarmConfig.alarma_activa
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-300'
          "
        >
          <button
            type="button"
            @click="handleChangeTipoAlarma('hora_exacta')"
            class="px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer"
            :class="
              alarmConfig.tipo_alarma === 'hora_exacta'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : alarmConfig.alarma_activa
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            "
            title="Programar alarma a una hora exacta del día (ideal para tomar o suspender medicamentos)"
          >
            <Clock class="w-3 h-3" />
            <span>Hora Fija</span>
          </button>

          <button
            type="button"
            @click="handleChangeTipoAlarma('recordatorio_periodico')"
            class="px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer"
            :class="
              alarmConfig.tipo_alarma === 'recordatorio_periodico'
                ? 'bg-amber-500 text-slate-950 shadow-2xs'
                : alarmConfig.alarma_activa
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            "
            title="Repetir recordatorio cada cierto tiempo (ideal para mantener ayuno o recordar ducharse)"
          >
            <Repeat class="w-3 h-3" />
            <span>Cada Hora / Intervalo</span>
          </button>
        </div>

        <!-- Control A: Si es HORA EXACTA (ej. Medicamento a las 06:00 AM) -->
        <div
          v-if="alarmConfig.tipo_alarma === 'hora_exacta'"
          class="inline-flex items-center gap-2"
        >
          <label :for="`alarm-time-${pauta.id}`" class="text-xs font-bold opacity-90">
            Sonar a las:
          </label>
          <input
            :id="`alarm-time-${pauta.id}`"
            type="time"
            :value="alarmConfig.hora_alarma"
            @change="handleChangeHoraExacta"
            class="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border focus:outline-none cursor-pointer"
            :class="
              alarmConfig.alarma_activa
                ? 'bg-slate-800 border-indigo-400/60 text-indigo-200'
                : 'bg-white border-slate-300 text-slate-800'
            "
          />
        </div>

        <!-- Control B: Si es RECORDATORIO PERIÓDICO (ej. Ayuno o Ducha cada 1 hora) -->
        <div v-else class="inline-flex items-center gap-2">
          <label :for="`alarm-interval-${pauta.id}`" class="text-xs font-bold opacity-90">
            Repetir:
          </label>
          <select
            :id="`alarm-interval-${pauta.id}`"
            :value="alarmConfig.intervalo_minutos"
            @change="handleChangeIntervalo"
            class="px-2.5 py-1 rounded-lg text-xs font-extrabold border focus:outline-none cursor-pointer"
            :class="
              alarmConfig.alarma_activa
                ? 'bg-slate-800 border-amber-400/60 text-amber-300'
                : 'bg-white border-slate-300 text-slate-800'
            "
          >
            <option :value="15">Cada 15 minutos</option>
            <option :value="30">Cada 30 minutos</option>
            <option :value="60">Cada 1 hora (Recomendado)</option>
            <option :value="120">Cada 2 horas</option>
          </select>
        </div>
      </div>

      <!-- Derecha: Cuenta Regresiva en Vivo + Botón Probar Alarma -->
      <div class="flex flex-wrap items-center justify-between lg:justify-end gap-3">
        <span
          class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
          :class="
            alarmConfig.alarma_activa
              ? 'bg-slate-800 text-teal-300 border border-slate-700'
              : 'bg-slate-200 text-slate-600'
          "
        >
          {{ countdownText }}
        </span>

        <button
          type="button"
          @click="triggerAlarmNow(pauta)"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer"
          :class="
            alarmConfig.alarma_activa
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-400/40'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
          "
          title="Hacer sonar esta alarma ahora mismo para probar el aviso sonoro y de voz"
        >
          <Volume2 class="w-3.5 h-3.5" />
          <span>Probar Alarma</span>
        </button>
      </div>
    </div>
  </div>
</template>
