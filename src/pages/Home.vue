<template>
  <section>
    <PanoramaPlayer
      class="player w-full bg-black"
      :poster="poster"
      :low-src="lowSrc"
      :initialPitchDeg="initialPitchDeg"
    />
    <LoadingScreen :visible="loadingVisible" :progress="loadingProgress" />
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import PanoramaPlayer from '../components/PanoramaPlayer.vue';
import LoadingScreen from './LoadingScreen.vue';

// 使用本地 MP4 全景视频作为纹理源
const poster = '/vite.svg';
const lowSrc = '/videos/大殿全景.mp4';
// 初始视角：略向下以鸟瞰效果，可按需调整
const initialPitchDeg = 20;

// 加载界面状态（示例接入，视频播放时会触发 100%）
const loadingVisible = ref(true);
const loadingProgress = ref(0);

const onPanoramaLoaded = () => {
  loadingProgress.value = 100;
  // 可选：加载完成后延迟隐藏
  setTimeout(() => (loadingVisible.value = false), 300);
};

onMounted(() => {
  window.addEventListener('panorama:loaded', onPanoramaLoaded);
});
onUnmounted(() => {
  window.removeEventListener('panorama:loaded', onPanoramaLoaded);
});
</script>

<style scoped>
.player {
  height: calc(100vh - var(--header-h, 56px));
}
@supports (height: 100svh) {
  .player {
    height: calc(100svh - var(--header-h, 56px));
  }
}
</style>
