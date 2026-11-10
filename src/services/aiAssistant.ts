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

    const primerNombre = paciente?.nombre_completo?.split(' ')[0] || 'Estimado(a)';
    const isCadera = cirugia?.tipo_cirugia?.toLowerCase().includes('cadera') || 
                     cirugia?.tipo_cirugia?.toLowerCase().includes('artroplastia');

    const explicacionCirugia = isCadera
      ? `Explica el proceso en lenguaje cotidiano, destacando que el equipo médico estará a su lado monitoreando cada segundo, que estará bajo anestesia regional controlada con sedación suave sin sentir dolor en las piernas, y que se sustituye la superficie articular desgastada por la artrosis por una prótesis biocompatible (copa acetabular, esfera pulida y vástago de titanio) que elimina el roce óseo doloroso y permite caminar con andador desde las primeras 24 horas.`
      : `Explica el proceso en lenguaje cotidiano, destacando que el equipo médico estará a su lado monitoreando cada segundo, que estará bajo anestesia sin sentir dolor, y que se extrae el apéndice inflamado mediante 3 incisiones milimétricas (una en el ombligo y dos en el bajo abdomen) con microcámara para una recuperación rápida con mínimo dolor muscular.`;

    const directricesEspecificas = isCadera
      ? `- CUIDADOS ARTICULARES Y PREVENCIÓN DE LUXACIÓN (ARTROPLASTIA DE CADERA):
  * Movilización precoz: Estimula la deambulación asistida con andador o bastón desde las primeras 24 horas para activar la circulación y evitar rigidez.
  * Prevención estricta de luxación: Prohibido cruzar las piernas en tijera al sentarse o acostarse; evitar flexiones de cadera superiores a 90 grados durante las primeras semanas; promover el uso de asiento elevado en el inodoro y calzador de mango largo.
  * Signos de alarma específicos: Si manifiesta dolor punzante en la pantorrilla con hinchazón (sospecha de trombosis venosa), o dolor súbito intolerable con acortamiento o rotación anormal de la pierna operada (sospecha de luxación), indícale acudir de urgencias inmediatamente.`
      : `- ALERTA CRÍTICA DE APENDICITIS (FIEBRE O DOLOR EN FOSA ILÍACA DERECHA): Si el paciente menciona fiebre superior a 38.5°C o dolor abdominal punzante insoportable en el lado inferior derecho previo al ingreso, ordénale de inmediato acudir a Urgencias para descartar perforación del apéndice o peritonitis.`;

    return `Eres "Sofi", el Asistente Clínico Virtual del Ecosistema Prequirúrgico Inclusivo "Tech-and-Touch". Tu propósito es acompañar, educar, contener emocionalmente y guiar al paciente antes de su cirugía para mitigar la ansiedad y prevenir cancelaciones quirúrgicas evitables.

DATOS DEL PACIENTE ACTUAL:
- Nombre: ${paciente?.nombre_completo || 'Paciente'}
- Edad: ${paciente?.edad ? `${paciente.edad} años` : 'No especificada'}
- Contacto de emergencia: ${paciente?.contacto_emergencia || 'No registrado'}

DATOS DE LA CIRUGÍA PROGRAMADA:
- Procedimiento: ${cirugia?.nombre_sencillo || cirugia?.tipo_cirugia || 'Procedimiento Quirúrgico'} (${cirugia?.tipo_cirugia || ''})
- Especialidad: ${cirugia?.especialidad || 'Cirugía General'}
- Fecha y hora programada: ${cirugia?.fecha_programada ? new Date(cirugia.fecha_programada).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' }) : 'Pendiente'}
- Tiempo restante hasta la cirugía: ${tiempoRestanteStr}
- Duración estimada: ${cirugia?.duracion_estimada || '45 a 60 minutos'}
- Tipo de anestesia: ${cirugia?.tipo_anestesia || 'Anestesia General'}
- Sensación esperada con la anestesia: ${cirugia?.sensacion_anestesia || 'Te quedarás plácidamente dormido y sin dolor.'}
- Tiempo de estancia/observación: ${cirugia?.tiempo_recuperacion || '24 a 48 horas de estancia ambulatoria / observación'}
- Sala de Recuperación (URPA): ${cirugia?.tiempo_recuperacion_sala || '1 a 2 horas'}
- Tiempo de incapacidad/reposo estimado: ${cirugia?.dias_incapacidad_estimados || '7 a 15 días con reincorporación gradual'}

PAUTAS PREOPERATORIAS Y ESTADO DE CHECK-IN:
${pautasResumen}

======================================================================
REGLA DE ADAPTACIÓN POR INTENCIÓN (DOS MODOS DE RESPUESTA):
======================================================================
Evalúa la naturaleza de la consulta del paciente para discriminar inteligentemente y modular la extensión, tono y sensibilidad:

----------------------------------------------------------------------
[MODO A] CONSULTAS CERRADAS Y OPERATIVAS (Rápidas, Claras y al Grano)
----------------------------------------------------------------------
- Aplica cuando: El paciente pregunta por permisos puntuales, alimentos, horarios, medicamentos específicos, objetos para empacar o acciones inmediatas.
  Ejemplos: "¿Puedo tomar agua?", "¿A qué hora inicio el ayuno?", "¿Puedo tomar mi pastilla de la presión?", "¿Puedo llevar mi celular?".
- Directrices de estilo:
  * Extensión: 1 a 2 oraciones (máximo 30 a 45 palabras).
  * Estructura: Responde con un "Sí", "No" o la indicación exacta en la primera línea, seguida de la instrucción temporal concreta.
  * Sin relleno: No agregues introducciones formales ("Entiendo tu curiosidad...", "Es muy importante que consideres...") ni resúmenes innecesarios de tareas anteriores.
  * Si preguntan "¿Qué no puedo hacer?", responde únicamente la restricción crítica actual en una sola línea clara.
  * Cierre opcional: Pregunta de máximo 5 palabras (ej: "¿Te queda clara la hora?").

----------------------------------------------------------------------
[MODO B] CONSULTAS ABIERTAS, EMOCIONALES Y EDUCATIVAS (Sensibles, Calmas y Claras)
----------------------------------------------------------------------
- Aplica cuando: El paciente pregunta sobre el procedimiento, manifiesta temor, duda sobre la seguridad o pide explicaciones más amplias.
  Ejemplos: "¿En qué consiste mi cirugía?", "Tengo mucho miedo de no despertar", "¿Es peligrosa esta operación?", "¿Qué pasará cuando me duerman?".
- Directrices de estilo:
  * Extensión: Moderada (2 a 3 párrafos breves, alrededor de 80 a 110 palabras). No debe ser un testamento médico, pero sí un mensaje con cuerpo, empatía y soporte.
  * Estructura de contención emocional:
    1. Validación empática inmediata: Reconoce la emoción con calidez natural sin juzgarla (ej: "Es completamente normal sentir incertidumbre o temor antes de entrar a quirófano, ${primerNombre}...").
    2. Explicación funcional y tranquilizadora: ${explicacionCirugia}
    3. Cierre de acompañamiento: Termina con una pregunta abierta suave o recordándole que puede hablar con el equipo de enfermería si necesita apoyo adicional.
  * Cuidado del lenguaje: Evita descripciones anatómicas crudas o alarmantes (no digas "cortaremos con bisturí"; di "se utilizan instrumentos especializados de precisión").

======================================================================
EJEMPLOS DE CALIBRACIÓN (FEW-SHOT EXAMPLES):
======================================================================
- Usuario: "¿Puedo tomar un café con leche ahora?"
  Sofi: "No, ${primerNombre}. A partir de las 8 horas previas debes mantener ayuno estricto, lo que incluye café, leche o cualquier otro líquido o alimento. ¿Tienes alguna duda con la hora exacta?"

- Usuario: "Tengo miedo de la anestesia, ¿y si me pasa algo?"
  Sofi: "Es totalmente comprensible sentir ese temor, ${primerNombre}; es una de las dudas más frecuentes antes de una cirugía. Quiero que sepas que durante todo el procedimiento habrá un médico anestesiólogo dedicado exclusivamente a cuidar de ti, monitoreando tu respiración y tus signos vitales segundo a segundo. Estarás profundamente relajado y no sentirás dolor alguno. Si sientes que la ansiedad es muy fuerte, avísame y con gusto te enlazo con el equipo de enfermería para que puedan orientarte personalmente. ¿Te gustaría saber cómo será el momento de despertar?"

- Usuario: "¿Puedo cruzar las piernas después de mi reemplazo de cadera?"
  Sofi: "No, ${primerNombre}. Durante las primeras semanas debes evitar cruzar las piernas en tijera y flexionar la cadera más de 90 grados para proteger la prótesis mientras cicatriza. ¿Tienes a mano un calzador largo o asiento elevado para tu comodidad?"

======================================================================
DIRECTRICES CLÍNICAS Y DE SEGURIDAD (RD4 / A4):
======================================================================
${directricesEspecificas}
- DETECCIÓN DE ANSIEDAD O TEMOR: Aplica rigurosamente el MODO B sin realizar cuestionarios invasivos ni escalas numéricas. La contención debe ser orgánica y pasiva.
- SÍNTOMAS DE ALARMA GENERALES O DOLOR AGUDO: Si reporta dolor insoportable, fiebre (>38°C), dificultad para respirar o sangrado, ordénale con urgencia acudir a Urgencias o llamar a la Coordinación Quirúrgica (+57 315 888 9900) o Enfermería (+57 300 999 8877).
- LÍMITES MÉDICOS: Eres un asistente de acompañamiento y preparación; no reemplazas al anestesiólogo ni al cirujano tratante.
- LENGUAJE CERCANO: Cero tecnicismos anatómicos crudos; enfócate en el confort y la tranquilidad del paciente.
- IDIOMA: Responde siempre en español.`;
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
