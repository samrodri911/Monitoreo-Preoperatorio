<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Briefcase, Check, AlertOctagon } from 'lucide-vue-next';

interface BagItem {
  id: string;
  category: 'documento' | 'ropa' | 'prohibido';
  label: string;
  checked: boolean;
}

const items = ref<BagItem[]>([
  { id: 'doc-1', category: 'documento', label: 'Documento de identidad original (Cédula o pasaporte)', checked: true },
  { id: 'doc-2', category: 'documento', label: 'Orden médica quirúrgica y autorización de tu EPS/aseguradora', checked: true },
  { id: 'doc-3', category: 'documento', label: 'Resultados físicos de exámenes prequirúrgicos (sangre y electrocardiograma)', checked: false },
  { id: 'ropa-1', category: 'ropa', label: 'Ropa muy holgada y cómoda (blusa/camisa con botones al frente)', checked: true },
  { id: 'ropa-2', category: 'ropa', label: 'Calzado plano, cerrado y con suela de goma antideslizante', checked: false },
  { id: 'ropa-3', category: 'ropa', label: 'Muda de ropa interior cómoda de algodón', checked: false },
]);

// Cargar desde localStorage si existe
onMounted(() => {
  const saved = localStorage.getItem('hospital_bag_checklist');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      items.value.forEach(item => {
        if (parsed[item.id] !== undefined) {
          item.checked = parsed[item.id];
        }
      });
    } catch (e) {
      console.warn('Error leyendo localStorage de maleta', e);
    }
  }
});

// Guardar en localStorage
watch(items, (newItems) => {
  const map: Record<string, boolean> = {};
  newItems.forEach(i => { map[i.id] = i.checked; });
  localStorage.setItem('hospital_bag_checklist', JSON.stringify(map));
}, { deep: true });

function toggleItem(id: string) {
  const item = items.value.find(i => i.id === id);
  if (item) item.checked = !item.checked;
}

const totalItems = computed(() => items.value.length);
const checkedItems = computed(() => items.value.filter(i => i.checked).length);
const progressPercent = computed(() => Math.round((checkedItems.value / totalItems.value) * 100));
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
    
    <!-- Cabecera de la Maleta -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
          <Briefcase class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-teal-700 block">Guía de Ingreso Hospitalario</span>
          <h3 class="text-xl font-bold text-slate-900">¿Qué empacar en tu maleta prequirúrgica?</h3>
        </div>
      </div>

      <div class="text-right flex-shrink-0">
        <span class="text-xs font-bold uppercase text-slate-400 block">Progreso de la Maleta</span>
        <span class="text-lg font-black text-teal-700">
          {{ checkedItems }} de {{ totalItems }} listos ({{ progressPercent }}%)
        </span>
      </div>
    </div>

    <!-- Barra de Progreso -->
    <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        class="h-full bg-teal-600 transition-all duration-300 rounded-full"
        :class="{ 'bg-emerald-500': progressPercent === 100 }"
        :style="{ width: `${progressPercent}%` }"
      ></div>
    </div>

    <!-- Lista de Artículos Interactiva -->
    <div class="space-y-2.5">
      <div
        v-for="item in items"
        :key="item.id"
        @click="toggleItem(item.id)"
        class="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none"
        :class="[
          item.checked
            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
        ]"
      >
        <div
          class="w-6 h-6 rounded-lg flex items-center justify-center border transition-colors flex-shrink-0"
          :class="item.checked ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300 text-transparent'"
        >
          <Check class="w-4 h-4 stroke-[3]" />
        </div>
        <span
          class="text-sm sm:text-base font-medium flex-1"
          :class="{ 'line-through text-slate-400': item.checked }"
        >
          {{ item.label }}
        </span>
      </div>
    </div>

    <!-- Sección de Advertencia: Lo que DEBES dejar en casa -->
    <div class="p-4 rounded-xl bg-amber-50 border border-amber-200">
      <div class="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
        <AlertOctagon class="w-5 h-5 text-amber-600 flex-shrink-0" />
        <span>¡Obligatorio dejar en casa! (Evita retrasos en quirófano)</span>
      </div>
      <ul class="text-xs sm:text-sm text-amber-800 space-y-1 pl-7 list-disc">
        <li><strong>Sin joyas ni accesorios metálicos:</strong> Anillos, aretes o cadenas deben quedarse en casa por seguridad del electrobisturí.</li>
        <li><strong>Uñas limpias y sin esmalte:</strong> El sensor del oxímetro de pulso no lee adecuadamente a través de esmaltes oscuros.</li>
        <li><strong>Sin lentes de contacto:</strong> Usa tus gafas convencionales para ingresar a la clínica.</li>
      </ul>
    </div>

  </div>
</template>
