import { ref, computed } from 'vue';
import type {
  Alerta,
  Cirugia,
  NivelAnsiedad,
  OrigenReporteAnsiedad,
  Paciente,
  ReporteAnsiedad,
} from '../types/database.types';
import { isSupabaseConfigured, supabase, mockRealtimeBus } from '../lib/supabase';
import { initialMockAlertas } from '../lib/mockData';

const STORAGE_KEY_ANXIETY_REPORTS = 'precare_anxiety_reports_v1';
const STORAGE_KEY_AI_CONTACTS = 'precare_ai_contacts_v1';
const STORAGE_KEY_SURVEY_COMPLETED = 'precare_survey_completed_v1';
const STORAGE_KEY_DYNAMIC_ALERTS = 'precare_dynamic_alerts_v1';

export interface HelpDirectoryContext {
  urgente: boolean;
  motivo: string;
  fraseDetectada?: string | null;
  origen?: OrigenReporteAnsiedad | 'manual';
  alertaEnviadaMedico?: boolean;
}

export interface WristbandSurveyNotification {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  tipoCirugia: string;
  isSimulation: boolean;
  triggeredAt: string;
}

export interface AnalisisAnsiedadResultado {
  detectado: boolean;
  nivel: NivelAnsiedad;
  riesgoCancelacion: boolean;
  esUrgente: boolean;
  puntaje: number;
  palabrasClave: string[];
  motivoResumen: string;
  abrirDirectorioAyuda: boolean;
}

// =========================================================================
// ESTADO GLOBAL SINGLETON REACTIVO
// =========================================================================
const anxietyReports = ref<ReporteAnsiedad[]>([]);
const dynamicAlerts = ref<Alerta[]>([]);
const aiContactMap = ref<Record<string, string>>({}); // pacienteId -> ISO timestamp
const surveyCompletedMap = ref<Record<string, string>>({}); // pacienteId -> ISO timestamp

// Directorio de Ayuda Global (controlado desde HeaderNav y disparable desde IA/Encuesta)
const isHelpDirectoryOpen = ref<boolean>(false);
const helpDirectoryContext = ref<HelpDirectoryContext | null>(null);

// Modal de Encuesta Rápida de Ansiedad
const isSurveyModalOpen = ref<boolean>(false);
const surveyTriggerReason = ref<'auto_mitad_tiempo' | 'simulacion_mitad_tiempo' | 'desde_pulsera' | 'manual'>('manual');
const pendingSurveyWristbandEvent = ref<WristbandSurveyNotification | null>(null);

// Notificación urgente activa en el tablero médico
const latestUrgentMedicalToast = ref<ReporteAnsiedad | null>(null);

let surveyWatcherInterval: ReturnType<typeof setInterval> | null = null;
let autoTriggeredPacientes = new Set<string>();

// =========================================================================
// PERSISTENCIA Y SINCRONIZACIÓN MULTI-PESTAÑA
// =========================================================================
function loadPersistedAnxietyData() {
  if (typeof window === 'undefined') return;
  try {
    const rawReports = localStorage.getItem(STORAGE_KEY_ANXIETY_REPORTS);
    if (rawReports) {
      anxietyReports.value = JSON.parse(rawReports);
    }
    const rawAlerts = localStorage.getItem(STORAGE_KEY_DYNAMIC_ALERTS);
    if (rawAlerts) {
      const parsed: Alerta[] = JSON.parse(rawAlerts);
      dynamicAlerts.value = parsed;
      for (const a of parsed) {
        if (!initialMockAlertas.some((m) => m.id === a.id)) {
          initialMockAlertas.unshift(a);
        }
      }
    }
    const rawContacts = localStorage.getItem(STORAGE_KEY_AI_CONTACTS);
    if (rawContacts) {
      aiContactMap.value = JSON.parse(rawContacts);
    }
    const rawCompleted = localStorage.getItem(STORAGE_KEY_SURVEY_COMPLETED);
    if (rawCompleted) {
      surveyCompletedMap.value = JSON.parse(rawCompleted);
    }
  } catch (e) {
    console.warn('[useAnxietyMonitoring] Error cargando datos persistidos:', e);
  }
}

