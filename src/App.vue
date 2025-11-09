<template>
  <div class="min-h-screen bg-black text-white">
    <header
      ref="headerEl"
      class="flex items-center justify-between px-4 py-3 border-b border-white/10"
    >
      <div class="flex items-center gap-2">
        <img :src="BASE + 'vite.svg'" alt="logo" class="w-6 h-6" />
      </div>
      <nav class="flex items-center gap-4 text-sm">
        <RouterLink class="hover:text-primary" to="/">首页</RouterLink>
      </nav>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const BASE = import.meta.env.BASE_URL;

const headerEl = ref<HTMLElement | null>(null);

const updateHeaderH = () => {
  const h = headerEl.value?.offsetHeight ?? 56;
  document.documentElement.style.setProperty('--header-h', `${h}px`);
};

onMounted(() => {
  updateHeaderH();
  window.addEventListener('resize', updateHeaderH);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHeaderH);
});
</script>
