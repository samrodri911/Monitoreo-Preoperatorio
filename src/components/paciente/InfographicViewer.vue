<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut,
  X, 
  CheckCircle2, 
  Layers, 
  Compass,
  Sparkles,
  Info,
  Maximize2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-vue-next';
import { usePacienteStore } from '../../stores/pacienteStore';

const props = withDefaults(defineProps<{
  title?: string;
  description?: string;
  imageUrl?: string | null;
  markdownContent?: string | null;
  isCadera?: boolean;
}>(), {
  title: '',
  description: '',
  imageUrl: null,
  markdownContent: null,
  isCadera: undefined
});

const pacienteStore = usePacienteStore();
const isModalOpen = ref(false);
const imageLoadFailed = ref(false);
const zoomLevel = ref<number>(1); // 1 = 100%, 1.25, 1.5, 2

// Detección automática o por prop del tipo de procedimiento
const isCaderaMode = computed(() => {
  if (typeof props.isCadera === 'boolean') return props.isCadera;
  const tipoCirugia = pacienteStore.cirugia?.tipo_cirugia || '';
  const titleText = props.title || '';
  return tipoCirugia.toLowerCase().includes('cadera') || 
         tipoCirugia.toLowerCase().includes('artroplastia') ||
         titleText.toLowerCase().includes('cadera');
});

// Título dinámico
const effectiveTitle = computed(() => {
  if (props.title && props.title.trim().length > 0) return props.title;
  return isCaderaMode.value
    ? 'Anatomía Articular y Componentes de la Nueva Prótesis'
    : 'Anatomía del Apéndice y los 3 Puertos de Mínima Invasión';
});

// Descripción dinámica
const effectiveDescription = computed(() => {
  if (props.description && props.description.trim().length > 0) return props.description;
  return isCaderaMode.value
    ? 'Guía visual detallada sobre el desgaste del cartílago por artrosis y los componentes biocompatibles de la prótesis total de cadera.'
    : 'Guía visual ilustrada que muestra la ubicación del apéndice en la fosa ilíaca derecha y los 3 diminutos accesos milimétricos.';
});

// Rutas estáticas locales en la carpeta public/
const defaultLocalImage = computed(() => {
  return isCaderaMode.value 
    ? '/images/infografia-cadera.png' 
    : '/images/infografia-apendice.png';
});

const fallbackImage = computed(() => {
  return isCaderaMode.value 
    ? '/images/infografia-cadera.jpg' 
    : '/images/puertos-laparoscopia.svg';
});

const effectiveImageUrl = computed(() => {
  if (imageLoadFailed.value) {
    return fallbackImage.value;
  }
  if (props.imageUrl && !props.imageUrl.includes('unsplash.com')) {
    return props.imageUrl;
  }
  return defaultLocalImage.value;
});

const imageAltText = computed(() => {
  return isCaderaMode.value
    ? 'Infografía Anatómica de Artroplastia de Cadera y Componentes Protésicos'
    : 'Infografía Anatómica de Apendicectomía Laparoscópica y 3 Puertos';
});

function onImageError() {
  imageLoadFailed.value = true;
}

function onImageLoaded() {
  imageLoadFailed.value = false;
}

function openModal() {
  isModalOpen.value = true;
  zoomLevel.value = 1;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  isModalOpen.value = false;
  zoomLevel.value = 1;
  document.body.style.overflow = '';
}

function toggleZoom() {
  if (zoomLevel.value >= 1.5) {
    zoomLevel.value = 1;
  } else {
    zoomLevel.value += 0.25;
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isModalOpen.value) {
    closeModal();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
  document.body.style.overflow = '';
});
</script>

