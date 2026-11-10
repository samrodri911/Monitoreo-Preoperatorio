<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Film, 
  CheckCircle2, 
  FileVideo,
  Activity
} from 'lucide-vue-next';
import { usePacienteStore } from '../../stores/pacienteStore';

const props = withDefaults(defineProps<{
  title?: string;
  description?: string;
  videoUrl?: string | null;
  posterUrl?: string;
  isCadera?: boolean;
}>(), {
  title: '',
  description: '',
  videoUrl: null,
  posterUrl: undefined,
  isCadera: undefined
});

const pacienteStore = usePacienteStore();
const videoHasError = ref(false);

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
    ? 'Cápsula Audiovisual Breve: ¿Cómo funciona el Reemplazo Articular de Cadera?'
    : 'Cápsula Audiovisual Breve: ¿Cómo funciona la Cirugía Laparoscópica de Apéndice?';
});

// Descripción dinámica
const effectiveDescription = computed(() => {
  if (props.description && props.description.trim().length > 0) return props.description;
  return isCaderaMode.value
    ? 'Conoce en 3 minutos el proceso de sustitución del cartílago desgastado por una prótesis biocompatible diseñada para devolver la movilidad natural sin dolor.'
    : 'Conoce en 3 minutos la técnica de mínima invasión mediante 3 pequeñas incisiones y microcámara para extraer el apéndice sin dolor excesivo.';
});

// Ruta por defecto del video local estático en Vite
const defaultLocalVideo = computed(() => {
  return isCaderaMode.value 
    ? '/videos/cirugia-cadera.mp4' 
    : '/videos/cirugia-apendice.mp4';
});

const defaultPoster = '/videos/poster-video.svg';

const videoSource = computed(() => {
  if (props.videoUrl && !props.videoUrl.includes('youtube.com') && !props.videoUrl.includes('youtu.be')) {
    return props.videoUrl;
  }
  return defaultLocalVideo.value;
});

const posterSource = computed(() => {
  return props.posterUrl || defaultPoster;
});

function onVideoError() {
  videoHasError.value = true;
}

function onVideoLoaded() {
  videoHasError.value = false;
}
</script>

