import { ref, computed } from 'vue';
import { usePacienteStore } from '../stores/pacienteStore';
import { aiAssistantService } from '../services/aiAssistant';
import { edgeTtsService } from '../services/edgeTtsService';
import { supabase, isSupabaseConfigured, mockRealtimeBus } from '../lib/supabase';

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

let recognitionInstance: any = null;
let synth: SpeechSynthesis | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let timerInterval: any = null;
let audioLevelInterval: any = null;
let silenceTimer: any = null;
let finalTranscriptBuffer = '';
let activeAbortController: AbortController | null = null;
let resolvedOllamaModel: string | null = null;

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
    if (callStatus.value !== 'listening' || isMuted.value || !isCallActive.value) return;

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
    console.log(`[VoiceCall] Evento onresult -> transcript parcial: "${interimTranscript.trim()}" | transcript final: "${finalTranscriptBuffer.trim()}"`);
    console.log('[VoiceCall] Escuchado hasta ahora:', currentFullText);

    if (currentFullText.length > 0) {
      audioLevel.value = Math.min(95, 30 + currentFullText.length * 2);

      // Reiniciar temporizador de silencio (1.5 segundos) cada vez que el usuario produce fonemas
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
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
    if (isCallActive.value && callStatus.value === 'listening' && !isMuted.value) {
      setTimeout(() => {
        if (isCallActive.value && callStatus.value === 'listening' && !isMuted.value) {
          try {
            recognitionInstance.start();
            console.log('[VoiceCall] Micrófono reanudado automáticamente tras onend inactivo');
          } catch (err: any) {
            if (err?.name !== 'InvalidStateError') {
              console.warn('[VoiceCall] Error al reanudar reconocimiento tras onend:', err);
            }
          }
        }
      }, 250);
    }
  };
}

/**
 * Inicia la captura del micrófono
 */
