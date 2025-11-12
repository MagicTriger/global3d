<template>
  <section class="relative w-full" style="height: 100vh; min-height: 400px">
    <PanoramaPlayer
      class="player w-full h-full bg-black"
      :poster="poster"
      :mp4-src="mediumQualityVideo"
      :initial-pitch-deg="initialPitchDeg"
      :initial-yaw-deg="initialYawDeg"
      :initial-fov="initialFov"
      :autoplay="true"
      :muted="true"
      :loop="true"
    />

    <!-- 移动端资源图片 -->
    <img
      v-if="!globalLoadingVisible"
      src="/images/home/mobile/组 1.png"
      alt="装饰图片"
      class="mobile-decoration"
      loading="lazy"
    />

    <!-- 移动端资源图片2 - 右上角位置，可点击切换 -->
    <img
      v-if="!globalLoadingVisible && showDecoration2"
      src="/images/home/mobile/组 1(1).png"
      alt="装饰图片2"
      class="mobile-decoration-2 clickable"
      loading="lazy"
      @click="toggleDecoration"
    />

    <!-- 移动端资源图片3 - 与图片2同位置，条件显示，可点击切换 -->
    <img
      v-if="!globalLoadingVisible && !showDecoration2"
      src="/images/home/mobile/组 1 拷贝.png"
      alt="装饰图片3"
      class="mobile-decoration-2 clickable"
      loading="lazy"
      @click="toggleDecoration"
    />

    <!-- 移动端资源图片4 - 背包按钮 -->
    <img
      v-if="!globalLoadingVisible"
      src="/images/home/mobile/组 1(2).png"
      alt="背包按钮"
      class="mobile-decoration-4 clickable"
      loading="lazy"
      @click="openBackbag"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, defineOptions } from 'vue';
import { useRouter } from 'vue-router';
import PanoramaPlayer from '../components/PanoramaPlayer.vue';
import { useGlobalLoading } from '../composables/useGlobalLoading';
import { getDefaultPanoramaVideoUrl } from '../utils/env';
// 显式命名组件以支持 KeepAlive 精确缓存
defineOptions({ name: 'Home' });
// 路由实例
const router = useRouter();

// 读取全局加载层状态用于控制首页装饰显隐
const { visible: globalLoadingVisible } = useGlobalLoading();

// 控制右上角装饰图片的显示（true显示图片2，false显示图片3）
const showDecoration2 = ref(true);

const BASE = import.meta.env.BASE_URL;

// 视频源配置 - 默认从配置读取，可通过 env 统一注入
const poster = BASE + 'vite.svg';
const defaultVideo = getDefaultPanoramaVideoUrl();
const mediumQualityVideo = defaultVideo; // 默认使用 MP4(H.264) 源

// 初始视角配置
const initialPitchDeg = 20; // 略向下以鸟瞰效果
const initialYawDeg = 0; // 初始水平角度
const initialFov = 75; // 初始视场角

/**
 * 切换右上角装饰图片显示
 */
const toggleDecoration = () => {
  showDecoration2.value = !showDecoration2.value;
};

/**
 * 打开背包界面
 */
const openBackbag = () => {
  router.push('/backbag');
};
</script>

<style scoped>
/* 首页调试按钮样式已移除 */

/* 移动端装饰图片 - 缩小一倍 */
.mobile-decoration {
  position: fixed;
  left: 8.5px;
  top: 14px;
  z-index: 9997;
  pointer-events: none;
  object-fit: contain;
  transform: scale(0.5);
  transform-origin: top left;
}

/* 移动端装饰图片2和3 - 缩小一倍，右上角同位置 */
.mobile-decoration-2 {
  position: fixed;
  top: 15px;
  right: 10px;
  z-index: 9997;
  pointer-events: none;
  object-fit: contain;
  transform: scale(0.5);
  transform-origin: top right;
}

/* 可点击的装饰图片 */
.mobile-decoration-2.clickable {
  pointer-events: auto;
  cursor: pointer;
  transition: opacity 0.3s;
}

.mobile-decoration-2.clickable:active {
  opacity: 0.7;
}

/* 移动端装饰图片4 - 缩小一倍，右下角 */
.mobile-decoration-4 {
  position: fixed;
  bottom: 21px;
  right: 10px;
  z-index: 9997;
  pointer-events: none;
  object-fit: contain;
  transform: scale(0.5);
  transform-origin: bottom right;
}

/* 可点击的背包按钮 */
.mobile-decoration-4.clickable {
  pointer-events: auto;
  cursor: pointer;
  transition: opacity 0.3s;
}

.mobile-decoration-4.clickable:active {
  opacity: 0.7;
}

/* 响应式适配：平板与桌面端显示并调整尺寸与位置 */
@media (min-width: 640px) {
  /* 平板：适当放大并调整边距 */
  .mobile-decoration {
    left: 16px;
    top: 20px;
    transform: scale(0.75);
  }

  .mobile-decoration-2 {
    top: 20px;
    right: 16px;
    transform: scale(0.75);
  }

  .mobile-decoration-4 {
    bottom: 24px;
    right: 16px;
    transform: scale(0.75);
  }
}

@media (min-width: 1024px) {
  /* 桌面：正常尺寸并增加可点击性 */
  .mobile-decoration {
    left: 24px;
    top: 24px;
    transform: none; /* 1:1 显示 */
  }

  .mobile-decoration-2 {
    top: 24px;
    right: 24px;
    transform: none;
    pointer-events: auto; /* 确保可点击 */
    cursor: pointer;
  }

  .mobile-decoration-4 {
    bottom: 24px;
    right: 24px;
    transform: none;
    pointer-events: auto; /* 确保可点击 */
    cursor: pointer;
  }
}
</style>