function persistAnxietyReports() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ANXIETY_REPORTS, JSON.stringify(anxietyReports.value));
  } catch (e) {
    console.warn('[useAnxietyMonitoring] Error guardando reportes de ansiedad:', e);
  }
}

function persistDynamicAlerts() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_DYNAMIC_ALERTS, JSON.stringify(dynamicAlerts.value));
  } catch (e) {
    console.warn('[useAnxietyMonitoring] Error guardando alertas dinámicas:', e);
  }
}

function persistAiContacts() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_AI_CONTACTS, JSON.stringify(aiContactMap.value));
  } catch {}
}

function persistSurveyCompleted() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SURVEY_COMPLETED, JSON.stringify(surveyCompletedMap.value));
  } catch {}
}

loadPersistedAnxietyData();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (
      event.key === STORAGE_KEY_ANXIETY_REPORTS ||
      event.key === STORAGE_KEY_DYNAMIC_ALERTS
    ) {
      const prevIds = new Set(anxietyReports.value.map((r) => r.id));
      loadPersistedAnxietyData();
      const nuevoUrgente = anxietyReports.value.find(
        (r) => !prevIds.has(r.id) && (r.es_urgente || r.riesgo_cancelacion) && !r.revisado_medico
      );
      if (nuevoUrgente) {
        latestUrgentMedicalToast.value = nuevoUrgente;
        mockRealtimeBus.emit('reportes_ansiedad', 'INSERT', nuevoUrgente);
      }
      const ultimaAlerta = dynamicAlerts.value[0];
      if (ultimaAlerta) {
        mockRealtimeBus.emit('alertas', 'INSERT', ultimaAlerta);
      }
    }
  });
}

// =========================================================================
// MOTOR DE DETECCIÓN DE PALABRAS CLAVE DE ANSIEDAD / CANCELACIÓN
// =========================================================================
const PATRONES_CANCELACION: Array<{ regex: RegExp; etiqueta: string }> = [
  { regex: /quiero cancelar/i, etiqueta: 'quiero cancelar' },
  { regex: /cancelar\s+(la|mi)?\s*cirug[ií]a/i, etiqueta: 'cancelar cirugía' },
  { regex: /voy a cancelar/i, etiqueta: 'voy a cancelar' },
  { regex: /no me quiero operar/i, etiqueta: 'no me quiero operar' },
  { regex: /no quiero operarme/i, etiqueta: 'no quiero operarme' },
  { regex: /mejor no me opero/i, etiqueta: 'mejor no me opero' },
  { regex: /ya no quiero\s*(operarme|ir|seguir|la cirug)/i, etiqueta: 'ya no quiero operarme' },
  { regex: /quiero\s*(aplazar|posponer|suspender)/i, etiqueta: 'quiero aplazar/suspender' },
  { regex: /suspender\s+(la|mi)?\s*cirug/i, etiqueta: 'suspender cirugía' },
  { regex: /me arrepent[ií]|estoy arrepentid/i, etiqueta: 'arrepentimiento quirúrgico' },
  { regex: /quiero desistir|no voy a ir a la cirug/i, etiqueta: 'desistir de la cirugía' },
];

const PATRONES_MIEDO_CRITICO: Array<{ regex: RegExp; etiqueta: string }> = [
  { regex: /tengo mucho miedo|much[ií]simo miedo|demasiado miedo|me da mucho miedo|me muero de miedo/i, etiqueta: 'tengo mucho miedo' },
  { regex: /p[aá]nico|terror|aterrad[oa]|aterrorizad[oa]/i, etiqueta: 'pánico / terror' },
  { regex: /me voy a morir|miedo a morir|no voy a despertar|no despertar de la anestesia/i, etiqueta: 'temor vital / anestesia' },
  { regex: /no puedo m[aá]s|no aguanto|estoy llorando|ataque de ansiedad|demasiada ansiedad/i, etiqueta: 'crisis de ansiedad' },
  { regex: /muy asustad[oa]|s[uú]per asustad[oa]|me siento horrible/i, etiqueta: 'miedo intenso' },
  { regex: /siento que algo\s*(va a salir|saldr[aá])\s*mal/i, etiqueta: 'temor a complicación' },
];

