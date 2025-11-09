<template>
  <transition name="fade">
    <div v-if="visible" class="loading-overlay">
      <div class="panel">
        <div class="bar">
          <div class="progress" :style="{ width: internalProgress + '%' }"></div>
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
  background: rgba(0, 0, 0, 0.9);
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

.bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #22c55e, #f59e0b);
  background-size: 200% 100%;
  animation: glow 2s linear infinite;
}

.percent {
  margin-top: 12px;
  font-weight: 600;
}

.error {
  margin-top: 16px;
}

.msg {
  margin-bottom: 8px;
  opacity: 0.9;
}

.retry {
  padding: 8px 16px;
  border-radius: 8px;
  background: #fff;
  color: #111;
  font-weight: 600;
}

@keyframes glow {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
