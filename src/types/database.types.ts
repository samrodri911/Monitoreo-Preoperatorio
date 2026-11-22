export type CirugiaEstado = 'programada' | 'en_preparacion' | 'cancelada' | 'realizada';
export type CheckinEstado = 'pendiente' | 'completado' | 'omitido';
export type AlertaNivel = 'verde' | 'amarillo' | 'rojo';
export type CategoriaMaterial = 'que_esperar' | 'preparacion_fisica' | 'tecnica_quirurgica' | 'cuidados_generales' | 'guia_maleta' | 'recorrido' | 'faq';
export type TipoRecurso = 'video' | 'imagen' | 'infografia' | 'articulo' | 'pdf';
export type UserRole = 'paciente' | 'medico';
export type NivelAnsiedad = 'baja' | 'moderada' | 'alta';
export type TipoAlarmaPauta = 'hora_exacta' | 'recordatorio_periodico';

export interface Paciente {
  id: string;
  nombre_completo: string;
  documento: string;
  telefono: string;
  edad: number;
  contacto_emergencia: string;
  email?: string | null;
  pin_acceso?: string | null;
  // Perfil clínico específico del paciente
  grupo_sanguineo?: string | null;
  peso_kg?: number | null;
  talla_cm?: number | null;
  alergias?: string | null;
  comorbilidades?: string[] | null;
  medicacion_habitual?: string | null;
  nivel_ansiedad?: NivelAnsiedad | null;
  created_at: string;
}

export interface CatalogoCirugia {
  id: string;
  codigo_base: string;
  tipo_cirugia: string;
  nombre_sencillo: string;
  especialidad: string;
  tipo_anestesia: string;
  sensacion_anestesia: string;
  duracion_estimada: string;
  tiempo_recuperacion: string;
  tiempo_recuperacion_sala: string;
  dias_incapacidad_estimados: string;
  // Protocolo de pautas preoperatorias estándar de esta cirugía
  horas_ayuno_solidos: number;
  descripcion_ayuno_solidos: string;
  horas_ayuno_liquidos: number;
  descripcion_ayuno_liquidos: string;
  incluir_suspension_farmacos: boolean;
  horas_suspension_farmacos: number;
  detalle_farmacos_base: string;
  incluir_ducha_antiseptica: boolean;
  horas_ducha_antiseptica: number;
  descripcion_ducha_antiseptica: string;
  pauta_especifica_titulo?: string | null;
  pauta_especifica_descripcion?: string | null;
  pauta_especifica_horas?: number | null;
  // Recursos multimedia y educativos base ("Conoce tu Cirugía")
  video_url?: string | null;
  video_titulo?: string | null;
  video_descripcion?: string | null;
  infografia_url?: string | null;
  infografia_titulo?: string | null;
  infografia_descripcion?: string | null;
  // Conocimiento clínico base inyectado en el Asistente "Sofi"
  explicacion_sofi: string;
  cuidados_especificos_sofi: string;
  created_at: string;
}

export interface Cirugia {
  id: string;
  paciente_id: string;
  catalogo_cirugia_id?: string | null;
  tipo_cirugia: string;
  codigo_cirugia?: string | null;
  medico_tratante?: string | null;
  notas_medicas?: string | null;
  nombre_sencillo?: string | null;
  especialidad?: string | null;
  duracion_estimada?: string | null;
  tipo_anestesia?: string | null;
  sensacion_anestesia?: string | null;
  tiempo_recuperacion?: string | null;
  tiempo_recuperacion_sala?: string | null;
  dias_incapacidad_estimados?: string | null;
  fecha_programada: string;
  estado: CirugiaEstado;
  created_at: string;
}

export interface Pauta {
  id: string;
  cirugia_id: string;
  titulo: string;
  descripcion: string;
  horas_previas: number;
  es_critica: boolean;
  fecha_limite: string;
  // Configuración de Alarma / Recordatorio Temporal
  tipo_alarma?: TipoAlarmaPauta;
  hora_alarma?: string | null; // Formato "HH:mm" para medicamentos u horas exactas (ej. "06:00")
  intervalo_minutos?: number | null; // Ej. 60 (cada hora) para ayuno, ducha o preparación continua
  alarma_activa?: boolean;
  es_vigilancia_continua?: boolean; // True si es ayuno u otra condición continua que no se finaliza con un solo check
  created_at: string;
}