const PATRONES_ANSIEDAD_MODERADA: Array<{ regex: RegExp; etiqueta: string }> = [
  { regex: /tengo miedo|me da miedo|temor/i, etiqueta: 'miedo / temor' },
  { regex: /nervios|nervios[oa]/i, etiqueta: 'nerviosismo' },
  { regex: /ansiedad|ansios[oa]|angustia|angustiad[oa]/i, etiqueta: 'ansiedad' },
  { regex: /preocupad[oa]|me preocupa|asustad[oa]/i, etiqueta: 'preocupación' },
  { regex: /no puedo dormir|insomnio|dudas de operarme/i, etiqueta: 'inquietud preoperatoria' },
];

const PATRONES_TRANQUILIDAD: RegExp =
  /estoy tranquil[oa]|me siento bien|me siento tranquil[oa]|todo claro|sin miedo|listo para la cirug/i;

export function analizarDiscursoAnsiedad(texto: string): AnalisisAnsiedadResultado {
  const limpio = (texto || '').trim();
  if (!limpio) {
    return {
      detectado: false,
      nivel: 'baja',
      riesgoCancelacion: false,
      esUrgente: false,
      puntaje: 2,
      palabrasClave: [],
      motivoResumen: '',
      abrirDirectorioAyuda: false,
    };
  }

  const hitsCancelacion = PATRONES_CANCELACION.filter((p) => p.regex.test(limpio)).map(
    (p) => p.etiqueta
  );
  const hitsCritico = PATRONES_MIEDO_CRITICO.filter((p) => p.regex.test(limpio)).map(
    (p) => p.etiqueta
  );
  const hitsModerado = PATRONES_ANSIEDAD_MODERADA.filter((p) => p.regex.test(limpio)).map(
    (p) => p.etiqueta
  );

  if (hitsCancelacion.length > 0) {
    const keywords = [...new Set([...hitsCancelacion, ...hitsCritico])];
    return {
      detectado: true,
      nivel: 'alta',
      riesgoCancelacion: true,
      esUrgente: true,
      puntaje: 10,
      palabrasClave: keywords,
      motivoResumen: `Posible intención de cancelar la cirugía (${keywords.join(', ')})`,
      abrirDirectorioAyuda: true,
    };
  }

  if (hitsCritico.length > 0) {
    return {
      detectado: true,
      nivel: 'alta',
      riesgoCancelacion: true,
      esUrgente: true,
      puntaje: 9,
      palabrasClave: hitsCritico,
      motivoResumen: `Ansiedad severa / miedo intenso detectado (${hitsCritico.join(', ')})`,
      abrirDirectorioAyuda: true,
    };
  }

  if (hitsModerado.length > 0) {
    return {
      detectado: true,
      nivel: 'moderada',
      riesgoCancelacion: false,
      esUrgente: false,
      puntaje: 6,
      palabrasClave: hitsModerado,
      motivoResumen: `Ansiedad moderada o nerviosismo expresado (${hitsModerado.join(', ')})`,
      abrirDirectorioAyuda: false,
    };
  }

  if (PATRONES_TRANQUILIDAD.test(limpio)) {
    return {
      detectado: true,
      nivel: 'baja',
      riesgoCancelacion: false,
      esUrgente: false,
      puntaje: 2,
      palabrasClave: ['tranquilidad'],
      motivoResumen: 'Paciente expresa tranquilidad y buena disposición preoperatoria',
      abrirDirectorioAyuda: false,
    };
  }

  return {
    detectado: false,
    nivel: 'baja',
    riesgoCancelacion: false,
    esUrgente: false,
    puntaje: 2,
    palabrasClave: [],
    motivoResumen: '',
    abrirDirectorioAyuda: false,
  };
}

