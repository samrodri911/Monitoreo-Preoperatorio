import { ref, onMounted, onUnmounted } from 'vue';
import { edgeTtsService } from '../services/edgeTtsService';

// Tipado seguro para la Web Speech API nativa
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

export function useVoiceAssistant() {
  // Estados de Reconocimiento de Voz (STT)
  const isListening = ref<boolean>(false);
  const transcript = ref<string>('');
  const speechRecognitionSupported = ref<boolean>(false);
  const voiceError = ref<string | null>(null);

  // Estados de Síntesis de Voz (TTS)
  const isSpeaking = ref<boolean>(false);
  const speechSynthesisSupported = ref<boolean>(false);
  const isAutoVoiceEnabled = ref<boolean>(false);
  const speakingMessageId = ref<string | null>(null);

  let recognitionInstance: any = null;
  let synth: SpeechSynthesis | null = null;

  /**
   * Limpia el texto en formato Markdown para que la síntesis
   * vocal suene fluida, humana y natural sin deletrear caracteres especiales.
   */
  function cleanMarkdownForSpeech(text: string): string {
    return text
      // Eliminar bloques de código markdown
      .replace(/```[\s\S]*?```/g, '')
      // Eliminar código inline
      .replace(/`([^`]+)`/g, '$1')
      // Eliminar negritas y cursivas
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Eliminar encabezados
      .replace(/^#{1,6}\s+/gm, '')
      // Reemplazar enlaces por solo el texto visible
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Eliminar viñetas y listas
      .replace(/^\s*[-*]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Eliminar citas
      .replace(/^>\s?/gm, '')
      // Reemplazar saltos de línea por pausas suaves
      .replace(/\n+/g, '. ')
      // Reemplazar emojis o símbolos que perturben la dicción
      .replace(/[👋⚠️🚨💡🩺💙✨]/g, '')
      .trim();
  }

  // Inicialización de APIs al montar
  onMounted(() => {
    if (typeof window !== 'undefined') {
      const win = window as IWindow;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

      // 1. Detección de STT
      if (SpeechRecognitionClass) {
        speechRecognitionSupported.value = true;
        try {
          recognitionInstance = new SpeechRecognitionClass();
          recognitionInstance.continuous = false;
          recognitionInstance.interimResults = true;
          // Preferir español colombiano o español neutro
          recognitionInstance.lang = 'es-CO';
        } catch (e) {
          console.warn('[useVoiceAssistant] Error inicializando SpeechRecognition:', e);
          speechRecognitionSupported.value = false;
        }
      }

      // 2. Detección de TTS (Edge-TTS neuronal con fallback a síntesis nativa)
      if (typeof window !== 'undefined') {
        speechSynthesisSupported.value = true;
        if ('speechSynthesis' in window) {
          synth = window.speechSynthesis;
        }
      }

      // Cargar preferencia guardada de voz automática
      const savedAutoVoice = localStorage.getItem('preop_auto_voice');
      if (savedAutoVoice !== null) {
        isAutoVoiceEnabled.value = savedAutoVoice === 'true';
      }
    }
  });

  onUnmounted(() => {
    stopListening();
    stopSpeaking();
  });

  /**
   * Inicia el reconocimiento de voz (STT)
   * Recibe callbacks opcionales para texto en tiempo real y final
   */
  function startListening(callbacks?: {
    onInterim?: (text: string) => void;
    onFinal?: (text: string) => void;
  }) {
    if (!speechRecognitionSupported.value || !recognitionInstance) {
      voiceError.value = 'El reconocimiento de voz no está soportado en este navegador.';
      return;
    }

    // Detener síntesis en curso para que no interfiera con el micrófono
    stopSpeaking();

    voiceError.value = null;
    transcript.value = '';

    recognitionInstance.onstart = () => {
      isListening.value = true;
    };

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      const currentText = final || interim;
      transcript.value = currentText;

      if (interim && callbacks?.onInterim) {
        callbacks.onInterim(interim);
      }

      if (final && callbacks?.onFinal) {
        callbacks.onFinal(final);
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('[useVoiceAssistant] Error STT:', event.error);
      isListening.value = false;

      if (event.error === 'not-allowed') {
        voiceError.value = 'Permiso de micrófono denegado. Permite el acceso al micrófono en tu navegador.';
      } else if (event.error === 'no-speech') {
        // Silencio normal del paciente, no alarmar
        voiceError.value = null;
      } else {
        voiceError.value = `Error en captura de voz: ${event.error}`;
      }
    };

    recognitionInstance.onend = () => {
      isListening.value = false;
    };

    try {
      recognitionInstance.start();
    } catch (err: any) {
      // Si ya estaba corriendo, detener y reiniciar limpiamente
      if (err?.name === 'InvalidStateError') {
        recognitionInstance.stop();
      } else {
        voiceError.value = 'No se pudo iniciar el micrófono.';
      }
      isListening.value = false;
    }
  }

  /**
   * Detiene la captura del micrófono
   */
  function stopListening() {
    if (recognitionInstance && isListening.value) {
      try {
        recognitionInstance.stop();
      } catch {
        // Ignorar error al detener
      }
    }
    isListening.value = false;
  }

  function toggleListening(callbacks?: {
    onInterim?: (text: string) => void;
    onFinal?: (text: string) => void;
  }) {
    if (isListening.value) {
      stopListening();
    } else {
      startListening(callbacks);
    }
  }

  /**
   * Sintetiza el texto de respuesta usando voz neuronal hiperrealista (Edge-TTS) con fallback nativo
   */
  async function speak(text: string, messageId?: string, onDone?: () => void) {
    // Si ya está reproduciendo el mismo mensaje, detenerlo (toggle)
    if (isSpeaking.value && messageId && speakingMessageId.value === messageId) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    const cleanText = cleanMarkdownForSpeech(text);
    if (!cleanText) return;

    speakingMessageId.value = messageId || null;
    isSpeaking.value = true;

    await edgeTtsService.playNeuralVoice(
      cleanText,
      // onEnded
      () => {
        isSpeaking.value = false;
        speakingMessageId.value = null;
        onDone?.();
      },
      // onError
      () => {
        isSpeaking.value = false;
        speakingMessageId.value = null;
      },
      // options
      {
        voice: 'es-CO-SalomeNeural',
        rate: '+5%',
        onStart: () => {
          isSpeaking.value = true;
        }
      }
    );
  }

  /**
   * Detiene cualquier locución activa (neuronal o nativa)
   */
  function stopSpeaking() {
    edgeTtsService.stop();
    if (synth && (synth.speaking || isSpeaking.value)) {
      try {
        synth.cancel();
      } catch {}
    }
    isSpeaking.value = false;
    speakingMessageId.value = null;
  }

  /**
   * Alterna la preferencia global de voz automática para respuestas
   */
  function toggleAutoVoice() {
    isAutoVoiceEnabled.value = !isAutoVoiceEnabled.value;
    localStorage.setItem('preop_auto_voice', String(isAutoVoiceEnabled.value));
    if (!isAutoVoiceEnabled.value) {
      stopSpeaking();
    }
  }

  return {
    // STT
    isListening,
    transcript,
    speechRecognitionSupported,
    voiceError,
    startListening,
    stopListening,
    toggleListening,

    // TTS
    isSpeaking,
    speechSynthesisSupported,
    isAutoVoiceEnabled,
    speakingMessageId,
    speak,
    stopSpeaking,
    toggleAutoVoice,
    cleanMarkdownForSpeech,
  };
}