<template>
  <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
    <div>
      <!-- Cabecera de la Tarjeta -->
      <div class="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
            <ImageIcon class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-teal-700 block">Infografía Didáctica y Anatomía</span>
            <h3 class="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{{ effectiveTitle }}</h3>
          </div>
        </div>

        <!-- Botón de Lupa / Zoom en la cabecera -->
        <button
          type="button"
          @click="openModal"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors focus-ring"
          title="Ampliar infografía a pantalla completa (Esc)"
        >
          <ZoomIn class="w-4 h-4" />
          <span class="hidden sm:inline">Ampliar</span>
        </button>
      </div>

      <!-- Contenedor Responsivo y Estilizado de la Imagen -->
      <div class="p-5 sm:p-6 pb-2">
        <div 
          class="relative bg-slate-50 rounded-2xl aspect-[16/9] overflow-hidden group cursor-pointer border border-slate-200 shadow-xs flex items-center justify-center transition-all"
          @click="openModal"
          role="button"
          tabindex="0"
          @keydown.enter="openModal"
          @keydown.space.prevent="openModal"
          title="Clic para abrir imagen en pantalla completa"
        >
          <img
            :key="effectiveImageUrl"
            :src="effectiveImageUrl"
            :alt="imageAltText"
            class="w-full h-full object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300 rounded-xl"
            loading="lazy"
            @error="onImageError"
            @load="onImageLoaded"
          />

          <!-- Overlay al pasar el mouse -->
          <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs sm:text-sm gap-2 backdrop-blur-[2px]">
            <Maximize2 class="w-5 h-5" />
            <span>Clic para ampliar a pantalla completa</span>
          </div>
        </div>

        <!-- Notificación informativa si se muestra el fallback -->
        <div v-if="imageLoadFailed" class="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <Info class="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div class="leading-relaxed">
            Mostrando imagen alternativa. Para desplegar tu infografía ilustrada principal, guárdala en:
            <code class="px-1.5 py-0.5 bg-white font-mono text-[11px] rounded border border-slate-200 text-slate-800 font-bold">public{{ defaultLocalImage }}</code>.
          </div>
        </div>
      </div>

      <!-- Contenido Estructurado Expandido (Sin etiquetas Markdown crudas) -->
      <div class="p-5 sm:p-6 pt-3 space-y-5">
        
        <!-- Descripción General -->
        <p class="text-sm text-slate-600 leading-relaxed">
          {{ effectiveDescription }}
        </p>

        <!-- SECCIÓN CONDICIONAL: DETALLE CLÍNICO PARA ARTROPLASTIA DE CADERA -->
        <template v-if="isCaderaMode">
          
          <!-- Bloque 1: Función y causas (Artrosis Severa) -->
          <div class="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
            <div class="flex items-center gap-2">
              <Compass class="w-4 h-4 text-teal-700 flex-shrink-0" />
              <h4 class="text-xs sm:text-sm font-bold text-teal-950 uppercase tracking-wide">
                Función y Desgaste: Tu Cadera y la Artrosis Severa
              </h4>
            </div>
            <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">
              La articulación de la cadera conecta la cabeza del fémur con la cavidad de la pelvis (acetábulo). En condiciones normales, una capa de cartílago amortigua el movimiento permitiendo giros libres de dolor.
            </p>
            <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong>El efecto de la artrosis:</strong> Con el desgaste severo del cartílago, los huesos rozan directamente entre sí, originando dolor incapacitante y rigidez. <strong>La nueva prótesis sustituye ese contacto desgastado por superficies biocompatibles lisas</strong>, eliminando de raíz el roce doloroso y devolviendo la libertad de movimiento.
            </p>
          </div>

          <!-- Bloque 2: Los 3 Componentes Clave de la Prótesis -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <Layers class="w-4 h-4 text-slate-700" />
              <h4 class="text-xs font-black uppercase tracking-wider text-slate-700">
                Los 3 Componentes Clave de la Prótesis
              </h4>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Componente 1: Copa Acetabular -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-slate-900">1. Copa Acetabular</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-teal-100 text-teal-800">Pelvis</span>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Encajada firmemente en la pelvis con un inserto de deslizamiento ultrasuave (cerámica o polietileno de alta densidad).
                </p>
              </div>

              <!-- Componente 2: Cabeza Protésica -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-slate-900">2. Cabeza Protésica</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800">Esfera</span>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Esfera biocompatible pulida a espejo que recrea el movimiento natural de giro de la cadera con mínima fricción.
                </p>
              </div>

              <!-- Componente 3: Vástago Femoral -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-slate-900">3. Vástago Femoral</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800">Titanio</span>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Soporte anatómico en aleación de titanio fijado con precisión en el canal del fémur para máxima estabilidad ósea.
                </p>
              </div>
            </div>
          </div>

          <!-- Bloque 3: Pautas Iniciales de Protección en Casa -->
          <div class="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2.5">
            <div class="flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-amber-700" />
              <h4 class="text-xs sm:text-sm font-bold text-amber-950 uppercase tracking-wide">
                Pautas Iniciales de Protección en Casa (Prevención de Luxación)
              </h4>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div class="flex items-start gap-2 text-xs text-amber-900">
                <AlertTriangle class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span><strong>No cruzar piernas:</strong> Evitar cruzar las piernas en tijera y mantener flexiones de cadera menores a 90 grados en las primeras semanas.</span>
              </div>
              <div class="flex items-start gap-2 text-xs text-amber-900">
                <CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Ayudas técnicas:</strong> Utilizar temporalmente calzador de mango largo y asiento elevado en el inodoro para no forzar la flexión.</span>
              </div>
            </div>
          </div>

        </template>

        <!-- SECCIÓN CONDICIONAL: DETALLE CLÍNICO PARA APENDICECTOMÍA LAPAROSCÓPICA -->
        <template v-else>
          
          <!-- Bloque 1: Ubicación y Función del Apéndice -->
          <div class="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
            <div class="flex items-center gap-2">
              <Compass class="w-4 h-4 text-teal-700 flex-shrink-0" />
              <h4 class="text-xs sm:text-sm font-bold text-teal-950 uppercase tracking-wide">
                Función y Ubicación: Tu Cuerpo Sin Apéndice
              </h4>
            </div>
            <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">
              El apéndice cecal es una pequeña prolongación cilíndrica de 6 a 9 cm ubicada al inicio del colon, en la <strong>fosa ilíaca derecha</strong> (parte inferior derecha de tu abdomen).
            </p>
            <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong>No es un órgano vital:</strong> Su extracción no altera en absoluto la absorción de nutrientes, la digestión de alimentos ni el tránsito intestinal regular. Tras una breve dieta de adaptación, tu vida continúa con total normalidad.
            </p>
          </div>

          <!-- Bloque 2: Los 3 Puertos Laparoscópicos de Mínima Invasión -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <Layers class="w-4 h-4 text-slate-700" />
              <h4 class="text-xs font-black uppercase tracking-wider text-slate-700">
                Detalle de los 3 Puertos de Mínima Invasión
              </h4>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Puerto 1 -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-slate-900">1. Umbilical</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-teal-100 text-teal-800">10 mm</span>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Microcámara óptica HD. Se sitúa en el pliegue natural del ombligo, quedando invisible tras la cicatrización.
                </p>
              </div>

              <!-- Puerto 2 -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-slate-900">2. Suprapúbico</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800">5 mm</span>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Instrumental fino de corte y sellado. Se sitúa bajo la línea de la ropa interior (zona del pubis).
                </p>
              </div>

              <!-- Puerto 3 -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-slate-900">3. Fosa Izquierda</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800">5 mm</span>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Pinza de retracción suave para exponer y retirar el apéndice sin tracción muscular dolorosa.
                </p>
              </div>
            </div>
          </div>

          <!-- Bloque 3: Ventajas Claras Frente a Cirugía Abierta -->
          <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
            <div class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-emerald-700" />
              <h4 class="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide">
                Ventajas Clave Frente a Cirugía Abierta Tradicional
              </h4>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div class="flex items-start gap-2 text-xs text-emerald-900">
                <CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Menor dolor:</strong> Sin heridas abiertas extensas; analgésicos comunes bastan.</span>
              </div>
              <div class="flex items-start gap-2 text-xs text-emerald-900">
                <CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Músculo intacto:</strong> No se cortan músculos abdominales; nulo riesgo de hernia incisional.</span>
              </div>
              <div class="flex items-start gap-2 text-xs text-emerald-900">
                <CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Alta en 24-48h:</strong> Deambulación el mismo día y retorno rápido al hogar.</span>
              </div>
            </div>
          </div>

        </template>

      </div>
    </div>

    <!-- MODAL LIGHTBOX / PANTALLA COMPLETA -->
    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        @click.self="closeModal"
        role="dialog"
        aria-modal="true"
        aria-label="Vista ampliada de la infografía"
      >
        <div class="bg-white rounded-3xl max-w-5xl w-full max-h-[94vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
          
          <!-- Cabecera del Modal -->
          <div class="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
            <div class="flex items-center gap-2.5 min-w-0">
              <Compass class="w-5 h-5 text-teal-600 flex-shrink-0" />
              <div class="truncate">
                <h4 class="font-bold text-slate-900 text-base sm:text-lg truncate">{{ effectiveTitle }}</h4>
                <p class="text-xs text-slate-500 hidden sm:block">Usa la rueda del ratón o el botón de zoom para ajustar la vista</p>
              </div>
            </div>

            <!-- Controles del Modal: Zoom y Cerrar -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                @click="toggleZoom"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors focus-ring"
                :title="zoomLevel > 1 ? 'Restablecer zoom' : 'Acercar imagen'"
              >
                <ZoomOut v-if="zoomLevel > 1" class="w-4 h-4" />
                <ZoomIn v-else class="w-4 h-4" />
                <span>{{ Math.round(zoomLevel * 100) }}%</span>
              </button>

              <button
                type="button"
                @click="closeModal"
                class="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-colors focus-ring"
                title="Cerrar vista ampliada (Esc)"
              >
                <X class="w-5 h-5" />
                <span class="sr-only">Cerrar (Esc)</span>
              </button>
            </div>
          </div>

          <!-- Área de Visualización de la Imagen en Alta Resolución -->
          <div class="p-4 sm:p-6 overflow-auto flex-1 flex items-center justify-center bg-slate-950/95 min-h-[350px]">
            <img 
              :src="effectiveImageUrl" 
              :alt="imageAltText" 
              class="max-h-[72vh] max-w-full object-contain rounded-xl transition-transform duration-200 select-none shadow-2xl"
              :style="{ transform: `scale(${zoomLevel})` }"
            />
          </div>

          <!-- Pie del Modal -->
          <div class="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 font-medium">
            <span class="flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span v-if="isCaderaMode">Infografía ilustrada y componentes protésicos para Artroplastia Total de Cadera</span>
              <span v-else>Infografía ilustrada y mapa de accesos mínimos para Apendicectomía Laparoscópica</span>
            </span>
            <span class="text-slate-400 font-mono text-[11px]">
              Presiona [Esc] o haz clic afuera para salir
            </span>
          </div>

        </div>
      </div>
    </Teleport>

  </div>
</template>
