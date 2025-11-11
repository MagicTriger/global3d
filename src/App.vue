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
import { getDefaultPanoramaVideoUrl, resolveAssetPath, getAssetCDNOrigin } from './utils/env';

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

  // 若配置了 CDN，加速握手：预连接并进行 DNS 预取
  const cdnOrigin = getAssetCDNOrigin();
  if (cdnOrigin) {
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = cdnOrigin;
    preconnect.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect);

    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = cdnOrigin;
    document.head.appendChild(dnsPrefetch);
  }

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
      img.src = resolveAssetPath(src);
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
      link.href = resolveAssetPath(src);
      document.head.appendChild(link);
    }
  });

  // 运行时对静态资源进行 CDN 重写（确保模板中写死的 /images/* 也能走 CDN）
  const rewriteStaticAssetsToCDN = () => {
    if (!cdnOrigin) return;
    const rewriteImgSelector = (selector: string) => {
      document.querySelectorAll<HTMLImageElement>(selector).forEach((img) => {
        const src = img.getAttribute('src');
        if (!src) return;
        if (src.startsWith('/images/') || src.startsWith('/videos/')) {
          img.src = resolveAssetPath(src);
        }
      });
    };

    rewriteImgSelector('img[src^="/images/"]');
    rewriteImgSelector('img[src^="/videos/"]');

    // 覆盖背包页背景图为 CDN 路径
    const backbag = document.querySelector<HTMLElement>('.backbag-container');
    if (backbag) {
      backbag.style.backgroundImage = `url(${resolveAssetPath('images/backbag/底图.png')})`;
    }
  };

  // 不延迟，尽快重写，避免重复加载非 CDN 资源
  rewriteStaticAssetsToCDN();
});

onUnmounted(() => {
  detach();
});
</script>
