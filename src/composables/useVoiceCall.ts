import { ref, computed } from 'vue';
import { usePacienteStore } from '../stores/pacienteStore';
import { aiAssistantService } from '../services/aiAssistant';
import { edgeTtsService } from '../services/edgeTtsService';
import { supabase, isSupabaseConfigured, mockRealtimeBus } from '../lib/supabase';
import { useAnxietyMonitoring } from './useAnxietyMonitoring';
import type { NivelAnsiedad } from '../types/database.types';

// Tipado para la Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export type CallStatus =
  | 'idle'
  | 'connecting'
  | 'greeting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'ending'
  | 'transferred'
  | 'error';

// =========================================================================
// ESTADO SINGLETON A NIVEL DE MÓDULO (Compartido en toda la aplicación)
// =========================================================================
const isCallModalOpen = ref<boolean>(false);
const isCallActive = ref<boolean>(false);
const callStatus = ref<CallStatus>('idle');
const isMuted = ref<boolean>(false);
const callDurationSeconds = ref<number>(0);
const audioLevel = ref<number>(0);
const errorMessage = ref<string | null>(null);
const transferReason = ref<string | null>(null);
const hasNurseBeenAlerted = ref<boolean>(false);
const callHistory = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
const lastUserTranscript = ref<string>('');
const lastAssistantResponse = ref<string>('');

export type WristbandSurveyStep = 'idle' | 'q1_animo' | 'q2_inquietud' | 'q3_cancelacion' | 'completed';
const isWristbandSurveyActive = ref<boolean>(false);
const wristbandSurveyStep = ref<WristbandSurveyStep>('idle');
const wristbandSurveyDraft = ref<{
  animoTexto: string;
  nivel: NivelAnsiedad;
  puntaje: number;
  inquietud: string;
  riesgoCancelacion: boolean;
  transcripciones: string[];
}>({
  animoTexto: '',
  nivel: 'baja',
  puntaje: 2,
  inquietud: '',
  riesgoCancelacion: false,
  transcripciones: [],
});

let recognitionInstance: any = null;
let synth: SpeechSynthesis | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let timerInterval: any = null;
let audioLevelInterval: any = null;
let silenceTimer: any = null;
let pendingListenDelayTimer: ReturnType<typeof setTimeout> | null = null;
let finalTranscriptBuffer = '';
let activeAbortController: AbortController | null = null;
let resolvedOllamaModel: string | null = null;
let isProcessingTurn = false;
let currentSpeakGeneration = 0;
let lastProcessedSpeech = '';
let lastProcessedAt = 0;

/**
 * Resuelve automáticamente el modelo de chat instalado en Ollama
 */
