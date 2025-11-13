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

  // 启动全局加载层（按就绪事件关闭，延长最大展示时长避免弱网过早隐藏）
  start({ minMs: 1200, maxMs: 30000 });
  attach();

  // 监听渲染就绪事件，及时关闭加载层
  const onReady = () => {
    detach();
    window.removeEventListener('panorama:first-frame-rendered', onReady as EventListener);
    window.removeEventListener('panorama:loaded', onReady as EventListener);
  };
  window.addEventListener('panorama:first-frame-rendered', onReady as EventListener);
  window.addEventListener('panorama:loaded', onReady as EventListener);
});

onUnmounted(() => {
  detach();
});
</script>
