<template>
  <div ref="rootRef" class="panorama-root relative w-full h-full overflow-hidden">
    <!-- 加载状态 -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30"
    >
      <div class="text-white/80 text-sm mb-2">{{ loadingMessage }}</div>
      <!-- 始终显示进度条 -->
      <div class="w-48 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-blue-500 transition-all duration-300"
          :style="{ width: `${loadingProgress}%` }"
        ></div>
      </div>
      <div class="text-white/60 text-xs mt-2">{{ loadingProgress }}%</div>
    </div>

    <!-- 缓冲状态 -->
    <div
      v-if="isBuffering && !isLoading"
      class="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded text-sm z-20"
    >
      缓冲中...
    </div>

    <!-- 播放按钮（需要用户手势时显示） -->
    <button
      v-if="showPlayButton"
      class="absolute inset-0 z-20 flex items-center justify-center bg-black/60 hover:bg-black/50 transition-colors"
      style="min-width: 44px; min-height: 44px"
      @click="handlePlayClick"
    >
      <div class="play-button-icon">
        <div class="play-triangle"></div>
      </div>
    </button>

    <!-- WebGL 渲染器容器 -->
    <div
      v-show="currentRendererType === 'webgl'"
      ref="webglContainerRef"
      class="absolute inset-0"
    ></div>

    <!-- CSS3D 渲染器容器 -->
    <div
      v-show="currentRendererType === 'css3d'"
      ref="css3dContainerRef"
      class="absolute inset-0"
    ></div>

    <!-- Fallback 渲染器容器 -->
    <div
      v-show="currentRendererType === 'fallback'"
      ref="fallbackContainerRef"
      class="absolute inset-0"
    ></div>

    <!-- 视频元素（隐藏，用作纹理源） -->
    <video
      ref="videoRef"
      class="absolute w-px h-px opacity-0 -z-10 pointer-events-none"
      :poster="poster"
    ></video>

    <!-- 错误提示 -->
    <div
      v-if="errorMessage"
      class="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-40 text-white p-4"
    >
      <div class="text-red-400 mb-4">{{ errorMessage }}</div>
      <button
        v-if="canRetry"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        @click="handleRetry"
      >
        重试
      </button>
    </div>

    <!-- 降级提示 -->
    <div
      v-if="showDegradationNotice"
      class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-600/90 text-white px-4 py-2 rounded text-sm z-10"
    >
      {{ degradationMessage }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import type { VideoSource } from '../types/panorama';
import { useCompatibility } from '../composables/useCompatibility';
import { useRenderer } from '../composables/useRenderer';
import { useVideoLoader } from '../composables/useVideoLoader';
import { useInteraction } from '../composables/useInteraction';
import logger from '../utils/logger';
import memoryMonitor from '../utils/memoryMonitor';

// Props 定义
interface Props {
  poster?: string;
  hlsSrc?: string;
  lowSrc?: string;
  highSrc?: string;
  mp4Src?: string;
  webmSrc?: string;
  initialYawDeg?: number;
  initialPitchDeg?: number;
  initialFov?: number;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  poster: '',
  hlsSrc: '',
  lowSrc: '',
  highSrc: '',
  mp4Src: '',
  webmSrc: '',
  initialYawDeg: 0,
  initialPitchDeg: 0,
  initialFov: 75,
  autoplay: true,
  muted: true,
  loop: true,
});

// 定义事件
const emit = defineEmits<{
  ready: [];
  loading: [progress: number];
  error: [message: string];
}>();

// 使用 Composables
const compatibility = useCompatibility();
const rendererManager = useRenderer();
const videoLoader = useVideoLoader();
const interaction = useInteraction();

// 模板引用
const rootRef = ref<HTMLElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const webglContainerRef = ref<HTMLElement | null>(null);
const css3dContainerRef = ref<HTMLElement | null>(null);
const fallbackContainerRef = ref<HTMLElement | null>(null);

// 组件状态
const isLoading = ref(true); // 恢复自动加载
const loadingMessage = ref('正在初始化...');
const errorMessage = ref<string | null>(null);
const canRetry = ref(false);
const showDegradationNotice = ref(false);
const degradationMessage = ref('');
const isBuffering = ref(false);
const loadingProgress = ref(0);