// =========================================================================
// COMPOSABLE PRINCIPAL
// =========================================================================
export function useAnxietyMonitoring() {
  const reportesUrgentesSinRevisar = computed(() =>
    anxietyReports.value.filter(
      (r) => (r.es_urgente || r.riesgo_cancelacion || r.nivel === 'alta') && !r.revisado_medico
    )
  );

  function openHelpDirectory(context?: Partial<HelpDirectoryContext>) {
    helpDirectoryContext.value = context
      ? {
          urgente: Boolean(context.urgente),
          motivo:
            context.motivo ||
            'Nuestro equipo clínico y de contención emocional está disponible 24/7 para ayudarte.',
          fraseDetectada: context.fraseDetectada || null,
          origen: context.origen || 'manual',
          alertaEnviadaMedico: Boolean(context.alertaEnviadaMedico),
        }
      : null;
    isHelpDirectoryOpen.value = true;
  }

  function closeHelpDirectory() {
    isHelpDirectoryOpen.value = false;
  }

  function markAiContact(pacienteId?: string | null) {
    if (!pacienteId) return;
    aiContactMap.value[pacienteId] = new Date().toISOString();
    persistAiContacts();
  }

  function hasAiContact(pacienteId?: string | null): boolean {
    if (!pacienteId) return false;
    return Boolean(aiContactMap.value[pacienteId]);
  }

  function hasCompletedSurvey(pacienteId?: string | null): boolean {
    if (!pacienteId) return false;
    return Boolean(surveyCompletedMap.value[pacienteId]);
  }

  function clearWristbandSurveyNotification() {
    pendingSurveyWristbandEvent.value = null;
  }

  /**
   * Calcula si ya se alcanzó o superó el 50% del tiempo entre la programación y la cirugía
   */
  function isHalfwayTimeReached(cirugia?: Cirugia | null): boolean {
    if (!cirugia?.fecha_programada) return false;
    const nowMs = Date.now();
    const targetMs = new Date(cirugia.fecha_programada).getTime();
    if (Number.isNaN(targetMs) || targetMs <= nowMs) return false;

    const createdMs = cirugia.created_at ? new Date(cirugia.created_at).getTime() : NaN;
    if (!Number.isNaN(createdMs) && targetMs > createdMs) {
      const totalMs = targetMs - createdMs;
      const elapsedMs = nowMs - createdMs;
      // Si el periodo total es real (> 1h) y ya transcurrió >= 50% del tiempo
      if (totalMs >= 3600 * 1000 && elapsedMs >= totalMs * 0.5) {
        return true;
      }
    }

    // Fallback clínico para cirugías demo recién sembradas: si falta <= 24h de un horizonte de 48h (mitad del tiempo)
    const remainingHours = (targetMs - nowMs) / (1000 * 3600);
    return remainingHours <= 24;
  }

  /**
   * Registra un reporte de ansiedad (desde Llamada IA, Chat IA o Encuesta Rápida)
   * y lo envía automáticamente al tablero médico con notificación urgente si corresponde.
   */
  async function registrarReporteAnsiedad(params: {
    paciente: Paciente;
    cirugia?: Cirugia | null;
    origen: OrigenReporteAnsiedad;
    nivel: NivelAnsiedad;
    riesgoCancelacion: boolean;
    puntaje: number;
    estadoAnimo: string;
    preocupacionPrincipal?: string | null;
    fraseDetectada?: string | null;
    palabrasClave?: string[];
    comentarioPaciente?: string | null;
  }): Promise<ReporteAnsiedad> {
    const nowIso = new Date().toISOString();
    const esUrgente = params.riesgoCancelacion || params.nivel === 'alta';

    const nuevoReporte: ReporteAnsiedad = {
      id: `anx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      paciente_id: params.paciente.id,
      paciente_nombre: params.paciente.nombre_completo,
      cirugia_id: params.cirugia?.id || null,
      tipo_cirugia: params.cirugia?.tipo_cirugia || null,
      origen: params.origen,
      nivel: params.nivel,
      riesgo_cancelacion: params.riesgoCancelacion,
      es_urgente: esUrgente,
      puntaje: params.puntaje,
      estado_animo: params.estadoAnimo,
      preocupacion_principal: params.preocupacionPrincipal || null,
      frase_detectada: params.fraseDetectada || null,
      palabras_clave: params.palabrasClave || [],
      comentario_paciente: params.comentarioPaciente || null,
      revisado_medico: false,
      created_at: nowIso,
    };

    anxietyReports.value.unshift(nuevoReporte);
    persistAnxietyReports();

    if (params.origen === 'encuesta_rapida' || params.origen === 'encuesta_pulsera') {
      surveyCompletedMap.value[params.paciente.id] = nowIso;
      persistSurveyCompleted();
    }

    if (esUrgente) {
      latestUrgentMedicalToast.value = nuevoReporte;
    }

    // Emitir evento en bus local para actualización inmediata del tablero médico
    mockRealtimeBus.emit('reportes_ansiedad', 'INSERT', nuevoReporte);

    // Generar la alerta clínica correspondiente para el Tablero Semáforo (/clinica)
    const origenLabel =
      params.origen === 'llamada_ia'
        ? 'Llamada con IA Sofi'
        : params.origen === 'chat_ia'
        ? 'Chat con IA Sofi'
        : params.origen === 'encuesta_pulsera'
        ? 'Encuesta por Pulsera (Voz)'
        : 'Encuesta Rápida Web';

    const detalleTexto = params.fraseDetectada
      ? ` — "${params.fraseDetectada}"`
      : params.preocupacionPrincipal
      ? ` — Inquietud: ${params.preocupacionPrincipal}`
      : '';

    const nivelAlerta: Alerta['nivel'] = esUrgente
      ? 'rojo'
      : params.nivel === 'moderada'
      ? 'amarillo'
      : 'verde';

    const prefijo = esUrgente
      ? `🚨 [URGENTE — RIESGO CANCELACIÓN EMOCIONAL | ${origenLabel}]`
      : params.nivel === 'moderada'
      ? `⚠️ [Ansiedad Moderada | ${origenLabel}]`
      : `💚 [Chequeo Emocional Tranquilo | ${origenLabel}]`;

    const mensajeAlerta = `${prefijo} ${params.paciente.nombre_completo}: ${params.estadoAnimo}${detalleTexto}${
      params.comentarioPaciente ? ` • Nota: "${params.comentarioPaciente}"` : ''
    }`;

    const nuevaAlerta: Alerta = {
      id: `alert-anx-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      paciente_id: params.paciente.id,
      cirugia_id: params.cirugia?.id || null,
      nivel: nivelAlerta,
      mensaje: mensajeAlerta,
      atendida: nivelAlerta === 'verde',
      created_at: nowIso,
    };

    // Guardar en alertas dinámicas persistidas + initialMockAlertas para sobrevivir navegación
    dynamicAlerts.value.unshift(nuevaAlerta);
    persistDynamicAlerts();
    if (!initialMockAlertas.some((a) => a.id === nuevaAlerta.id)) {
      initialMockAlertas.unshift(nuevaAlerta);
    }

    // Enviar a Supabase si está activo
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('alertas').insert({
          paciente_id: nuevaAlerta.paciente_id,
          cirugia_id: nuevaAlerta.cirugia_id,
          nivel: nuevaAlerta.nivel,
          mensaje: nuevaAlerta.mensaje,
          atendida: nuevaAlerta.atendida,
        });
      } catch (e) {
        console.warn('[useAnxietyMonitoring] Error enviando alerta a Supabase (respaldo local activo):', e);
      }
    }

    mockRealtimeBus.emit('alertas', 'INSERT', nuevaAlerta);
    return nuevoReporte;
  }

  /**
   * Analiza una frase dicha o escrita por el paciente a la IA.
   * Si detecta ansiedad crítica o deseo de cancelar:
   * 1. Despliega automáticamente el Directorio de Ayuda.
   * 2. Envía reporte urgente + alerta roja al médico en el tablero clínico.
   */
  async function evaluarYReportarInteraccionIA(params: {
    texto: string;
    origen: 'llamada_ia' | 'chat_ia';
    paciente?: Paciente | null;
    cirugia?: Cirugia | null;
  }): Promise<AnalisisAnsiedadResultado> {
    const analisis = analizarDiscursoAnsiedad(params.texto);
    if (!params.paciente) return analisis;

    markAiContact(params.paciente.id);

    if (analisis.detectado) {
      const estadoAnimo = analisis.riesgoCancelacion
        ? 'Riesgo de Cancelación / Miedo Intenso'
        : analisis.nivel === 'alta'
        ? 'Ansiedad Severa'
        : analisis.nivel === 'moderada'
        ? 'Ansiedad Moderada / Nerviosismo'
        : 'Tranquilo y Dispuesto';

      await registrarReporteAnsiedad({
        paciente: params.paciente,
        cirugia: params.cirugia,
        origen: params.origen,
        nivel: analisis.nivel,
        riesgoCancelacion: analisis.riesgoCancelacion,
        puntaje: analisis.puntaje,
        estadoAnimo,
        preocupacionPrincipal: analisis.motivoResumen,
        fraseDetectada: params.texto,
        palabrasClave: analisis.palabrasClave,
      });

      if (analisis.abrirDirectorioAyuda) {
        openHelpDirectory({
          urgente: true,
          motivo: analisis.motivoResumen,
          fraseDetectada: params.texto,
          origen: params.origen,
          alertaEnviadaMedico: true,
        });
      }
    }

    return analisis;
  }

  /**
   * Dispara la encuesta rápida (de forma independiente para Web y/o Pulsera en Llamada)
   */
  function dispararEncuestaAnsiedad(options: {
    paciente: Paciente;
    cirugia?: Cirugia | null;
    motivo: 'auto_mitad_tiempo' | 'simulacion_mitad_tiempo' | 'desde_pulsera' | 'manual';
    openWeb?: boolean;
    notifyWristband?: boolean;
  }) {
    if (options.openWeb) {
      surveyTriggerReason.value = options.motivo;
      isSurveyModalOpen.value = true;
    }

    if (options.notifyWristband) {
      pendingSurveyWristbandEvent.value = {
        id: `survey-wb-${Date.now()}`,
        pacienteId: options.paciente.id,
        pacienteNombre: options.paciente.nombre_completo,
        tipoCirugia: options.cirugia?.nombre_sencillo || options.cirugia?.tipo_cirugia || 'tu cirugía',
        isSimulation: options.motivo === 'simulacion_mitad_tiempo',
        triggeredAt: new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    }
  }

  /**
   * Simulación EXCLUSIVA del Portal Web: solo despliega la encuesta en pantalla web (sin activar pulsera).
   */
  function simularEncuestaWeb(paciente?: Paciente | null, cirugia?: Cirugia | null) {
    if (!paciente) return;
    dispararEncuestaAnsiedad({
      paciente,
      cirugia,
      motivo: 'simulacion_mitad_tiempo',
      openWeb: true,
      notifyWristband: false,
    });
  }

  /**
   * Simulación EXCLUSIVA de la Pulsera Inteligente: solo inicia la encuesta 100% en llamada en la pulsera (sin abrir nada en la web).
   */
  function simularEncuestaPulsera(paciente?: Paciente | null, cirugia?: Cirugia | null) {
    if (!paciente) return;
    isSurveyModalOpen.value = false;
    dispararEncuestaAnsiedad({
      paciente,
      cirugia,
      motivo: 'simulacion_mitad_tiempo',
      openWeb: false,
      notifyWristband: true,
    });
  }

  /**
   * Solo se llama si el paciente en plena encuesta por llamada de la pulsera pide explícitamente hacerla en la web.
   */
  function abrirEncuestaWebDesdePulsera(paciente?: Paciente | null, cirugia?: Cirugia | null) {
    if (!paciente) return;
    dispararEncuestaAnsiedad({
      paciente,
      cirugia,
      motivo: 'desde_pulsera',
      openWeb: true,
      notifyWristband: false,
    });
  }

  /**
   * Alias retrocompatible -> por defecto simula en web
   */
  function simularEncuestaMitadTiempo(paciente?: Paciente | null, cirugia?: Cirugia | null) {
    simularEncuestaWeb(paciente, cirugia);
  }

  function closeSurveyModal() {
    isSurveyModalOpen.value = false;
  }

  /**
   * Vigilante en segundo plano: detecta si NO ha habido contacto con la IA al llegar al 50% del tiempo
   */
  function startSurveyInactivityWatcher(
    getPaciente: () => Paciente | null,
    getCirugia: () => Cirugia | null
  ) {
    if (surveyWatcherInterval) clearInterval(surveyWatcherInterval);

    const checkCondition = () => {
      const pac = getPaciente();
      const cir = getCirugia();
      if (!pac || !cir) return;
      if (isSurveyModalOpen.value) return;
      if (hasAiContact(pac.id) || hasCompletedSurvey(pac.id)) return;
      if (autoTriggeredPacientes.has(pac.id)) return;

      if (isHalfwayTimeReached(cir)) {
        autoTriggeredPacientes.add(pac.id);
        console.log(
          `[useAnxietyMonitoring] 50% del tiempo alcanzado sin contacto IA para ${pac.nombre_completo}. Lanzando encuesta en web y pulsera.`
        );
        dispararEncuestaAnsiedad({
          paciente: pac,
          cirugia: cir,
          motivo: 'auto_mitad_tiempo',
          openWeb: true,
          notifyWristband: true,
        });
      }
    };

    // Comprobar tras 4 segundos para no chocar con el montaje inicial de la vista
    const initialTimeout = setTimeout(checkCondition, 4000);
    surveyWatcherInterval = setInterval(checkCondition, 15000);

    return () => {
      clearTimeout(initialTimeout);
      if (surveyWatcherInterval) {
        clearInterval(surveyWatcherInterval);
        surveyWatcherInterval = null;
      }
    };
  }

  function marcarReporteRevisado(reporteId: string) {
    const target = anxietyReports.value.find((r) => r.id === reporteId);
    if (target) {
      target.revisado_medico = true;
      persistAnxietyReports();
    }
    if (latestUrgentMedicalToast.value?.id === reporteId) {
      latestUrgentMedicalToast.value = null;
    }
  }

  function dismissUrgentToast() {
    latestUrgentMedicalToast.value = null;
  }

  function getReportesPorPaciente(pacienteId: string): ReporteAnsiedad[] {
    return anxietyReports.value.filter((r) => r.paciente_id === pacienteId);
  }

  function getDynamicAlerts(): Alerta[] {
    loadPersistedAnxietyData();
    return dynamicAlerts.value;
  }

  return {
    anxietyReports,
    dynamicAlerts,
    reportesUrgentesSinRevisar,
    latestUrgentMedicalToast,
    isHelpDirectoryOpen,
    helpDirectoryContext,
    isSurveyModalOpen,
    surveyTriggerReason,
    pendingSurveyWristbandEvent,
    openHelpDirectory,
    closeHelpDirectory,
    markAiContact,
    hasAiContact,
    hasCompletedSurvey,
    isHalfwayTimeReached,
    analizarDiscursoAnsiedad,
    registrarReporteAnsiedad,
    evaluarYReportarInteraccionIA,
    dispararEncuestaAnsiedad,
    simularEncuestaMitadTiempo,
    simularEncuestaWeb,
    simularEncuestaPulsera,
    abrirEncuestaWebDesdePulsera,
    closeSurveyModal,
    clearWristbandSurveyNotification,
    startSurveyInactivityWatcher,
    marcarReporteRevisado,
    dismissUrgentToast,
    getReportesPorPaciente,
    getDynamicAlerts,
    loadPersistedAnxietyData,
  };
}
