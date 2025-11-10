<template>
  <div class="min-h-screen bg-black text-white">
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  document.documentElement.style.setProperty('--header-h', '0px');
});
</script>
