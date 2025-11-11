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

  // 在空闲时间预取背包与法物流通的路由代码块，避免首次点击时下载延迟
  deferNonCriticalTask(() => {
    // 仅预热模块，不执行逻辑
    import('./pages/Backbag.vue');
    import('./pages/Legal-circulation.vue');
  });

  // 在空闲时间预取背包与法物流通首屏关键图片，缩短首进白屏时间
  deferNonCriticalTask(() => {
    const essentialImages = [
      // Backbag 首屏关键图
      '/images/backbag/底图.png',
      '/images/backbag/组 1(3).png',
      '/images/backbag/组 1(2).png',
      '/images/backbag/底.png',
      '/images/backbag/图层 5 副本 2.png',
      '/images/backbag/图层 2.png',
      '/images/backbag/生成游戏图标 (7).png',
      // Legal-circulation 首屏关键图
      '/images/fawu/mobile/组 1.png',
      '/images/fawu/mobile/太极.png',
      '/images/fawu/mobile/price-bg.png',
      '/images/fawu/mobile/椭圆 1 拷贝 3.png',
      '/images/fawu/mobile/矩形 2.png',
      '/images/fawu/mobile/图层 4.png',
    ];
    for (const src of essentialImages) {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = src;
    }
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
