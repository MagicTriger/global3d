<template>
  <transition name="fade">
    <div v-if="visible" class="loading-overlay">
      <!-- Logo 居中显示 -->
      <div class="logo-container">
        <img v-if="logoType === 'image'" :src="logoSrc" alt="Logo" class="logo" />
        <div v-else class="logo-text">{{ logoText }}</div>
      </div>

      <!-- 进度条区域 -->
      <div class="progress-section">
        <!-- 图层资源背景框 -->
        <div class="progress-layer-wrapper">
          <img src="/images/loading/图层 3.png" alt="进度条背景" class="progress-layer-bg" />
          <!-- 进度条填充 -->
          <div class="progress-bar" :style="{ width: `${internalProgress}%` }"></div>
          <!-- 进度指示器图标（资源 14.png，初始位置左139px，随进度移动） -->
          <div class="progress-icon-indicator" :style="{ left: `calc(139px + ${internalProgress}% * 478 / 100 - 13.75px)` }">
            <img src="/images/loading/资源 14.png" alt="进度指示器" class="progress-icon" />
          </div>
          <!-- 百分比显示（固定在进度条右边） -->
          <div class="progress-percentage">{{ Math.round(internalProgress) }}%</div>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="hasError" class="error">
        <div class="msg">{{ errorMessage }}</div>
        <button class="retry" @click="handleRetry">重新加载</button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: true },
  progress: { type: Number, default: 0 },
  error: { type: String, default: '' },
  logoType: { type: String, default: 'text' },
  logoSrc: { type: String, default: '/vite.svg' },
  logoText: { type: String, default: 'logo' },
})

const emit = defineEmits(['retry'])

const internalProgress = ref(Math.max(0, Math.min(100, props.progress)))
watch(() => props.progress, (v) => {
  internalProgress.value = Math.max(0, Math.min(100, v))
})

const hasError = computed(() => !!props.error)
const errorMessage = computed(() => props.error || '加载过程中出现错误，请重试')

const handleRetry = () => emit('retry')

const onPanoramaLoaded = () => {
  internalProgress.value = 100
}

onMounted(() => {
  window.addEventListener('panorama:loaded', onPanoramaLoaded)
})

onUnmounted(() => {
  window.removeEventListener('panorama:loaded', onPanoramaLoaded)
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  background: #211622;
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Logo 容器 - 进度条上方37px */
.logo-container {
  position: absolute;
  bottom: calc(120px + 37px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  max-width: 200px;
  max-height: 100px;
  object-fit: contain;
}

.logo-text {
  font-size: 80px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  user-select: none;
}

/* 进度条区域 - 底部120px固定 */
.progress-section {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 713px;
}

/* 图层资源包装器 */
.progress-layer-wrapper {
  position: relative;
  width: 100%;
  max-width: 713px;
}

/* 图层资源背景图 */
.progress-layer-bg {
  display: block;
  width: 100%;
  height: auto;
}

/* 进度条（左边距139px，总宽478px，高13px） */
.progress-bar {
  position: absolute;
  top: 50%;
  left: 139px;
  transform: translateY(-50%);
  width: 0;
  max-width: 478px;
  height: 13px;
  background: #ffb527;
  transition: width 0.3s ease;
  border-radius: 6.5px;
}

/* 进度指示器图标（资源 14.png，初始位置左139px，垂直居中） */
.progress-icon-indicator {
  position: absolute;
  top: 50%;
  left: 139px;
  transform: translateY(-50%);
  transition: left 0.3s ease;
  z-index: 10;
}

/* 进度指示器图标（缩小一倍：27.5px × 27px） */
.progress-icon {
  display: block;
  width: 27.5px;
  height: 27px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* 百分比显示（固定在进度条右边，左边距17px） */
.progress-percentage {
  position: absolute;
  top: 50%;
  left: calc(139px + 478px + 17px);
  transform: translateY(-50%);
  width: 55px;
  height: 22px;
  font-size: 16px;
  font-weight: 600;
  color: #ffb527;
  text-align: left;
  line-height: 22px;
}

/* 错误提示 */
.error {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #fff;
  width: calc(100% - 40px);
  max-width: 400px;
}

.msg {
  margin-bottom: 12px;
  opacity: 0.9;
  font-size: 14px;
}

.retry {
  padding: 10px 24px;
  border-radius: 8px;
  background: #fff;
  color: #211622;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.retry:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.retry:active {
  transform: translateY(0);
}

/* PC端适配 - 增加间距 */
@media (min-width: 431px) {
  .logo-container {
    bottom: calc(120px + 150px);
  }
}

/* 移动端适配 */
@media (max-width: 430px) {
  .logo-text {
    font-size: 48px;
  }
  
  .progress-section {
    width: 95%;
  }
  
  .progress-bar {
    left: 70px;
    max-width: 250px;
  }
  
  .progress-icon-indicator {
    left: 70px;
  }
  
  .progress-icon {
    width: 20px;
    height: 19.5px;
  }
  
  .progress-percentage {
    left: calc(70px + 250px + 12px);
    font-size: 12px;
  }
}

/* 淡入淡出动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}
</style>
