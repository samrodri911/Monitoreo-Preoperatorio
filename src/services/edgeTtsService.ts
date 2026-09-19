/**
 * Servicio de Síntesis de Voz Neuronal con Edge-TTS y Fallback Nativo
 * Ecosistema Phygital Inclusivo Tech-and-Touch
 * 
 * Voz Principal: es-CO-SalomeNeural (Acento colombiano cálido, empático y preoperatorio)
 * Resiliencia: Si el microservicio local de Python no está encendido o falla,
 * conmuta automáticamente a window.speechSynthesis sin interrumpir la experiencia.
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
  private currentAudio: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;
  private abortController: AbortController | null = null;
  private isNeuralAvailable: boolean | null = null;

  constructor() {
    this.apiUrl = import.meta.env.VITE_TTS_API_URL || 'http://localhost:8000/api/tts';
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  getIsNeuralAvailable(): boolean | null {
    return this.isNeuralAvailable;
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
    // 1. Abortar petición de red pendiente
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // 2. Detener audio HTML5 de Edge-TTS
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.onplay = null;
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.src = '';
      this.currentAudio.load();
      this.currentAudio = null;
    }

    // 3. Liberar memoria del blob URL
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    // 4. Detener síntesis nativa del navegador por seguridad
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  /**
   * Reproduce el texto usando la voz neuronal hiperrealista de Edge-TTS
   * Si el backend no está disponible, conmuta transparentemente a síntesis nativa.
   */
  async playNeuralVoice(
    text: string,
    onEnded?: () => void,
    onError?: (error?: any) => void,
    options?: NeuralTtsOptions
  ): Promise<HTMLAudioElement | null> {
    this.stop();

    const clean = text.trim();
    if (!clean) {
      onEnded?.();
      return null;
    }

    try {
      this.abortController = new AbortController();

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: clean,
          voice: options?.voice || 'es-CO-SalomeNeural',
          rate: options?.rate || '+5%',
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al sintetizar voz en microservicio.`);
      }

      const blob = await response.blob();
      this.currentBlobUrl = URL.createObjectURL(blob);
      const audio = new Audio(this.currentBlobUrl);
      this.currentAudio = audio;

      audio.onplay = () => {
        options?.onStart?.();
      };

      audio.onended = () => {
        if (this.currentBlobUrl) {
          URL.revokeObjectURL(this.currentBlobUrl);
          this.currentBlobUrl = null;
        }
        this.currentAudio = null;
        onEnded?.();
      };

      audio.onerror = (e) => {
        console.warn('[EdgeTtsService] Error en reproducción de audio HTML5, ejecutando fallback:', e);
        this.fallbackNativeSpeech(clean, onEnded, onError, options?.onStart);
      };

      await audio.play();
      this.isNeuralAvailable = true;
      return audio;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // Reproducción cancelada intencionalmente (ej. usuario colgó o interrumpió)
        return null;
      }

      console.warn('[EdgeTtsService] Microservicio no disponible o error de red. Conmutando a voz nativa:', err?.message || err);
      this.isNeuralAvailable = false;
      this.fallbackNativeSpeech(clean, onEnded, onError, options?.onStart);
      return null;
    }
  }

  /**
   * Fallback de alta resiliencia usando SpeechSynthesis nativo del navegador
   */
  private fallbackNativeSpeech(
    text: string,
    onEnded?: () => void,
    onError?: (error?: any) => void,
    onStart?: () => void
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onError?.(new Error('Síntesis de voz no disponible en este entorno.'));
      onEnded?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.05;
      utterance.lang = 'es-CO';

      // Buscar voz femenina en español si existe
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
      const femaleKeywords = ['sabina', 'paulina', 'helena', 'monica', 'laura', 'sofia', 'paloma', 'lucia', 'salome', 'zira', 'elena', 'female', 'mujer'];
      const femaleVoice = spanishVoices.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k))) || spanishVoices[0];

      if (femaleVoice) {
        utterance.voice = femaleVoice;
        utterance.lang = femaleVoice.lang;
      }

      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onend = () => {
        onEnded?.();
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[EdgeTtsService-Fallback] Error nativo:', e);
          onError?.(e);
        }
        onEnded?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[EdgeTtsService] Error en fallback nativo:', e);
      onError?.(e);
      onEnded?.();
    }
  }
}

export const edgeTtsService = new EdgeTtsService();
