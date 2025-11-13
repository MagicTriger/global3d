import { ref, type Ref } from 'vue'
import type { VideoSource, VideoLoaderConfig } from '../types/panorama'
import logger from '../utils/logger'
import Hls from 'hls.js'
import { isIOS, isHlsSupported, isWechat } from '../utils/env'

interface VideoLoaderState {
  loading: Ref<boolean>
  currentSource: Ref<VideoSource | null>
  error: Ref<string | null>
}

export function useVideoLoader() {
  const state: VideoLoaderState = {
    loading: ref(false),
    currentSource: ref<VideoSource | null>(null),
    error: ref<string | null>(null),
  }

  let config: VideoLoaderConfig | null = null
  let sources: VideoSource[] = []

  function setupVideoAttributes(video: HTMLVideoElement, cfg: VideoLoaderConfig): void {
    video.autoplay = cfg.autoplay
    video.muted = true
    video.loop = cfg.loop
    video.preload = 'metadata'
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.setAttribute('x5-playsinline', '')
    video.crossOrigin = 'anonymous'
  }

  function pickPrimarySource(): VideoSource | null {
    const mp4 = sources.find((s) => s.type === 'mp4')
    if (mp4) return mp4
    const webm = sources.find((s) => s.type === 'webm')
    if (webm) return webm
    return sources[0] || null
  }

  async function loadStandardVideo(video: HTMLVideoElement, source: VideoSource): Promise<void> {
    logger.info('video', `开始加载 ${source.type.toUpperCase()} 视频`, { url: source.url })

    return new Promise<void>((resolve, reject) => {
      const handleLoaded = () => {
        cleanup()
        resolve()
      }

      const handleError = () => {
        const error = video.error
        const errorMessage = error
          ? `视频加载失败: ${error.message} (code: ${error.code})`
          : '视频加载失败'
        logger.error('video', errorMessage)
        cleanup()
        reject(new Error(errorMessage))
      }

      const cleanup = () => {
        video.removeEventListener('loadeddata', handleLoaded)
        video.removeEventListener('canplay', handleLoaded)
        video.removeEventListener('error', handleError)
      }

      video.addEventListener('loadeddata', handleLoaded)
      video.addEventListener('canplay', handleLoaded)
      video.addEventListener('error', handleError)

      video.src = source.url
      try { video.load() } catch {}

      setTimeout(() => {
        cleanup()
        reject(new Error('视频加载超时'))
      }, 30000)
    })
  }

  async function loadSource(video: HTMLVideoElement, source: VideoSource): Promise<void> {
    state.currentSource.value = source
    state.error.value = null
    try {
      if (source.type === 'hls') {
        await loadHls(video, source.url)
      } else {
        await loadStandardVideo(video, source)
      }
      logger.info('video', '视频源加载成功', {
        type: source.type,
        quality: source.quality,
        url: source.url,
      })
    } catch (error) {
      logger.error('video', '视频源加载失败', error)
      throw error
    }
  }

  async function tryLoad(video: HTMLVideoElement): Promise<void> {
    const source = pickPrimarySource()
    if (!source) throw new Error('未提供可用视频源')
    if (isHlsSupported()) {
      const hlsSource = sources.find((s) => s.type === 'hls')
      if (hlsSource) {
        await loadSource(video, hlsSource)
        return
      }
    }
    await loadSource(video, source)
  }

  async function loadHls(video: HTMLVideoElement, url: string): Promise<void> {
    if (isIOS()) { video.src = url; return }
    if (!Hls.isSupported()) throw new Error('浏览器不支持 HLS')
    const hls = new Hls({ startPosition: 0, enableWorker: true })
    hls.loadSource(url)
    hls.attachMedia(video)
    await new Promise<void>((resolve, reject) => {
      hls.on(Hls.Events.MANIFEST_PARSED, () => resolve())
      hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) reject(new Error('HLS 错误')) })
      setTimeout(() => reject(new Error('HLS 加载超时')), 30000)
    })
  }

  async function loadVideo(cfg: VideoLoaderConfig): Promise<void> {
    config = cfg
    sources = cfg.sources
    state.loading.value = true
    state.error.value = null

    const video = cfg.videoElement

    try {
      setupVideoAttributes(video, cfg)
      await tryLoad(video)
      // 首帧预解码：等待元数据、探测 currentTime、一次 play/pause
      try {
        const PRIME_TIMEOUT = 1500
        if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
          await new Promise<void>((resolve) => {
            const onLoadedMetadata = () => { video.removeEventListener('loadedmetadata', onLoadedMetadata); resolve() }
            video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
            setTimeout(() => { video.removeEventListener('loadedmetadata', onLoadedMetadata); resolve() }, PRIME_TIMEOUT)
          })
        }
        try { video.currentTime = 0.001 } catch {}
        const originalMuted = video.muted
        video.muted = true
        try { await video.play(); video.pause() } catch {}
        video.muted = originalMuted
      } catch {}
      logger.info('video', '视频加载完成')
    } catch (error) {
      logger.error('video', '视频加载最终失败', error)
      state.error.value = error instanceof Error ? error.message : '视频加载失败'
      throw error
    } finally {
      state.loading.value = false
    }
  }

  function setupLoopPlayback(video: HTMLVideoElement): (() => void) | undefined {
    if (!config?.loop) return
    video.loop = true
    const handleEnded = () => {
      logger.info('video', '视频播放结束，重新开始')
      video.currentTime = 0
      video.play().catch((error) => {
        logger.error('video', '循环播放失败', error)
      })
    }
    video.addEventListener('ended', handleEnded)
    return () => {
      video.removeEventListener('ended', handleEnded)
    }
  }

  function dispose(): void {
    state.loading.value = false
    state.currentSource.value = null
    state.error.value = null
    logger.info('video', '视频加载器已清理')
  }

  return {
    loading: state.loading,
    currentSource: state.currentSource,
    error: state.error,
    loadVideo,
    switchQuality: async () => {
      throw new Error('质量切换已移除')
    },
    autoSelectQuality: () => 'medium',
    setupLoopPlayback,
    dispose,
  }
}