// 计算属性
const showPlayButton = computed(() => interaction.showPlayButton.value);
const currentRendererType = computed(() => rendererManager.currentType.value);

// 清理函数引用
let loopCleanup: (() => void) | undefined;

/**
 * 构建视频源列表
 */
function buildVideoSources(): VideoSource[] {
  const sources: VideoSource[] = [];

  // HLS 源
  if (props.hlsSrc) {
    sources.push({ url: props.hlsSrc, type: 'hls', quality: 'medium' });
  }
  if (props.lowSrc) {
    sources.push({ url: props.lowSrc, type: 'hls', quality: 'low' });
  }
  if (props.highSrc) {
    sources.push({ url: props.highSrc, type: 'hls', quality: 'high' });
  }

  // MP4 源
  if (props.mp4Src) {
    sources.push({ url: props.mp4Src, type: 'mp4', quality: 'medium' });
  }

  // WebM 源
  if (props.webmSrc) {
    sources.push({ url: props.webmSrc, type: 'webm', quality: 'medium' });
  }

  return sources;
}

/**
 * 处理播放按钮点击
 */
async function handlePlayClick() {
  logger.info('interaction', '播放按钮被点击');
  
  if (!videoRef.value) {
    logger.error('interaction', '视频元素不存在');
    return;
  }

  const video = videoRef.value;

  try {
    // 确保视频已加载
    if (!video.src) {
      logger.error('interaction', '视频源未设置');
      errorMessage.value = '视频源未加载，请刷新页面重试';
      return;
    }

    // 如果视频未准备好，先加载
    if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      loadingMessage.value = '正在加载视频...';
      isLoading.value = true;
      video.load();
      
      // 等待视频准备好
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = () => {
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          reject(new Error('视频加载失败'));
        };
        
        video.addEventListener('canplay', onCanPlay, { once: true });
        video.addEventListener('error', onError, { once: true });
        
        // 5秒超时
        setTimeout(() => {
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          reject(new Error('视频加载超时'));
        }, 5000);
      });
      
      isLoading.value = false;
    }

    await interaction.handlePlayButtonClick(video);
    
  } catch (error) {
    logger.error('interaction', '播放按钮点击处理失败', error);
    isLoading.value = false;
    errorMessage.value = error instanceof Error ? error.message : '无法播放视频，请刷新页面重试';
    canRetry.value = true;
  }
}

/**
 * 处理开始体验按钮点击
 * 这是绕过自动播放限制的关键 - 用户主动点击后，所有浏览器都允许播放
 */
async function handleStartExperience() {
  logger.info('interaction', '用户点击开始体验按钮');
  
  // 隐藏启动屏幕
  showStartScreen.value = false;
  
  // 开始初始化播放器
  await initializePlayer();
}

/**
 * 处理重试
 */
async function handleRetry() {
  errorMessage.value = null;
  canRetry.value = false;
  await initializePlayer();
}

/**
 * 初始化播放器
 * 这是 subtask 11.2 的主要实现
 * 优化：使用 requestIdleCallback 延迟非关键初始化
 */
