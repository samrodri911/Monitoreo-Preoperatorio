<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useChatStore } from '../../stores/chat';
import { usePacienteStore } from '../../stores/pacienteStore';
import { useVoiceAssistant } from '../../composables/useVoiceAssistant';
import SafeMarkdown from './SafeMarkdown.vue';
import {
  Bot,
  Send,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  Square,
  MessageSquare,
  Sparkles,
  PhoneCall,
  Loader2,
  ChevronDown,
  Volume2,
  VolumeX,
  Mic,
  MicOff
} from 'lucide-vue-next';

const chatStore = useChatStore();
const pacienteStore = usePacienteStore();
const voice = useVoiceAssistant();

const inputText = ref('');
const messagesContainer = ref<HTMLDivElement | null>(null);

const quickChips = [
  '¿A qué hora debo iniciar el ayuno?',
  '¿Puedo tomar mis medicamentos habituales?',
  '¿Qué debo empacar en mi maleta?',
  '¿Qué tipo de anestesia me van a colocar?',
];

// Auto-scroll reactivo al fondo
function scrollToBottom(smooth = true) {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  });
}

// Observar los mensajes y el streaming para hacer scroll
watch(
  () => [chatStore.messages.length, chatStore.messages[chatStore.messages.length - 1]?.content],
  () => {
    scrollToBottom(true);
  },
  { deep: true }
);

watch(
  () => chatStore.isOpen,
  (open) => {
    if (open) {
      scrollToBottom(false);
    } else {
      voice.stopSpeaking();
      voice.stopListening();
    }
  }
);

// Lectura automática por voz al finalizar streaming (si la voz está activada)
watch(
  () => chatStore.isStreaming,
  (isStreaming, wasStreaming) => {
    if (!isStreaming && wasStreaming && voice.isAutoVoiceEnabled.value) {
      const lastMsg = chatStore.messages[chatStore.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
        voice.speak(lastMsg.content, lastMsg.id);
      }
    }
  }
);

onMounted(() => {
  chatStore.initChat();
});

function handleSend() {
  const text = inputText.value.trim();
  if (!text || chatStore.isStreaming) return;
  voice.stopListening();
  voice.stopSpeaking();
  inputText.value = '';
  chatStore.sendMessage(text);
  scrollToBottom(true);
}