export interface Checkin {
  id: string;
  pauta_id: string;
  estado: CheckinEstado;
  fecha_respuesta: string | null;
  observaciones: string | null;
  updated_at: string;
}

export type OrigenReporteAnsiedad = 'llamada_ia' | 'chat_ia' | 'encuesta_rapida' | 'encuesta_pulsera';

export interface ReporteAnsiedad {
  id: string;
  paciente_id: string;
  paciente_nombre: string;
  cirugia_id?: string | null;
  tipo_cirugia?: string | null;
  origen: OrigenReporteAnsiedad;
  nivel: NivelAnsiedad;
  riesgo_cancelacion: boolean;
  es_urgente: boolean;
  puntaje: number; // 1 (muy tranquilo) a 10 (pánico / deseo de cancelar)
  estado_animo: string;
  preocupacion_principal?: string | null;
  frase_detectada?: string | null;
  palabras_clave?: string[];
  comentario_paciente?: string | null;
  revisado_medico: boolean;
  created_at: string;
}

export interface Alerta {
  id: string;
  paciente_id: string;
  cirugia_id?: string | null;
  nivel: AlertaNivel;
  mensaje: string;
  atendida: boolean;
  created_at: string;
}

export interface MaterialEducativo {
  id: string;
  cirugia_id?: string | null;
  tipo_cirugia: string;
  categoria: CategoriaMaterial;
  tipo_recurso: TipoRecurso;
  titulo: string;
  descripcion_corta: string;
  contenido_markdown?: string | null;
  url_recurso?: string | null;
  orden_visualizacion: number;
  created_at: string;
}

export interface PersonalClinico {
  id: string;
  nombre_completo: string;
  email: string;
  rol: string;
  especialidad: string;
}

// Tipos agregados para la UI
export interface PautaConCheckin extends Pauta {
  checkin?: Checkin;
}

export interface CirugiaConDetalle extends Cirugia {
  paciente: Paciente;
  pautas: PautaConCheckin[];
  alertas: Alerta[];
  reportesAnsiedad?: ReporteAnsiedad[];
  ultimoReporteAnsiedad?: ReporteAnsiedad | null;
  semaforo: AlertaNivel;
  pautasCriticasPendientes: number;
}

export interface PautaPersonalizadaInput {
  titulo: string;
  descripcion: string;
  horas_previas: number;
  es_critica: boolean;
  tipo_alarma?: TipoAlarmaPauta;
  hora_alarma?: string | null;
  intervalo_minutos?: number | null;
}

export interface NuevaCirugiaPayload {
  // Sección A: Ficha Clínica Específica del Paciente
  nombre_completo: string;
  documento: string;
  edad: number;
  telefono: string;
  contacto_emergencia: string;
  email?: string;
  pin_acceso: string;
  grupo_sanguineo?: string;
  peso_kg?: number | null;
  talla_cm?: number | null;
  alergias?: string;
  comorbilidades?: string[];
  medicacion_habitual?: string;
  nivel_ansiedad?: NivelAnsiedad;
  // Sección B: Cirugía Base Seleccionada + Sobrescrituras
  catalogo_cirugia_id?: string;
  tipo_cirugia: string;
  nombre_sencillo: string;
  especialidad: string;
  fecha_programada: string;
  medico_tratante: string;
  tipo_anestesia: string;
  sensacion_anestesia: string;
  duracion_estimada: string;
  tiempo_recuperacion: string;
  tiempo_recuperacion_sala: string;
  dias_incapacidad_estimados: string;
  // Sección C: Personalización para el Paciente + Pautas
  notas_medicas: string;
  incluirSuspensionFarmacos: boolean;
  horasSuspensionFarmacos?: number;
  detalleFarmacos?: string;
  horasAyunoSolidos: number;
  horasAyunoLiquidos: number;
  incluirDuchaAntiseptica?: boolean;
  pautasPersonalizadasExtra?: PautaPersonalizadaInput[];
  estado_inicial_simulacion?: 'en_tiempo' | 'en_riesgo' | 'critico';
}
