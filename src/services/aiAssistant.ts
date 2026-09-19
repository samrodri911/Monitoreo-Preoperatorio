import type { Paciente, Cirugia, PautaConCheckin, MaterialEducativo } from '../types/database.types';

export interface ChatMessage {
  id?: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ClinicalContext {
  paciente: Paciente | null;
  cirugia: Cirugia | null;
  pautas: PautaConCheckin[];
  materiales?: MaterialEducativo[];
}

export interface OllamaHealthStatus {
  ok: boolean;
  models: string[];
  modelAvailable?: boolean;
  error?: string;
}

export class AiAssistantService {
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiUrl = (import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434').replace(/\/+$/, '');
    this.model = import.meta.env.VITE_OLLAMA_MODEL || 'gemma3:4b';
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  getModel(): string {
    return this.model;
  }

  setModel(newModel: string) {
    this.model = newModel;
  }

  /**
   * Verifica la conectividad con el servidor local de Ollama y la presencia del modelo
   */
  async checkHealth(signal?: AbortSignal): Promise<OllamaHealthStatus> {
    try {
      const controller = signal ? undefined : new AbortController();
      const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : undefined;
      const effectiveSignal = signal || controller?.signal;

      const response = await fetch(`${this.apiUrl}/api/tags`, {
        method: 'GET',
        signal: effectiveSignal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          ok: false,
          models: [],
          error: `Ollama respondió con código HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const models: string[] = Array.isArray(data.models)
        ? data.models.map((m: any) => String(m.name || m.model))
        : [];
      let modelAvailable = models.some((m: string) => m === this.model || m.startsWith(`${this.model}:`));

      // Si el modelo preferido no está disponible, intentar adoptar automáticamente uno conversacional disponible
      if (!modelAvailable && models.length > 0) {
        const chatModel = models.find(m => !m.includes('embed') && !m.includes('bert'));
        if (chatModel) {
          console.log(`[AiAssistantService] Modelo '${this.model}' no encontrado. Auto-seleccionando disponible: '${chatModel}'`);
          this.model = chatModel;
          modelAvailable = true;
        }
      }

      let errorMsg: string | undefined;
      if (!modelAvailable && models.length > 0) {
        errorMsg = `El modelo "${this.model}" no está instalado en Ollama. Ejecuta \`ollama pull ${this.model}\` o selecciona uno de los instalados (${models.join(', ')}).`;
      } else if (!modelAvailable && models.length === 0) {
        errorMsg = `Ollama está activo pero no tienes modelos descargados. Ejecuta: \`ollama pull ${this.model}\`.`;
      }

      return {
        ok: true,
        models,
        modelAvailable,
        error: errorMsg,
      };
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError';
      return {
        ok: false,
        models: [],
        modelAvailable: false,
        error: isAbort
          ? 'Tiempo de espera agotado al conectar con Ollama.'
          : 'No se pudo conectar con Ollama. Verifica que el servicio esté corriendo en tu equipo.',
      };
    }
  }

  /**
   * Genera el System Prompt clínico inyectando dinámicamente el expediente del paciente
   */
  buildSystemPrompt(context: ClinicalContext): string {
    const { paciente, cirugia, pautas } = context;

    // Cálculo de tiempo restante hasta la cirugía
    let tiempoRestanteStr = 'Fecha no confirmada';
    let horasRestantes = 0;
    if (cirugia?.fecha_programada) {
      const diffMs = new Date(cirugia.fecha_programada).getTime() - Date.now();
      horasRestantes = Math.round(diffMs / (1000 * 60 * 60));
      if (horasRestantes > 24) {
        const dias = Math.floor(horasRestantes / 24);
        const horas = horasRestantes % 24;
        tiempoRestanteStr = `${dias} día(s) y ${horas} hora(s) (aproximadamente ${horasRestantes} horas)`;
      } else if (horasRestantes > 0) {
        tiempoRestanteStr = `${horasRestantes} horas`;
      } else {
        tiempoRestanteStr = 'El procedimiento está programado para hoy o ya pasó la hora límite';
      }
    }

    // Resumen de pautas críticas y su estado de cumplimiento
    const pautasResumen = pautas.length > 0
      ? pautas
          .map(p => {
            const estado = p.checkin?.estado === 'completado' ? 'COMPLETADA' : 'PENDIENTE';
            const critica = p.es_critica ? '[CRÍTICA]' : '[Opcional]';
            return `- ${critica} "${p.titulo}": ${estado} (Límite: ${p.horas_previas}h antes del procedimiento). Detalle: ${p.descripcion}`;
          })
          .join('\n')
      : 'No hay pautas registradas en el sistema.';

    return `Eres "Sofi", el Asistente Clínico Virtual del Ecosistema Prequirúrgico Inclusivo "Tech-and-Touch". Tu propósito es acompañar, educar, contener emocionalmente y guiar al paciente antes de su cirugía para mitigar la ansiedad y prevenir cancelaciones quirúrgicas evitables.

DATOS DEL PACIENTE ACTUAL:
- Nombre: ${paciente?.nombre_completo || 'Paciente'}
- Edad: ${paciente?.edad ? `${paciente.edad} años` : 'No especificada'}
- Contacto de emergencia: ${paciente?.contacto_emergencia || 'No registrado'}

DATOS DE LA CIRUGÍA PROGRAMADA:
- Procedimiento: ${cirugia?.nombre_sencillo || cirugia?.tipo_cirugia || 'Procedimiento Quirúrgico'} (${cirugia?.tipo_cirugia || ''})
- Fecha y hora programada: ${cirugia?.fecha_programada ? new Date(cirugia.fecha_programada).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' }) : 'Pendiente'}
- Tiempo restante hasta la cirugía: ${tiempoRestanteStr}
- Duración estimada: ${cirugia?.duracion_estimada || '1 a 2 horas'}
- Tipo de anestesia: ${cirugia?.tipo_anestesia || 'Anestesia General'}
- Sensación esperada con la anestesia: ${cirugia?.sensacion_anestesia || 'Te quedarás plácidamente dormido y sin dolor.'}
- Sala de Recuperación (URPA): ${cirugia?.tiempo_recuperacion_sala || '1 a 2 horas'}
- Tiempo de incapacidad/reposo estimado: ${cirugia?.dias_incapacidad_estimados || 'Según evolución'}

PAUTAS PREOPERATORIAS Y ESTADO DE CHECK-IN:
${pautasResumen}

======================================================================
REGLAS MANDATORIAS DE COMUNICACIÓN Y ESTILO (PROTOCOLO TRIZ TECH-AND-TOUCH)
======================================================================

1. REGLA DE MÁXIMA BREVEDAD:
   - Responde siempre con un MÁXIMO de 2 o 3 párrafos cortos y concisos.
   - En modo voz o respuestas habladas: MANTÉN LA RESPUESTA EN MENOS DE 60-70 PALABRAS (idealmente 2 a 3 frases fluidas).
   - Prohibido extenderse en introducciones o explicaciones enciclopédicas innecesarias.

2. IR DIRECTO AL PUNTO:
   - Responde en la PRIMERA FRASE exactamente lo que el usuario preguntó, sin rodeos ni preámbulos.
   - Si el paciente pregunta qué evitar o qué no hacer, lista ÚNICAMENTE las restricciones y pautas activas o pendientes para su momento actual. NUNCA menciones el historial previo ni pautas que ya fueron superadas.

3. LENGUAJE COTIDIANO Y CERCANO (PROHIBICIÓN DE FRASES CLICHÉ):
   - PROHIBIDO TERMINANTEMENTE usar frases hechas, acartonadas o condescendientes como:
     * "entendido tu curiosidad"
     * "asegurar una recuperación óptima"
     * "no hay necesidad de preocuparse"
     * "comprendo tu inquietud"
     * "es un placer asistirte"
   - REEMPLÁZALAS por validaciones naturales, cálidas y humanas:
     * "Es totalmente normal tener esa duda"
     * "Vas por muy buen camino"
     * "Es muy comprensible lo que sientes"
     * "Aquí estoy para que lo resolvamos juntos"

4. FOCO EN SENSACIONES, NO EN TÉCNICAS ANATÓMICAS:
   - Evita descripciones anatómicas crudas o técnicas gráficas del interior del cuerpo (cero detalles de disección, cortes de órganos o sangrados).
   - Enfócate siempre en el confort y las sensaciones de bienestar y seguridad del paciente:
     * Estarás plácidamente dormido y sin sentir dolor durante todo el procedimiento.
     * Son incisiones milimétricas (mínima invasión) diseñadas para que sanes mucho más rápido.
     * Contarás con monitoreo constante de tus signos vitales segundo a segundo por especialistas a tu lado.

======================================================================
PROTOCOLO CLÍNICO DE ACOMPAÑAMIENTO INVISIBLE Y CONTENCIÓN PASIVA (RD4 / A4)
======================================================================

5. MANEJO ORGÁNICO Y PROGRESIVO DE INFORMACIÓN SENSIBLE (EVITAR SOBRECARGA COGNITIVA):
   - DOSIFICACIÓN EMPÁTICA: Responde estrictamente lo que el paciente pregunta paso a paso. No agregues listas abrumadoras de posibles complicaciones que el paciente no haya consultado.
   - NORMALIZACIÓN DE SENSACIONES: Explica con naturalidad que sentir nervios, frío en la sala de quirófano o un mareo leve al despertar de la anestesia es completamente esperado y atendido por el equipo con mantas térmicas y analgésicos.

6. MONITOREO Y CONTENCIÓN PASIVA DE ANSIEDAD (CERO TESTS INVASIVOS):
   - CERO TESTS REACTIVOS: Está terminantemente prohibido pedirle al paciente que califique su ansiedad (ej. "¿del 1 al 10 qué tan ansioso estás?") o aplicar escalas clínicas visibles.
   - DETECCIÓN LÉXICA/TONAL PASIVA: Si el paciente expresa palabras de pánico o miedo intenso ("tengo mucho miedo", "¿y si no despierto?", "estoy temblando", etc.):
     1. Valida su emoción en la primera frase con serenidad ("Es totalmente normal tener esa duda o sentir temor antes de una cirugía...").
     2. Brinda un ancla de tranquilidad concreta: recuérdale que estará dormido sin dolor y cuidado por su equipo médico segundo a segundo.
     3. Ofrece con delicadeza el puente humano: "Si sientes que quieres hablar con enfermería para estar más tranquilo, avísame y te enlazo de inmediato".

7. LÍMITES DE SEGURIDAD MÉDICA Y EMERGENCIAS:
   - Eres un asistente informativo y de acompañamiento prequirúrgico; nunca reemplazas el criterio del cirujano tratante ni del anestesiólogo.
   - SÍNTOMAS DE ALARMA O DOLOR AGUDO: Si el paciente reporta dolor intenso o insoportable, fiebre (>38°C), dificultad para respirar o sangrado, ordénale con prioridad y claridad que acuda a Urgencias o llame a la línea de enfermería (+57 300 999 8877).

8. PAUTAS DE AYUNO, FÁRMACOS Y MALETA:
   - Recuerda el cumplimiento estricto del ayuno (cero alimentos sólidos y líquidos en las horas establecidas).
   - Solo se deben tomar con un sorbo mínimo de agua los medicamentos expresamente autorizados.
   - Maleta: ropa holgada, calzado cómodo cerrado, documento de identidad, y dejar en casa joyas, esmalte y lentes de contacto.

DIRECTRICES FINALES DE ESTILO:
- Tono sumamente cálido, tranquilizador, empático y respetuoso. Trata al paciente por su nombre si resulta natural.
- Responde siempre en español.`;
  }

  /**
   * Realiza una consulta en Streaming a la API de Ollama (/api/chat)
   * Soporta cancelación mediante AbortSignal.
   */
  async streamChat(options: {
    messages: ChatMessage[];
    systemPrompt?: string;
    onChunk: (chunk: string) => void;
    onDone: (fullText: string) => void;
    onError: (error: Error) => void;
    signal?: AbortSignal;
  }): Promise<void> {
    const { messages, systemPrompt, onChunk, onDone, onError, signal } = options;

    try {
      // Estructurar array de mensajes para Ollama
      const formattedMessages: { role: string; content: string }[] = [];

      if (systemPrompt) {
        formattedMessages.push({ role: 'system', content: systemPrompt });
      }

      for (const msg of messages) {
        if (msg.role === 'system' && systemPrompt) continue; // Evitar duplicar
        formattedMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }

      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          stream: true,
          options: {
            temperature: 0.6,
          },
        }),
        signal,
      });

      if (!response.ok) {
        let errorDetails = `Código HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errorDetails = errData.error;
        } catch {
          // Ignorar si no es JSON
        }
        throw new Error(`Error en Ollama (${errorDetails})`);
      }

      if (!response.body) {
        throw new Error('La respuesta del servidor no tiene flujo de datos (body nulo).');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';

      try {
        while (true) {
          if (signal?.aborted) {
            reader.cancel();
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.message?.content) {
                const token = parsed.message.content;
                fullText += token;
                onChunk(token);
              }
              if (parsed.done) {
                // Completado por Ollama
              }
            } catch (jsonErr) {
              console.warn('[AiAssistantService] Fragmento no parseable:', trimmed, jsonErr);
            }
          }
        }

        // Procesar cualquier remanente en el buffer
        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer.trim());
            if (parsed.message?.content) {
              const token = parsed.message.content;
              fullText += token;
              onChunk(token);
            }
          } catch {
            // Fin de buffer
          }
        }

        onDone(fullText);
      } finally {
        reader.releaseLock();
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || signal?.aborted) {
        // Cancelación deliberada por el usuario
        console.log('[AiAssistantService] Generación cancelada por AbortController.');
        return;
      }
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export const aiAssistantService = new AiAssistantService();
