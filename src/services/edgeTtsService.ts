/**
 * Servicio de Síntesis de Voz Neuronal con Edge-TTS y Fallback Nativo
 * Ecosistema Phygital Inclusivo PreCare
 *
 * Voz Principal: es-CO-SalomeNeural (Acento colombiano cálido, empático y preoperatorio)
 * Resiliencia:
 * - Token monotónico `currentRequestId` para evitar cualquier superposición o repetición de voces.
 * - Elemento `HTMLAudioElement` persistente y desbloqueable (`unlockAudio`) para garantizar reproducción en Chrome/Safari.
 * - Timeout amplio de 10s para frases largas de Edge-TTS (evita caer a voz robótica cuando el microservicio sí responde 200 OK).
 * - Si el microservicio local está apagado (Failed to fetch), conmuta de inmediato a SpeechSynthesis nativo.
 */

export interface NeuralTtsOptions {
  voice?: string;
  rate?: string;
  onStart?: () => void;
  onEnded?: () => void;
  onError?: (err?: any) => void;
}

class EdgeTtsService {
  private apiUrl: string;
  private audioElement: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;
  private abortController: AbortController | null = null;
  private isNeuralAvailable: boolean | null = null;
  private nativeUtterance: SpeechSynthesisUtterance | null = null;
  private currentRequestId = 0;
  private isAudioUnlocked = false;

  constructor() {
    this.apiUrl = import.meta.env.VITE_TTS_API_URL || 'http://localhost:8000/api/tts';
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  getIsNeuralAvailable(): boolean | null {
    return this.isNeuralAvailable;
  }

  private getOrCreateAudioElement(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
    }
    return this.audioElement;
  }