async function initializePlayer() {
  try {
    // 微信浏览器检测
    const isWechatBrowser = /MicroMessenger/i.test(navigator.userAgent);
    if (isWechatBrowser) {
      logger.info('renderer', '检测到微信浏览器环境');
    }
    
    logger.info('renderer', '开始初始化全景播放器');
    isLoading.value = true;
    loadingProgress.value = 10; // 初始进度
    loadingMessage.value = '正在检测浏览器能力...';

    // 步骤 1: 执行兼容性检测（关键路径）
    const capabilities = await compatibility.detectCapabilities();
    loadingProgress.value = 20; // 兼容性检测完成
    logger.info('compatibility', '兼容性检测完成', capabilities);

    // 步骤 2: 根据检测结果选择渲染器（关键路径）
    loadingMessage.value = '正在选择渲染器...';
    loadingProgress.value = 25;
    const selectedRendererType = compatibility.selectRenderer(capabilities);
    logger.info('renderer', `选择的渲染器: ${selectedRendererType}`);

    // 显示降级提示
    if (selectedRendererType === 'css3d') {
      showDegradationNotice.value = true;
      degradationMessage.value = '您的浏览器不支持 WebGL，使用简化渲染模式';
    } else if (selectedRendererType === 'fallback') {
      showDegradationNotice.value = true;
      degradationMessage.value = '您的浏览器功能受限，使用基础显示模式';
    }

    // 步骤 3: 获取渲染器容器
    let container: HTMLElement | null = null;
    if (selectedRendererType === 'webgl') {
      container = webglContainerRef.value;
    } else if (selectedRendererType === 'css3d') {
      container = css3dContainerRef.value;
    } else if (selectedRendererType === 'fallback') {
      container = fallbackContainerRef.value;
    }

    if (!container) {
      throw new Error('渲染器容器未找到');
    }

    // 步骤 4: 初始化选定的渲染器
    loadingMessage.value = '正在初始化渲染器...';
    loadingProgress.value = 30;
    const rendererInitSuccess = await rendererManager.initRenderer({
      type: selectedRendererType,
      container,
      videoElement: videoRef.value!,
      initialView: {
        yaw: props.initialYawDeg,
        pitch: props.initialPitchDeg,
        fov: props.initialFov,
      },
    });

    if (!rendererInitSuccess) {
      throw new Error('渲染器初始化失败');
    }

    loadingProgress.value = 40;
    logger.info('renderer', '渲染器初始化成功');

    // 步骤 5: 加载视频资源
    loadingMessage.value = '正在加载视频...';
    loadingProgress.value = 50;
    const videoSources = buildVideoSources();

    if (videoSources.length === 0) {
      throw new Error('未提供视频源');
    }

    // iOS 优化：并行加载视频和初始化渲染器，减少总加载时间
    const videoLoadPromise = videoLoader.loadVideo({
      sources: videoSources,
      videoElement: videoRef.value!,
      autoplay: props.autoplay,
      muted: props.muted,
      loop: props.loop,
    });

    // 等待视频加载完成
    await videoLoadPromise;
    loadingProgress.value = 70;
    logger.info('video', '视频加载成功');

    // 步骤 6: 设置循环播放
    if (props.loop && videoRef.value) {
      loopCleanup = videoLoader.setupLoopPlayback(videoRef.value);
    }

    // 步骤 7: 处理自动播放策略
    if (props.autoplay && videoRef.value) {
      loadingMessage.value = '正在启动播放...';
      loadingProgress.value = 80;
      
      // iOS 优化：在尝试自动播放前，先加载视频数据
      // 这样即使自动播放失败，视频也已经准备好，点击播放按钮会立即播放
      if (videoRef.value.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        logger.info('video', 'iOS 优化：等待视频数据加载');
        await new Promise<void>((resolve) => {
          const video = videoRef.value!;
          const onCanPlay = () => {
            video.removeEventListener('canplay', onCanPlay);
            resolve();
          };
          video.addEventListener('canplay', onCanPlay);
          // 触发加载
          video.load();
        });
      }
      
      loadingProgress.value = 90;
      const autoplaySuccess = await interaction.tryAutoplay(videoRef.value);

      if (!autoplaySuccess) {
        logger.info('interaction', '自动播放失败，显示播放按钮（视频已预加载）');
        // 播放按钮已由 interaction.tryAutoplay 自动显示
        // 此时视频已经预加载，用户点击后会立即播放
      } else {
        logger.info('interaction', '自动播放成功');
      }
    }

    // 步骤 8: 启用触摸控制（如果有渲染器）
    loadingProgress.value = 95;
    if (rendererManager.currentRenderer.value && rootRef.value) {
      interaction.enableTouchControls(rootRef.value, rendererManager.currentRenderer.value);
      logger.info('interaction', '触摸控制已启用');
    }

    // 步骤 9: 监听视频播放事件，隐藏加载状态
    if (videoRef.value) {
      const video = videoRef.value;

      // 标记是否已经通知渲染器和发射 ready 事件
      let videoReadyNotified = false;
      let readyEventEmitted = false;

      // 微信浏览器检测
      const isWechatBrowser = /MicroMessenger/i.test(navigator.userAgent);
      
      // 微信浏览器需要更长的超时时间（3秒），因为加载较慢
      const timeoutDuration = isWechatBrowser ? 3000 : 1000;
      
      // 设置超时机制：如果超时没有触发事件，强制显示内容
      const forceShowTimeout = setTimeout(() => {
        if (!readyEventEmitted && rendererManager.currentRenderer.value && videoRef.value) {
          logger.info('video', `超时触发：强制显示内容（${timeoutDuration}ms）`);

          // 通知渲染器
          if (!videoReadyNotified) {
            rendererManager.currentRenderer.value.onVideoReady(videoRef.value);
            videoReadyNotified = true;
          }

          // 隐藏加载状态
          isLoading.value = false;
          loadingMessage.value = '';

          // 发射 ready 事件
          window.dispatchEvent(
            new CustomEvent('panorama:loaded', {
              detail: {
                rendererType: selectedRendererType,
                capabilities,
              },
            })
          );
          emit('ready');
          readyEventEmitted = true;
        }
      }, timeoutDuration);

      // loadeddata 事件 - 视频首帧数据加载完成（最早可显示内容）
      const handleLoadedData = () => {
        clearTimeout(forceShowTimeout);
        // 在 loadeddata 时就通知渲染器创建纹理，最早显示内容
        if (!videoReadyNotified && rendererManager.currentRenderer.value && videoRef.value) {
          rendererManager.currentRenderer.value.onVideoReady(videoRef.value);
          videoReadyNotified = true;
          logger.info('renderer', '已通知渲染器视频准备就绪（loadeddata）');
        }

        // 立即隐藏加载状态，显示视频内容
        if (!readyEventEmitted) {
          isLoading.value = false;
          loadingMessage.value = '';

          // 通知外部组件
          window.dispatchEvent(
            new CustomEvent('panorama:loaded', {
              detail: {
                rendererType: selectedRendererType,
                capabilities,
              },
            })
          );

          // 发射 ready 事件
          emit('ready');
          readyEventEmitted = true;
          logger.info('video', '视频数据加载完成，提前显示内容');
        }
      };

      // canplay 事件 - 视频可以开始播放
      const handleCanPlay = () => {
        clearTimeout(forceShowTimeout);

        // 确保渲染器已通知
        if (!videoReadyNotified && rendererManager.currentRenderer.value && videoRef.value) {
          rendererManager.currentRenderer.value.onVideoReady(videoRef.value);
          videoReadyNotified = true;
          logger.info('renderer', '已通知渲染器视频准备就绪（canplay）');
        }

        // 确保 ready 事件已发射
        if (!readyEventEmitted) {
          isLoading.value = false;
          loadingMessage.value = '';

          window.dispatchEvent(
            new CustomEvent('panorama:loaded', {
              detail: {
                rendererType: selectedRendererType,
                capabilities,
              },
            })
          );
          emit('ready');
          readyEventEmitted = true;
        }

        isBuffering.value = false;
        logger.info('video', '视频可以播放');
      };

      // 播放事件 - 视频开始播放
      const handlePlaying = () => {
        clearTimeout(forceShowTimeout);

        isLoading.value = false;
        isBuffering.value = false;
        loadingMessage.value = '';
        logger.info('video', '视频开始播放');

        // 确保渲染器已通知（兜底）
        if (!videoReadyNotified && rendererManager.currentRenderer.value && videoRef.value) {
          rendererManager.currentRenderer.value.onVideoReady(videoRef.value);
          videoReadyNotified = true;
          logger.info('renderer', '已通知渲染器视频准备就绪（playing）');
        }

        // 确保 ready 事件已发射（兜底）
        if (!readyEventEmitted) {
          window.dispatchEvent(
            new CustomEvent('panorama:loaded', {
              detail: {
                rendererType: selectedRendererType,
                capabilities,
              },
            })
          );
          emit('ready');
          readyEventEmitted = true;
        }
      };

      // 缓冲事件
      const handleWaiting = () => {
        isBuffering.value = true;
        logger.info('video', '视频缓冲中');
      };

      // 进度事件
      const handleProgress = () => {
        if (video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          const duration = video.duration;
          if (duration > 0) {
            const progress = Math.round((bufferedEnd / duration) * 100);
            loadingProgress.value = progress;
            // 发射 loading 事件
            emit('loading', progress);
          }
        }
      };

      // 错误事件
      const handleError = () => {
        const error = video.error;
        const errorMsg = error
          ? `视频加载失败: ${error.message} (code: ${error.code})`
          : '视频加载失败';
        logger.error('video', errorMsg);
        isLoading.value = false;
        isBuffering.value = false;
        errorMessage.value = errorMsg;
        canRetry.value = true;
        // 发射 error 事件
        emit('error', errorMsg);
      };

      video.addEventListener('loadeddata', handleLoadedData, { once: true });
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('progress', handleProgress);
      video.addEventListener('error', handleError);
    }

    // 如果不自动播放，也要隐藏加载状态
    if (!props.autoplay) {
      isLoading.value = false;
      loadingMessage.value = '';
    }

    logger.info('renderer', '全景播放器初始化完成');
  } catch (error) {
    logger.error('renderer', '全景播放器初始化失败', error);
    isLoading.value = false;
    const errorMsg = error instanceof Error ? error.message : '初始化失败，请刷新页面重试';
    errorMessage.value = errorMsg;
    canRetry.value = true;
    // 发射 error 事件
    emit('error', errorMsg);
  }
}