async function resolveOllamaModel(apiUrl: string, preferredModel: string): Promise<string> {
  if (resolvedOllamaModel) return resolvedOllamaModel;
  try {
    const res = await fetch(`${apiUrl}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      const models: string[] = Array.isArray(data.models)
        ? data.models.map((m: any) => String(m.name || m.model))
        : [];

      // 1. Si el modelo preferido está instalado, usarlo
      if (models.some(m => m === preferredModel || m.startsWith(`${preferredModel}:`))) {
        resolvedOllamaModel = preferredModel;
        return preferredModel;
      }

      // 2. Buscar cualquier modelo conversacional instalado (excluyendo embeddings)
      const chatModel = models.find(m => !m.includes('embed') && !m.includes('bert'));
      if (chatModel) {
        console.log(`[VoiceCall] Modelo '${preferredModel}' no encontrado en Ollama. Usando automáticamente modelo disponible: '${chatModel}'`);
        resolvedOllamaModel = chatModel;
        return chatModel;
      }
    }
  } catch (e) {
    console.warn('[VoiceCall] No se pudo verificar tags en Ollama:', e);
  }
  return preferredModel;
}

// Formato mm:ss para el contador de la llamada
const callDurationFormatted = computed(() => {
  const mins = Math.floor(callDurationSeconds.value / 60);
  const secs = callDurationSeconds.value % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

/**
 * Limpia Markdown, emojis y símbolos para que la síntesis vocal
 * suene 100% natural, humana y fluida sin deletrear caracteres extraños.
 */
function cleanTextForSpeech(text: string): string {
  return text
    // Eliminar etiquetas de canal, acotaciones teatrales o prefijos como (Altavoz), [Altavoz], Altavoz:, (Voz), Sofi:, etc.
    .replace(/^\s*[\(\[]\s*(?:altavoz|voz|sofi|asistente|enfermera|audio|hablando|pausa)[^\)\]]*[\)\]]\s*:?/gi, '')
    .replace(/\b(?:altavoz|voz|audio)\s*:\s*/gi, '')
    .replace(/[\(\[]\s*(?:altavoz|voz|pausa|silencio|audio)\s*[\)\]]/gi, '')
    // Eliminar bloques de código y sintaxis Markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\n+/g, '. ')
    .replace(/[👋⚠️🚨💡🩺💙✨🟢🟡🔵📞🛡️❌✓]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Inicializa las APIs del navegador (STT y TTS)
 */
function initSpeechApis() {
  if (typeof window === 'undefined') return;

  // TTS
  if ('speechSynthesis' in window) {
    synth = window.speechSynthesis;
  }

  // STT (Web Speech API con prefijo webkit)
  const win = window as IWindow;
  const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    console.error('[VoiceCall] Web Speech API no soportada en este navegador');
    errorMessage.value = 'Tu navegador no soporta reconocimiento de voz. Te recomendamos usar Google Chrome o Microsoft Edge.';
    return;
  }

  try {
    recognitionInstance = new SpeechRecognitionClass();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'es-CO';
    setupRecognitionEvents();
  } catch (e) {
    console.warn('[VoiceCall] Error inicializando SpeechRecognition:', e);
  }
}

/**
 * Configura los eventos del SpeechRecognition con buffer acumulador y telemetría
 */
function setupRecognitionEvents() {
  if (!recognitionInstance) return;

  recognitionInstance.onstart = () => {
    console.log('[VoiceCall] Evento onstart disparado');
    if (callStatus.value === 'listening') {
      audioLevel.value = 15;
    }
  };

  recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
    // BLOQUEO ESTRICTO ANTI-ECO: Solo procesar micrófono si estamos activamente escuchando y sin turno en curso
    if (!isCallActive.value || isMuted.value || isProcessingTurn || callStatus.value !== 'listening') {
      return;
    }

    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcriptSegment = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscriptBuffer += ' ' + transcriptSegment;
      } else {
        interimTranscript += transcriptSegment;
      }
    }

    const currentFullText = (finalTranscriptBuffer + ' ' + interimTranscript).trim();
    console.log(`[VoiceCall] Evento onresult -> parcial: "${interimTranscript.trim()}" | final: "${finalTranscriptBuffer.trim()}"`);

    if (currentFullText.length > 0) {
      lastUserTranscript.value = currentFullText;
      audioLevel.value = Math.min(95, 30 + currentFullText.length * 2);

      // Reiniciar temporizador de silencio (1.5 segundos) cada vez que el usuario produce fonemas
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        if (!isCallActive.value || isProcessingTurn || callStatus.value !== 'listening') return;
        console.log('[VoiceCall] Temporizador de silencio disparado con texto:', currentFullText);
        procesarTurnoDelPaciente(currentFullText);
      }, 1500);
    }
  };

  recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.warn('[VoiceCall] Evento onerror:', event.error);

    if (event.error === 'not-allowed') {
      errorMessage.value = 'Permiso de micrófono denegado. Permite el acceso al micrófono para continuar.';
      callStatus.value = 'error';
      return;
    }

    // Si fue solo silencio ('no-speech'), no romper la llamada
    if (event.error === 'no-speech') {
      console.log('[VoiceCall] Evento onerror: no-speech (manteniendo llamada activa)');
      return;
    }

    if (event.error === 'aborted') {
      return;
    }
  };

  recognitionInstance.onend = () => {
    audioLevel.value = 0;
    console.log(`[VoiceCall] Evento onend disparado (estado actual: ${callStatus.value})`);

    // En Chromium, el micrófono a menudo se desconecta solo tras inactividad emitiendo onend.
    // Si la llamada sigue activa y el estado es 'listening', reabrir automáticamente para mantener la escucha activa:
    if (isCallActive.value && callStatus.value === 'listening' && !isMuted.value && !isProcessingTurn) {
      setTimeout(() => {
        if (isCallActive.value && callStatus.value === 'listening' && !isMuted.value && !isProcessingTurn) {
          try {
            recognitionInstance.start();
            console.log('[VoiceCall] Micrófono reanudado automáticamente tras onend inactivo');
          } catch (err: any) {
            if (err?.name !== 'InvalidStateError') {
              console.warn('[VoiceCall] Error al reanudar reconocimiento tras onend:', err);
            }
          }
        }
      }, 280);
    }
  };
}

/**
 * Inicia la captura del micrófono
 */
function startListening() {
  if (!isCallActive.value || isMuted.value || isProcessingTurn) return;
  if (callStatus.value === 'ending' || callStatus.value === 'transferred' || callStatus.value === 'idle') {
    return;
  }

  finalTranscriptBuffer = '';
  callStatus.value = 'listening';

  if (!recognitionInstance) {
    initSpeechApis();
  }
  if (!recognitionInstance) return;

  try {
    recognitionInstance.start();
    console.log('[VoiceCall] Micrófono solicitado / iniciado');
  } catch (err: any) {
    if (err?.name === 'InvalidStateError') {
      console.log('[VoiceCall] Micrófono ocupado o en transición (InvalidStateError), reintentando en 250ms...');
      setTimeout(() => {
        if (callStatus.value === 'listening' && isCallActive.value && !isMuted.value && !isProcessingTurn) {
          try {
            recognitionInstance.start();
            console.log('[VoiceCall] Micrófono solicitado / iniciado (en reintento)');
          } catch (e2) {
            console.warn('[VoiceCall] Reintento de start falló:', e2);
          }
        }
      }, 250);
    } else {
      console.warn('[VoiceCall] Error al iniciar micrófono:', err);
      setTimeout(() => {
        if (callStatus.value === 'listening' && isCallActive.value && !isMuted.value && !isProcessingTurn) {
          try {
            recognitionInstance.start();
            console.log('[VoiceCall] Micrófono solicitado / iniciado (en reintento)');
          } catch {}
        }
      }, 300);
    }
  }
}

/**
 * Detiene la captura del micrófono inmediatamente sin emitir resultados tardíos
 */
function stopListening() {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  if (pendingListenDelayTimer) {
    clearTimeout(pendingListenDelayTimer);
    pendingListenDelayTimer = null;
  }
  finalTranscriptBuffer = '';
  if (recognitionInstance) {
    try {
      // abort() evita que Chrome emita un onresult tardío con palabras repetidas tras detener
      recognitionInstance.abort();
    } catch {
      try {
        recognitionInstance.stop();
      } catch {}
    }
  }
}

/**
 * Sintetiza la voz del asistente por altavoces (Voz neuronal hiperrealista "Sofi" con fallback nativo)
 */
function speak(text: string, onDone?: () => void, opts?: { isEnding?: boolean }) {
  const speakGen = ++currentSpeakGeneration;

  // 1. Detener micrófono de inmediato y marcar estado 'speaking'/'ending' ANTES del fetch TTS
  stopListening();
  if (opts?.isEnding) {
    callStatus.value = 'ending';
  } else if (callStatus.value !== 'greeting' && callStatus.value !== 'transferred') {
    callStatus.value = 'speaking';
  }

  // 2. Detener cualquier audio previo (neuronal o nativo)
  edgeTtsService.stop();
  if (currentUtterance) {
    currentUtterance.onstart = null;
    currentUtterance.onend = null;
    currentUtterance.onerror = null;
    currentUtterance = null;
  }
  if (synth) {
    try {
      synth.cancel();
    } catch {}
  }

  const clean = cleanTextForSpeech(text);
  if (!clean) {
    onDone?.();
    return;
  }

  console.log('[VoiceCall] Disparando síntesis de voz con texto:', clean);

  let doneFired = false;
  let safetyWatchdog: ReturnType<typeof setTimeout> | null = null;

  const finishTurn = () => {
    if (doneFired || speakGen !== currentSpeakGeneration) return;
    doneFired = true;
    if (safetyWatchdog) {
      clearTimeout(safetyWatchdog);
      safetyWatchdog = null;
    }
    stopSimulatingAudioWaves();
    audioLevel.value = 0;

    if (!isCallActive.value || callStatus.value === 'idle') {
      return;
    }

    // Si era una despedida/cierre (isEnding: true), ejecutar callback (hangUp) limpiamente
    if (opts?.isEnding) {
      onDone?.();
      return;
    }

    if (callStatus.value === 'transferred') {
      return;
    }

    if (onDone) {
      onDone();
    } else {
      // Pausa anti-eco de 450ms tras finalizar el audio del altavoz antes de reabrir el micrófono
      if (pendingListenDelayTimer) clearTimeout(pendingListenDelayTimer);
      pendingListenDelayTimer = setTimeout(() => {
        if (speakGen === currentSpeakGeneration && isCallActive.value && !isProcessingTurn) {
          startListening();
        }
      }, 450);
    }
  };

  // Fase 1 del watchdog: espera generosa de 12s mientras carga el audio del microservicio Edge-TTS
  safetyWatchdog = setTimeout(() => {
    if (speakGen === currentSpeakGeneration) {
      console.warn('[VoiceCall] Watchdog de carga speak() disparado (12s sin onStart)');
      finishTurn();
    }
  }, 12000);

  edgeTtsService.playNeuralVoice(
    clean,
    // onEnded
    () => {
      if (speakGen !== currentSpeakGeneration) return;
      console.log('[VoiceCall] Sofi terminó de hablar. Preparando siguiente turno...');
      finishTurn();
    },
    // onError
    (e) => {
      if (speakGen !== currentSpeakGeneration) return;
      console.warn('[VoiceCall] Error o interrupción en reproducción:', e);
      finishTurn();
    },
    // options
    {
      voice: 'es-CO-SalomeNeural',
      rate: '+12%',
      onStart: () => {
        if (speakGen !== currentSpeakGeneration || !isCallActive.value || callStatus.value === 'idle') {
          edgeTtsService.stop();
          return;
        }
        if (!opts?.isEnding && callStatus.value !== 'transferred') {
          callStatus.value = 'speaking';
        }
        startSimulatingAudioWaves();

        // Fase 2 del watchdog: una vez que el audio REALMENTE comenzó a reproducirse,
        // dar tiempo amplio según la longitud del texto para NUNCA cortar la frase a la mitad
        if (safetyWatchdog) clearTimeout(safetyWatchdog);
        const playbackMaxMs = Math.max(15000, clean.length * 145 + 4000);
        safetyWatchdog = setTimeout(() => {
          if (speakGen === currentSpeakGeneration) {
            console.warn('[VoiceCall] Watchdog de reproducción speak() alcanzado');
            finishTurn();
          }
        }, playbackMaxMs);
      }
    }
  );
}

/**
 * Simula oscilación de ondas mientras la voz sintetizada habla
 */
function startSimulatingAudioWaves() {
  stopSimulatingAudioWaves();
  audioLevelInterval = setInterval(() => {
    // Oscilar entre 30 y 85 de forma armónica
    audioLevel.value = 35 + Math.floor(Math.random() * 50);
  }, 120);
}

function stopSimulatingAudioWaves() {
  if (audioLevelInterval) {
    clearInterval(audioLevelInterval);
    audioLevelInterval = null;
  }
}

/**
 * Procesa la intervención del paciente (Ollama o Encuesta 100% por voz en pulsera)
 */
async function procesarTurnoDelPaciente(userSpeech: string) {
  const speech = userSpeech.trim();
  if (!speech || !isCallActive.value) return;

  // Cerrojo anti-duplicados: evitar doble procesamiento si Chrome dispara 2 eventos seguidos
  const now = Date.now();
  if (isProcessingTurn) {
    console.log('[VoiceCall] Turno ignorado porque ya hay uno en procesamiento:', speech);
    return;
  }
  if (speech.toLowerCase() === lastProcessedSpeech && now - lastProcessedAt < 2500) {
    console.log('[VoiceCall] Transcripción duplicada descartada (<2.5s):', speech);
    return;
  }

  isProcessingTurn = true;
  lastProcessedSpeech = speech.toLowerCase();
  lastProcessedAt = now;

  // 1. Detener de inmediato el micrófono, bloquear estado a 'thinking' y limpiar buffers
  callStatus.value = 'thinking';
  stopListening();

  try {
    // 2. Detección de Despedida / Cierre de llamada (fuera de palabras accidentales)
    if (/(adi[oó]s|hasta luego|chao|hasta pronto|colgar llamada|terminar llamada|cerrar llamada)/i.test(speech)) {
      const pacienteStore = usePacienteStore();
      const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || '';
      const despedida = `Comprendo${nombre ? ` ${nombre}` : ''}. Que tengas un excelente descanso y mucho ánimo con tu preparación. Estaré aquí si me necesitas. Hasta pronto.`;
      speak(despedida, () => {
        hangUp();
      }, { isEnding: true });
      return;
    }

    // 2.5 Modo Encuesta 100% por Llamada en la Pulsera (completamente desconectado de la web,
    // salvo que el paciente pida explícitamente hacerla en la web)
    if (isWristbandSurveyActive.value) {
      await procesarTurnoEncuestaPulsera(speech);
      return;
    }

    await continuarTurnoConversacionalNormal(speech);
  } finally {
    isProcessingTurn = false;
  }
}

async function continuarTurnoConversacionalNormal(speech: string) {

  // 3. Detección de ansiedad, miedo intenso o intención de cancelar cirugía
  // Si escucha palabras clave críticas ("quiero cancelar", "tengo mucho miedo", "pánico", etc.):
  // despliega automáticamente el Directorio de Ayuda y envía alerta URGENTE al tablero médico.
  const pacienteStore = usePacienteStore();
  const anxiety = useAnxietyMonitoring();
  const analisisAnsiedad = await anxiety.evaluarYReportarInteraccionIA({
    texto: speech,
    origen: 'llamada_ia',
    paciente: pacienteStore.paciente,
    cirugia: pacienteStore.cirugia,
  });

  if (analisisAnsiedad.abrirDirectorioAyuda) {
    lastUserTranscript.value = speech;
    const nombrePac = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || 'Paciente';
    const respuestaContencion = `Te escucho con mucha atención ${nombrePac}, y entiendo perfectamente que sientas miedo o dudas en este momento. No estás solo. Acabo de abrir el Directorio de Ayuda en tu pantalla con los teléfonos directos de enfermería y apoyo emocional, y ya envié una alerta prioritaria a tu médico en PreCare para que te acompañe hoy mismo. Respira profundo; puedes llamar a cualquiera de las líneas en pantalla o seguir hablando conmigo.`;
    callHistory.value.push(
      { role: 'user', content: speech },
      { role: 'assistant', content: respuestaContencion }
    );
    lastAssistantResponse.value = respuestaContencion;
    speak(respuestaContencion);
    return;
  }

  // 4. Detección de solicitud explícita de hablar con un humano / enfermería (RD4)
  if (/enfermer[ií]a|enfermera|enfermero|persona real|humano|hablar con alguien|auxilio|urgencia/i.test(speech)) {
    transferToNurse('El paciente solicitó atención humana explícitamente durante la llamada de voz.');
    return;
  }

  // 5. Cambiar estado visual a pensando
  callStatus.value = 'thinking';
  audioLevel.value = 10;
  lastUserTranscript.value = speech;

  const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || 'Paciente';
  const cirugiaNombre = pacienteStore.cirugia?.nombre_sencillo || pacienteStore.cirugia?.tipo_cirugia || 'tu procedimiento';

  const voicePrompt = `ESTÁS EN UNA LLAMADA TELEFÓNICA 100% DE VOZ con el paciente ${nombre} (cirugía: ${cirugiaNombre}).
Habla en primera persona directamente como Sofi:
- PROHIBIDO INCLUIR etiquetas, acotaciones teatrales o prefijos como "(Altavoz)", "(Voz)", "(Sofi):", "[Altavoz]" o similares. Comienza a hablarle al paciente directamente desde la primera palabra.
- ADAPTACIÓN POR INTENCIÓN:
  * Si es una consulta cerrada/operativa (permisos, ayuno, horarios, medicamentos, celular): Responde en Modo A (1 a 2 oraciones cortas, directo al grano, máx 30 a 45 palabras).
  * Si es una consulta abierta, emocional o educativa (miedo, anestesia, procedimiento, dudas amplias): Responde en Modo B (extensión moderada y cálida de 70 a 100 palabras con validación empática, explicación tranquilizadora y cierre de apoyo).
- CERO FORMATO O EMOJIS: Habla en prosa continua, sin viñetas, asteriscos, negritas ni emojis apto para ser pronunciado por voz.

Paciente: "${speech}"`;

  const clinicalContext = {
    paciente: pacienteStore.paciente,
    cirugia: pacienteStore.cirugia,
    pautas: pacienteStore.pautas,
    materiales: pacienteStore.materiales,
  };

  const systemPrompt = aiAssistantService.buildSystemPrompt(clinicalContext);
  const apiUrl = (import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434').replace(/\/+$/, '');
  const preferredModel = import.meta.env.VITE_OLLAMA_MODEL || 'gemma3:4b';
  const model = await resolveOllamaModel(apiUrl, preferredModel);

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...callHistory.value,
      { role: 'user', content: voicePrompt }
    ],
    stream: false
  };

  console.log('[VoiceCall] Enviando payload a Ollama:', {
    endpoint: `${apiUrl}/api/chat`,
    model,
    texto: speech
  });

  activeAbortController = new AbortController();

  try {
    const timeoutId = setTimeout(() => {
      if (activeAbortController) activeAbortController.abort();
    }, 15000); // 15s timeout

    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: activeAbortController.signal,
      body: JSON.stringify(payload)
    });

    clearTimeout(timeoutId);
    activeAbortController = null;

    if (!response.ok) {
      let errorBody = '';
      try {
        const errJson = await response.json();
        errorBody = errJson.error || JSON.stringify(errJson);
      } catch {}
      throw new Error(`HTTP ${response.status}: ${errorBody || response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.message?.content?.trim() || '';
    // Sanitizar acotaciones de canal o etiquetas residuales como (Altavoz), [Altavoz], etc.
    const respuestaAsistente = rawContent
      .replace(/^\s*[\(\[]\s*(?:altavoz|voz|sofi|asistente|enfermera|audio|hablando)[^\)\]]*[\)\]]\s*:?/gi, '')
      .replace(/\b(?:altavoz|voz|audio)\s*:\s*/gi, '')
      .trim();
    console.log('[VoiceCall] Respuesta de Ollama recibida:', respuestaAsistente);

    if (!isCallActive.value) return;

    if (!respuestaAsistente) {
      throw new Error('Respuesta vacía de Ollama');
    }

    // Guardar en el historial de la llamada
    callHistory.value.push(
      { role: 'user', content: speech },
      { role: 'assistant', content: respuestaAsistente }
    );
    lastAssistantResponse.value = respuestaAsistente;

    speak(respuestaAsistente);
  } catch (err: any) {
    activeAbortController = null;
    console.warn('[VoiceCall] Error al comunicarse con Ollama:', err);

    if (!isCallActive.value) return;

    // Contingencia de voz inmediata
    const fallbackMsg = `Lo siento ${nombre}, tuve un pequeño problema de conexión con mi sistema. ¿Podrías repetirme tu duda o deseas que contactemos a enfermería?`;
    lastAssistantResponse.value = fallbackMsg;
    speak(fallbackMsg);
  }
}