function handleToggleMic() {
  if (voice.isListening.value) {
    voice.stopListening();
  } else {
    voice.startListening({
      onInterim: (text) => {
        inputText.value = text;
      },
      onFinal: (text) => {
        inputText.value = text;
      },
    });
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function handleChipClick(chip: string) {
  if (chatStore.isStreaming) return;
  voice.stopSpeaking();
  voice.stopListening();
  chatStore.sendMessage(chip);
  scrollToBottom(true);
}

function handleClearChat() {
  voice.stopSpeaking();
  voice.stopListening();
  chatStore.clearChat();
}

function handleAbortGeneration() {
  voice.stopSpeaking();
  chatStore.abortGeneration();
}

function formatTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <div class="fixed bottom-5 right-5 z-50 select-none">
    
    <!-- BOTÓN FLOTANTE LANZADOR (FAB) -->
    <button
      v-if="!chatStore.isOpen"
      type="button"
      @click="chatStore.toggleChat(true)"
      class="group relative flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-xl shadow-teal-600/30 hover:shadow-2xl hover:shadow-teal-600/40 hover:from-teal-500 hover:to-teal-600 transition-all duration-300 focus-ring cursor-pointer"
      aria-label="Abrir asistente virtual preoperatorio"
    >
      <!-- Avatar con indicador de pulso -->
      <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-white text-teal-700 shadow-xs flex-shrink-0">
        <Bot class="w-6 h-6 transition-transform group-hover:scale-110" />
        
        <!-- Indicador de estado de conexión -->
        <span
          class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
          :class="chatStore.isConnected ? 'bg-emerald-500' : 'bg-amber-500'"
        >
          <span
            v-if="chatStore.isConnected"
            class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"
          ></span>
        </span>
      </div>

      <!-- Texto descriptivo -->
      <div class="text-left hidden sm:block pr-1">
        <span class="text-xs font-semibold text-teal-100 uppercase tracking-wider block leading-tight">Asistente IA</span>
        <span class="text-sm font-bold text-white block leading-tight">¿Dudas preoperatorias?</span>
      </div>

      <Sparkles class="w-4 h-4 text-teal-200 hidden sm:block animate-pulse" />
    </button>

    <!-- VENTANA DE CHAT EXPANDIDA -->
    <div
      v-else
      class="w-[calc(100vw-2.5rem)] sm:w-[440px] h-[620px] max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300"
    >
      
      <!-- CABECERA DEL CHAT -->
      <header class="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-4 flex items-center justify-between shadow-md relative z-10">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center">
              <Bot class="w-6 h-6 text-teal-200" />
            </div>
            <span
              class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900"
              :class="chatStore.isConnected ? 'bg-emerald-400' : 'bg-amber-400'"
            ></span>
          </div>

          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-sm tracking-tight text-white">Sofi • Asistente Prequirúrgico</h3>
              <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30">
                IA Local
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-teal-200/90 font-medium">
              <span
                class="w-1.5 h-1.5 rounded-full"
                :class="chatStore.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"
              ></span>
              <span v-if="chatStore.isConnected">En línea ({{ chatStore.currentModel }})</span>
              <span v-else class="text-amber-300">Desconectado</span>
            </div>
          </div>
        </div>

        <!-- Botones de Acción en Cabecera -->
        <div class="flex items-center gap-1">
          <!-- Toggle Lectura de Voz (TTS) -->
          <button
            v-if="voice.speechSynthesisSupported.value"
            type="button"
            @click="voice.toggleAutoVoice()"
            class="p-2 rounded-xl transition-colors focus-ring cursor-pointer"
            :class="voice.isAutoVoiceEnabled.value ? 'text-emerald-300 bg-white/15 shadow-inner' : 'text-teal-300/70 hover:text-white hover:bg-white/10'"
            :title="voice.isAutoVoiceEnabled.value ? 'Lectura por voz activada (clic para silenciar)' : 'Lectura por voz silenciada (clic para activar)'"
          >
            <Volume2 v-if="voice.isAutoVoiceEnabled.value" class="w-4 h-4" />
            <VolumeX v-else class="w-4 h-4" />
          </button>

          <!-- Verificar conexión -->
          <button
            type="button"
            @click="chatStore.checkConnection()"
            :disabled="chatStore.isCheckingConnection"
            class="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors focus-ring cursor-pointer"
            title="Verificar conexión con Ollama"
          >
            <RefreshCw
              class="w-4 h-4"
              :class="{ 'animate-spin': chatStore.isCheckingConnection }"
            />
          </button>

          <!-- Limpiar conversación -->
          <button
            type="button"
            @click="handleClearChat"
            class="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors focus-ring cursor-pointer"
            title="Limpiar conversación"
          >
            <RotateCcw class="w-4 h-4" />
          </button>

          <!-- Minimizar / Cerrar -->
          <button
            type="button"
            @click="chatStore.toggleChat(false)"
            class="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors focus-ring cursor-pointer"
            title="Minimizar chat"
          >
            <ChevronDown class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- AVISO DE CONEXIÓN O OFFLINE -->
      <div
        v-if="!chatStore.isConnected"
        class="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in"
      >
        <AlertCircle class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div class="flex-1 leading-snug">
          <p class="font-bold">Asistente desconectado</p>
          <p class="text-amber-800 mt-0.5">
            {{ chatStore.error || 'Asegúrate de tener Ollama corriendo en tu equipo.' }}
          </p>

          <!-- Si Ollama responde pero falta el modelo configurado -->
          <div v-if="chatStore.availableModels.length > 0" class="mt-2 pt-2 border-t border-amber-200/70">
            <span class="text-[11px] font-semibold text-amber-950 block mb-1">
              Modelos detectados en tu equipo (haz clic para conectar):
            </span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="m in chatStore.availableModels"
                :key="m"
                type="button"
                @click="chatStore.setModel(m)"
                class="px-2 py-0.5 rounded-lg bg-white hover:bg-teal-50 text-teal-800 border border-amber-300 hover:border-teal-400 text-[11px] font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                :title="`Usar ${m}`"
              >
                {{ m }}
              </button>
            </div>
            <span class="text-[10px] text-amber-700 block mt-1">
              O descarga {{ chatStore.currentModel }}: <code class="font-mono bg-amber-100 px-1 py-0.5 rounded">ollama pull {{ chatStore.currentModel }}</code>
            </span>
          </div>

          <div v-else class="mt-1">
            <code class="bg-amber-200/70 px-1.5 py-0.5 rounded font-mono text-[11px] block mt-1 select-all text-amber-950">
              OLLAMA_ORIGINS="*" ollama run {{ chatStore.currentModel }}
            </code>
          </div>

          <div class="mt-2 flex items-center gap-3">
            <button
              type="button"
              @click="chatStore.checkConnection()"
              class="font-bold text-teal-700 hover:text-teal-900 underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw class="w-3 h-3" /> Reintentar conexión
            </button>
          </div>
        </div>
      </div>

      <!-- CONTENEDOR DE MENSAJES CON SCROLL -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 select-text"
      >
        <!-- Tarjeta de Contexto del Paciente Activo -->
        <div class="bg-teal-50/80 border border-teal-100 rounded-2xl p-3 text-xs text-slate-700 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-teal-600"></span>
            <span>Expediente: <strong>{{ pacienteStore.paciente?.nombre_completo || 'Paciente' }}</strong></span>
          </div>
          <span class="text-teal-800 font-semibold truncate max-w-[170px]" :title="pacienteStore.cirugia?.nombre_sencillo || pacienteStore.cirugia?.tipo_cirugia">
            {{ pacienteStore.cirugia?.nombre_sencillo || pacienteStore.cirugia?.tipo_cirugia }}
          </span>
        </div>

        <!-- Renderizado de la lista de Mensajes -->
        <template v-for="msg in chatStore.messages" :key="msg.id">
          <!-- Mensaje del Usuario -->
          <div
            v-if="msg.role === 'user'"
            class="flex flex-col items-end space-y-1"
          >
            <div class="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-xs bg-teal-600 text-white text-sm shadow-xs leading-relaxed">
              {{ msg.content }}
            </div>
            <span class="text-[10px] text-slate-400 font-medium pr-1">
              {{ formatTime(msg.timestamp) }}
            </span>
          </div>

          <!-- Mensaje del Asistente -->
          <div
            v-else-if="msg.role === 'assistant'"
            class="flex items-start gap-2.5"
          >
            <!-- Avatar del Asistente -->
            <div class="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 mt-1 shadow-2xs">
              <Bot class="w-4 h-4" />
            </div>

            <div class="flex-1 space-y-1 max-w-[88%]">
              <div class="p-3.5 rounded-2xl rounded-tl-xs bg-white text-slate-800 text-sm border border-slate-200/80 shadow-xs">
                
                <!-- Indicador de carga inicial si aún no hay tokens generados -->
                <div
                  v-if="!msg.content && chatStore.isStreaming"
                  class="flex items-center gap-2 py-1 text-slate-500 text-xs"
                >
                  <Loader2 class="w-4 h-4 animate-spin text-teal-600" />
                  <span>Sofi está consultando tus pautas y redactando...</span>
                </div>

                <!-- Contenido con Markdown Seguro -->
                <SafeMarkdown v-else :content="msg.content" />

                <!-- Cursor parpadeante durante streaming -->
                <span
                  v-if="chatStore.isStreaming && msg.id === chatStore.messages[chatStore.messages.length - 1]?.id && msg.content"
                  class="inline-block w-1.5 h-4 ml-0.5 bg-teal-600 animate-pulse align-middle"
                ></span>
              </div>

              <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
                <div class="flex items-center gap-2">
                  <span>Sofi • Asistente</span>
                  <!-- Botón de Audio por Mensaje (TTS) -->
                  <button
                    v-if="voice.speechSynthesisSupported.value && msg.content && !chatStore.isStreaming"
                    type="button"
                    @click="voice.speak(msg.content, msg.id)"
                    class="inline-flex items-center gap-1 text-[10px] font-semibold transition-colors px-1.5 py-0.5 rounded cursor-pointer"
                    :class="voice.speakingMessageId.value === msg.id && voice.isSpeaking.value
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'text-teal-700 hover:text-teal-900 hover:bg-teal-50'"
                    :title="voice.speakingMessageId.value === msg.id && voice.isSpeaking.value ? 'Detener lectura hablada' : 'Escuchar respuesta en voz alta'"
                  >
                    <Square v-if="voice.speakingMessageId.value === msg.id && voice.isSpeaking.value" class="w-2.5 h-2.5 fill-current text-red-500 animate-pulse" />
                    <Volume2 v-else class="w-2.5 h-2.5 text-teal-600" />
                    <span>{{ voice.speakingMessageId.value === msg.id && voice.isSpeaking.value ? 'Detener' : 'Escuchar' }}</span>
                  </button>
                </div>
                <span>{{ formatTime(msg.timestamp) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- BOTÓN PARA CANCELAR GENERACIÓN (Si está en Streaming) -->
      <div v-if="chatStore.isStreaming" class="px-4 py-1.5 bg-slate-100 border-t border-slate-200 flex justify-center">
        <button
          type="button"
          @click="handleAbortGeneration"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-300 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
        >
          <Square class="w-3 h-3 fill-current text-red-500" />
          <span>Detener respuesta</span>
        </button>
      </div>

      <!-- SUGERENCIAS RÁPIDAS (QUICK CHIPS) -->
      <div class="p-2.5 bg-white border-t border-slate-100">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <MessageSquare class="w-3 h-3 text-teal-600" />
          <span>Preguntas frecuentes sugeridas:</span>
        </div>
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            v-for="(chip, idx) in quickChips"
            :key="idx"
            type="button"
            @click="handleChipClick(chip)"
            :disabled="chatStore.isStreaming"
            class="px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 whitespace-nowrap text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-ring"
          >
            {{ chip }}
          </button>
        </div>
      </div>

      <!-- INPUT Y ENVÍO -->
      <footer class="p-3 bg-white border-t border-slate-200/80 space-y-2">
        <!-- Indicador de escucha STT en vivo -->
        <div
          v-if="voice.isListening.value"
          class="px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between animate-in fade-in"
        >
          <div class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span class="font-medium">Escuchando tu voz... Habla con tranquilidad</span>
          </div>
          <button
            type="button"
            @click="voice.stopListening()"
            class="text-[11px] font-bold text-red-800 hover:underline cursor-pointer"
          >
            Listo
          </button>
        </div>

        <!-- Aviso si hay error con el micrófono -->
        <div
          v-if="voice.voiceError.value"
          class="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[11px] flex items-center justify-between"
        >
          <span>{{ voice.voiceError.value }}</span>
          <button type="button" @click="voice.voiceError.value = null" class="font-bold text-amber-900 hover:opacity-75 cursor-pointer ml-2">×</button>
        </div>

        <form @submit.prevent="handleSend" class="flex items-center gap-2">
          <textarea
            v-model="inputText"
            @keydown="handleKeydown"
            :disabled="chatStore.isStreaming"
            rows="1"
            placeholder="Escribe o usa el micrófono para consultar..."
            class="flex-1 resize-none py-2.5 px-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-slate-800 placeholder-slate-400 transition-shadow disabled:bg-slate-100"
          ></textarea>

          <!-- Botón de Micrófono (STT) -->
          <button
            v-if="voice.speechRecognitionSupported.value"
            type="button"
            @click="handleToggleMic"
            :disabled="chatStore.isStreaming"
            class="p-2.5 rounded-xl transition-all focus-ring shadow-xs flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
            :class="voice.isListening.value
              ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30 ring-2 ring-red-300'
              : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'"
            :title="voice.isListening.value ? 'Detener captura de voz' : 'Hablar por micrófono (STT)'"
          >
            <Mic v-if="!voice.isListening.value" class="w-4 h-4" />
            <MicOff v-else class="w-4 h-4 animate-bounce" />
          </button>

          <!-- Botón de Enviar -->
          <button
            type="submit"
            :disabled="!inputText.trim() || chatStore.isStreaming"
            class="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-all focus-ring shadow-xs flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
            title="Enviar mensaje"
          >
            <Send class="w-4 h-4" />
          </button>
        </form>

        <!-- DESCARGO CLÍNICO Y CONTACTO RÁPIDO -->
        <div class="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1 border-t border-slate-100">
          <span class="truncate pr-2">Orientación informativa • No reemplaza al cirujano</span>
          <a
            href="tel:+573009998877"
            class="text-teal-700 font-bold hover:underline flex-shrink-0 flex items-center gap-1"
            title="Línea directa enfermería"
          >
            <PhoneCall class="w-2.5 h-2.5" />
            <span>Enfermería 24/7</span>
          </a>
        </div>
      </footer>

    </div>

  </div>
</template>
