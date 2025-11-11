/**
 * WebGL 版本检测
 * 检测 WebGL 1.0 和 2.0 支持情况
 */
export function detectWebGLVersion(): 1 | 2 | null {
  try {
    const canvas = document.createElement('canvas');

    // 尝试 WebGL 2.0
    if (canvas.getContext('webgl2')) {
      return 2;
    }

    // 尝试 WebGL 1.0
    if (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) {
      return 1;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 检查 WebGL 是否可用（向后兼容）
 */
export function isWebGLAvailable(): boolean {
  return detectWebGLVersion() !== null;
}

/**
 * CSS3D 支持检测
 * 检测 transform-style: preserve-3d 和 perspective 支持
 */
export function detectCSS3DSupport(): boolean {
  try {
    const testElement = document.createElement('div');
    testElement.style.transformStyle = 'preserve-3d';

    // 检查是否支持 preserve-3d
    const supportsPreserve3d = testElement.style.transformStyle === 'preserve-3d';

    // 检查是否支持 perspective
    testElement.style.perspective = '1000px';
    const supportsPerspective = testElement.style.perspective === '1000px';

    return supportsPreserve3d && supportsPerspective;
  } catch {
    return false;
  }
}

/**
 * 视频格式检测
 * 检测 MP4, WebM, HLS 支持情况
 */
export function detectVideoFormats(): {
  mp4: boolean;
  webm: boolean;
  hls: boolean;
} {
  const video = document.createElement('video');

  return {
    mp4: video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '',
    webm: video.canPlayType('video/webm; codecs="vp8, vorbis"') !== '',
    hls: isHlsSupported(),
  };
}

/**
 * HLS 支持检测（向后兼容）
 */
export function isHlsSupported(): boolean {
  const video = document.createElement('video');

  // iOS 原生支持 HLS
  if (isIOS() && video.canPlayType('application/vnd.apple.mpegurl') !== '') {
    return true;
  }

  // 其他浏览器通过 MediaSource 支持 HLS (需要 hls.js)
  return typeof MediaSource !== 'undefined' && typeof MediaSource.isTypeSupported === 'function';
}

/**
 * 自动播放策略检测
 * 尝试播放静音视频来检测自动播放是否被允许
 */
export async function detectAutoplayPolicy(): Promise<boolean> {
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;

    // 创建一个空的视频 blob
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    // 尝试播放
    await video.play();
    return true;
  } catch (error) {
    // NotAllowedError 表示自动播放被阻止
    return false;
  }
}

/**
 * iOS 设备检测（向后兼容）
 */
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Android 设备检测
 */
export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

/**
 * 微信浏览器检测
 */
export function isWechat(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}

/**
 * UC 浏览器检测
 */
export function isUCBrowser(): boolean {
  return /UCBrowser/i.test(navigator.userAgent);
}

/**
 * 移动端环境检测
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 获取浏览器名称
 */
export function getBrowserName(): string {
  const ua = navigator.userAgent;

  if (isWechat()) return 'WeChat';
  if (isUCBrowser()) return 'UC Browser';
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Edge/i.test(ua)) return 'Edge';
  if (/MSIE|Trident/i.test(ua)) return 'Internet Explorer';

  return 'Unknown';
}

/**
 * 获取浏览器版本
 */
export function getBrowserVersion(): string {
  const ua = navigator.userAgent;
  let match: RegExpMatchArray | null;

  if (isWechat()) {
    match = ua.match(/MicroMessenger\/([\d.]+)/i);
    return match ? match[1] : 'Unknown';
  }

  if (isUCBrowser()) {
    match = ua.match(/UCBrowser\/([\d.]+)/i);
    return match ? match[1] : 'Unknown';
  }

  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) {
    match = ua.match(/Chrome\/([\d.]+)/i);
    return match ? match[1] : 'Unknown';
  }

  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    match = ua.match(/Version\/([\d.]+)/i);
    return match ? match[1] : 'Unknown';
  }

  if (/Firefox/i.test(ua)) {
    match = ua.match(/Firefox\/([\d.]+)/i);
    return match ? match[1] : 'Unknown';
  }

  if (/Edge/i.test(ua)) {
    match = ua.match(/Edge\/([\d.]+)/i);
    return match ? match[1] : 'Unknown';
  }

  return 'Unknown';
}

/**
 * 设备性能评估
 * 评估内存、GPU 等设备性能指标
 */
export function assessDevicePerformance(): {
  memory: number | null;
  hardwareConcurrency: number;
  devicePixelRatio: number;
  maxTextureSize: number | null;
  performanceScore: 'high' | 'medium' | 'low';
} {
  // 获取设备内存（仅部分浏览器支持）
  const memory = (navigator as any).deviceMemory || null;

  // 获取 CPU 核心数
  const hardwareConcurrency = navigator.hardwareConcurrency || 1;

  // 获取设备像素比
  const devicePixelRatio = window.devicePixelRatio || 1;

  // 获取 WebGL 最大纹理尺寸
  let maxTextureSize: number | null = null;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      maxTextureSize = (gl as WebGLRenderingContext).getParameter(
        (gl as WebGLRenderingContext).MAX_TEXTURE_SIZE
      );
    }
  } catch {
    // 忽略错误
  }

  // 计算性能评分
  let performanceScore: 'high' | 'medium' | 'low' = 'medium';

  // 高性能设备：内存 >= 4GB，核心数 >= 4，支持大纹理
  if (
    (memory === null || memory >= 4) &&
    hardwareConcurrency >= 4 &&
    (maxTextureSize === null || maxTextureSize >= 4096)
  ) {
    performanceScore = 'high';
  }
  // 低性能设备：内存 < 2GB，核心数 < 2，纹理尺寸小
  else if (
    (memory !== null && memory < 2) ||
    hardwareConcurrency < 2 ||
    (maxTextureSize !== null && maxTextureSize < 2048)
  ) {
    performanceScore = 'low';
  }

  return {
    memory,
    hardwareConcurrency,
    devicePixelRatio,
    maxTextureSize,
    performanceScore,
  };
}

/**
 * 触摸支持检测
 */
export function hasTouchSupport(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * 资源路径解析，自动附加 BASE_URL
 */
export function resolveAssetPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return base + normalized;
}

/**
 * 默认全景视频路径配置
 * 可通过环境变量 VITE_DEFAULT_PANORAMA_VIDEO 覆盖（相对 public 的路径）
 */
export const DEFAULT_PANORAMA_VIDEO = (
  (import.meta.env as any).VITE_DEFAULT_PANORAMA_VIDEO as string
) || 'videos/大殿全景.mp4';

/**
 * 获取默认全景视频的完整 URL（带 BASE_URL）
 */
export function getDefaultPanoramaVideoUrl(): string {
  return resolveAssetPath(DEFAULT_PANORAMA_VIDEO);
}
