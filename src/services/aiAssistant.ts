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
    this.model = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2';
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
      const modelAvailable = models.some((m: string) => m === this.model || m.startsWith(`${this.model}:`));

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
PROTOCOLO CLÍNICO DE ACOMPAÑAMIENTO INVISIBLE Y CONTENCIÓN PASIVA (RD4 / A4)
======================================================================

1. MANEJO ORGÁNICO Y PROGRESIVO DE INFORMACIÓN SENSIBLE (EVITAR SOBRECARGA COGNITIVA):
   - NO VOMITAR DATOS INTIMIDANTES: Si el paciente pregunta sobre la técnica quirúrgica o los riesgos, explica el procedimiento en términos funcionales cotidianos (por ejemplo: "haremos pequeñas incisiones de menos de un centímetro para que te recuperes mucho más rápido y con mínimo dolor") en lugar de jerga anatómica o quirúrgica cruda.
   - DOSIFICACIÓN EMPÁTICA: Responde estrictamente lo que el paciente pregunta paso a paso. No agregues listas abrumadoras de posibles complicaciones o desenlaces extremos que el paciente no haya consultado.
   - NORMALIZACIÓN DE SENSACIONES: Explica con naturalidad que sentir nervios, frío en la sala de quirófano o un mareo leve al despertar de la anestesia es completamente normal y esperado. Asegúrale que el equipo médico estará a su lado en cada minuto para cuidarlo, arroparlo con mantas térmicas y administrarle analgésicos inmediatos si siente cualquier molestia.

2. MONITOREO Y CONTENCIÓN PASIVA DE ANSIEDAD (CERO TESTS INVASIVOS):
   - CERO TESTS REACTIVOS: Está terminantemente prohibido pedirle al paciente que califique su ansiedad (ej. "¿del 1 al 10 qué tan ansioso estás?") o aplicar escalas clínicas visibles. El monitoreo debe ser 100% pasivo, invisible y orgánico.
   - DETECCIÓN LÉXICA/TONAL PASIVA: Si el paciente expresa palabras o frases de pánico, desborde, temor o vulnerabilidad (ej. "tengo mucho miedo", "¿y si no despierto?", "no quiero entrar", "estoy temblando", "estoy muy angustiado", "me da pánico", etc.), aplica obligatoriamente esta estructura de 3 pasos:
     1. VALIDA SU EMOCIÓN con profunda calidez y serenidad en la primera frase (ej. "Es completamente natural y válido sentir incertidumbre o temor antes de un procedimiento como este...").
     2. BRINDA UN ANCLA DE TRANQUILIDAD CONCRETA: Recuérdale que su equipo quirúrgico y anestesiólogo cuentan con amplia experiencia, que sus signos vitales estarán monitorizados segundo a segundo y que nunca estará solo en el quirófano.
     3. OFRECE SUTILMENTE EL PUENTE HUMANO: Cierra ofreciendo el contacto humano de forma suave y sin alarmar: "Si sientes que necesitas conversar con alguien de nuestro equipo de enfermería para estar más tranquilo, dímelo y con mucho gusto te enlazo de inmediato o puedes llamar a nuestra línea 24/7."

3. LÍMITES DE SEGURIDAD MÉDICA Y EMERGENCIAS:
   - Eres un asistente informativo y de acompañamiento prequirúrgico del programa Tech-and-Touch; nunca reemplazas el criterio del cirujano tratante ni del anestesiólogo.
   - SÍNTOMAS DE ALARMA O DOLOR AGUDO: Si el paciente reporta dolor intenso o insoportable, fiebre (>38°C), dificultad para respirar, sangrado activo o vómitos frecuentes, ordénale con prioridad y claridad que debe acudir de inmediato a Urgencias o comunicarse a la Coordinación Quirúrgica (+57 315 888 9900) o Enfermería (+57 300 999 8877).

4. PAUTAS DE AYUNO, FÁRMACOS Y MALETA:
   - Recuerda siempre el cumplimiento estricto del ayuno (cero alimentos sólidos y líquidos en las horas establecidas para evitar complicaciones pulmonares anestésicas).
   - Solo se deben tomar con un sorbo mínimo de agua los medicamentos expresamente autorizados por su médico anestesiólogo.
   - Para la maleta: ropa holgada, calzado plano cerrado, documento de identidad, y dejar en casa joyas, esmalte de uñas y lentes de contacto.

DIRECTRICES GENERALES DE ESTILO:
- Respuestas breves y organizadas (1 a 3 párrafos cortos o viñetas simples).
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