// Alias retrocompatible
const processUserSpeech = procesarTurnoDelPaciente;

/**
 * Transferencia de Rescate Clínico (RD4 / A4)
 * Desvía de inmediato la interacción a soporte humano y genera alerta prioritaria
 */
async function transferToNurse(reason = 'Solicitud de contención o apoyo humano desde llamada de voz') {
  console.log('[VoiceCall] Transferencia a enfermería solicitada:', reason);
  callStatus.value = 'transferred';
  transferReason.value = reason;
  stopListening();
  if (currentUtterance) {
    currentUtterance.onstart = null;
    currentUtterance.onend = null;
    currentUtterance.onerror = null;
    currentUtterance = null;
  }
  if (synth) synth.cancel();
  stopSimulatingAudioWaves();
  audioLevel.value = 0;

  const pacienteStore = usePacienteStore();
  const anxiety = useAnxietyMonitoring();
  const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || '';
  const mensajeTranquilizador = `Comprendo perfectamente${nombre ? ` ${nombre}` : ''}. Ya he puesto en sobreaviso a nuestra enfermería de turno y abrí el Directorio de Ayuda en tu pantalla para brindarte apoyo inmediato.`;

  anxiety.openHelpDirectory({
    urgente: true,
    motivo: reason,
    origen: 'llamada_ia',
    alertaEnviadaMedico: true,
  });

  // Registrar alerta prioritaria en Supabase / Realtime
  if (!hasNurseBeenAlerted.value && pacienteStore.paciente?.id) {
    hasNurseBeenAlerted.value = true;
    const alertaPayload = {
      paciente_id: pacienteStore.paciente.id,
      cirugia_id: pacienteStore.cirugia?.id || null,
      nivel: 'amarillo' as const,
      mensaje: `[Llamada de Voz RD4] El paciente solicitó transferencia directa a enfermería. Motivo: ${reason}`,
      atendida: false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('alertas').insert({
          paciente_id: alertaPayload.paciente_id,
          cirugia_id: alertaPayload.cirugia_id,
          nivel: alertaPayload.nivel,
          mensaje: alertaPayload.mensaje,
          atendida: false,
        });
      } catch (e) {
        console.error('[VoiceCall] Error al insertar alerta en Supabase:', e);
      }
    } else {
      mockRealtimeBus.emit('alertas', 'INSERT', {
        id: `alert-voice-${Date.now()}`,
        ...alertaPayload,
      });
    }
  }

  speak(mensajeTranquilizador);
}

