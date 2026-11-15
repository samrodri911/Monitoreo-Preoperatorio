<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useClinicaStore } from '../../stores/clinicaStore'
import type { CatalogoCirugia } from '../../types/database.types'
import {
  X,
  BookOpen,
  Plus,
  Edit3,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  Film,
  ClipboardList,
  UserPlus,
  Save,
  ArrowLeft,
  AlertCircle,
} from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select-for-new-patient', catalogoId: string): void
}>()

const clinicaStore = useClinicaStore()
const dialogRef = ref<HTMLDialogElement | null>(null)

// Modo de vista dentro del modal: 'lista' | 'formulario'
const viewMode = ref<'lista' | 'formulario'>('lista')
const isEditing = ref(false)
const saveSuccessMsg = ref('')
const formError = ref('')

const emptyForm = (): Omit<CatalogoCirugia, 'created_at'> => ({
  id: '',
  codigo_base: `PROT-${Math.floor(100 + Math.random() * 900)}`,
  tipo_cirugia: '',
  nombre_sencillo: '',
  especialidad: 'Cirugía General',
  tipo_anestesia: 'Anestesia General Balanceada',
  sensacion_anestesia:
    'Te quedarás plácidamente dormido en pocos segundos y despertarás cuando la cirugía haya concluido sin haber sentido dolor.',
  duracion_estimada: '60 a 90 minutos',
  tiempo_recuperacion: '24 a 48 horas de estancia u observación',
  tiempo_recuperacion_sala: '1 a 2 horas en Sala de Recuperación (URPA)',
  dias_incapacidad_estimados: '10 a 15 días con reincorporación progresiva',
  horas_ayuno_solidos: 8,
  descripcion_ayuno_solidos:
    'Suspender todo alimento sólido, lácteos, grasas y jugos con pulpa desde 8 horas antes del ingreso a quirófano.',
  horas_ayuno_liquidos: 2,
  descripcion_ayuno_liquidos:
    'Suspender completamente el consumo de agua, aromáticas o cualquier líquido 2 horas antes del procedimiento.',
  incluir_suspension_farmacos: true,
  horas_suspension_farmacos: 24,
  detalle_farmacos_base:
    'Suspender antiinflamatorios (aspirina, ibuprofeno, naproxeno) y anticoagulantes según indicación preanestésica.',
  incluir_ducha_antiseptica: true,
  horas_ducha_antiseptica: 12,
  descripcion_ducha_antiseptica:
    'Realizar baño corporal completo con jabón quirúrgico de clorhexidina, enfatizando la región operatoria.',
  pauta_especifica_titulo: '',
  pauta_especifica_descripcion: '',
  pauta_especifica_horas: 18,
  video_url: '/videos/cirugia-apendice.mp4',
  video_titulo: 'Cápsula Educativa del Procedimiento Quirúrgico',
  video_descripcion:
    'Explicación audiovisual paso a paso sobre la técnica quirúrgica, anestesia y cuidados de recuperación.',
  infografia_url: '/images/infografia-apendice.png',
  infografia_titulo: 'Infografía Didáctica: Anatomía y Cuidados Posoperatorios',
  infografia_descripcion:
    'Resumen ilustrado de las fases de la cirugía y recomendaciones clave para una cicatrización segura.',
  explicacion_sofi:
    'Explica el procedimiento en lenguaje cercano y empático, destacando que estará monitoreado segundo a segundo por el anestesiólogo sin sentir dolor y con técnicas seguras para una pronta recuperación.',
  cuidados_especificos_sofi:
    'Si el paciente presenta fiebre >38°C, dolor agudo que no cede, sangrado en la herida o dificultad respiratoria, indícale acudir de inmediato a Urgencias.',
})

const form = ref<Omit<CatalogoCirugia, 'created_at'>>(emptyForm())
const touched = ref<Record<string, boolean>>({})
const errors = ref<Record<string, string>>({})

function markInput(field: string) {
  touched.value[field] = true
  errors.value[field] = ''
  formError.value = ''
}

function validateField(field: string) {
  if (!touched.value[field]) return
  if (field === 'tipo_cirugia' && !form.value.tipo_cirugia.trim()) {
    errors.value.tipo_cirugia = 'Ingresa el nombre oficial de la cirugía.'
  }
  if (field === 'nombre_sencillo' && !form.value.nombre_sencillo.trim()) {
    errors.value.nombre_sencillo = 'Ingresa la descripción sencilla para el paciente.'
  }
  if (field === 'explicacion_sofi' && !form.value.explicacion_sofi.trim()) {
    errors.value.explicacion_sofi = 'Define cómo debe explicar Sofi esta cirugía al paciente.'
  }
}

