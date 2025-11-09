/**
 * 视频加载器 Composable
 * 处理视频资源加载、格式适配、HLS 支持、错误重试和质量切换
 */

import { ref, type Ref } from 'vue';
import Hls from 'hls.js';
import type { VideoSource, VideoLoaderConfig, VideoQuality } from '../types/panorama';
import logger from '../utils/logger';
import { isIOS, isHlsSupported, isMobile, isAndroid, assessDevicePerformance } from '../utils/env';
import memoryMonitor from '../utils/memoryMonitor';

/**
 * 视频加载器状态
 */
interface VideoLoaderState {
  /** 是否正在加载 */
  loading: Ref<boolean>;
  /** 当前视频源 */
  currentSource: Ref<VideoSource | null>;
  /** 当前质量 */
  currentQuality: Ref<VideoQuality>;
  /** 错误信息 */
  error: Ref<string | null>;
  /** 重试次数 */
  retryCount: Ref<number>;
  /** HLS 实例 */
  hlsInstance: Ref<any>;
}

/**
 * 视频加载器 Composable
 */
export function useVideoLoader() {
  // 状态
  const state: VideoLoaderState = {
    loading: ref(false),
    currentSource: ref<VideoSource | null>(null),
    currentQuality: ref<VideoQuality>('medium'),
    error: ref<string | null>(null),
    retryCount: ref(0),
    hlsInstance: ref<Hls | null>(null),
  };

  // 配置
  let config: VideoLoaderConfig | null = null;
  let sources: VideoSource[] = [];

  // 重试配置
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

  /**
   * 设置视频元素属性（移动端兼容性）
   * 优化 iOS 和 Android 兼容性
   */
  function setupVideoAttributes(video: HTMLVideoElement, cfg: VideoLoaderConfig): void {
    // 基本属性
    video.autoplay = cfg.autoplay;
    video.muted = cfg.muted;
    video.loop = cfg.loop;
    video.playsInline = true;

    // iOS 特定属性 - 确保内联播放，防止全屏
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    // iOS 自动播放要求：必须静音
    if (cfg.autoplay && !cfg.muted) {
      logger.warn('video', 'iOS 自动播放要求视频静音，强制设置 muted=true');
      video.muted = true;
    }

    // Android 微信/X5 内核特定属性
    video.setAttribute('x5-playsinline', '');
    video.setAttribute('x5-video-player-type', 'h5-page');
    video.setAttribute('x5-video-player-fullscreen', 'false');
    video.setAttribute('x5-video-orientation', 'portraint'); // 竖屏模式

    // 预加载策略 - 移动端优化
    // 移动端统一使用 metadata，避免过度缓冲导致卡顿
    const devicePerf = assessDevicePerformance();
    if (isMobile()) {
      video.preload = 'metadata'; // 移动端只加载元数据
      logger.info('video', '移动端：使用 metadata 预加载策略');
    } else if (devicePerf.performanceScore === 'high') {
      video.preload = 'auto'; // 高性能桌面设备可以预加载
      logger.info('video', '高性能设备：使用 auto 预加载策略');
    } else {
      video.preload = 'metadata'; // 默认使用 metadata
      logger.info('video', '标准设备：使用 metadata 预加载策略');
    }

    // 跨域设置
    video.crossOrigin = 'anonymous';

    logger.info('video', '视频元素属性设置完成（iOS/Android 优化）', {
      autoplay: cfg.autoplay,
      muted: cfg.muted,
      loop: cfg.loop,
      playsInline: true,
      isIOS: isIOS(),
      isAndroid: isAndroid(),
    });
  }

  /**
   * 选择降级视频源
   */
  function selectFallbackSource(preferredQuality: VideoQuality): VideoSource | null {
    // 质量降级顺序：high -> medium -> low
    const qualityOrder: VideoQuality[] = ['high', 'medium', 'low'];
    const startIndex = qualityOrder.indexOf(preferredQuality);

    // 从当前质量开始向下降级
    for (let i = startIndex + 1; i < qualityOrder.length; i++) {
      const fallbackQuality = qualityOrder[i];
      const fallbackSources = sources.filter((s) => s.quality === fallbackQuality);

      if (fallbackSources.length > 0) {
        logger.info('video', `降级到质量: ${fallbackQuality}`);
        return fallbackSources[0];
      }
    }

    // 如果向下降级失败，尝试向上
    for (let i = startIndex - 1; i >= 0; i--) {
      const fallbackQuality = qualityOrder[i];
      const fallbackSources = sources.filter((s) => s.quality === fallbackQuality);

      if (fallbackSources.length > 0) {
        logger.info('video', `升级到质量: ${fallbackQuality}`);
        return fallbackSources[0];
      }
    }

    // 如果都没有，返回第一个可用源
    return sources.length > 0 ? sources[0] : null;
  }

  /**
   * 加载 HLS 视频
   */
  async function loadHLS(video: HTMLVideoElement, source: VideoSource): Promise<void> {
    logger.info('video', '开始加载 HLS 视频', { url: source.url });

    // iOS 原生支持 HLS
    if (isIOS()) {
      logger.info('video', 'iOS 设备，使用原生 HLS 支持');
      video.src = source.url;
      return;
    }

    // 其他浏览器使用 hls.js
    if (Hls.isSupported()) {
      logger.info('video', '使用 hls.js 加载 HLS 流');

      // 清理旧的 HLS 实例
      if (state.hlsInstance.value) {
        state.hlsInstance.value.destroy();
        state.hlsInstance.value = null;
      }

      // 创建新的 HLS 实例
      // 根据设备性能调整缓冲区大小
      const devicePerf = assessDevicePerformance();
      const bufferConfig =
        devicePerf.performanceScore === 'low'
          ? { maxBufferLength: 15, maxMaxBufferLength: 30 } // 低性能设备：减少缓冲
          : devicePerf.performanceScore === 'high'
            ? { maxBufferLength: 30, maxMaxBufferLength: 60 } // 高性能设备：标准缓冲
            : { maxBufferLength: 20, maxMaxBufferLength: 40 }; // 中等性能设备：适中缓冲

      logger.info('video', `HLS 缓冲配置: ${JSON.stringify(bufferConfig)}`, {
        performanceScore: devicePerf.performanceScore,
      });

      const hls = new Hls({
        ...bufferConfig,
        startPosition: 0, // 起始位置
        enableWorker: true, // 启用 Web Worker
        lowLatencyMode: false, // 低延迟模式（直播用）
        maxBufferSize: devicePerf.performanceScore === 'low' ? 30 * 1000 * 1000 : 60 * 1000 * 1000, // 最大缓冲大小（字节）
        maxBufferHole: 0.5, // 最大缓冲空洞（秒）
      });

      state.hlsInstance.value = hls;

      // 加载视频源
      hls.loadSource(source.url);
      hls.attachMedia(video);

      // 监听事件
      return new Promise<void>((resolve, reject) => {
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          logger.info('video', 'HLS manifest 解析完成');
          resolve();
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            logger.error('video', 'HLS 致命错误', data);

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                logger.error('video', 'HLS 网络错误，尝试恢复');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                logger.error('video', 'HLS 媒体错误，尝试恢复');
                hls.recoverMediaError();
                break;
              default:
                logger.error('video', 'HLS 无法恢复的错误');
                reject(new Error(`HLS Error: ${data.type}`));
                break;
            }
          }
        });

        // 超时处理
        setTimeout(() => {
          reject(new Error('HLS 加载超时'));
        }, 30000); // 30 秒超时
      });
    } else {
      throw new Error('浏览器不支持 HLS');
    }
  }

  /**
   * 加载 MP4/WebM 视频
   */
  async function loadStandardVideo(video: HTMLVideoElement, source: VideoSource): Promise<void> {
    logger.info('video', `开始加载 ${source.type.toUpperCase()} 视频`, { url: source.url });

    return new Promise<void>((resolve, reject) => {
      const handleCanPlay = () => {
        logger.info('video', '视频可以播放');
        cleanup();
        resolve();
      };

      const handleError = () => {
        const error = video.error;
        const errorMessage = error
          ? `视频加载失败: ${error.message} (code: ${error.code})`
          : '视频加载失败';
        logger.error('video', errorMessage);
        cleanup();
        reject(new Error(errorMessage));
      };

      const cleanup = () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      // 设置视频源
      video.src = source.url;

      // 超时处理
      setTimeout(() => {
        cleanup();
        reject(new Error('视频加载超时'));
      }, 30000); // 30 秒超时
    });
  }

  /**
   * 加载视频源
   */
  async function loadSource(video: HTMLVideoElement, source: VideoSource): Promise<void> {
    state.currentSource.value = source;
    state.error.value = null;

    try {
      if (source.type === 'hls') {
        await loadHLS(video, source);
      } else {
        await loadStandardVideo(video, source);
      }

      logger.info('video', '视频源加载成功', {
        type: source.type,
        quality: source.quality,
        url: source.url,
      });
    } catch (error) {
      logger.error('video', '视频源加载失败', error);
      throw error;
    }
  }

  /**
   * 尝试加载视频（带格式降级）
   */
  async function tryLoadWithFallback(
    video: HTMLVideoElement,
    quality: VideoQuality
  ): Promise<void> {
    // 按优先级尝试不同格式：HLS -> MP4 -> WebM
    const formatOrder: Array<'hls' | 'mp4' | 'webm'> = ['hls', 'mp4', 'webm'];

    for (const format of formatOrder) {
      const source = sources.find((s) => s.type === format && s.quality === quality);

      if (!source) {
        logger.info('video', `跳过格式 ${format}（未配置）`);
        continue;
      }

      // 检查格式支持
      if (format === 'hls' && !isHlsSupported()) {
        logger.info('video', '跳过 HLS（浏览器不支持）');
        continue;
      }

      try {
        logger.info('video', `尝试加载格式: ${format}`);
        await loadSource(video, source);
        return; // 成功加载，退出
      } catch (error) {
        logger.warn('video', `格式 ${format} 加载失败，尝试下一个格式`, error);
        continue;
      }
    }

    // 所有格式都失败，尝试质量降级
    const fallbackSource = selectFallbackSource(quality);
    if (fallbackSource && fallbackSource.quality !== quality) {
      logger.warn('video', `当前质量 ${quality} 所有格式失败，尝试降级质量`);
      await tryLoadWithFallback(video, fallbackSource.quality);
      return;
    }

    // 所有格式和质量都失败
    throw new Error('所有视频格式加载失败');
  }

  /**
   * 延迟函数
   */
  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 重试加载视频
   */
  async function retryLoad(video: HTMLVideoElement, quality: VideoQuality): Promise<void> {
    for (let i = 0; i < MAX_RETRIES; i++) {
      state.retryCount.value = i + 1;

      try {
        logger.info('video', `重试加载视频 (${i + 1}/${MAX_RETRIES})`);
        await tryLoadWithFallback(video, quality);
        state.retryCount.value = 0; // 重置重试计数
        return; // 成功
      } catch (error) {
        logger.warn('video', `第 ${i + 1} 次重试失败`, error);

        if (i < MAX_RETRIES - 1) {
          // 等待后重试
          const delayMs = RETRY_DELAYS[i];
          logger.info('video', `等待 ${delayMs}ms 后重试`);
          await delay(delayMs);
        }
      }
    }

    // 所有重试都失败
    const errorMsg = `视频加载失败，已重试 ${MAX_RETRIES} 次`;
    state.error.value = errorMsg;
    logger.error('video', errorMsg);
    throw new Error(errorMsg);
  }

  /**
   * 加载视频
   */
  async function loadVideo(cfg: VideoLoaderConfig): Promise<void> {
    config = cfg;
    sources = cfg.sources;
    state.loading.value = true;
    state.error.value = null;
    state.retryCount.value = 0;

    const video = cfg.videoElement;

    try {
      // 设置视频元素属性
      setupVideoAttributes(video, cfg);

      // 尝试加载视频（带重试）
      await retryLoad(video, state.currentQuality.value);

      logger.info('video', '视频加载完成');
    } catch (error) {
      logger.error('video', '视频加载最终失败', error);
      state.error.value = error instanceof Error ? error.message : '视频加载失败';
      throw error;
    } finally {
      state.loading.value = false;
    }
  }

  /**
   * 切换视频质量
   */
  async function switchQuality(quality: VideoQuality): Promise<void> {
    if (!config) {
      throw new Error('视频加载器未初始化');
    }

    const video = config.videoElement;
    const currentTime = video.currentTime;
    const wasPlaying = !video.paused;

    logger.info('video', `切换视频质量: ${state.currentQuality.value} -> ${quality}`);

    try {
      state.loading.value = true;
      state.currentQuality.value = quality;

      // 清理旧的 HLS 实例
      if (state.hlsInstance.value) {
        state.hlsInstance.value.destroy();
        state.hlsInstance.value = null;
      }

      // 加载新质量的视频
      await tryLoadWithFallback(video, quality);

      // 恢复播放位置
      video.currentTime = currentTime;

      // 恢复播放状态
      if (wasPlaying) {
        await video.play();
      }

      logger.info('video', '视频质量切换成功', { quality, currentTime });
    } catch (error) {
      logger.error('video', '视频质量切换失败', error);
      throw error;
    } finally {
      state.loading.value = false;
    }
  }

  /**
   * 根据网络速度和内存情况自动选择质量
   */
  function autoSelectQuality(): VideoQuality {
    // 首先检查内存情况
    const shouldDowngrade = memoryMonitor.shouldDowngradeQuality();
    if (shouldDowngrade) {
      logger.warn('video', '内存不足，降级到低质量视频');
      return 'low';
    }

    // 检查设备性能
    const devicePerf = assessDevicePerformance();
    if (devicePerf.performanceScore === 'low') {
      logger.info('video', '低性能设备，选择低质量视频');
      return 'low';
    }

    // 使用 Network Information API（如果可用）
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      const effectiveType = connection.effectiveType;
      const downlink = connection.downlink; // Mbps

      logger.info('video', '网络信息', { effectiveType, downlink });

      // 根据网络类型选择质量
      if (effectiveType === '4g' && downlink > 5) {
        return devicePerf.performanceScore === 'high' ? 'high' : 'medium';
      } else if (effectiveType === '4g' || effectiveType === '3g') {
        return 'medium';
      } else {
        return 'low';
      }
    }

    // 默认根据设备性能选择
    if (devicePerf.performanceScore === 'high') {
      return 'medium'; // 保守策略，默认不选择 high
    }

    return 'medium';
  }

  /**
   * 设置循环播放
   */
  function setupLoopPlayback(video: HTMLVideoElement): (() => void) | undefined {
    if (!config?.loop) {
      return;
    }

    // 设置 loop 属性
    video.loop = true;

    // 监听 ended 事件作为兜底
    const handleEnded = () => {
      logger.info('video', '视频播放结束，重新开始');
      video.currentTime = 0;
      video.play().catch((error) => {
        logger.error('video', '循环播放失败', error);
      });
    };

    video.addEventListener('ended', handleEnded);

    // 返回清理函数
    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }

  /**
   * 清理资源
   */
  function dispose(): void {
    // 清理 HLS 实例
    if (state.hlsInstance.value) {
      state.hlsInstance.value.destroy();
      state.hlsInstance.value = null;
    }

    // 重置状态
    state.loading.value = false;
    state.currentSource.value = null;
    state.error.value = null;
    state.retryCount.value = 0;

    logger.info('video', '视频加载器已清理');
  }

  return {
    // 状态
    loading: state.loading,
    currentSource: state.currentSource,
    currentQuality: state.currentQuality,
    error: state.error,
    retryCount: state.retryCount,

    // 方法
    loadVideo,
    switchQuality,
    autoSelectQuality,
    setupLoopPlayback,
    dispose,
  };
}