/**
 * Inicia la llamada conversacional completa
 */
function startCall(options?: { showModal?: boolean; customGreeting?: string }) {
  console.log('[VoiceCall] Iniciando llamada con Asistente Sofi');
  // 0. Desbloquear audio HTML5 sincrónicamente bajo el gesto del usuario
  edgeTtsService.unlockAudio();

  // 1. Limpieza rigurosa previa de cualquier audio o proceso anterior
  resetCallState();

  initSpeechApis();
  errorMessage.value = null;
  transferReason.value = null;
  hasNurseBeenAlerted.value = false;
  isMuted.value = false;
  callDurationSeconds.value = 0;
  isCallActive.value = true;
  isCallModalOpen.value = options?.showModal ?? true;
  callStatus.value = 'greeting';
  callHistory.value = [];

  // Iniciar cronómetro de llamada
  timerInterval = setInterval(() => {
    if (isCallActive.value) {
      callDurationSeconds.value++;
    }
  }, 1000);

  const pacienteStore = usePacienteStore();
  const anxiety = useAnxietyMonitoring();
  anxiety.markAiContact(pacienteStore.paciente?.id);
  const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || 'Gerardo';

  const saludoInicial = options?.customGreeting || `Hola ${nombre}, ¿qué duda tienes sobre tu cirugía?`;
  lastAssistantResponse.value = saludoInicial;
  lastUserTranscript.value = '';

  // Síntesis del saludo inicial; al terminar, speak() espera 450ms anti-eco y activa el micrófono
  speak(saludoInicial);
}

