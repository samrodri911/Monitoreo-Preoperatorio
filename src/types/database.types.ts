export type CirugiaEstado = 'programada' | 'en_preparacion' | 'cancelada' | 'realizada';
export type CheckinEstado = 'pendiente' | 'completado' | 'omitido';
export type AlertaNivel = 'verde' | 'amarillo' | 'rojo';
export type CategoriaMaterial = 'que_esperar' | 'preparacion_fisica' | 'tecnica_quirurgica' | 'cuidados_generales' | 'guia_maleta' | 'recorrido' | 'faq';
export type TipoRecurso = 'video' | 'imagen' | 'infografia' | 'articulo' | 'pdf';

export interface Paciente {
  id: string;
  nombre_completo: string;
  documento: string;
  telefono: string;
  edad: number;
  contacto_emergencia: string;
  created_at: string;
}

export interface Cirugia {
  id: string;
  paciente_id: string;
  tipo_cirugia: string;
  nombre_sencillo?: string | null;
  duracion_estimada?: string | null;
  tipo_anestesia?: string | null;
  sensacion_anestesia?: string | null;
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

// Tipos agregados para la UI
export interface PautaConCheckin extends Pauta {
  checkin?: Checkin;
}

export interface CirugiaConDetalle extends Cirugia {
  paciente: Paciente;
  pautas: PautaConCheckin[];
  alertas: Alerta[];
  semaforo: AlertaNivel;
  pautasCriticasPendientes: number;
}