function iniciarNuevaCirugiaCatalogo() {
  isEditing.value = false
  form.value = emptyForm()
  touched.value = {}
  errors.value = {}
  formError.value = ''
  saveSuccessMsg.value = ''
  viewMode.value = 'formulario'
}

function editarCirugiaCatalogo(item: CatalogoCirugia) {
  isEditing.value = true
  form.value = {
    id: item.id,
    codigo_base: item.codigo_base,
    tipo_cirugia: item.tipo_cirugia,
    nombre_sencillo: item.nombre_sencillo,
    especialidad: item.especialidad,
    tipo_anestesia: item.tipo_anestesia,
    sensacion_anestesia: item.sensacion_anestesia,
    duracion_estimada: item.duracion_estimada,
    tiempo_recuperacion: item.tiempo_recuperacion,
    tiempo_recuperacion_sala: item.tiempo_recuperacion_sala,
    dias_incapacidad_estimados: item.dias_incapacidad_estimados,
    horas_ayuno_solidos: item.horas_ayuno_solidos,
    descripcion_ayuno_solidos: item.descripcion_ayuno_solidos,
    horas_ayuno_liquidos: item.horas_ayuno_liquidos,
    descripcion_ayuno_liquidos: item.descripcion_ayuno_liquidos,
    incluir_suspension_farmacos: item.incluir_suspension_farmacos,
    horas_suspension_farmacos: item.horas_suspension_farmacos,
    detalle_farmacos_base: item.detalle_farmacos_base,
    incluir_ducha_antiseptica: item.incluir_ducha_antiseptica,
    horas_ducha_antiseptica: item.horas_ducha_antiseptica,
    descripcion_ducha_antiseptica: item.descripcion_ducha_antiseptica,
    pauta_especifica_titulo: item.pauta_especifica_titulo || '',
    pauta_especifica_descripcion: item.pauta_especifica_descripcion || '',
    pauta_especifica_horas: item.pauta_especifica_horas || 18,
    video_url: item.video_url || '/videos/cirugia-apendice.mp4',
    video_titulo: item.video_titulo || '',
    video_descripcion: item.video_descripcion || '',
    infografia_url: item.infografia_url || '/images/infografia-apendice.png',
    infografia_titulo: item.infografia_titulo || '',
    infografia_descripcion: item.infografia_descripcion || '',
    explicacion_sofi: item.explicacion_sofi,
    cuidados_especificos_sofi: item.cuidados_especificos_sofi,
  }
  touched.value = {}
  errors.value = {}
  formError.value = ''
  saveSuccessMsg.value = ''
  viewMode.value = 'formulario'
}

async function handleSaveCatalogo() {
  for (const f of ['tipo_cirugia', 'nombre_sencillo', 'explicacion_sofi']) {
    touched.value[f] = true
    validateField(f)
  }
  if (Object.values(errors.value).some(Boolean)) {
    formError.value = 'Completa los campos obligatorios marcados antes de guardar la plantilla quirúrgica.'
    return
  }

  const saved = await clinicaStore.guardarCatalogoCirugia({
    ...form.value,
    horas_ayuno_solidos: Number(form.value.horas_ayuno_solidos) || 8,
    horas_ayuno_liquidos: Number(form.value.horas_ayuno_liquidos) || 2,
    horas_suspension_farmacos: Number(form.value.horas_suspension_farmacos) || 24,
    horas_ducha_antiseptica: Number(form.value.horas_ducha_antiseptica) || 12,
    pauta_especifica_horas: Number(form.value.pauta_especifica_horas) || 18,
  })

  saveSuccessMsg.value = `Plantilla "${saved.tipo_cirugia}" guardada en el Catálogo General y lista para reutilizarse en cualquier paciente.`
  viewMode.value = 'lista'
}