function startListening() {
  if (!isCallActive.value || isMuted.value) return;
  if (callStatus.value === 'ending' || callStatus.value === 'transferred') {
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
        if (callStatus.value === 'listening' && isCallActive.value && !isMuted.value) {
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
        if (callStatus.value === 'listening' && isCallActive.value && !isMuted.value) {
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
 * Detiene la captura del micrófono de forma segura
 */
function stopListening() {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch {}
  }
}

/**
 * Sintetiza la voz del asistente por altavoces (Voz neuronal hiperrealista "Sofi" con fallback nativo)
 */
function speak(text: string, onDone?: () => void) {
  // Detener micrófono de inmediato mientras habla el asistente para evitar eco
  stopListening();

  // 1. Detener cualquier audio previo (neuronal o nativo)
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

  console.log('[VoiceCall] Disparando síntesis de voz neuronal con texto:', clean);

  edgeTtsService.playNeuralVoice(
    clean,
    // onEnded
    () => {
      console.log('[VoiceCall] Sofi terminó de hablar. Reabriendo micrófono...');
      stopSimulatingAudioWaves();
      audioLevel.value = 0;
      if (!isCallActive.value || callStatus.value === 'ending' || callStatus.value === 'transferred' || callStatus.value === 'idle') {
        return;
      }
      if (onDone) {
        onDone();
      } else {
        startListening();
      }
    },
    // onError
    (e) => {
      console.warn('[VoiceCall] Error o interrupción en reproducción:', e);
      stopSimulatingAudioWaves();
      audioLevel.value = 0;
      if (!isCallActive.value || callStatus.value === 'ending' || callStatus.value === 'transferred' || callStatus.value === 'idle') {
        return;
      }
      if (onDone) {
        onDone();
      } else {
        startListening();
      }
    },
    // options
    {
      voice: 'es-CO-SalomeNeural',
      rate: '+5%',
      onStart: () => {
        // Si el usuario colgó mientras cargaba el audio, parar inmediatamente
        if (!isCallActive.value || callStatus.value === 'idle' || callStatus.value === 'ending') {
          edgeTtsService.stop();
          return;
        }
        callStatus.value = 'speaking';
        startSimulatingAudioWaves();
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
 * Procesa la intervención del paciente (Ollama con stream: false)
 */
async function procesarTurnoDelPaciente(userSpeech: string) {
  const speech = userSpeech.trim();
  if (!speech || !isCallActive.value) return;

  // 1. Detener de inmediato el micrófono y limpiar buffer
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  try {
    recognitionInstance?.stop();
  } catch {}
  finalTranscriptBuffer = '';

  // 2. Detección de Despedida / Cierre de llamada
  if (/adi[oó]s|hasta luego|chao|hasta pronto|colgar|terminar llamada|cerrar llamada/i.test(speech)) {
    callStatus.value = 'ending';
    const pacienteStore = usePacienteStore();
    const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || '';
    const despedida = `Comprendo${nombre ? ` ${nombre}` : ''}. Que tengas un excelente descanso y mucho ánimo con tu preparación. Estaré aquí si me necesitas. Hasta pronto.`;
    speak(despedida, () => {
      hangUp();
    });
    return;
  }

  // 3. Detección de solicitud explícita de hablar con un humano / enfermería (RD4)
  if (/enfermer[ií]a|enfermera|enfermero|persona real|humano|hablar con alguien|auxilio|urgencia/i.test(speech)) {
    transferToNurse('El paciente solicitó atención humana explícitamente durante la llamada de voz.');
    return;
  }

  // 4. Cambiar estado visual a pensando
  callStatus.value = 'thinking';
  audioLevel.value = 10;

  const pacienteStore = usePacienteStore();
  const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || 'Paciente';
  const cirugiaNombre = pacienteStore.cirugia?.nombre_sencillo || pacienteStore.cirugia?.tipo_cirugia || 'tu procedimiento';

  const voicePrompt = `ESTÁS EN UNA LLAMADA TELEFÓNICA 100% DE VOZ con el paciente ${nombre} (cirugía: ${cirugiaNombre}).
Habla en primera persona directamente como Sofi:
- PROHIBIDO INCLUIR etiquetas, acotaciones teatrales o prefijos como "(Altavoz)", "(Voz)", "(Sofi):", "[Altavoz]" o similares. Comienza a hablarle al paciente directamente desde la primera palabra.
- REGLA DE MÁXIMA BREVEDAD: Responde con MÁXIMO 2 o 3 frases cortas (menos de 60-70 palabras en total).
- IR DIRECTO AL PUNTO: Contesta en la PRIMERA FRASE exactamente lo que el paciente preguntó. Si pregunta qué evitar, menciona únicamente las restricciones activas en este momento, sin repasar el historial.
- LENGUAJE COTIDIANO Y CERCANO: Prohibido decir "entendido tu curiosidad", "asegurar una recuperación óptima", "no hay necesidad de preocuparse" o fórmulas cliché. Usa validaciones naturales como "Es totalmente normal tener esa duda" o "Vas por muy buen camino".
- FOCO EN SENSACIONES Y CONFORT: Nada de descripciones anatómicas crudas del cuerpo interno. Enfócate en el confort (estarás dormido sin dolor, incisiones milimétricas, monitoreo constante).
- CERO FORMATO O EMOJIS: Habla en prosa continua, sin viñetas, asteriscos, negritas ni emojis.

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

    speak(respuestaAsistente);
  } catch (err: any) {
    activeAbortController = null;
    console.warn('[VoiceCall] Error al comunicarse con Ollama:', err);

    if (!isCallActive.value) return;

    // Contingencia de voz inmediata
    const fallbackMsg = `Lo siento ${nombre}, tuve un pequeño problema de conexión con mi sistema. ¿Podrías repetirme tu duda o deseas que contactemos a enfermería?`;
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
  const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || '';
  const mensajeTranquilizador = `Comprendo perfectamente${nombre ? ` ${nombre}` : ''}. Ya he puesto en sobreaviso a nuestra enfermería de turno para brindarte apoyo inmediato. Puedes llamar al número que ves en pantalla o esperar su contacto.`;

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
function startCall() {
  console.log('[VoiceCall] Iniciando llamada con Asistente Sofi');
  // 1. Limpieza rigurosa previa de cualquier audio o proceso anterior
  resetCallState();

  initSpeechApis();
  errorMessage.value = null;
  transferReason.value = null;
  hasNurseBeenAlerted.value = false;
  isMuted.value = false;
  callDurationSeconds.value = 0;
  isCallActive.value = true;
  isCallModalOpen.value = true;
  callStatus.value = 'greeting';
  callHistory.value = [];

  // Iniciar cronómetro de llamada
  timerInterval = setInterval(() => {
    if (isCallActive.value) {
      callDurationSeconds.value++;
    }
  }, 1000);

  const pacienteStore = usePacienteStore();
  const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || 'Paciente';
  const cirugiaNombre = pacienteStore.cirugia?.nombre_sencillo || pacienteStore.cirugia?.tipo_cirugia || 'tu procedimiento quirúrgico';

  const saludoInicial = `¡Hola ${nombre}! Soy Sofi, tu acompañante clínica preoperatoria. Estamos en una llamada directa de voz. Cuéntame con calma, ¿cómo te sientes hoy o qué duda tienes sobre tu ${cirugiaNombre}? Te escucho.`;

  // Síntesis del saludo inicial con voz femenina; al terminar, activa el micrófono automáticamente
  speak(saludoInicial, () => {
    if (isCallActive.value && callStatus.value !== 'transferred' && callStatus.value !== 'ending') {
      startListening();
    }
  });
}

/**
 * Abre el modal e inicia la llamada
 */
function openCall() {
  startCall();
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
  callStatus.value = 'idle';
  audioLevel.value = 0;
  errorMessage.value = null;

  resetCallState();
  callHistory.value = [];
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
    hangUp,
    endCall,
    toggleMute,
    transferToNurse,
    procesarTurnoDelPaciente,
    processUserSpeech,
  };
}