<template>
  <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
    <div>
      <!-- Cabecera de la Tarjeta -->
      <div class="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
            <Film class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-teal-700 block">Cápsula Audiovisual Breve</span>
            <h3 class="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{{ effectiveTitle }}</h3>
          </div>
        </div>

        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex-shrink-0">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
          Video Oficial Clínico
        </span>
      </div>

      <!-- Reproductor de Video Nativo HTML5 -->
      <div class="p-5 sm:p-6 pb-2">
        <div class="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-md border border-slate-800">
          <video
            class="w-full h-full object-contain rounded-2xl"
            controls
            preload="metadata"
            playsinline
            :key="videoSource"
            :poster="posterSource"
            @error="onVideoError"
            @loadeddata="onVideoLoaded"
          >
            <source :src="videoSource" type="video/mp4" />
            Tu navegador no soporta la reproducción de video HTML5.
          </video>
        </div>

        <!-- Notificación de Ayuda si aún no se ha copiado el archivo de video -->
        <div v-if="videoHasError" class="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <FileVideo class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div class="leading-relaxed">
            <strong class="font-bold">Aviso para el usuario / desarrollador:</strong>
            Para reproducir tu video propio, guarda el archivo en:
            <code class="px-1.5 py-0.5 bg-amber-100 font-mono text-[11px] rounded font-bold">public{{ defaultLocalVideo }}</code>.
            Al colocarlo, se reproducirá directamente aquí sin publicidad.
          </div>
        </div>

        <!-- 3 Puntos Destacados / Badges Clave Adaptados por Procedimiento -->
        <div v-if="isCaderaMode" class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
          <div class="p-3 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center gap-2.5">
            <Clock class="w-4 h-4 text-teal-700 flex-shrink-0" />
            <span class="text-xs font-bold text-teal-900">Duración promedio: 60 a 90 minutos</span>
          </div>

          <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2.5">
            <ShieldCheck class="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span class="text-xs font-bold text-emerald-900">Anestesia raquídea/general controlada sin dolor</span>
          </div>

          <div class="p-3 rounded-xl bg-cyan-50 border border-cyan-200/80 flex items-center gap-2.5">
            <Activity class="w-4 h-4 text-cyan-700 flex-shrink-0" />
            <span class="text-xs font-bold text-cyan-900">Movilización asistida desde las primeras 24 horas</span>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
          <div class="p-3 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center gap-2.5">
            <Clock class="w-4 h-4 text-teal-700 flex-shrink-0" />
            <span class="text-xs font-bold text-teal-900">Duración real: 45 min</span>
          </div>

          <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2.5">
            <ShieldCheck class="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span class="text-xs font-bold text-emerald-900">Anestesia sin dolor</span>
          </div>

          <div class="p-3 rounded-xl bg-cyan-50 border border-cyan-200/80 flex items-center gap-2.5">
            <Sparkles class="w-4 h-4 text-cyan-700 flex-shrink-0" />
            <span class="text-xs font-bold text-cyan-900">Cicatriz imperceptible</span>
          </div>
        </div>
      </div>

      <!-- Explicación Expandida: 3 Momentos Clave que Muestra la Animación -->
      <div class="p-5 sm:p-6 pt-3 space-y-4">
        <div>
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
            ¿Qué observarás en esta cápsula explicativa?
          </h4>
          <p class="text-sm text-slate-600 leading-relaxed mb-3">
            {{ effectiveDescription }}
          </p>
        </div>

        <!-- 3 Momentos Clave para Reemplazo de Cadera -->
        <div v-if="isCaderaMode" class="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
              1
            </div>
            <div class="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong class="font-bold text-slate-900">Preparación y retiro de cartílago desgastado:</strong>
              Limpieza del acetábulo y corte milimétrico de la cabeza femoral dañada por la artrosis para recibir los implantes sin fricción dolorosa.
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
              2
            </div>
            <div class="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong class="font-bold text-slate-900">Fijación de componentes protésicos (vástago y copa):</strong>
              Colocación de la copa acetabular biocompatible en la pelvis y del vástago de titanio en el canal del fémur para máxima estabilidad ósea.
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
              3
            </div>
            <div class="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong class="font-bold text-slate-900">Colocación de esfera articular y comprobación de movilidad:</strong>
              Inserción de la cabeza esférica pulida, reducción articular y verificación de rangos completos de movimiento sin roce ni dolor.
            </div>
          </div>
        </div>

        <!-- 3 Momentos Clave para Apendicectomía Laparoscópica -->
        <div v-else class="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
              1
            </div>
            <div class="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong class="font-bold text-slate-900">Marcación e incisiones milimétricas:</strong>
              El cirujano realiza 3 accesos diminutos (uno en el ombligo y dos en el bajo abdomen) preservando la integridad muscular para evitar dolor postoperatorio.
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
              2
            </div>
            <div class="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong class="font-bold text-slate-900">Visualización con microcámara interna:</strong>
              Insuflación suave con gas CO2 y exploración guiada por laparoscopio HD que amplifica los órganos para aislar con máxima seguridad el apéndice inflamado.
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
              3
            </div>
            <div class="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong class="font-bold text-slate-900">Extracción y sutura estética:</strong>
              El apéndice se retira en una bolsa estéril protectora y las pequeñas heridas se cierran con puntos intradérmicos absorbibles que no requieren retiro.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Consejo Clínico Final -->
    <div class="p-5 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5 text-xs font-semibold text-teal-900">
      <CheckCircle2 class="w-4 h-4 text-teal-600 flex-shrink-0" />
      <span>Consejo: Puedes pausar o adelantar el video con total libertad para compartirlo con tu familiar o acompañante.</span>
    </div>
  </div>
</template>
