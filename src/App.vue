<template>
  <div class="min-h-screen bg-black text-white">
    <!-- 全局加载层：覆盖所有页面 -->
    <LoadingScreen :visible="visible" :progress="progress" :error="error" @retry="handleRetry" />
    <main>
      <RouterView v-slot="{ Component }">
        <KeepAlive include="Home">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import LoadingScreen from './components/LoadingScreen.vue';
import { useGlobalLoading } from './composables/useGlobalLoading';
import { deferNonCriticalTask } from './utils/performance';
import { getDefaultPanoramaVideoUrl } from './utils/env';

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

  // 非关键逻辑延迟：预加载默认全景视频资源（不阻塞首屏交互）
  deferNonCriticalTask(() => {
    const url = getDefaultPanoramaVideoUrl();
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = url;
    document.head.appendChild(link);
  });

  // 非关键逻辑延迟：预取首页装饰图片（不阻塞首屏）
  deferNonCriticalTask(() => {
    const images = [
      '/images/home/mobile/组 1.png',
      '/images/home/mobile/组 1(1).png',
      '/images/home/mobile/组 1 拷贝.png',
      '/images/home/mobile/组 1(2).png',
    ];
    for (const src of images) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = (import.meta.env.BASE_URL || '/') + (src.startsWith('/') ? src.slice(1) : src);
      document.head.appendChild(link);
    }
  });
});

onUnmounted(() => {
  detach();
});
</script>
