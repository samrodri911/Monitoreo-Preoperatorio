<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useClinicaStore } from '../../stores/clinicaStore'
import { useAuthStore } from '../../stores/authStore'
import type {
  NuevaCirugiaPayload,
  Paciente,
  Cirugia,
  NivelAnsiedad,
  PautaPersonalizadaInput,
} from '../../types/database.types'
import {
  X,
  UserPlus,
  Stethoscope,
  CalendarClock,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  HeartPulse,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  preselectedCatalogoId?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', result: { paciente: Paciente; cirugia: Cirugia }): void
  (e: 'open-patient-preview', pacienteId: string): void
  (e: 'open-catalogo'): void
}>()

const clinicaStore = useClinicaStore()
const authStore = useAuthStore()

const dialogRef = ref<HTMLDialogElement | null>(null)
const submitting = ref(false)
const submitError = ref('')
const createdResult = ref<{ paciente: Paciente; cirugia: Cirugia } | null>(null)
const copiedCredentials = ref(false)
const mostrarOverrideCirugiaBase = ref(false)

const opcionesComorbilidades = [
  'Hipertensión Arterial (HTA)',
  'Diabetes Mellitus Tipo 2',
  'Asma / EPOC',
  'Cardiopatía / Anticoagulación',
  'Apnea del Sueño',
  'Movilidad Reducida / Adulto Mayor',
]

const gruposSanguineos = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