watch(
  () => props.open,
  async (isOpen) => {
    const dialog = dialogRef.value
    if (!dialog) return
    if (isOpen && !dialog.open) {
      await clinicaStore.cargarCatalogoCirugias()
      viewMode.value = 'lista'
      saveSuccessMsg.value = ''
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }
)

onMounted(async () => {
  await clinicaStore.cargarCatalogoCirugias()
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
</script>

<template>
  <dialog
    ref="dialogRef"
    closedby="any"
    aria-labelledby="catalogo-cirugias-title"
    @close="emit('close')"
    @click="handleDialogClick"
    class="catalogo-dialog w-full max-w-5xl rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 p-0 m-auto overflow-hidden"
  >
    <!-- Cabecera -->
    <div class="bg-slate-900 text-white px-6 py-5 flex items-center justify-between gap-4 border-b border-slate-800">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
          <BookOpen class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-teal-400 block">
            Biblioteca Clínica Estandarizada y Reutilizable
          </span>
          <h2 id="catalogo-cirugias-title" class="text-xl font-extrabold text-white">
            {{
              viewMode === 'lista'
                ? 'Catálogo General de Cirugías (Protocolos Base)'
                : isEditing
                ? `Editar Protocolo Base: ${form.tipo_cirugia}`
                : 'Crear Nueva Cirugía General en el Catálogo'
            }}
          </h2>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="viewMode === 'lista'"
          type="button"
          @click="iniciarNuevaCirugiaCatalogo"
          class="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Nueva Cirugía Base</span>
        </button>

        <button
          v-else
          type="button"
          @click="viewMode = 'lista'"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </button>

        <button
          type="button"
          aria-label="Cerrar catálogo de cirugías"
          @click="closeDialog"
          class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- ============================================================
         MODO 1: LISTA DE CIRUGÍAS GUARDADAS EN EL CATÁLOGO
         ============================================================ -->
    <div v-if="viewMode === 'lista'" class="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
      <div
        v-if="saveSuccessMsg"
        role="status"
        class="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-950 flex items-center gap-3 text-sm font-bold"
      >
        <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
        <span>{{ saveSuccessMsg }}</span>
      </div>

      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Aquí se guarda toda la <strong>información general de cada cirugía</strong> (tiempos quirúrgicos, tipo de anestesia, horas de ayuno, multimedia educativa e instrucciones base para <strong>Sofi</strong>). Al registrar un paciente, seleccionas cualquiera de estas cirugías como base y solo añades las particularidades de ese paciente.
        </p>
        <span class="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-extrabold shrink-0">
          {{ clinicaStore.catalogoCirugias.length }} cirugías en catálogo
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <article
          v-for="item in clinicaStore.catalogoCirugias"
          :key="item.id"
          class="rounded-2xl border-2 border-slate-200 hover:border-teal-400 bg-white p-5 shadow-xs flex flex-col justify-between gap-4 transition-all"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                    {{ item.codigo_base }}
                  </span>
                  <span class="text-xs font-bold text-teal-700">
                    {{ item.especialidad }}
                  </span>
                </div>
                <h3 class="text-lg font-extrabold text-slate-900 mt-1">
                  {{ item.tipo_cirugia }}
                </h3>
                <p class="text-xs text-slate-500 font-medium">
                  {{ item.nombre_sencillo }}
                </p>
              </div>

              <button
                type="button"
                @click="editarCirugiaCatalogo(item)"
                class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Edit3 class="w-3.5 h-3.5" />
                <span>Editar Base</span>
              </button>
            </div>

            <!-- Resumen de Parámetros Base -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div class="p-2 rounded-lg bg-slate-50">
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Duración / Anestesia</span>
                <span class="font-semibold text-slate-800 block truncate">{{ item.duracion_estimada }}</span>
                <span class="text-[11px] text-slate-500 block truncate">{{ item.tipo_anestesia }}</span>
              </div>
              <div class="p-2 rounded-lg bg-slate-50">
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Protocolo de Ayuno</span>
                <span class="font-semibold text-slate-800 block">
                  Sólidos: -{{ item.horas_ayuno_solidos }}h • Líquidos: -{{ item.horas_ayuno_liquidos }}h
                </span>
                <span class="text-[11px] text-slate-500 block">
                  Fármacos: -{{ item.horas_suspension_farmacos }}h
                </span>
              </div>
            </div>

            <!-- Resumen Conocimiento IA Sofi -->
            <div class="p-3 rounded-xl bg-teal-50/60 border border-teal-100 text-xs text-slate-700 space-y-1">
              <div class="flex items-center gap-1.5 font-bold text-teal-800">
                <Sparkles class="w-3.5 h-3.5 text-teal-600" />
                <span>Base de conocimiento para Sofi:</span>
              </div>
              <p class="line-clamp-2 text-[11px] leading-relaxed">
                {{ item.explicacion_sofi }}
              </p>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span class="text-[11px] text-slate-500 flex items-center gap-1">
              <Film class="w-3.5 h-3.5 text-teal-600" />
              Multimedia + {{ item.pauta_especifica_titulo ? '5 pautas base' : '4 pautas base' }}
            </span>

            <button
              type="button"
              @click="emit('select-for-new-patient', item.id)"
              class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus class="w-3.5 h-3.5" />
              <span>Asignar a Nuevo Paciente →</span>
            </button>
          </div>
        </article>
      </div>
    </div>

    <!-- ============================================================
         MODO 2: FORMULARIO PARA CREAR / EDITAR CIRUGÍA EN EL CATÁLOGO
         ============================================================ -->
    <form
      v-else
      aria-labelledby="catalogo-cirugias-title"
      @submit.prevent="handleSaveCatalogo"
      novalidate
      class="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto brand-form"
    >
      <div
        v-if="formError"
        role="alert"
        class="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-900 flex items-center gap-3 text-sm font-bold"
      >
        <AlertCircle class="w-5 h-5 text-red-600 shrink-0" />
        <span>{{ formError }}</span>
      </div>

      <!-- 1. Identificación, Tiempos y Anestesia Estándar -->
      <fieldset class="space-y-4 border border-slate-200 rounded-2xl p-5 bg-slate-50/60">
        <legend class="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
          <Stethoscope class="w-3.5 h-3.5 text-teal-400" />
          <span>1. Información Clínica General y Tiempos Estándar</span>
        </legend>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div class="sm:col-span-5">
            <label for="cat-tipo" class="block text-xs font-bold text-slate-800 mb-1">
              Nombre Oficial de la Cirugía *
            </label>
            <input
              id="cat-tipo"
              v-model="form.tipo_cirugia"
              type="text"
              required
              placeholder="Ej: Artroscopia de Rodilla con Meniscectomía"
              :aria-invalid="errors.tipo_cirugia ? 'true' : 'false'"
              @input="markInput('tipo_cirugia')"
              @blur="validateField('tipo_cirugia')"
              class="w-full px-3.5 py-2.5 text-sm font-semibold bg-white border-2 rounded-xl text-slate-900 focus:outline-none"
              :class="errors.tipo_cirugia ? 'border-red-400' : 'border-slate-200 focus:border-teal-600'"
            />
            <p v-if="errors.tipo_cirugia" role="alert" class="text-xs font-bold text-red-600 mt-1">
              {{ errors.tipo_cirugia }}
            </p>
          </div>

          <div class="sm:col-span-5">
            <label for="cat-sencillo" class="block text-xs font-bold text-slate-800 mb-1">
              Nombre Sencillo / Empático para el Paciente *
            </label>
            <input
              id="cat-sencillo"
              v-model="form.nombre_sencillo"
              type="text"
              required
              placeholder="Ej: Reparación de menisco en rodilla por microcámara"
              :aria-invalid="errors.nombre_sencillo ? 'true' : 'false'"
              @input="markInput('nombre_sencillo')"
              @blur="validateField('nombre_sencillo')"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 rounded-xl text-slate-900 focus:outline-none"
              :class="errors.nombre_sencillo ? 'border-red-400' : 'border-slate-200 focus:border-teal-600'"
            />
            <p v-if="errors.nombre_sencillo" role="alert" class="text-xs font-bold text-red-600 mt-1">
              {{ errors.nombre_sencillo }}
            </p>
          </div>

          <div class="sm:col-span-2">
            <label for="cat-codigo" class="block text-xs font-bold text-slate-800 mb-1">
              Código Protocolo
            </label>
            <input
              id="cat-codigo"
              v-model="form.codigo_base"
              type="text"
              class="w-full px-3 py-2.5 text-sm font-mono font-bold bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div class="sm:col-span-4">
            <label for="cat-especialidad" class="block text-xs font-bold text-slate-800 mb-1">
              Especialidad Quirúrgica
            </label>
            <input
              id="cat-especialidad"
              v-model="form.especialidad"
              type="text"
              placeholder="Ej: Ortopedia y Traumatología"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div class="sm:col-span-4">
            <label for="cat-anestesia" class="block text-xs font-bold text-slate-800 mb-1">
              Tipo de Anestesia Base
            </label>
            <input
              id="cat-anestesia"
              v-model="form.tipo_anestesia"
              type="text"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div class="sm:col-span-4">
            <label for="cat-duracion" class="block text-xs font-bold text-slate-800 mb-1">
              Duración Estimada en Quirófano
            </label>
            <input
              id="cat-duracion"
              v-model="form.duracion_estimada"
              type="text"
              placeholder="Ej: 45 a 60 minutos"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div class="sm:col-span-4">
            <label for="cat-urpa" class="block text-xs font-bold text-slate-800 mb-1">
              Tiempo en Sala de Recuperación (URPA)
            </label>
            <input
              id="cat-urpa"
              v-model="form.tiempo_recuperacion_sala"
              type="text"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div class="sm:col-span-4">
            <label for="cat-estancia" class="block text-xs font-bold text-slate-800 mb-1">
              Tiempo de Estancia / Observación
            </label>
            <input
              id="cat-estancia"
              v-model="form.tiempo_recuperacion"
              type="text"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div class="sm:col-span-4">
            <label for="cat-incapacidad" class="block text-xs font-bold text-slate-800 mb-1">
              Incapacidad / Reposo Estimado
            </label>
            <input
              id="cat-incapacidad"
              v-model="form.dias_incapacidad_estimados"
              type="text"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div class="sm:col-span-12">
            <label for="cat-sensacion" class="block text-xs font-bold text-slate-800 mb-1">
              Explicación Tranquilizadora de la Anestesia (Para el Hero del Paciente)
            </label>
            <input
              id="cat-sensacion"
              v-model="form.sensacion_anestesia"
              type="text"
              class="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl text-slate-900"
            />
          </div>
        </div>
      </fieldset>

      <!-- 2. Protocolo Base de Pautas Preoperatorias -->
      <fieldset class="space-y-4 border border-slate-200 rounded-2xl p-5 bg-slate-50/60">
        <legend class="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
          <ClipboardList class="w-3.5 h-3.5" />
          <span>2. Pautas Preoperatorias Estándar de esta Cirugía</span>
        </legend>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div class="sm:col-span-3">
            <label for="cat-ayuno-sol" class="block text-xs font-bold text-slate-800 mb-1">
              Ayuno Sólidos (Horas antes)
            </label>
            <input
              id="cat-ayuno-sol"
              v-model="form.horas_ayuno_solidos"
              type="text"
              inputmode="numeric"
              class="w-full px-3.5 py-2 text-sm font-bold bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>
          <div class="sm:col-span-9">
            <label for="cat-desc-sol" class="block text-xs font-bold text-slate-800 mb-1">
              Instrucción de Ayuno de Sólidos
            </label>
            <input
              id="cat-desc-sol"
              v-model="form.descripcion_ayuno_solidos"
              type="text"
              class="w-full px-3.5 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>

          <div class="sm:col-span-3">
            <label for="cat-ayuno-liq" class="block text-xs font-bold text-slate-800 mb-1">
              Ayuno Líquidos (Horas antes)
            </label>
            <input
              id="cat-ayuno-liq"
              v-model="form.horas_ayuno_liquidos"
              type="text"
              inputmode="numeric"
              class="w-full px-3.5 py-2 text-sm font-bold bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>
          <div class="sm:col-span-9">
            <label for="cat-desc-liq" class="block text-xs font-bold text-slate-800 mb-1">
              Instrucción de Ayuno de Líquidos Claros
            </label>
            <input
              id="cat-desc-liq"
              v-model="form.descripcion_ayuno_liquidos"
              type="text"
              class="w-full px-3.5 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>

          <div class="sm:col-span-3">
            <label for="cat-horas-meds" class="block text-xs font-bold text-slate-800 mb-1">
              Suspensión Fármacos (Horas)
            </label>
            <input
              id="cat-horas-meds"
              v-model="form.horas_suspension_farmacos"
              type="text"
              inputmode="numeric"
              class="w-full px-3.5 py-2 text-sm font-bold bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>
          <div class="sm:col-span-9">
            <label for="cat-desc-meds" class="block text-xs font-bold text-slate-800 mb-1">
              Regla General de Suspensión de Medicamentos para esta Cirugía
            </label>
            <input
              id="cat-desc-meds"
              v-model="form.detalle_farmacos_base"
              type="text"
              class="w-full px-3.5 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>

          <div class="sm:col-span-5">
            <label for="cat-pauta-esp-tit" class="block text-xs font-bold text-slate-800 mb-1">
              Hito / Pauta Especial de esta Cirugía (Opcional)
            </label>
            <input
              id="cat-pauta-esp-tit"
              v-model="form.pauta_especifica_titulo"
              type="text"
              placeholder="Ej: Alistamiento de Muletas o Rodillera Articulada"
              class="w-full px-3.5 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>
          <div class="sm:col-span-7">
            <label for="cat-pauta-esp-desc" class="block text-xs font-bold text-slate-800 mb-1">
              Descripción del Hito Especial
            </label>
            <input
              id="cat-pauta-esp-desc"
              v-model="form.pauta_especifica_descripcion"
              type="text"
              placeholder="Ej: Llevar las muletas ajustadas a su altura el día de la cirugía."
              class="w-full px-3.5 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </fieldset>

      <!-- 3. Conocimiento Base para Sofi y Multimedia -->
      <fieldset class="space-y-4 border border-slate-200 rounded-2xl p-5 bg-teal-50/40">
        <legend class="px-3 py-1 rounded-lg bg-teal-700 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
          <Sparkles class="w-3.5 h-3.5" />
          <span>3. Conocimiento Base para el Asistente "Sofi" y Multimedia</span>
        </legend>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div class="sm:col-span-6">
            <label for="cat-sofi-exp" class="block text-xs font-bold text-slate-900 mb-1">
              ¿Cómo debe explicar Sofi esta cirugía al paciente? *
            </label>
            <textarea
              id="cat-sofi-exp"
              v-model="form.explicacion_sofi"
              rows="3"
              required
              :aria-invalid="errors.explicacion_sofi ? 'true' : 'false'"
              @input="markInput('explicacion_sofi')"
              @blur="validateField('explicacion_sofi')"
              class="w-full px-3.5 py-2 text-xs font-medium bg-white border-2 border-teal-200 focus:border-teal-600 rounded-xl"
            ></textarea>
            <p v-if="errors.explicacion_sofi" role="alert" class="text-xs font-bold text-red-600 mt-1">
              {{ errors.explicacion_sofi }}
            </p>
          </div>

          <div class="sm:col-span-6">
            <label for="cat-sofi-alarmas" class="block text-xs font-bold text-slate-900 mb-1">
              Cuidados Posoperatorios y Signos de Alarma para Sofi
            </label>
            <textarea
              id="cat-sofi-alarmas"
              v-model="form.cuidados_especificos_sofi"
              rows="3"
              class="w-full px-3.5 py-2 text-xs font-medium bg-white border-2 border-teal-200 focus:border-teal-600 rounded-xl"
            ></textarea>
          </div>

          <div class="sm:col-span-6">
            <label for="cat-video-url" class="block text-xs font-bold text-slate-800 mb-1">
              Ruta del Video Local (en carpeta public/videos/)
            </label>
            <input
              id="cat-video-url"
              v-model="form.video_url"
              type="text"
              placeholder="/videos/cirugia-apendice.mp4"
              class="w-full px-3.5 py-2 text-xs font-mono bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>

          <div class="sm:col-span-6">
            <label for="cat-info-url" class="block text-xs font-bold text-slate-800 mb-1">
              Ruta de la Infografía Local (en carpeta public/images/)
            </label>
            <input
              id="cat-info-url"
              v-model="form.infografia_url"
              type="text"
              placeholder="/images/infografia-apendice.png"
              class="w-full px-3.5 py-2 text-xs font-mono bg-white border-2 border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </fieldset>

      <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
        <button
          type="button"
          @click="viewMode = 'lista'"
          class="px-5 py-2.5 rounded-xl border-2 border-slate-200 hover:bg-slate-100 font-bold text-sm text-slate-700 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
        >
          <Save class="w-4 h-4" />
          <span>Guardar Cirugía en el Catálogo Reutilizable</span>
        </button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.catalogo-dialog:modal {
  overscroll-behavior: contain;
}

.catalogo-dialog::backdrop {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  overflow: hidden;
  overscroll-behavior: contain;
}
</style>