/**
 * Inicia llamada 100% Manos Libres desde el Simulador de Pulsera PreCare
 * (Sin abrir el modal a pantalla completa para mantener visible el wearable)
 */
function startWristbandCall(options?: { showModal?: boolean }) {
  isWristbandSurveyActive.value = false;
  wristbandSurveyStep.value = 'idle';
  const pacienteStore = usePacienteStore();
  const anxiety = useAnxietyMonitoring();
  anxiety.markAiContact(pacienteStore.paciente?.id);
  const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || 'Gerardo';
  startCall({
    showModal: options?.showModal ?? false,
    customGreeting: `Hola ${nombre}, te escucho por el altavoz de tu pulsera. ¿Qué duda tienes sobre tu cirugía o preparación?`,
  });
}

/**
 * Inicia la Encuesta de Ansiedad 100% POR LLAMADA EN LA PULSERA (desconectada de la web).
 * No abre ningún modal en pantalla web a menos que el paciente indique explícitamente que la quiere hacer en la web.
 */
function startWristbandSurveyCall() {
  const pacienteStore = usePacienteStore();
  const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || 'Gerardo';

  isWristbandSurveyActive.value = true;
  wristbandSurveyStep.value = 'q1_animo';
  wristbandSurveyDraft.value = {
    animoTexto: '',
    nivel: 'baja',
    puntaje: 2,
    inquietud: 'Ninguna en especial',
    riesgoCancelacion: false,
    transcripciones: [],
  };

  startCall({
    showModal: false,
    customGreeting: `Hola ${nombre}, soy Sofi de PreCare. Ya estamos a mitad de camino de tu cirugía y quiero hacerte un chequeo cortico por aquí. Si prefieres hacerlo en la web, solo dímelo. ¿Cómo te sientes hoy: tranquilo, un poco nervioso o con mucho miedo?`,
  });
}

