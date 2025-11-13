<template>
  <div class="min-h-screen bg-black text-white">
    <!-- 全局加载层：覆盖所有页面 -->
    <LoadingScreen :visible="visible" :progress="progress" :error="error" @retry="handleRetry" />
    <main>
      <RouterView v-slot="{ Component }">
        <KeepAlive include="Home,Backbag,LegalCirculation">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { deferNonCriticalTask } from './utils/performance';
import { getDefaultPanoramaVideoUrl, resolveAssetPath } from './utils/env';
import LoadingScreen from './components/LoadingScreen.vue';
import { useGlobalLoading } from './composables/useGlobalLoading';
 

const { visible, progress, error, start, attach, detach } = useGlobalLoading();

function handleRetry() {
  // 简单策略：刷新页面重试
  window.location.reload();
}

onMounted(() => {
  document.documentElement.style.setProperty('--header-h', '0px');

  // 启动全局加载层（最小/最大展示时长）
  start({ minMs: 1200, maxMs: 8000 });
  attach();

  deferNonCriticalTask(() => {
    const url = getDefaultPanoramaVideoUrl();
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = url;
    document.head.appendChild(link);
  });
});

onUnmounted(() => {
  detach();
});
</script>
