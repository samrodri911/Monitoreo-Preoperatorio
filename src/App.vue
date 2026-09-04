<script setup lang="ts">
import HeaderNav from './components/common/HeaderNav.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
    <HeaderNav />
    <main class="flex-1">
      <router-view />
    </main>
    <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
      <p>Ecosistema Phygital Inclusivo "Tech-and-Touch" • Preparación Prequirúrgica Segura</p>
      <p class="mt-1 text-slate-400">Diseñado bajo Metodología TRIZ y Estándares WCAG 2.1 AA</p>
    </footer>
  </div>
</template>