/**
 * Procesa cada respuesta hablada del paciente durante la encuesta 100% en llamada en la pulsera
 */
async function procesarTurnoEncuestaPulsera(speech: string) {
  const pacienteStore = usePacienteStore();
  const anxiety = useAnxietyMonitoring();
  const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || 'Paciente';
  const lower = speech.toLowerCase();

  lastUserTranscript.value = speech;
  wristbandSurveyDraft.value.transcripciones.push(speech);

  // 1. Verificar si el paciente indica explícitamente que prefiere hacer la encuesta en la web
  if (
    /(en la web|por la web|en pantalla|en la pantalla|en el computador|en el celular|abrir la encuesta|prefiero en la web|hacerla en la web|hacerlo en la web|mejor en la web|pasar a la web|ver en pantalla)/i.test(
      speech
    )
  ) {
    isWristbandSurveyActive.value = false;
    wristbandSurveyStep.value = 'idle';
    anxiety.abrirEncuestaWebDesdePulsera(pacienteStore.paciente, pacienteStore.cirugia);

    const msgWeb = `Perfecto ${nombre}, acabo de abrir la encuesta rápida en tu pantalla web para que la respondas con calma. Cuelgo la llamada de la pulsera y aquí sigo pendiente si me necesitas.`;
    callHistory.value.push({ role: 'user', content: speech }, { role: 'assistant', content: msgWeb });
    lastAssistantResponse.value = msgWeb;
    speak(msgWeb, () => {
      hangUp();
    }, { isEnding: true });
    return;
  }

  // 2. Verificar palabras clave críticas inmediatas (quiero cancelar, pánico, mucho miedo, etc.)
  const analisisCritico = anxiety.analizarDiscursoAnsiedad(speech);
  if (analisisCritico.abrirDirectorioAyuda) {
    isWristbandSurveyActive.value = false;
    wristbandSurveyStep.value = 'completed';

    if (pacienteStore.paciente) {
      await anxiety.registrarReporteAnsiedad({
        paciente: pacienteStore.paciente,
        cirugia: pacienteStore.cirugia,
        origen: 'encuesta_pulsera',
        nivel: 'alta',
        riesgoCancelacion: true,
        puntaje: 10,
        estadoAnimo: analisisCritico.riesgoCancelacion
          ? 'Riesgo de Cancelación / Miedo Intenso (Encuesta Pulsera)'
          : 'Ansiedad Severa (Encuesta Pulsera)',
        preocupacionPrincipal: analisisCritico.motivoResumen,
        fraseDetectada: speech,
        palabrasClave: analisisCritico.palabrasClave,
      });
    }

    anxiety.openHelpDirectory({
      urgente: true,
      motivo: analisisCritico.motivoResumen,
      fraseDetectada: speech,
      origen: 'encuesta_pulsera',
      alertaEnviadaMedico: true,
    });

    const msgUrgente = `Te escucho con mucha atención ${nombre}, y te agradezco tu sinceridad. No estás solo en esto. Ya envié una notificación urgente a tu médico en PreCare y abrí el Directorio de Ayuda con las líneas directas de enfermería y apoyo emocional. Puedes llamar ahora mismo o seguir conversando conmigo por tu pulsera.`;
    callHistory.value.push({ role: 'user', content: speech }, { role: 'assistant', content: msgUrgente });
    lastAssistantResponse.value = msgUrgente;
    speak(msgUrgente);
    return;
  }

  // 3. Avanzar por los 3 pasos breves de la encuesta por voz
  if (wristbandSurveyStep.value === 'q1_animo') {
    if (/(mucho miedo|p[aá]nico|terror|fatal|horrible|muy mal|muy asustad|ansiedad fuerte|demasiado)/i.test(lower)) {
      wristbandSurveyDraft.value.nivel = 'alta';
      wristbandSurveyDraft.value.puntaje = 9;
      wristbandSurveyDraft.value.animoTexto = 'Con mucho miedo / ansiedad fuerte';
    } else if (/(nervios|un poco|duda|preocupad|asustad|miedo|ansios|regular|inquiet)/i.test(lower)) {
      wristbandSurveyDraft.value.nivel = 'moderada';
      wristbandSurveyDraft.value.puntaje = 6;
      wristbandSurveyDraft.value.animoTexto = 'Un poco nervioso / con dudas';
    } else if (/(tranquil|bien|listo|calmad|excelente|normal|segur|sin miedo)/i.test(lower)) {
      wristbandSurveyDraft.value.nivel = 'baja';
      wristbandSurveyDraft.value.puntaje = 2;
      wristbandSurveyDraft.value.animoTexto = 'Tranquilo y listo';
    } else {
      wristbandSurveyDraft.value.nivel = 'moderada';
      wristbandSurveyDraft.value.puntaje = 5;
      wristbandSurveyDraft.value.animoTexto = `Respuesta hablada: "${speech}"`;
    }

    wristbandSurveyStep.value = 'q2_inquietud';
    const q2 = `Gracias por contarme ${nombre}. Segunda pregunta cortica: ¿hay algo que te inquiete más en este momento, como la anestesia, el dolor, la recuperación, el ayuno, o todo está bien?`;
    callHistory.value.push({ role: 'user', content: speech }, { role: 'assistant', content: q2 });
    lastAssistantResponse.value = q2;
    speak(q2);
    return;
  }

  if (wristbandSurveyStep.value === 'q2_inquietud') {
    if (/anestesia|dormir|despertar/i.test(lower)) {
      wristbandSurveyDraft.value.inquietud = 'La anestesia';
    } else if (/dolor|duela/i.test(lower)) {
      wristbandSurveyDraft.value.inquietud = 'Sentir dolor';
    } else if (/recuperaci[oó]n|posoperatorio|cicatriz/i.test(lower)) {
      wristbandSurveyDraft.value.inquietud = 'La recuperación';
    } else if (/ayuno|comer|agua|medicament|preparaci[oó]n/i.test(lower)) {
      wristbandSurveyDraft.value.inquietud = 'Ayuno o preparación';
    } else if (/nada|todo est[aá] bien|ningun|todo bien|tranquil/i.test(lower)) {
      wristbandSurveyDraft.value.inquietud = 'Ninguna en especial';
    } else {
      wristbandSurveyDraft.value.inquietud = speech;
    }

    wristbandSurveyStep.value = 'q3_cancelacion';
    const q3 = `Perfecto, tomo nota. Y última pregunta: ¿has pensado en aplazar o cancelar tu cirugía, o te sientes dispuesto a seguir adelante?`;
    callHistory.value.push({ role: 'user', content: speech }, { role: 'assistant', content: q3 });
    lastAssistantResponse.value = q3;
    speak(q3);
    return;
  }

  if (wristbandSurveyStep.value === 'q3_cancelacion') {
    const piensaCancelar =
      /(s[ií]\b|cancelar|aplazar|posponer|suspender|no me quiero operar|no quiero operarme|no s[eé] si ir|mejor no)/i.test(
        lower
      ) && !/no\s+(he pensado|quiero cancelar|pienso cancelar)/i.test(lower);

    const tieneDudas = /(duda|dudado|tal vez|a veces|un poco|no estoy seguro|no estoy segura)/i.test(lower);

    if (piensaCancelar) {
      wristbandSurveyDraft.value.riesgoCancelacion = true;
      wristbandSurveyDraft.value.nivel = 'alta';
      wristbandSurveyDraft.value.puntaje = 10;
    } else if (tieneDudas) {
      wristbandSurveyDraft.value.riesgoCancelacion = false;
      if (wristbandSurveyDraft.value.nivel === 'baja') {
        wristbandSurveyDraft.value.nivel = 'moderada';
      }
      wristbandSurveyDraft.value.puntaje = Math.max(wristbandSurveyDraft.value.puntaje, 7);
    }

    const draft = wristbandSurveyDraft.value;
    const esUrgente = draft.riesgoCancelacion || draft.nivel === 'alta';

    isWristbandSurveyActive.value = false;
    wristbandSurveyStep.value = 'completed';

    if (pacienteStore.paciente) {
      await anxiety.registrarReporteAnsiedad({
        paciente: pacienteStore.paciente,
        cirugia: pacienteStore.cirugia,
        origen: 'encuesta_pulsera',
        nivel: draft.nivel,
        riesgoCancelacion: draft.riesgoCancelacion,
        puntaje: draft.puntaje,
        estadoAnimo: draft.riesgoCancelacion
          ? `${draft.animoTexto} • Piensa en cancelar`
          : tieneDudas
          ? `${draft.animoTexto} • Con dudas sobre continuar`
          : draft.animoTexto,
        preocupacionPrincipal: draft.inquietud,
        fraseDetectada: esUrgente ? speech : null,
        palabrasClave: ['encuesta por voz pulsera', draft.inquietud],
        comentarioPaciente: `Encuesta completada por llamada en pulsera: "${draft.transcripciones.join(' | ')}"`,
      });
    }

    if (esUrgente) {
      anxiety.openHelpDirectory({
        urgente: true,
        motivo: draft.riesgoCancelacion
          ? 'En la encuesta por pulsera el paciente expresó intención de aplazar o cancelar la cirugía.'
          : 'En la encuesta por pulsera el paciente reportó ansiedad alta antes de su cirugía.',
        fraseDetectada: speech,
        origen: 'encuesta_pulsera',
        alertaEnviadaMedico: true,
      });

      const cierreUrgente = `Muchas gracias por tu sinceridad ${nombre}. Ya envié un aviso prioritario a tu equipo médico en PreCare y dejé el Directorio de Ayuda abierto con los teléfonos directos de enfermería y apoyo emocional. Si quieres seguir conversando conmigo aquí sigo escuchándote.`;
      callHistory.value.push({ role: 'user', content: speech }, { role: 'assistant', content: cierreUrgente });
      lastAssistantResponse.value = cierreUrgente;
      speak(cierreUrgente);
    } else if (draft.nivel === 'moderada') {
      const cierreModerado = `Muchas gracias ${nombre}. Ya envié tus respuestas a tu médico para que esté atento respecto a ${draft.inquietud}. Si tienes alguna pregunta sobre eso puedes hacérmela ahora mismo por aquí, o presionar el botón de tu pulsera para colgar.`;
      callHistory.value.push({ role: 'user', content: speech }, { role: 'assistant', content: cierreModerado });
      lastAssistantResponse.value = cierreModerado;
      speak(cierreModerado);
    } else {
      const cierreTranquilo = `Qué alegría escuchar eso ${nombre}. Ya le confirmé a tu médico que te sientes tranquilo y listo para tu cirugía. Sigue así con tus pautas y aquí estaré en tu pulsera cuando me necesites. Hasta pronto.`;
      callHistory.value.push({ role: 'user', content: speech }, { role: 'assistant', content: cierreTranquilo });
      lastAssistantResponse.value = cierreTranquilo;
      speak(cierreTranquilo, () => {
        hangUp();
      }, { isEnding: true });
    }
  }
}