function getDefaultFechaProgramada(): string {
  const tomorrow = new Date(Date.now() + 26 * 60 * 60 * 1000)
  tomorrow.setMinutes(0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:00`
}

const catalogoIdSeleccionado = ref<string>('cat-apendicectomia-lap')

const cirugiaBaseActiva = computed(() => {
  return (
    clinicaStore.catalogoCirugias.find((c) => c.id === catalogoIdSeleccionado.value) ||
    clinicaStore.catalogoCirugias[0]
  )
})

// --- Estado del Formulario ---
const form = ref({
  // Sección A: Ficha Clínica Específica del Paciente
  nombre_completo: '',
  documento: '',
  edad: '56',
  grupo_sanguineo: 'O+',
  peso_kg: '74',
  talla_cm: '168',
  telefono: '+57 310 ',
  contacto_emergencia: '',
  email: '',
  pin_acceso: '',
  alergias: 'Ninguna conocida',
  comorbilidades: ['Hipertensión Arterial (HTA)'] as string[],
  medicacion_habitual: 'Losartán 50mg cada 12 horas',
  nivel_ansiedad: 'moderada' as NivelAnsiedad,

  // Sección B: Cirugía Base (Heredada del Catálogo) + Posibles Ajustes
  tipo_cirugia: 'Apendicectomía Laparoscópica',
  nombre_sencillo: 'Cirugía de apéndice por mínima invasión (3 puertos)',
  especialidad: 'Cirugía General',
  fecha_programada: getDefaultFechaProgramada(),
  medico_tratante: authStore.medicoData?.nombre_completo || 'Dr. Alejandro Ramírez',
  tipo_anestesia: 'Anestesia General Balanceada',
  sensacion_anestesia:
    'Sentirás una suave calidez en el brazo y te quedarás plácidamente dormido en segundos sin sentir dolor alguno.',
  duracion_estimada: '45 a 60 minutos',
  tiempo_recuperacion: '24 a 48 horas de estancia ambulatoria / observación',
  tiempo_recuperacion_sala: '1 a 2 horas en Sala de Recuperación (URPA)',
  dias_incapacidad_estimados: '7 a 12 días con reincorporación gradual',

  // Sección C: Personalización para ESTE Paciente (Notas + Pautas)
  notas_medicas:
    'Paciente hipertenso controlado con Losartán 50mg; autorizar dosis matutina con sorbo mínimo de agua 4h antes. Reforzar acompañamiento empático por ansiedad moderada.',
  incluir_ayuno_solidos: true,
  ayuno_solidos_horas: 8,
  incluir_ayuno_liquidos: true,
  ayuno_liquidos_horas: 2,
  incluir_suspension_medicamentos: true,
  pauta_medicamentos_horas: 24,
  pauta_medicamentos_detalle:
    'Suspender antiinflamatorios (ibuprofeno, naproxeno, aspirina) y anticoagulantes. Seguir indicación específica para antihipertensivo.',
  incluir_ducha_antiseptica: true,
})

// Pautas adicionales exclusivas para este paciente
const pautasExtraPaciente = ref<PautaPersonalizadaInput[]>([])

const nuevaPautaExtra = ref<PautaPersonalizadaInput>({
  titulo: '',
  descripcion: '',
  horas_previas: 4,
  es_critica: true,
  tipo_alarma: 'hora_exacta',
  hora_alarma: '06:00',
  intervalo_minutos: 60,
})

function aplicarPlantillaBase(catId: string) {
  const tpl = clinicaStore.catalogoCirugias.find((c) => c.id === catId)
  if (!tpl) return
  form.value.tipo_cirugia = tpl.tipo_cirugia
  form.value.nombre_sencillo = tpl.nombre_sencillo
  form.value.especialidad = tpl.especialidad
  form.value.tipo_anestesia = tpl.tipo_anestesia
  form.value.sensacion_anestesia = tpl.sensacion_anestesia
  form.value.duracion_estimada = tpl.duracion_estimada
  form.value.tiempo_recuperacion = tpl.tiempo_recuperacion
  form.value.tiempo_recuperacion_sala = tpl.tiempo_recuperacion_sala
  form.value.dias_incapacidad_estimados = tpl.dias_incapacidad_estimados
  form.value.ayuno_solidos_horas = tpl.horas_ayuno_solidos
  form.value.ayuno_liquidos_horas = tpl.horas_ayuno_liquidos
  form.value.incluir_suspension_medicamentos = tpl.incluir_suspension_farmacos
  form.value.pauta_medicamentos_horas = tpl.horas_suspension_farmacos
  form.value.pauta_medicamentos_detalle = tpl.detalle_farmacos_base
  form.value.incluir_ducha_antiseptica = tpl.incluir_ducha_antiseptica
}

watch(catalogoIdSeleccionado, (newId) => {
  aplicarPlantillaBase(newId)
})

watch(
  () => props.preselectedCatalogoId,
  (newId) => {
    if (newId) {
      catalogoIdSeleccionado.value = newId
      aplicarPlantillaBase(newId)
    }
  }
)

function toggleComorbilidad(item: string) {
  const idx = form.value.comorbilidades.indexOf(item)
  if (idx >= 0) {
    form.value.comorbilidades.splice(idx, 1)
  } else {
    form.value.comorbilidades.push(item)
  }
}

// Autogenerar nota personalizada para Sofi y fármacos en base al perfil clínico del paciente
function generarNotaPersonalizadaAutomatica() {
  const partes: string[] = []
  if (form.value.comorbilidades.length > 0) {
    partes.push(`Antecedentes de ${form.value.comorbilidades.join(', ')}.`)
  }
  if (form.value.medicacion_habitual.trim()) {
    partes.push(
      `Medicación habitual reportada: ${form.value.medicacion_habitual.trim()} (verificar horario de última toma permitida con anestesiología).`
    )
    form.value.pauta_medicamentos_detalle = `${
      cirugiaBaseActiva.value?.detalle_farmacos_base || 'Suspender AINEs y anticoagulantes.'
    } Medicación habitual del paciente: ${form.value.medicacion_habitual.trim()}.`
  }
  if (
    form.value.alergias.trim() &&
    form.value.alergias.trim().toLowerCase() !== 'ninguna' &&
    form.value.alergias.trim().toLowerCase() !== 'ninguna conocida'
  ) {
    partes.push(`ALERTA DE ALERGIA: ${form.value.alergias.trim()}.`)
  }
  if (form.value.nivel_ansiedad === 'alta') {
    partes.push(
      'Paciente con ansiedad preoperatoria ALTA: Sofi debe priorizar validación emocional cálida y pausada en cada respuesta.'
    )
  } else if (form.value.nivel_ansiedad === 'moderada') {
    partes.push('Brindar acompañamiento tranquilizador ante dudas sobre la anestesia y el quirófano.')
  }
  form.value.notas_medicas =
    partes.join(' ') ||
    'Paciente sin comorbilidades mayores; seguir protocolo estándar de la cirugía programada.'
}

function agregarPautaExtraPaciente() {
  if (!nuevaPautaExtra.value.titulo.trim()) return
  pautasExtraPaciente.value.push({
    titulo: nuevaPautaExtra.value.titulo.trim(),
    descripcion:
      nuevaPautaExtra.value.descripcion.trim() ||
      'Indicación específica asignada por el cirujano para tu preparación.',
    horas_previas: Number(nuevaPautaExtra.value.horas_previas) || 4,
    es_critica: nuevaPautaExtra.value.es_critica,
    tipo_alarma: nuevaPautaExtra.value.tipo_alarma || 'hora_exacta',
    hora_alarma:
      nuevaPautaExtra.value.tipo_alarma === 'recordatorio_periodico'
        ? null
        : nuevaPautaExtra.value.hora_alarma || '06:00',
    intervalo_minutos:
      nuevaPautaExtra.value.tipo_alarma === 'recordatorio_periodico'
        ? Number(nuevaPautaExtra.value.intervalo_minutos) || 60
        : null,
  })
  nuevaPautaExtra.value = {
    titulo: '',
    descripcion: '',
    horas_previas: 4,
    es_critica: true,
    tipo_alarma: 'hora_exacta',
    hora_alarma: '06:00',
    intervalo_minutos: 60,
  }
}

function eliminarPautaExtraPaciente(index: number) {
  pautasExtraPaciente.value.splice(index, 1)
}

function agregarPlantillaRapidaPauta(tipo: 'hta' | 'glucometria' | 'inhalador') {
  if (tipo === 'hta') {
    pautasExtraPaciente.value.push({
      titulo: 'Toma Matutina de Antihipertensivo con Sorbo Mínimo de Agua',
      descripcion: `Tomar su dosis de ${form.value.medicacion_habitual || 'antihipertensivo'} únicamente con un sorbo pequeño de agua a las 06:00 AM (4 horas antes de la cirugía).`,
      horas_previas: 4,
      es_critica: true,
      tipo_alarma: 'hora_exacta',
      hora_alarma: '06:00',
      intervalo_minutos: null,
    })
  } else if (tipo === 'glucometria') {
    pautasExtraPaciente.value.push({
      titulo: 'Control de Glucometría Capilar en Ayunas y Suspensión de Hipoglucemiante',
      descripcion:
        'Medir glucosa en ayunas a las 06:30 AM la mañana de la cirugía y no administrar insulina ni metformina matutina sin orden médica.',
      horas_previas: 6,
      es_critica: true,
      tipo_alarma: 'hora_exacta',
      hora_alarma: '06:30',
      intervalo_minutos: null,
    })
  } else if (tipo === 'inhalador') {
    pautasExtraPaciente.value.push({
      titulo: 'Aplicar Puff Broncodilatador y Llevar Inhalador a Quirófano',
      descripcion:
        'Realizar inhalación preventiva de mantenimiento a las 07:00 AM y entregar el inhalador al equipo de anestesiología al ingreso.',
      horas_previas: 3,
      es_critica: false,
      tipo_alarma: 'hora_exacta',
      hora_alarma: '07:00',
      intervalo_minutos: null,
    })
  }
}

// Validación por campo (on blur tras edición, limpieza on input)
const touched = ref<Record<string, boolean>>({})
const errors = ref<Record<string, string>>({})

function markInput(field: string) {
  touched.value[field] = true
  errors.value[field] = ''
  submitError.value = ''

  if (field === 'documento') {
    const cleanDoc = form.value.documento.replace(/\D/g, '')
    if (cleanDoc.length >= 4 && !touched.value.pin_acceso) {
      form.value.pin_acceso = cleanDoc.slice(-4)
    }
  }
}

function validateField(field: string) {
  if (!touched.value[field]) return

  switch (field) {
    case 'nombre_completo':
      if (!form.value.nombre_completo.trim() || form.value.nombre_completo.trim().length < 3) {
        errors.value.nombre_completo = 'Ingresa el nombre y apellido completo del paciente.'
      }
      break
    case 'documento':
      if (!form.value.documento.trim() || form.value.documento.trim().length < 5) {
        errors.value.documento = 'Ingresa un número de documento o cédula válido (mínimo 5 dígitos).'
      }
      break
    case 'edad': {
      const edadNum = Number(form.value.edad)
      if (!form.value.edad || Number.isNaN(edadNum) || edadNum < 1 || edadNum > 115) {
        errors.value.edad = 'Ingresa una edad válida entre 1 y 115 años.'
      }
      break
    }
    case 'telefono':
      if (!form.value.telefono.trim() || form.value.telefono.trim().length < 7) {
        errors.value.telefono = 'Ingresa un teléfono de contacto válido.'
      }
      break
    case 'contacto_emergencia':
      if (!form.value.contacto_emergencia.trim()) {
        errors.value.contacto_emergencia = 'Registra el nombre y teléfono del acompañante responsable.'
      }
      break
    case 'pin_acceso':
      if (!form.value.pin_acceso.trim() || form.value.pin_acceso.trim().length < 4) {
        errors.value.pin_acceso = 'El PIN de acceso debe tener al menos 4 caracteres.'
      }
      break
    case 'tipo_cirugia':
      if (!form.value.tipo_cirugia.trim()) {
        errors.value.tipo_cirugia = 'Especifica el nombre del procedimiento quirúrgico.'
      }
      break
    case 'fecha_programada':
      if (!form.value.fecha_programada) {
        errors.value.fecha_programada = 'Selecciona la fecha y hora programada del quirófano.'
      }
      break
  }
}

function generarPinAutomatico() {
  const cleanDoc = form.value.documento.replace(/\D/g, '')
  if (cleanDoc.length >= 4) {
    form.value.pin_acceso = cleanDoc.slice(-4)
  } else {
    form.value.pin_acceso = String(Math.floor(1000 + Math.random() * 9000))
  }
  errors.value.pin_acceso = ''
}

// Previsualización de pautas combinadas (Base de la Cirugía + Personalizadas del Paciente)
const pautasCalculadasPreview = computed(() => {
  if (!form.value.fecha_programada) return []
  const cirDate = new Date(form.value.fecha_programada)
  if (Number.isNaN(cirDate.getTime())) return []

  const formatTime = (hoursBefore: number) => {
    const d = new Date(cirDate.getTime() - hoursBefore * 60 * 60 * 1000)
    return d.toLocaleString('es-CO', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatHHMM = (hoursBefore: number) => {
    const d = new Date(cirDate.getTime() - hoursBefore * 60 * 60 * 1000)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const list: Array<{
    titulo: string;
    horas: number;
    critica: boolean;
    origen: 'base' | 'personalizada';
    limiteStr: string;
    alarmaLabel: string;
  }> = []

  if (form.value.incluir_suspension_medicamentos) {
    const h = Number(form.value.pauta_medicamentos_horas) || 24
    list.push({
      titulo: 'Control de Medicamentos y Anticoagulantes',
      horas: h,
      critica: true,
      origen: 'base',
      limiteStr: formatTime(h),
      alarmaLabel: `⏰ ${formatHHMM(h)}`,
    })
  }

  if (cirugiaBaseActiva.value?.pauta_especifica_titulo) {
    const h = cirugiaBaseActiva.value.pauta_especifica_horas || 18
    list.push({
      titulo: cirugiaBaseActiva.value.pauta_especifica_titulo,
      horas: h,
      critica: false,
      origen: 'base',
      limiteStr: formatTime(h),
      alarmaLabel: '🔁 Cada 1h',
    })
  }

  if (form.value.incluir_ducha_antiseptica) {
    const h = cirugiaBaseActiva.value?.horas_ducha_antiseptica || 12
    list.push({
      titulo: 'Ducha Corporal con Jabón Antiséptico',
      horas: h,
      critica: false,
      origen: 'base',
      limiteStr: formatTime(h),
      alarmaLabel: '🔁 Cada 1h',
    })
  }

  if (form.value.incluir_ayuno_solidos) {
    const h = Number(form.value.ayuno_solidos_horas) || 8
    list.push({
      titulo: `Ayuno Absoluto de Sólidos (-${h}h)`,
      horas: h,
      critica: true,
      origen: 'base',
      limiteStr: formatTime(h),
      alarmaLabel: '🔁 Cada 1h',
    })
  }

  if (form.value.incluir_ayuno_liquidos) {
    const h = Number(form.value.ayuno_liquidos_horas) || 2
    list.push({
      titulo: `Suspensión Total de Líquidos Claros (-${h}h)`,
      horas: h,
      critica: true,
      origen: 'base',
      limiteStr: formatTime(h),
      alarmaLabel: '🔁 Cada 1h',
    })
  }

  list.push({
    titulo: 'Presentación en Admisión con Acompañante',
    horas: 2,
    critica: true,
    origen: 'base',
    limiteStr: formatTime(2),
    alarmaLabel: `⏰ ${formatHHMM(2)}`,
  })

  for (const extra of pautasExtraPaciente.value) {
    const isPeriodico = extra.tipo_alarma === 'recordatorio_periodico'
    list.push({
      titulo: extra.titulo,
      horas: extra.horas_previas,
      critica: extra.es_critica,
      origen: 'personalizada',
      limiteStr: formatTime(extra.horas_previas),
      alarmaLabel: isPeriodico
        ? `🔁 Cada ${(extra.intervalo_minutos || 60) >= 60 ? `${(extra.intervalo_minutos || 60) / 60}h` : `${extra.intervalo_minutos}m`}`
        : `⏰ ${extra.hora_alarma || formatHHMM(extra.horas_previas)}`,
    })
  }

  return list.sort((a, b) => b.horas - a.horas)
})

watch(
  () => props.open,
  async (isOpen) => {
    const dialog = dialogRef.value
    if (!dialog) return
    if (isOpen && !dialog.open) {
      await clinicaStore.cargarCatalogoCirugias()
      if (props.preselectedCatalogoId) {
        catalogoIdSeleccionado.value = props.preselectedCatalogoId
      }
      aplicarPlantillaBase(catalogoIdSeleccionado.value)
      createdResult.value = null
      submitError.value = ''
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }
)

onMounted(async () => {
  await clinicaStore.cargarCatalogoCirugias()
  aplicarPlantillaBase(catalogoIdSeleccionado.value)
  if (props.open && dialogRef.value && !dialogRef.value.open) {
    dialogRef.value.showModal()
  }
})

function closeDialog() {
  if (dialogRef.value?.open) {
    dialogRef.value.close()
  }
  emit('close')
}

function handleNativeClose() {
  emit('close')
}

function handleDialogClick(event: MouseEvent) {
  if ('closedBy' in HTMLDialogElement.prototype) return
  const dialog = dialogRef.value
  if (!dialog) return
  const rect = dialog.getBoundingClientRect()
  const clickedInDialog =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width

  if (!clickedInDialog) {
    closeDialog()
  }
}

async function handleSubmit() {
  const requiredFields = [
    'nombre_completo',
    'documento',
    'edad',
    'telefono',
    'contacto_emergencia',
    'pin_acceso',
    'tipo_cirugia',
    'fecha_programada',
  ]
  for (const f of requiredFields) {
    touched.value[f] = true
    validateField(f)
  }

  const hasErrors = Object.values(errors.value).some((msg) => Boolean(msg))
  if (hasErrors) {
    submitError.value = 'Por favor revisa los campos obligatorios marcados en rojo antes de guardar.'
    return
  }

  submitting.value = true
  submitError.value = ''

  try {
    const isoDate = new Date(form.value.fecha_programada).toISOString()
    const payload: NuevaCirugiaPayload = {
      nombre_completo: form.value.nombre_completo.trim(),
      documento: form.value.documento.trim(),
      edad: Number(form.value.edad),
      telefono: form.value.telefono.trim(),
      contacto_emergencia: form.value.contacto_emergencia.trim(),
      email: form.value.email.trim() || undefined,
      pin_acceso: form.value.pin_acceso.trim(),
      grupo_sanguineo: form.value.grupo_sanguineo,
      peso_kg: form.value.peso_kg ? Number(form.value.peso_kg) : null,
      talla_cm: form.value.talla_cm ? Number(form.value.talla_cm) : null,
      alergias: form.value.alergias.trim() || 'Ninguna conocida',
      comorbilidades: [...form.value.comorbilidades],
      medicacion_habitual: form.value.medicacion_habitual.trim() || undefined,
      nivel_ansiedad: form.value.nivel_ansiedad,
      catalogo_cirugia_id: catalogoIdSeleccionado.value,
      tipo_cirugia: form.value.tipo_cirugia.trim(),
      nombre_sencillo: form.value.nombre_sencillo.trim() || form.value.tipo_cirugia.trim(),
      especialidad: form.value.especialidad.trim(),
      fecha_programada: isoDate,
      medico_tratante: form.value.medico_tratante.trim() || 'Dr. Alejandro Ramírez',
      tipo_anestesia: form.value.tipo_anestesia.trim(),
      sensacion_anestesia: form.value.sensacion_anestesia.trim(),
      duracion_estimada: form.value.duracion_estimada.trim(),
      tiempo_recuperacion: form.value.tiempo_recuperacion.trim(),
      tiempo_recuperacion_sala: form.value.tiempo_recuperacion_sala.trim(),
      dias_incapacidad_estimados: form.value.dias_incapacidad_estimados.trim(),
      notas_medicas: form.value.notas_medicas.trim(),
      incluirSuspensionFarmacos: form.value.incluir_suspension_medicamentos,
      horasSuspensionFarmacos: Number(form.value.pauta_medicamentos_horas) || 24,
      detalleFarmacos: form.value.pauta_medicamentos_detalle.trim(),
      horasAyunoSolidos: Number(form.value.ayuno_solidos_horas) || 8,
      horasAyunoLiquidos: Number(form.value.ayuno_liquidos_horas) || 2,
      incluirDuchaAntiseptica: form.value.incluir_ducha_antiseptica,
      pautasPersonalizadasExtra: [...pautasExtraPaciente.value],
    }

    const res = await clinicaStore.registrarNuevaCirugia(payload)
    if (!res.ok || !res.paciente || !res.cirugia) {
      submitError.value = res.error || 'No fue posible registrar el paciente y la cirugía.'
      return
    }
    const resultData = { paciente: res.paciente, cirugia: res.cirugia }
    createdResult.value = resultData
    emit('created', resultData)
  } catch (err: any) {
    submitError.value = err?.message || 'Error al registrar el paciente y la cirugía.'
  } finally {
    submitting.value = false
  }
}

async function copyCredenciales() {
  if (!createdResult.value) return
  const text = `Paciente: ${createdResult.value.paciente.nombre_completo}\nDocumento: ${createdResult.value.paciente.documento}\nPIN de Acceso: ${createdResult.value.paciente.pin_acceso}\nCódigo Cirugía: ${createdResult.value.cirugia.codigo_cirugia}`
  try {
    await navigator.clipboard.writeText(text)
    copiedCredentials.value = true
    setTimeout(() => {
      copiedCredentials.value = false
    }, 2500)
  } catch {
    // Fallback silencioso
  }
}
</script>

<template>
  <dialog
    ref="dialogRef"
    closedby="any"
    aria-labelledby="nueva-cirugia-title"
    @close="handleNativeClose"
    @click="handleDialogClick"
    class="nueva-cirugia-dialog w-full max-w-5xl rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 p-0 m-auto overflow-hidden"
  >
    <!-- Cabecera fija del modal -->
    <div class="bg-slate-900 text-white px-6 py-5 flex items-center justify-between gap-4 border-b border-slate-800">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
          <UserPlus class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-teal-400 block">
            Cirugía Base del Catálogo + Personalización Clínica por Paciente
          </span>
          <h2 id="nueva-cirugia-title" class="text-xl font-extrabold text-white">
            {{
              createdResult
                ? '¡Expediente Quirúrgico y Pautas Creados con Éxito!'
                : 'Registrar Nuevo Paciente y Asignar Cirugía'
            }}
          </h2>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="!createdResult"
          type="button"
          @click="emit('open-catalogo')"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <BookOpen class="w-4 h-4" />
          <span class="hidden sm:inline">Gestionar Catálogo de Cirugías</span>
        </button>

        <button
          type="button"
          aria-label="Cerrar ventana de registro"
          @click="closeDialog"
          class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- ============================================================
         VISTA DE CONFIRMACIÓN TRAS GUARDAR
         ============================================================ -->
    <div v-if="createdResult" class="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
      <div class="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-start gap-4">
        <CheckCircle2 class="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h3 class="text-lg font-extrabold text-emerald-950">
            Expediente prequirúrgico activo (Protocolo Base + Personalización del Paciente)
          </h3>
          <p class="text-sm text-emerald-800 mt-1">
            Se aplicó la base de <strong>{{ createdResult.cirugia.tipo_cirugia }}</strong> junto con el perfil clínico específico de <strong>{{ createdResult.paciente.nombre_completo }}</strong> y sus <strong>{{ pautasCalculadasPreview.length }} pautas preoperatorias</strong>.
          </p>
        </div>
      </div>

      <!-- Tarjeta de Credenciales y Resumen Clínico -->
      <div class="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-teal-400">
              Credenciales Habilitadas para el Portal del Paciente
            </span>
            <h4 class="text-lg font-bold text-white mt-0.5">
              {{ createdResult.paciente.nombre_completo }} ({{ createdResult.paciente.edad }} años • {{ createdResult.paciente.grupo_sanguineo || 'O+' }})
            </h4>
          </div>
          <button
            type="button"
            @click="copyCredenciales"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-teal-300 border border-slate-700 cursor-pointer"
          >
            <Check v-if="copiedCredentials" class="w-4 h-4 text-emerald-400" />
            <Copy v-else class="w-4 h-4" />
            <span>{{ copiedCredentials ? 'Copiado' : 'Copiar credenciales' }}</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700">
            <span class="text-xs text-slate-400 block">Documento / Cédula</span>
            <strong class="text-lg font-mono text-white">{{ createdResult.paciente.documento }}</strong>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-800/90 border border-teal-500/40">
            <span class="text-xs text-teal-300 block">PIN de Acceso</span>
            <strong class="text-lg font-mono text-teal-300">{{ createdResult.paciente.pin_acceso }}</strong>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-800/90 border border-amber-500/40">
            <span class="text-xs text-amber-300 block">Código de Cirugía</span>
            <strong class="text-lg font-mono text-amber-300">{{ createdResult.cirugia.codigo_cirugia }}</strong>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <span class="text-slate-400 block">Antecedentes y Alergias del Paciente:</span>
            <strong class="text-white block mt-0.5">
              {{
                createdResult.paciente.comorbilidades?.length
                  ? createdResult.paciente.comorbilidades.join(', ')
                  : 'Sin comorbilidades'
              }}
              • Alergias: {{ createdResult.paciente.alergias || 'Ninguna' }}
            </strong>
          </div>
          <div class="p-3 rounded-xl bg-teal-950/60 border border-teal-800/70">
            <span class="text-teal-300 font-bold block">Directriz personalizada inyectada en Sofi:</span>
            <span class="text-teal-100 block mt-0.5">"{{ createdResult.cirugia.notas_medicas }}"</span>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          type="button"
          @click="closeDialog"
          class="px-5 py-3 rounded-xl border-2 border-slate-200 hover:bg-slate-100 font-bold text-sm text-slate-700 cursor-pointer"
        >
          Volver al Tablero Semáforo
        </button>
        <button
          type="button"
          @click="emit('open-patient-preview', createdResult.paciente.id)"
          class="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
        >
          <span>Abrir Vista de este Paciente Ahora</span>
          <ExternalLink class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- ============================================================
         FORMULARIO DE CREACIÓN (SECCIONES A, B y C)
         ============================================================ -->
    <form
      v-else
      aria-labelledby="nueva-cirugia-title"
      @submit.prevent="handleSubmit"
      novalidate
      class="p-6 sm:p-8 space-y-8 max-h-[82vh] overflow-y-auto brand-consistent-form"
    >
      <div
        v-if="submitError"
        role="alert"
        class="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-900 flex items-start gap-3"
      >
        <AlertCircle class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div class="text-sm font-bold">{{ submitError }}</div>
      </div>

      <!-- ==========================================================
           SECCIÓN A: FICHA CLÍNICA ESPECÍFICA DEL PACIENTE
           ========================================================== -->
      <fieldset class="space-y-5 border border-slate-200 rounded-2xl p-5 bg-slate-50/60">
        <legend class="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
          <HeartPulse class="w-3.5 h-3.5 text-teal-400" />
          <span>Sección A • Ficha Clínica Específica del Paciente y Credencial de Acceso</span>
        </legend>

        <!-- Fila 1: Identificación, Edad, RH, Peso, Talla -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div class="sm:col-span-4">
            <label for="nc-nombre" class="block text-xs font-bold text-slate-800 mb-1">
              Nombre Completo del Paciente *
            </label>
            <input
              id="nc-nombre"
              v-model="form.nombre_completo"
              type="text"
              autocomplete="name"
              required
              placeholder="Ej: Jorge Enrique Pardo"
              :aria-invalid="errors.nombre_completo ? 'true' : 'false'"
              @input="markInput('nombre_completo')"
              @blur="validateField('nombre_completo')"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 rounded-xl text-slate-900 focus:outline-none"
              :class="errors.nombre_completo ? 'border-red-400' : 'border-slate-200 focus:border-teal-600'"
            />
            <p v-if="errors.nombre_completo" role="alert" class="text-xs font-bold text-red-600 mt-1">
              {{ errors.nombre_completo }}
            </p>
          </div>

          <div class="sm:col-span-3">
            <label for="nc-documento" class="block text-xs font-bold text-slate-800 mb-1">
              Documento / Cédula *
            </label>
            <input
              id="nc-documento"
              v-model="form.documento"
              type="text"
              inputmode="numeric"
              autocorrect="off"
              autocapitalize="none"
              spellcheck="false"
              required
              placeholder="Ej: 1020458912"
              :aria-invalid="errors.documento ? 'true' : 'false'"
              @input="markInput('documento')"
              @blur="validateField('documento')"
              class="w-full px-3.5 py-2.5 text-sm font-mono font-semibold bg-white border-2 rounded-xl text-slate-900 focus:outline-none"
              :class="errors.documento ? 'border-red-400' : 'border-slate-200 focus:border-teal-600'"
            />
            <p v-if="errors.documento" role="alert" class="text-xs font-bold text-red-600 mt-1">
              {{ errors.documento }}
            </p>
          </div>

          <div class="sm:col-span-1">
            <label for="nc-edad" class="block text-xs font-bold text-slate-800 mb-1">
              Edad *
            </label>
            <input
              id="nc-edad"
              v-model="form.edad"
              type="text"
              inputmode="numeric"
              required
              placeholder="56"
              :aria-invalid="errors.edad ? 'true' : 'false'"
              @input="markInput('edad')"
              @blur="validateField('edad')"
              class="w-full px-2.5 py-2.5 text-sm font-semibold text-center bg-white border-2 rounded-xl text-slate-900 focus:outline-none"
              :class="errors.edad ? 'border-red-400' : 'border-slate-200 focus:border-teal-600'"
            />
          </div>

          <div class="sm:col-span-2">
            <label for="nc-rh" class="block text-xs font-bold text-slate-800 mb-1">
              Grupo / RH
            </label>
            <select
              id="nc-rh"
              v-model="form.grupo_sanguineo"
              class="w-full px-3 py-2.5 text-sm font-bold bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            >
              <option v-for="rh in gruposSanguineos" :key="rh" :value="rh">{{ rh }}</option>
            </select>
          </div>

          <div class="sm:col-span-1">
            <label for="nc-peso" class="block text-xs font-bold text-slate-800 mb-1">
              Peso (kg)
            </label>
            <input
              id="nc-peso"
              v-model="form.peso_kg"
              type="text"
              inputmode="numeric"
              placeholder="74"
              class="w-full px-2 py-2.5 text-sm text-center font-medium bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>

          <div class="sm:col-span-1">
            <label for="nc-talla" class="block text-xs font-bold text-slate-800 mb-1">
              Talla (cm)
            </label>
            <input
              id="nc-talla"
              v-model="form.talla_cm"
              type="text"
              inputmode="numeric"
              placeholder="168"
              class="w-full px-2 py-2.5 text-sm text-center font-medium bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>

          <!-- Fila 2: Contacto, Acompañante y PIN -->
          <div class="sm:col-span-4">
            <label for="nc-telefono" class="block text-xs font-bold text-slate-800 mb-1">
              Teléfono Celular *
            </label>
            <input
              id="nc-telefono"
              v-model="form.telefono"
              type="tel"
              autocomplete="tel"
              required
              placeholder="+57 310 555 1234"
              :aria-invalid="errors.telefono ? 'true' : 'false'"
              @input="markInput('telefono')"
              @blur="validateField('telefono')"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 rounded-xl text-slate-900 focus:outline-none"
              :class="errors.telefono ? 'border-red-400' : 'border-slate-200 focus:border-teal-600'"
            />
            <p v-if="errors.telefono" role="alert" class="text-xs font-bold text-red-600 mt-1">
              {{ errors.telefono }}
            </p>
          </div>

          <div class="sm:col-span-4">
            <label for="nc-emergencia" class="block text-xs font-bold text-slate-800 mb-1">
              Acompañante Responsable (Nombre y Teléfono) *
            </label>
            <input
              id="nc-emergencia"
              v-model="form.contacto_emergencia"
              type="text"
              required
              placeholder="Ej: Claudia Pardo (Hija) - 315 222 3344"
              :aria-invalid="errors.contacto_emergencia ? 'true' : 'false'"
              @input="markInput('contacto_emergencia')"
              @blur="validateField('contacto_emergencia')"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 rounded-xl text-slate-900 focus:outline-none"
              :class="errors.contacto_emergencia ? 'border-red-400' : 'border-slate-200 focus:border-teal-600'"
            />
            <p v-if="errors.contacto_emergencia" role="alert" class="text-xs font-bold text-red-600 mt-1">
              {{ errors.contacto_emergencia }}
            </p>
          </div>

          <div class="sm:col-span-4">
            <label for="nc-pin" class="block text-xs font-bold text-slate-800 mb-1">
              PIN de Acceso Asignado al Paciente *
            </label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <KeyRound class="w-4 h-4 text-teal-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="nc-pin"
                  v-model="form.pin_acceso"
                  type="text"
                  inputmode="numeric"
                  autocorrect="off"
                  autocapitalize="none"
                  spellcheck="false"
                  required
                  placeholder="Ej: 8912"
                  :aria-invalid="errors.pin_acceso ? 'true' : 'false'"
                  @input="markInput('pin_acceso')"
                  @blur="validateField('pin_acceso')"
                  class="w-full pl-9 pr-3 py-2.5 text-sm font-mono font-bold bg-teal-50/70 border-2 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  :class="errors.pin_acceso ? 'border-red-400' : 'border-teal-300 focus:border-teal-600'"
                />
              </div>
              <button
                type="button"
                @click="generarPinAutomatico"
                class="px-3 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-teal-500 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RefreshCw class="w-3.5 h-3.5" />
                <span>Auto</span>
              </button>
            </div>
            <p v-if="errors.pin_acceso" role="alert" class="text-xs font-bold text-red-600 mt-0.5">
              {{ errors.pin_acceso }}
            </p>
          </div>
        </div>

        <!-- Sub-bloque: Antecedentes Clínicos Específicos del Paciente -->
        <div class="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div class="sm:col-span-12">
            <span class="block text-xs font-bold text-slate-800 mb-2">
              Comorbilidades / Antecedentes Médicos del Paciente (Selecciona los que apliquen)
            </span>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="(com, idx) in opcionesComorbilidades"
                :key="com"
                :for="`comorb-${idx}`"
                class="checkbox-pill inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all"
                :class="
                  form.comorbilidades.includes(com)
                    ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                "
              >
                <input
                  :id="`comorb-${idx}`"
                  type="checkbox"
                  :checked="form.comorbilidades.includes(com)"
                  @change="toggleComorbilidad(com)"
                  class="brand-checkbox"
                />
                <span>{{ com }}</span>
              </label>
            </div>
          </div>

          <div class="sm:col-span-4">
            <label for="nc-alergias" class="block text-xs font-bold text-slate-800 mb-1">
              Alergias Medicamentosas o Alimentarias
            </label>
            <input
              id="nc-alergias"
              v-model="form.alergias"
              type="text"
              placeholder="Ej: Alergia a Penicilina / Ninguna"
              class="w-full px-3.5 py-2 text-xs font-medium bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div class="sm:col-span-5">
            <label for="nc-med-habitual" class="block text-xs font-bold text-slate-800 mb-1">
              Medicación Habitual que Toma el Paciente en Casa
            </label>
            <input
              id="nc-med-habitual"
              v-model="form.medicacion_habitual"
              type="text"
              placeholder="Ej: Losartán 50mg c/12h, Aspirina 100mg"
              class="w-full px-3.5 py-2 text-xs font-medium bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div class="sm:col-span-3">
            <label for="nc-ansiedad" class="block text-xs font-bold text-slate-800 mb-1">
              Nivel de Ansiedad Detectado
            </label>
            <select
              id="nc-ansiedad"
              v-model="form.nivel_ansiedad"
              class="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            >
              <option value="baja">🟢 Baja (Tranquilo)</option>
              <option value="moderada">🟡 Moderada (Dudas normales)</option>
              <option value="alta">🔴 Alta (Priorizar contención Sofi)</option>
            </select>
          </div>
        </div>
      </fieldset>

      <!-- ==========================================================
           SECCIÓN B: SELECCIÓN DE CIRUGÍA BASE REUTILIZABLE DEL CATÁLOGO
           ========================================================== -->
      <fieldset class="space-y-4 border border-slate-200 rounded-2xl p-5 bg-slate-50/60">
        <legend class="px-3 py-1 rounded-lg bg-teal-700 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
          <Stethoscope class="w-3.5 h-3.5" />
          <span>Sección B • Selección de Cirugía Base (Reutilizada del Catálogo General)</span>
        </legend>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div class="sm:col-span-6">
            <div class="flex items-center justify-between mb-1">
              <label for="nc-catalogo-select" class="text-xs font-bold text-slate-800">
                Seleccionar Cirugía del Catálogo General *
              </label>
              <button
                type="button"
                @click="emit('open-catalogo')"
                class="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus class="w-3 h-3" />
                <span>Crear otra cirugía en el catálogo</span>
              </button>
            </div>
            <select
              id="nc-catalogo-select"
              v-model="catalogoIdSeleccionado"
              class="w-full px-3.5 py-2.5 text-sm font-bold bg-white border-2 border-teal-300 focus:border-teal-600 rounded-xl text-slate-900 focus:outline-none"
            >
              <option
                v-for="cat in clinicaStore.catalogoCirugias"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.tipo_cirugia }} ({{ cat.especialidad }} • {{ cat.codigo_base }})
              </option>
            </select>
          </div>

          <div class="sm:col-span-3">
            <label for="nc-fecha" class="block text-xs font-bold text-slate-800 mb-1">
              Fecha y Hora Programada *
            </label>
            <input
              id="nc-fecha"
              v-model="form.fecha_programada"
              type="datetime-local"
              required
              :aria-invalid="errors.fecha_programada ? 'true' : 'false'"
              @input="markInput('fecha_programada')"
              @blur="validateField('fecha_programada')"
              class="w-full px-3 py-2.5 text-sm font-semibold bg-white border-2 rounded-xl text-slate-900 focus:outline-none"
              :class="errors.fecha_programada ? 'border-red-400' : 'border-slate-200 focus:border-teal-600'"
            />
          </div>

          <div class="sm:col-span-3">
            <label for="nc-medico" class="block text-xs font-bold text-slate-800 mb-1">
              Cirujano Tratante Asignado
            </label>
            <input
              id="nc-medico"
              v-model="form.medico_tratante"
              type="text"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            />
          </div>
        </div>

        <!-- Resumen de la Información Base Heredada de la Cirugía -->
        <div
          v-if="cirugiaBaseActiva"
          class="p-4 rounded-2xl bg-white border border-teal-200/90 space-y-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-extrabold">
                Protocolo Base Cargado: {{ cirugiaBaseActiva.codigo_base }}
              </span>
              <span class="text-xs font-bold text-slate-800">
                {{ cirugiaBaseActiva.nombre_sencillo }}
              </span>
            </div>

            <button
              type="button"
              @click="mostrarOverrideCirugiaBase = !mostrarOverrideCirugiaBase"
              class="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <Sliders class="w-3.5 h-3.5" />
              <span>
                {{
                  mostrarOverrideCirugiaBase
                    ? 'Ocultar ajustes técnicos de la cirugía'
                    : 'Ajustar tiempos/anestesia solo para este paciente'
                }}
              </span>
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Anestesia Base</span>
              <strong class="text-slate-800">{{ form.tipo_anestesia }}</strong>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Duración Quirófano</span>
              <strong class="text-slate-800">{{ form.duracion_estimada }}</strong>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Estancia / Observación</span>
              <strong class="text-slate-800">{{ form.tiempo_recuperacion }}</strong>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Incapacidad Estimada</span>
              <strong class="text-slate-800">{{ form.dias_incapacidad_estimados }}</strong>
            </div>
          </div>

          <!-- Campos opcionales para sobrescribir la base en este paciente -->
          <div
            v-if="mostrarOverrideCirugiaBase"
            class="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <div>
              <label for="nc-over-anestesia" class="block text-[11px] font-bold text-slate-700 mb-1">
                Tipo de Anestesia para este Paciente
              </label>
              <input
                id="nc-over-anestesia"
                v-model="form.tipo_anestesia"
                type="text"
                class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label for="nc-over-duracion" class="block text-[11px] font-bold text-slate-700 mb-1">
                Duración Estimada para este Caso
              </label>
              <input
                id="nc-over-duracion"
                v-model="form.duracion_estimada"
                type="text"
                class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label for="nc-over-estancia" class="block text-[11px] font-bold text-slate-700 mb-1">
                Estancia Hospitalaria Estimada
              </label>
              <input
                id="nc-over-estancia"
                v-model="form.tiempo_recuperacion"
                type="text"
                class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </fieldset>

      <!-- ==========================================================
           SECCIÓN C: INFORMACIÓN Y PAUTAS PERSONALIZADAS PARA ESTE PACIENTE
           ========================================================== -->
      <fieldset class="space-y-5 border border-slate-200 rounded-2xl p-5 bg-slate-50/60">
        <legend class="px-3 py-1 rounded-lg bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
          <ClipboardCheck class="w-3.5 h-3.5 text-amber-400" />
          <span>Sección C • Personalización Exclusiva para este Paciente (Adicional a la Base)</span>
        </legend>

        <!-- 1. Nota Clínica Personalizada del Cirujano para el Paciente y para Sofi -->
        <div class="p-4 rounded-2xl bg-white border-2 border-teal-200/80 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label for="nc-notas-sofi" class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles class="w-4 h-4 text-teal-600" />
              <span>Indicaciones Clínicas Personalizadas para este Paciente y para "Sofi"</span>
            </label>
            <button
              type="button"
              @click="generarNotaPersonalizadaAutomatica"
              class="px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles class="w-3 h-3" />
              <span>Redactar automáticamente según comorbilidades y fármacos del paciente</span>
            </button>
          </div>
          <textarea
            id="nc-notas-sofi"
            v-model="form.notas_medicas"
            rows="2"
            placeholder="Escribe aquí cualquier instrucción exclusiva para este paciente (además de la información base de la cirugía)..."
            class="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-600 rounded-xl text-slate-900 focus:outline-none"
          ></textarea>
          <p class="text-[11px] text-slate-500">
            <strong>Sofi</strong> combinará la base general de <em>{{ form.tipo_cirugia }}</em> con esta directriz personalizada y con la ficha clínica (alergias, medicación y ansiedad) de este paciente.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <!-- Columna Izquierda: Ajustar Pautas Base + Añadir Pautas Personalizadas Extra -->
          <div class="lg:col-span-6 space-y-4">
            <div class="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <span class="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                Ajuste de Horas Base (Opcional para este paciente)
              </span>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label for="nc-ayuno-solidos" class="block text-[11px] font-bold text-slate-700 mb-1">
                    Ayuno Sólidos (h)
                  </label>
                  <input
                    id="nc-ayuno-solidos"
                    v-model="form.ayuno_solidos_horas"
                    type="text"
                    inputmode="numeric"
                    class="w-full px-2.5 py-1.5 text-center text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label for="nc-ayuno-liquidos" class="block text-[11px] font-bold text-slate-700 mb-1">
                    Ayuno Líquidos (h)
                  </label>
                  <input
                    id="nc-ayuno-liquidos"
                    v-model="form.ayuno_liquidos_horas"
                    type="text"
                    inputmode="numeric"
                    class="w-full px-2.5 py-1.5 text-center text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label for="nc-horas-meds" class="block text-[11px] font-bold text-slate-700 mb-1">
                    Susp. Fármacos (h)
                  </label>
                  <input
                    id="nc-horas-meds"
                    v-model="form.pauta_medicamentos_horas"
                    type="text"
                    inputmode="numeric"
                    class="w-full px-2.5 py-1.5 text-center text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label for="nc-meds-detalle" class="block text-[11px] font-bold text-slate-700 mb-1">
                  Instrucción de Medicamentos para este Paciente
                </label>
                <input
                  id="nc-meds-detalle"
                  v-model="form.pauta_medicamentos_detalle"
                  type="text"
                  class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
            </div>

            <!-- Añadir Pautas Extra Personalizadas solo para este Paciente -->
            <div class="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold text-amber-950">
                  + Añadir Pauta / Check-in Exclusivo para este Paciente
                </span>
              </div>

              <!-- Botones rápidos de pautas personalizadas frecuentes -->
              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  @click="agregarPlantillaRapidaPauta('hta')"
                  class="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900 cursor-pointer"
                >
                  + Toma HTA con sorbo de agua (-4h)
                </button>
                <button
                  type="button"
                  @click="agregarPlantillaRapidaPauta('glucometria')"
                  class="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900 cursor-pointer"
                >
                  + Glucometría en ayunas (-6h)
                </button>
                <button
                  type="button"
                  @click="agregarPlantillaRapidaPauta('inhalador')"
                  class="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900 cursor-pointer"
                >
                  + Llevar inhalador (-3h)
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div class="sm:col-span-5">
                  <label for="nc-extra-tit" class="sr-only">Título de pauta personalizada</label>
                  <input
                    id="nc-extra-tit"
                    v-model="nuevaPautaExtra.titulo"
                    type="text"
                    placeholder="Ej: Tomar Levotiroxina en ayunas con sorbo mínimo"
                    class="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label for="nc-extra-horas" class="sr-only">Horas antes</label>
                  <input
                    id="nc-extra-horas"
                    v-model="nuevaPautaExtra.horas_previas"
                    type="text"
                    inputmode="numeric"
                    placeholder="-4h"
                    class="w-full px-2 py-1.5 text-xs text-center font-bold bg-white border border-amber-300 rounded-lg"
                  />
                </div>
                <div class="sm:col-span-3 flex items-center gap-1">
                  <label for="nc-extra-tipo-alarma" class="sr-only">Tipo de Alarma</label>
                  <select
                    id="nc-extra-tipo-alarma"
                    v-model="nuevaPautaExtra.tipo_alarma"
                    class="px-1.5 py-1.5 text-[11px] font-bold bg-white border border-amber-300 rounded-lg text-amber-950"
                  >
                    <option value="hora_exacta">⏰ Hora Fija</option>
                    <option value="recordatorio_periodico">🔁 Cada 1h</option>
                  </select>
                  <input
                    v-if="nuevaPautaExtra.tipo_alarma === 'hora_exacta'"
                    v-model="nuevaPautaExtra.hora_alarma"
                    type="time"
                    aria-label="Hora exacta de la alarma"
                    class="px-1.5 py-1 text-[11px] font-mono font-bold bg-white border border-amber-300 rounded-lg text-amber-950 w-24"
                  />
                </div>
                <div class="sm:col-span-2">
                  <button
                    type="button"
                    @click="agregarPautaExtraPaciente"
                    class="w-full py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Previsualización del Cronograma Combinado -->
          <div class="lg:col-span-6 p-4 rounded-2xl bg-slate-900 text-white flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                  <CalendarClock class="w-4 h-4" />
                  <span>Cronograma Final del Paciente ({{ pautasCalculadasPreview.length }} pautas)</span>
                </div>
                <span class="text-[11px] text-slate-400">
                  Base + Personalizadas + Alarmas
                </span>
              </div>

              <ul class="space-y-2 text-xs max-h-60 overflow-y-auto pr-1">
                <li
                  v-for="(item, idx) in pautasCalculadasPreview"
                  :key="idx"
                  class="p-2.5 rounded-xl border flex items-center justify-between gap-2"
                  :class="
                    item.origen === 'personalizada'
                      ? 'bg-amber-950/60 border-amber-500/50'
                      : 'bg-slate-800/90 border-slate-700/80'
                  "
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0"
                      :class="
                        item.origen === 'personalizada'
                          ? 'bg-amber-400 text-slate-950'
                          : item.critica
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'bg-slate-700 text-slate-300'
                      "
                    >
                      -{{ item.horas }}h
                    </span>
                    <span class="font-semibold text-slate-100 truncate">{{ item.titulo }}</span>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <span
                      class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 border border-slate-700 text-amber-300"
                    >
                      {{ item.alarmaLabel }}
                    </span>
                    <span class="text-[11px] font-mono text-teal-300">{{ item.limiteStr }}</span>
                    <button
                      v-if="item.origen === 'personalizada'"
                      type="button"
                      title="Quitar pauta personalizada"
                      @click="
                        eliminarPautaExtraPaciente(
                          pautasExtraPaciente.findIndex((p) => p.titulo === item.titulo)
                        )
                      "
                      class="text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            <p class="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
              Las pautas con etiqueta dorada son <strong>exclusivas para este paciente</strong> y se suman a las pautas estándar de <em>{{ form.tipo_cirugia }}</em>.
            </p>
          </div>
        </div>
      </fieldset>

      <!-- Botonera inferior -->
      <div class="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200">
        <button
          type="button"
          @click="closeDialog"
          class="px-5 py-3 rounded-xl border-2 border-slate-200 hover:bg-slate-100 font-bold text-sm text-slate-700 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="submitting"
          class="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
        >
          <UserPlus class="w-4 h-4" />
          <span>
            {{
              submitting
                ? 'Guardando Expediente...'
                : 'Crear Paciente con Cirugía Base + Personalización'
            }}
          </span>
        </button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.nueva-cirugia-dialog:modal {
  overscroll-behavior: contain;
}

.nueva-cirugia-dialog::backdrop {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  overflow: hidden;
  overscroll-behavior: contain;
}

.brand-consistent-form {
  --brand-color: #0d9488;
  accent-color: var(--brand-color);
}

@supports not (accent-color: #0d9488) {
  .brand-consistent-form input[type='checkbox'].brand-checkbox {
    position: absolute !important;
    clip-path: inset(50%) !important;
    overflow: hidden !important;
    width: 1px !important;
    height: 1px !important;
    margin: -1px !important;
    padding: 0 !important;
    border: 0 !important;
    white-space: nowrap !important;
  }

  .brand-consistent-form label.checkbox-pill {
    position: relative;
    padding-left: 2rem;
  }

  .brand-consistent-form input[type='checkbox'].brand-checkbox + span::before {
    content: '';
    position: absolute;
    left: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    border: 2px solid #94a3b8;
    background: white;
    border-radius: 4px;
  }

  .brand-consistent-form input[type='checkbox'].brand-checkbox:checked + span::before {
    background-color: var(--brand-color, #0d9488);
    border-color: var(--brand-color, #0d9488);
  }

  .brand-consistent-form input[type='checkbox'].brand-checkbox:checked + span::after {
    content: '✓';
    position: absolute;
    left: 0.65rem;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    font-weight: bold;
    font-size: 0.75rem;
  }
}
</style>