// 对外暴露 API
defineExpose({
  setView: (yawDeg: number, pitchDeg: number) => {
    if (rendererManager.currentRenderer.value) {
      rendererManager.currentRenderer.value.setView(yawDeg, pitchDeg);
    }
  },
  panBy: (deltaYawDeg: number, deltaPitchDeg: number) => {
    if (rendererManager.currentRenderer.value) {
      rendererManager.currentRenderer.value.panBy(deltaYawDeg, deltaPitchDeg);
    }
  },
});

onMounted(async () => {
  // 启动内存监控
  memoryMonitor.startMonitoring(10000); // 每 10 秒检查一次
  memoryMonitor.setLowMemoryCallback(() => {
    logger.warn('memory', '检测到内存不足，尝试降级视频质量');
    // 如果当前不是低质量，尝试切换到低质量
    if (videoLoader.currentQuality.value !== 'low') {
      videoLoader.switchQuality('low').catch((error) => {
        logger.error('memory', '降级视频质量失败', error);
      });
    }
  });

  // 自动初始化播放器
  await initializePlayer();
});

onBeforeUnmount(() => {
  logger.info('renderer', '开始清理全景播放器资源');

  try {
    // 0. 停止内存监控
    memoryMonitor.stopMonitoring();
    logger.info('memory', '内存监控已停止');

    // 1. 禁用触摸控制
    if (rootRef.value) {
      interaction.disableTouchControls(rootRef.value);
      logger.info('interaction', '触摸控制已禁用');
    }

    // 2. 销毁渲染器（及时释放纹理和几何体）
    if (rendererManager.currentRenderer.value) {
      rendererManager.dispose();
      logger.info('renderer', '渲染器已销毁');
    }

    // 3. 清理视频资源
    if (videoRef.value) {
      // 停止播放
      videoRef.value.pause();
      videoRef.value.src = '';
      videoRef.value.load();
      logger.info('video', '视频资源已清理');
    }

    // 4. 清理视频加载器
    videoLoader.dispose();
    logger.info('video', '视频加载器已清理');

    // 5. 清理循环播放监听器
    if (loopCleanup) {
      loopCleanup();
      loopCleanup = undefined;
      logger.info('video', '循环播放监听器已清理');
    }

    // 6. 移除事件监听器
    if (videoRef.value) {
      // 移除所有可能的事件监听器
      const events = ['playing', 'ended', 'error', 'loadedmetadata', 'canplay'];
      events.forEach((event) => {
        videoRef.value?.removeEventListener(event, () => {});
      });
    }

    // 7. 记录最终内存状态
    memoryMonitor.logMemoryInfo();

    logger.info('renderer', '全景播放器资源清理完成');
  } catch (error) {
    logger.error('renderer', '清理资源时发生错误', error);
  }
});
</script>

<style scoped>
.panorama-root {
  touch-action: none;
  -ms-touch-action: none;
  overscroll-behavior: contain;
}

.play-button-icon {
  width: 80px;
  height: 80px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.play-button-icon:hover {
  background-color: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 1);
}

.play-triangle {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 15px 0 15px 25px;
  border-color: transparent transparent transparent rgba(255, 255, 255, 0.9);
  margin-left: 5px;
}
</style>