/**
 * Pronuncia un aviso puntual en el altavoz de la pulsera reutilizando el motor neuronal de Sofi
 */
function speakWristbandReminder(
  text: string,
  callbacks?: { onStart?: () => void; onEnded?: () => void }
) {
  edgeTtsService.unlockAudio();
  edgeTtsService.stop();
  const clean = cleanTextForSpeech(text);
  if (!clean) {
    callbacks?.onEnded?.();
    return;
  }
  edgeTtsService.playNeuralVoice(
    clean,
    () => {
      callbacks?.onEnded?.();
    },
    () => {
      callbacks?.onEnded?.();
    },
    {
      voice: 'es-CO-SalomeNeural',
      rate: '+12%',
      onStart: () => {
        callbacks?.onStart?.();
      },
    }
  );
}

/**
 * Detiene cualquier voz de aviso de la pulsera
 */
function stopWristbandSpeech() {
  edgeTtsService.stop();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Abre el modal e inicia la llamada
 */
function openCall() {
  startCall({ showModal: true });
}

/**
 * Colgar / Finalizar llamada (BUG 1: Detención inmediata de audio, callbacks y STT)
 */
function hangUp() {
  endCall();
}

/**
 * Resetea procesos internos sin alterar flags
 */
function resetCallState() {
  currentSpeakGeneration++;
  isProcessingTurn = false;
  lastProcessedSpeech = '';
  lastProcessedAt = 0;

  edgeTtsService.stop();
  if (currentUtterance) {
    currentUtterance.onstart = null;
    currentUtterance.onend = null;
    currentUtterance.onerror = null;
    currentUtterance = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  if (synth) {
    try {
      synth.cancel();
    } catch {}
  }
  stopSimulatingAudioWaves();

  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  if (pendingListenDelayTimer) {
    clearTimeout(pendingListenDelayTimer);
    pendingListenDelayTimer = null;
  }
  finalTranscriptBuffer = '';

  if (recognitionInstance) {
    try {
      recognitionInstance.abort();
    } catch {}
  }

  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (audioLevelInterval) {
    clearInterval(audioLevelInterval);
    audioLevelInterval = null;
  }
}

/**
 * Finaliza la llamada y resetea los estados
 */
function endCall() {
  console.log('[VoiceCall] Finalizando llamada y limpiando recursos...');
  isCallActive.value = false;
  isCallModalOpen.value = false;
  isWristbandSurveyActive.value = false;
  wristbandSurveyStep.value = 'idle';
  callStatus.value = 'idle';
  audioLevel.value = 0;
  errorMessage.value = null;

  resetCallState();
  callHistory.value = [];
  lastUserTranscript.value = '';
  lastAssistantResponse.value = '';
}

/**
 * Alterna el silenciador de micrófono
 */
function toggleMute() {
  isMuted.value = !isMuted.value;
  if (isMuted.value) {
    stopListening();
    audioLevel.value = 0;
  } else {
    if (callStatus.value === 'listening' && isCallActive.value) {
      startListening();
    }
  }
}

export function useVoiceCall() {
  return {
    isCallModalOpen,
    isCallActive,
    callStatus,
    isMuted,
    callDurationSeconds,
    callDurationFormatted,
    audioLevel,
    errorMessage,
    transferReason,
    openCall,
    startCall,
    startWristbandCall,
    startWristbandSurveyCall,
    isWristbandSurveyActive,
    wristbandSurveyStep,
    speakWristbandReminder,
    stopWristbandSpeech,
    hangUp,
    endCall,
    toggleMute,
    transferToNurse,
    procesarTurnoDelPaciente,
    processUserSpeech,
    callHistory,
    lastUserTranscript,
    lastAssistantResponse,
  };
}