  /**
   * Debe invocarse sincrónicamente en el clic del usuario al iniciar una llamada
   * para desbloquear la política de autoplay de Chrome/Safari antes de los `await` de red.
   */
  unlockAudio(): void {
    if (typeof window === 'undefined') return;
    try {
      const audio = this.getOrCreateAudioElement();
      if (audio && !this.isAudioUnlocked) {
        // WAV silencioso mínimo de 1 sample para autorizar el elemento HTMLAudioElement
        audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        audio.volume = 0.01;
        const p = audio.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1;
            this.isAudioUnlocked = true;
          }).catch(() => {
            audio.volume = 1;
          });
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
    } catch {}
  }

  /**
   * Verifica la disponibilidad del microservicio local de Edge-TTS
   */
  async checkHealth(): Promise<boolean> {
    try {
      const healthUrl = this.apiUrl.replace(/\/api\/tts\/?$/, '/api/health');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      this.isNeuralAvailable = res.ok;
      return res.ok;
    } catch {
      this.isNeuralAvailable = false;
      return false;
    }
  }

  /**
   * Limpia y detiene cualquier reproducción de audio en curso (Edge-TTS o síntesis nativa)
   */
  stop(): void {
    // Invalidar cualquier petición/audio anterior mediante el token monotónico
    this.currentRequestId++;

    // 1. Abortar petición de red pendiente
    if (this.abortController) {
      try {
        this.abortController.abort('manual_stop');
      } catch {}
      this.abortController = null;
    }

    // 2. Detener audio HTML5 de Edge-TTS limpiando handlers primero para evitar onerror falso
    if (this.audioElement) {
      this.audioElement.onplay = null;
      this.audioElement.onended = null;
      this.audioElement.onerror = null;
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {}
    }

    // 3. Liberar memoria del blob URL
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    // 4. Detener síntesis nativa del navegador por seguridad
    if (this.nativeUtterance) {
      this.nativeUtterance.onstart = null;
      this.nativeUtterance.onend = null;
      this.nativeUtterance.onerror = null;
      this.nativeUtterance = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  /**
   * Reproduce el texto usando la voz neuronal hiperrealista de Edge-TTS (es-CO-SalomeNeural).
   * Garantiza que nunca se repitan ni encimen dos frases al mismo tiempo.
   */
  async playNeuralVoice(
    text: string,
    onEnded?: () => void,
    onError?: (error?: any) => void,
    options?: NeuralTtsOptions
  ): Promise<HTMLAudioElement | null> {
    this.stop();
    const requestId = this.currentRequestId;

    const clean = text.trim();
    if (!clean) {
      onEnded?.();
      return null;
    }

    let fetchTimeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      const controller = new AbortController();
      this.abortController = controller;

      // Timeout generoso de 10 segundos: Edge-TTS suele tardar 1.5s-4s en frases largas de encuesta.
      // Si el servidor está apagado, fetch falla inmediatamente (<50ms) por Connection Refused.
      fetchTimeoutId = setTimeout(() => {
        if (requestId === this.currentRequestId) {
          console.warn('[EdgeTtsService] Timeout de microservicio (10s). Conmutando a síntesis nativa.');
          controller.abort('tts_timeout');
        }
      }, 10000);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: clean,
          voice: options?.voice || 'es-CO-SalomeNeural',
          rate: options?.rate || '+12%',
        }),
        signal: controller.signal,
      });

      if (fetchTimeoutId) {
        clearTimeout(fetchTimeoutId);
        fetchTimeoutId = null;
      }

      // Si mientras esperábamos el servidor hubo otra llamada o stop(), descartar silenciosamente
      if (requestId !== this.currentRequestId) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al sintetizar voz en microservicio.`);
      }

      const blob = await response.blob();
      if (requestId !== this.currentRequestId) {
        return null;
      }

      if (!blob || blob.size < 100) {
        throw new Error('Audio MP3 vacío recibido desde Edge-TTS.');
      }

      const audio = this.getOrCreateAudioElement();
      if (!audio) {
        throw new Error('Entorno sin soporte HTMLAudioElement.');
      }

      if (this.currentBlobUrl) {
        URL.revokeObjectURL(this.currentBlobUrl);
      }
      const blobUrl = URL.createObjectURL(blob);
      this.currentBlobUrl = blobUrl;

      let finished = false;
      const safeFinish = () => {
        if (finished || requestId !== this.currentRequestId) return;
        finished = true;
        audio.onplay = null;
        audio.onended = null;
        audio.onerror = null;
        if (this.currentBlobUrl === blobUrl) {
          URL.revokeObjectURL(blobUrl);
          this.currentBlobUrl = null;
        }
        onEnded?.();
      };

      audio.onplay = () => {
        if (requestId !== this.currentRequestId) {
          try {
            audio.pause();
          } catch {}
          return;
        }
        options?.onStart?.();
      };

      audio.onended = () => {
        safeFinish();
      };

      audio.onerror = (e) => {
        if (requestId !== this.currentRequestId) return;
        console.warn('[EdgeTtsService] Error en reproducción HTMLAudioElement, ejecutando fallback:', e);
        this.fallbackNativeSpeech(clean, requestId, onEnded, onError, options?.onStart);
      };

      audio.volume = 1;
      audio.src = blobUrl;
      audio.load();

      await audio.play();
      if (requestId !== this.currentRequestId) {
        try {
          audio.pause();
        } catch {}
        return null;
      }

      this.isNeuralAvailable = true;
      return audio;
    } catch (err: any) {
      if (fetchTimeoutId) {
        clearTimeout(fetchTimeoutId);
        fetchTimeoutId = null;
      }

      // CRÍTICO: Si esta petición ya fue reemplazada o detenida por el usuario, NUNCA disparar fallback!
      if (requestId !== this.currentRequestId) {
        return null;
      }

      console.warn(
        '[EdgeTtsService] Microservicio no disponible, autoplay bloqueado o error. Conmutando a voz nativa:',
        err?.message || err
      );
      this.isNeuralAvailable = false;
      this.fallbackNativeSpeech(clean, requestId, onEnded, onError, options?.onStart);
      return null;
    }
  }

  /**
   * Fallback de alta resiliencia usando SpeechSynthesis nativo del navegador
   */
  private fallbackNativeSpeech(
    text: string,
    requestId: number,
    onEnded?: () => void,
    onError?: (error?: any) => void,
    onStart?: () => void
  ): void {
    if (requestId !== this.currentRequestId) return;

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onError?.(new Error('Síntesis de voz no disponible en este entorno.'));
      onEnded?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.nativeUtterance = utterance;
      utterance.rate = 1.08;
      utterance.pitch = 1.04;
      utterance.lang = 'es-CO';

      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
      const femaleKeywords = [
        'salome', 'paulina', 'sabina', 'helena', 'monica', 'laura',
        'sofia', 'paloma', 'lucia', 'zira', 'elena', 'female', 'mujer',
      ];
      const femaleVoice =
        spanishVoices.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k))) ||
        spanishVoices[0];

      if (femaleVoice) {
        utterance.voice = femaleVoice;
        utterance.lang = femaleVoice.lang;
      }

      let endedCalled = false;
      let startCalled = false;
      let watchdogTimer: ReturnType<typeof setTimeout> | null = null;

      const safeEnd = () => {
        if (endedCalled || requestId !== this.currentRequestId) return;
        endedCalled = true;
        if (watchdogTimer) clearTimeout(watchdogTimer);
        this.nativeUtterance = null;
        onEnded?.();
      };

      utterance.onstart = () => {
        if (requestId !== this.currentRequestId) {
          window.speechSynthesis.cancel();
          return;
        }
        if (!startCalled) {
          startCalled = true;
          onStart?.();
        }
      };

      utterance.onend = () => {
        safeEnd();
      };

      utterance.onerror = (e) => {
        if (requestId !== this.currentRequestId) return;
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[EdgeTtsService-Fallback] Error nativo:', e);
          onError?.(e);
        }
        safeEnd();
      };

      // Watchdog amplio para voz nativa (evita cortar frases largas antes de tiempo)
      const expectedDurationMs = Math.max(8000, cleanDurationEstimateMs(text));
      watchdogTimer = setTimeout(() => {
        if (requestId === this.currentRequestId) {
          console.log('[EdgeTtsService-Fallback] Watchdog de voz nativa ejecutado tras timeout');
          safeEnd();
        }
      }, expectedDurationMs);

      setTimeout(() => {
        if (requestId === this.currentRequestId && this.nativeUtterance && !endedCalled && !startCalled) {
          startCalled = true;
          onStart?.();
        }
      }, 80);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (requestId !== this.currentRequestId) return;
      this.nativeUtterance = null;
      console.warn('[EdgeTtsService] Error en fallback nativo:', e);
      onError?.(e);
      onEnded?.();
    }
  }
}

function cleanDurationEstimateMs(text: string): number {
  // ~11 caracteres/segundo + 5 segundos de holgura
  return Math.ceil((text.length / 11) * 1000) + 5000;
}

export const edgeTtsService = new EdgeTtsService();
