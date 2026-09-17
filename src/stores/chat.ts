import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { aiAssistantService, type ChatMessage } from '../services/aiAssistant';
import { usePacienteStore } from './pacienteStore';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export const useChatStore = defineStore('chat', () => {
  const pacienteStore = usePacienteStore();

  const messages = ref<ChatMessageItem[]>([]);
  const isStreaming = ref<boolean>(false);
  const isConnected = ref<boolean>(true);
  const isCheckingConnection = ref<boolean>(false);
  const availableModels = ref<string[]>([]);
  const error = ref<string | null>(null);
  const isOpen = ref<boolean>(false);

  let activeAbortController: AbortController | null = null;

  const currentModel = computed(() => aiAssistantService.getModel());
  const hasMessages = computed(() => messages.value.length > 0);

  /**
   * Genera el saludo inicial personalizado según el paciente cargado
   */
  function createWelcomeMessage(): ChatMessageItem {
    const nombre = pacienteStore.paciente?.nombre_completo?.split(' ')[0] || 'Paciente';
    const cirugiaNombre = pacienteStore.cirugia?.nombre_sencillo || pacienteStore.cirugia?.tipo_cirugia || 'tu procedimiento';

    return {
      id: 'welcome-msg',
      role: 'assistant',
      content: `¡Hola ${nombre}! 👋 Soy **Sofi**, tu acompañante clínica preoperatoria del programa *Tech-and-Touch*.\n\nEstoy aquí para resolver tus dudas sobre tu **${cirugiaNombre}**, explicarte las horas de ayuno, la medicación autorizada o ayudarte a preparar tu maleta hospitalaria.\n\n*Recuerda que soy una guía informativa y no reemplazo las indicaciones directas de tu cirujano o anestesiólogo.* ¿Qué te gustaría consultar hoy?`,
      timestamp: new Date(),
    };
  }

  // Actualizar mensaje de bienvenida si cambia el paciente en el selector de pruebas
  watch(
    () => pacienteStore.currentPacienteId,
    () => {
      if (messages.value.length <= 1) {
        messages.value = [createWelcomeMessage()];
      }
    }
  );

  /**
   * Inicializa la conversación si está vacía
   */
  function initChat() {
    if (messages.value.length === 0) {
      messages.value = [createWelcomeMessage()];
    }
    // Verificar conexión silenciosamente en segundo plano
    checkConnection();
  }

  /**
   * Verifica la conectividad con Ollama
   */
  async function checkConnection(): Promise<boolean> {
    isCheckingConnection.value = true;
    error.value = null;

    try {
      const status = await aiAssistantService.checkHealth();
      availableModels.value = status.models;
      isConnected.value = status.ok && (status.modelAvailable !== false);
      if (!status.ok || status.modelAvailable === false) {
        error.value = status.error || 'Servidor Ollama no disponible';
      }
      return isConnected.value;
    } catch (err: any) {
      isConnected.value = false;
      error.value = err?.message || 'Error de conexión';
      return false;
    } finally {
      isCheckingConnection.value = false;
    }
  }

  function setModel(newModel: string) {
    aiAssistantService.setModel(newModel);
    checkConnection();
  }

  /**
   * Cancela la generación actual en streaming mediante AbortController
   */
  function abortGeneration() {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    isStreaming.value = false;
  }

  /**
   * Envía un mensaje a Ollama con inyección del contexto clínico del paciente
   */
  async function sendMessage(userText: string) {
    const text = userText.trim();
    if (!text) return;

    // Si ya había una respuesta generándose, la cancelamos antes de iniciar la nueva
    abortGeneration();

    error.value = null;

    // 1. Agregar mensaje del usuario
    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    messages.value.push(userMsg);

    // 2. Preparar burbuja temporal reactiva para el asistente
    const assistantMsg: ChatMessageItem = {
      id: `asst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    messages.value.push(assistantMsg);

    // 3. Obtener contexto clínico actualizado
    const clinicalContext = {
      paciente: pacienteStore.paciente,
      cirugia: pacienteStore.cirugia,
      pautas: pacienteStore.pautas,
      materiales: pacienteStore.materiales,
    };

    const systemPrompt = aiAssistantService.buildSystemPrompt(clinicalContext);

    // 4. Preparar historial para Ollama (omitiendo id y timestamp)
    const historyForModel: ChatMessage[] = messages.value
      .filter(m => m.id !== assistantMsg.id && m.content.trim() !== '')
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    // 5. Configurar AbortController
    activeAbortController = new AbortController();
    isStreaming.value = true;

    try {
      await aiAssistantService.streamChat({
        messages: historyForModel,
        systemPrompt,
        signal: activeAbortController.signal,
        onChunk: (chunk: string) => {
          assistantMsg.content += chunk;
        },
        onDone: (fullText: string) => {
          if (!assistantMsg.content && fullText) {
            assistantMsg.content = fullText;
          }
          isStreaming.value = false;
          isConnected.value = true;
          activeAbortController = null;
        },
        onError: (err: Error) => {
          console.error('[ChatStore] Error al generar respuesta:', err);
          isStreaming.value = false;
          isConnected.value = false;
          activeAbortController = null;

          const errorNotice =
            '⚠️ **Asistente desconectado:** No fue posible comunicarse con el servidor local de Ollama.\n\n' +
            'Por favor verifica que Ollama esté ejecutándose en tu equipo con:\n' +
            '```bash\n' +
            `OLLAMA_ORIGINS="*" ollama run ${aiAssistantService.getModel()}\n` +
            '```\n' +
            'Si tienes una duda urgente sobre tu ayuno o cirugía, puedes comunicarte de inmediato con nuestra enfermería de turno.';

          if (!assistantMsg.content) {
            assistantMsg.content = errorNotice;
          } else {
            assistantMsg.content += `\n\n*(La respuesta se interrumpió por un error de conexión con Ollama)*`;
          }
          error.value = 'Servidor Ollama no responde';
        },
      });
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error('[ChatStore Error inesperado]', e);
      }
      isStreaming.value = false;
      activeAbortController = null;
    }
  }

  /**
   * Limpia el chat y restaura el saludo inicial
   */
  function clearChat() {
    abortGeneration();
    messages.value = [createWelcomeMessage()];
    error.value = null;
  }

  /**
   * Control de apertura/cierre del panel de chat
   */
  function toggleChat(forceState?: boolean) {
    const nextState = forceState !== undefined ? forceState : !isOpen.value;
    isOpen.value = nextState;

    if (nextState) {
      initChat();
    } else {
      // Al cerrar el chat, cancelamos streaming activo para ahorrar recursos
      if (isStreaming.value) {
        abortGeneration();
      }
    }
  }

  function openChatWithMessage(initialPrompt?: string) {
    isOpen.value = true;
    initChat();
    if (initialPrompt) {
      sendMessage(initialPrompt);
    }
  }

  return {
    messages,
    isStreaming,
    isConnected,
    isCheckingConnection,
    availableModels,
    currentModel,
    error,
    isOpen,
    hasMessages,
    initChat,
    checkConnection,
    sendMessage,
    abortGeneration,
    clearChat,
    toggleChat,
    openChatWithMessage,
    setModel,
  };
});
