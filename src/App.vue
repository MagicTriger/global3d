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
 

const { visible, progress, error, start, attach, detach, setProgress } = useGlobalLoading();

function handleRetry() {
  // 简单策略：刷新页面重试
  window.location.reload();
}

onMounted(() => {
  document.documentElement.style.setProperty('--header-h', '0px');

  // 启动全局加载层（按就绪事件关闭，延长最大展示时长避免弱网过早隐藏）
  start({ minMs: 1200, maxMs: 300000 });
  attach();

  // 资源清单（首页静态图片）
  const staticImages = [
    '/images/home/mobile/组 1.png',
    '/images/home/mobile/组 1(1).png',
    '/images/home/mobile/组 1 拷贝.png',
    '/images/home/mobile/组 1(2).png',
  ].map((p) => resolveAssetPath(p));

  // 聚合进度：静态资源 + 视频
  const totalItems = staticImages.length + 1; // +1 为视频
  let staticLoaded = 0;
  let videoProgress = 0; // 0..100
  let ready = false;

  const updateProgress = () => {
    const aggregated = Math.round(((staticLoaded + videoProgress / 100) / totalItems) * 100);
    setProgress(aggregated);
    if (ready && aggregated >= 100) {
      detach();
      window.removeEventListener('panorama:first-frame-rendered', onFrame as EventListener);
      window.removeEventListener('panorama:loaded', onLoaded as EventListener);
      window.removeEventListener('panorama:loading', onLoading as EventListener);
    }
  };

  // 加载静态图片并统计
  staticImages.forEach((url) => {
    const img = new Image();
    img.decoding = 'async';
    img.loading = 'eager';
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
    const done = () => { staticLoaded++; updateProgress(); };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    img.src = url;
  });

  const onFrame = () => { ready = true; updateProgress(); };
  const onLoaded = () => { ready = true; updateProgress(); };
  const onLoading = (e: Event) => {
    const detail = (e as CustomEvent).detail as { progress?: number } | undefined;
    if (detail && typeof detail.progress === 'number') {
      videoProgress = detail.progress;
      updateProgress();
    }
  };
  window.addEventListener('panorama:first-frame-rendered', onFrame as EventListener);
  window.addEventListener('panorama:loaded', onLoaded as EventListener);
  window.addEventListener('panorama:loading', onLoading as EventListener);
});

onUnmounted(() => {
  detach();
});
</script>
