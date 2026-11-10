<script setup lang="ts">
import { computed } from 'vue';
import { usePacienteStore } from '../../stores/pacienteStore';
import VideoPlayer from './VideoPlayer.vue';
import InfographicViewer from './InfographicViewer.vue';
import type { MaterialEducativo } from '../../types/database.types';

const props = defineProps<{
  videoRecurso?: MaterialEducativo | null;
  infografiaRecurso?: MaterialEducativo | null;
  tipoCirugia?: string;
}>();

const pacienteStore = usePacienteStore();

// Detección condicional del tipo de procedimiento activo
const isCadera = computed(() => {
  const tipo = props.tipoCirugia || pacienteStore.cirugia?.tipo_cirugia || '';
  return tipo.toLowerCase().includes('cadera') || tipo.toLowerCase().includes('artroplastia');
});

// Metadatos y recursos dinámicos para Video
const videoTitle = computed(() => {
  if (props.videoRecurso?.titulo) return props.videoRecurso.titulo;
  return isCadera.value
    ? 'Cápsula Audiovisual Breve: ¿Cómo funciona el Reemplazo Articular de Cadera?'
    : 'Cápsula Audiovisual Breve: ¿Cómo funciona la Cirugía Laparoscópica de Apéndice?';
});

const videoDescription = computed(() => {
  if (props.videoRecurso?.descripcion_corta) return props.videoRecurso.descripcion_corta;
  return isCadera.value
    ? 'Conoce en 3 minutos el proceso de sustitución del cartílago desgastado por una prótesis biocompatible diseñada para devolver la movilidad natural sin dolor.'
    : 'Conoce en 3 minutos la técnica de mínima invasión mediante 3 pequeñas incisiones y microcámara para extraer el apéndice sin dolor excesivo.';
});

const videoUrl = computed(() => {
  if (props.videoRecurso?.url_recurso) return props.videoRecurso.url_recurso;
  return isCadera.value ? '/videos/cirugia-cadera.mp4' : '/videos/cirugia-apendice.mp4';
});

// Metadatos y recursos dinámicos para Infografía
const infografiaTitle = computed(() => {
  if (props.infografiaRecurso?.titulo) return props.infografiaRecurso.titulo;
  return isCadera.value
    ? 'Anatomía Articular y Componentes de la Nueva Prótesis'
    : 'Anatomía del Apéndice y los 3 Puertos de Mínima Invasión';
});

const infografiaDescription = computed(() => {
  if (props.infografiaRecurso?.descripcion_corta) return props.infografiaRecurso.descripcion_corta;
  return isCadera.value
    ? 'Guía visual detallada sobre el desgaste del cartílago por artrosis y los componentes biocompatibles de la prótesis total de cadera.'
    : 'Guía visual ilustrada que muestra la ubicación del apéndice en la fosa ilíaca derecha y los 3 diminutos accesos milimétricos.';
});

const infografiaUrl = computed(() => {
  if (props.infografiaRecurso?.url_recurso) return props.infografiaRecurso.url_recurso;
  return isCadera.value ? '/images/infografia-cadera.png' : '/images/infografia-apendice.png';
});
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Tarjeta Izquierda: Cápsula Audiovisual Breve -->
    <VideoPlayer
      :title="videoTitle"
      :description="videoDescription"
      :video-url="videoUrl"
      :is-cadera="isCadera"
    />

    <!-- Tarjeta Derecha: Infografía Didáctica y Detalle de la Prótesis / Anatomía -->
    <InfographicViewer
      :title="infografiaTitle"
      :description="infografiaDescription"
      :image-url="infografiaUrl"
      :markdown-content="infografiaRecurso?.contenido_markdown"
      :is-cadera="isCadera"
    />
  </div>
</template>
