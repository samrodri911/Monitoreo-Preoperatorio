<script setup lang="ts">
import { computed } from 'vue';

interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'code';
  text: string;
}

interface BlockToken {
  type: 'paragraph' | 'ul' | 'ol' | 'codeblock' | 'quote';
  items?: InlineToken[][];
  tokens?: InlineToken[];
  code?: string;
  lang?: string;
}

const props = defineProps<{
  content: string;
}>();

/**
 * Parsea el texto en tokens en línea (negrita, cursiva, código en línea)
 * de forma completamente segura sin usar innerHTML / v-html.
 */
function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // 1. Código en línea: `código`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push({ type: 'code', text: codeMatch[1] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 2. Negrita: **texto** o __texto__
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch && boldMatch[2]) {
      tokens.push({ type: 'bold', text: boldMatch[2] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 3. Cursiva: *texto* o _texto_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch && italicMatch[2]) {
      tokens.push({ type: 'italic', text: italicMatch[2] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 4. Texto plano hasta el próximo delimitador especial
    const nextSpecial = remaining.search(/[`*_]/);
    if (nextSpecial === -1) {
      tokens.push({ type: 'text', text: remaining });
      break;
    } else if (nextSpecial === 0) {
      // Carácter suelto que no coincidió con patrón completo
      tokens.push({ type: 'text', text: remaining[0] });
      remaining = remaining.slice(1);
    } else {
      tokens.push({ type: 'text', text: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

/**
 * Parsea el contenido en bloques estructurales (párrafos, listas, bloques de código)
 */
const blocks = computed<BlockToken[]>(() => {
  if (!props.content) return [];

  const rawBlocks = props.content.split(/\n{2,}/);
  const result: BlockToken[] = [];

  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Bloque de código: ```lang ... ```
    if (trimmed.startsWith('```')) {
      const match = trimmed.match(/^```([a-zA-Z0-9_-]*)\n([\s\S]*?)(?:```|$)/);
      if (match) {
        result.push({
          type: 'codeblock',
          lang: match[1] || 'bash',
          code: match[2].trim(),
        });
        continue;
      }
    }

    // Cita / Blockquote: > texto
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed
        .split('\n')
        .map(l => l.replace(/^>\s?/, ''))
        .join(' ');
      result.push({
        type: 'quote',
        tokens: parseInline(quoteText),
      });
      continue;
    }

    const lines = trimmed.split('\n');

    // Lista desordenada: líneas que empiezan con - o *
    const isUl = lines.every(l => /^\s*[-*]\s+/.test(l));
    if (isUl) {
      const items = lines.map(l => {
        const itemText = l.replace(/^\s*[-*]\s+/, '');
        return parseInline(itemText);
      });
      result.push({ type: 'ul', items });
      continue;
    }

    // Lista ordenada: líneas que empiezan con 1. 2. etc.
    const isOl = lines.every(l => /^\s*\d+\.\s+/.test(l));
    if (isOl) {
      const items = lines.map(l => {
        const itemText = l.replace(/^\s*\d+\.\s+/, '');
        return parseInline(itemText);
      });
      result.push({ type: 'ol', items });
      continue;
    }

    // Párrafo estándar (puede tener saltos de línea suaves dentro)
    result.push({
      type: 'paragraph',
      tokens: parseInline(trimmed.replace(/\n/g, ' ')),
    });
  }

  return result;
});
</script>

<template>
  <div class="safe-markdown text-inherit leading-relaxed space-y-2.5">
    <template v-for="(b, idx) in blocks" :key="idx">
      <!-- Párrafo estándar -->
      <p v-if="b.type === 'paragraph'" class="m-0">
        <template v-for="(tok, tIdx) in b.tokens" :key="tIdx">
          <strong v-if="tok.type === 'bold'" class="font-bold text-inherit">{{ tok.text }}</strong>
          <em v-else-if="tok.type === 'italic'" class="italic text-inherit">{{ tok.text }}</em>
          <code
            v-else-if="tok.type === 'code'"
            class="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-200/80 text-teal-900 font-mono text-xs font-semibold"
          >{{ tok.text }}</code>
          <span v-else>{{ tok.text }}</span>
        </template>
      </p>

      <!-- Lista con viñetas -->
      <ul v-else-if="b.type === 'ul'" class="list-disc list-inside space-y-1 my-1 pl-1">
        <li v-for="(itemTokens, iIdx) in b.items" :key="iIdx" class="leading-relaxed">
          <template v-for="(tok, tIdx) in itemTokens" :key="tIdx">
            <strong v-if="tok.type === 'bold'" class="font-bold text-inherit">{{ tok.text }}</strong>
            <em v-else-if="tok.type === 'italic'" class="italic text-inherit">{{ tok.text }}</em>
            <code
              v-else-if="tok.type === 'code'"
              class="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-200/80 text-teal-900 font-mono text-xs font-semibold"
            >{{ tok.text }}</code>
            <span v-else>{{ tok.text }}</span>
          </template>
        </li>
      </ul>

      <!-- Lista numerada -->
      <ol v-else-if="b.type === 'ol'" class="list-decimal list-inside space-y-1 my-1 pl-1">
        <li v-for="(itemTokens, iIdx) in b.items" :key="iIdx" class="leading-relaxed">
          <template v-for="(tok, tIdx) in itemTokens" :key="tIdx">
            <strong v-if="tok.type === 'bold'" class="font-bold text-inherit">{{ tok.text }}</strong>
            <em v-else-if="tok.type === 'italic'" class="italic text-inherit">{{ tok.text }}</em>
            <code
              v-else-if="tok.type === 'code'"
              class="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-200/80 text-teal-900 font-mono text-xs font-semibold"
            >{{ tok.text }}</code>
            <span v-else>{{ tok.text }}</span>
          </template>
        </li>
      </ol>

      <!-- Bloque de código seguro -->
      <div v-else-if="b.type === 'codeblock'" class="my-2 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 shadow-sm">
        <div class="px-3 py-1 bg-slate-800/90 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-700 flex items-center justify-between">
          <span>{{ b.lang || 'terminal' }}</span>
        </div>
        <pre class="p-3 text-xs font-mono text-teal-300 overflow-x-auto whitespace-pre leading-normal"><code>{{ b.code }}</code></pre>
      </div>

      <!-- Cita / Nota empática -->
      <blockquote
        v-else-if="b.type === 'quote'"
        class="border-l-4 border-teal-500 bg-teal-50/70 py-2 px-3 rounded-r-xl italic text-slate-700 my-2 text-sm"
      >
        <template v-for="(tok, tIdx) in b.tokens" :key="tIdx">
          <strong v-if="tok.type === 'bold'" class="font-bold text-inherit">{{ tok.text }}</strong>
          <em v-else-if="tok.type === 'italic'" class="italic text-inherit">{{ tok.text }}</em>
          <code v-else-if="tok.type === 'code'" class="px-1 py-0.5 bg-white rounded font-mono text-xs">{{ tok.text }}</code>
          <span v-else>{{ tok.text }}</span>
        </template>
      </blockquote>
    </template>
  </div>
</template>
