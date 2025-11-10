<template>
  <transition name="fade">
    <div v-if="visible" class="loading-overlay">
      <div class="panel">
        <!-- 使用图片作为进度条背景 -->
        <div class="bar-container">
          <img src="/images/loading/资源 14.png" alt="进度条背景" class="bar-bg" />
          <div class="bar-fill-container">
            <img 
              src="/images/loading/图层 3.png" 
              alt="进度条" 
              class="bar-fill" 
              :style="{ clipPath: `inset(0 ${100 - internalProgress}% 0 0)` }"
            />
          </div>
        </div>
        <div class="percent">{{ internalProgress }}%</div>

        <div v-if="hasError" class="error">
          <div class="msg">{{ errorMessage }}</div>
          <button class="retry" @click="handleRetry">重新加载</button>
        </div>
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
})

const emit = defineEmits(['retry'])

const internalProgress = ref(Math.max(0, Math.min(100, props.progress)))
watch(() => props.progress, (v) => {
  internalProgress.value = Math.max(0, Math.min(100, v))
})

const hasError = computed(() => !!props.error)
const errorMessage = computed(() => props.error || '加载过程中出现错误，请重试')

const handleRetry = () => emit('retry')

// 监听播放器触发的加载完成事件，进度直接到 100%
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
  background: #211622; /* 使用指定的背景颜色 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.panel {
  width: 90%;
  max-width: 480px;
  color: #fff;
  text-align: center;
}

.bar-container {
  position: relative;
  width: 100%;
  height: auto;
}

.bar-bg {
  width: 100%;
  height: auto;
  display: block;
}

.bar-fill-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.bar-fill {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: clip-path 0.3s ease;
}

.percent {
  margin-top: 16px;
  font-weight: 600;
  font-size: 18px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.error {
  margin-top: 24px;
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

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}
</style>
