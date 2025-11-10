<template>
  <section
    class="relative w-full"
    style="height: 100vh; min-height: 400px"
  >
    <PanoramaPlayer
      class="player w-full h-full bg-black"
      :poster="poster"
      :low-src="lowQualityVideo"
      :mp4-src="mediumQualityVideo"
      :high-src="highQualityVideo"
      :initial-pitch-deg="initialPitchDeg"
      :initial-yaw-deg="initialYawDeg"
      :initial-fov="initialFov"
      :autoplay="true"
      :muted="true"
      :loop="true"
      @ready="handlePanoramaReady"
      @loading="handlePanoramaLoading"
      @error="handlePanoramaError"
    />
    <LoadingScreen
      :visible="loadingVisible"
      :progress="loadingProgress"
      :error="loadingError"
      @retry="handleRetry"
    />
    <DebugPanel v-if="showDebug" @close="showDebug = false" />

    <!-- 移动端资源图片 -->
    <img 
      v-if="!loadingVisible"
      src="/images/home/mobile/组 1.png" 
      alt="装饰图片" 
      class="mobile-decoration"
    />
    
    <!-- 移动端资源图片2 - 右上角位置，可点击切换 -->
    <img 
      v-if="!loadingVisible && showDecoration2"
      src="/images/home/mobile/组 1(1).png" 
      alt="装饰图片2" 
      class="mobile-decoration-2 clickable"
      @click="toggleDecoration"
    />
    
    <!-- 移动端资源图片3 - 与图片2同位置，条件显示，可点击切换 -->
    <img 
      v-if="!loadingVisible && !showDecoration2"
      src="/images/home/mobile/组 1 拷贝.png" 
      alt="装饰图片3" 
      class="mobile-decoration-2 clickable"
      @click="toggleDecoration"
    />
    
    <!-- 移动端资源图片4 - 背包按钮 -->
    <img 
      v-if="!loadingVisible"
      src="/images/home/mobile/组 1(2).png" 
      alt="背包按钮" 
      class="mobile-decoration-4 clickable"
      @click="openBackbag"
    />
    
    <!-- 背包界面 -->
    <Backbag v-if="showBackbag" @close="closeBackbag" />
    
    <!-- 调试按钮 -->
    <button
      v-if="!showDebug && !loadingVisible"
      class="debug-toggle-btn"
      title="打开调试面板"
      @click="showDebug = true"
    >
      🔧
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import PanoramaPlayer from '../components/PanoramaPlayer.vue';
import LoadingScreen from '../components/LoadingScreen.vue';
import DebugPanel from '../components/DebugPanel.vue';
import Backbag from '../components/backbag.vue';

// 显示调试面板（默认隐藏，点击图标打开）
const showDebug = ref(false);

// 控制右上角装饰图片的显示（true显示图片2，false显示图片3）
const showDecoration2 = ref(true);

// 控制背包界面显示
const showBackbag = ref(false);

const BASE = import.meta.env.BASE_URL;

// 视频源配置 - 提供多质量选项以适应不同网络条件
const poster = BASE + 'vite.svg';
const lowQualityVideo = BASE + 'videos/大殿全景.mp4'; // 低质量 MP4
const mediumQualityVideo = BASE + 'videos/大殿全景.mp4'; // 中等质量 MP4
const highQualityVideo = BASE + 'videos/大殿全景.mp4'; // 高质量视频（如果有 HLS 可以配置）

// 初始视角配置
const initialPitchDeg = 20; // 略向下以鸟瞰效果
const initialYawDeg = 0; // 初始水平角度
const initialFov = 75; // 初始视场角

// 加载界面状态
const loadingVisible = ref(true);
const loadingProgress = ref(0);
const loadingError = ref('');

/**
 * 处理全景播放器就绪事件
 */
const handlePanoramaReady = () => {
  console.log('[Home] 全景播放器就绪');
  loadingProgress.value = 100;
  loadingError.value = '';
  // 快速隐藏加载屏幕，提供更流畅的体验
  setTimeout(() => {
    console.log('[Home] 隐藏加载屏幕');
    loadingVisible.value = false;
  }, 150); // 缩短延迟时间
};

/**
 * 处理全景播放器加载进度
 */
const handlePanoramaLoading = (progress: number) => {
  // 当进度达到一定程度时，快速推进到接近完成
  if (progress >= 50) {
    loadingProgress.value = Math.min(progress + 20, 95); // 加速进度显示
  } else {
    loadingProgress.value = Math.min(progress, 95);
  }
};

/**
 * 处理全景播放器错误
 */
const handlePanoramaError = (error: string) => {
  loadingError.value = error || '加载全景视频时出现错误';
  loadingProgress.value = 0;
};

/**
 * 处理重试
 */
const handleRetry = () => {
  loadingError.value = '';
  loadingProgress.value = 0;
  loadingVisible.value = true;
  // 重新加载页面以重新初始化播放器
  window.location.reload();
};

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
  showBackbag.value = true;
};

/**
 * 关闭背包界面
 */
const closeBackbag = () => {
  showBackbag.value = false;
};

// 监听旧版全景加载完成事件（向后兼容）
const onPanoramaLoaded = () => {
  handlePanoramaReady();
};

onMounted(() => {
  window.addEventListener('panorama:loaded', onPanoramaLoaded);
});

onUnmounted(() => {
  window.removeEventListener('panorama:loaded', onPanoramaLoaded);
});
</script>

<style scoped>
.debug-toggle-btn {
  position: fixed;
  top: 70px;
  right: 15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(96, 165, 250, 0.9);
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 9998;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.debug-toggle-btn:hover {
  transform: scale(1.1);
  background: rgba(96, 165, 250, 1);
}

.debug-toggle-btn:active {
  transform: scale(0.95);
}

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

/* PC端隐藏移动端装饰图片 */
@media (min-width: 431px) {
  .mobile-decoration,
  .mobile-decoration-2,
  .mobile-decoration-4 {
    display: none;
  }
}
</style>
