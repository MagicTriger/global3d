/**
 * 全景播放器类型定义
 * 定义了全景视频播放系统的所有接口和类型
 */

// ============================================================================
// 渲染器类型
// ============================================================================

/**
 * 渲染器类型
 * - webgl: 使用 Three.js 的 WebGL 渲染器（最佳体验）
 * - css3d: 使用 CSS3D 变换的渲染器（中等体验）
 * - fallback: 静态图片降级方案（保底方案）
 */
export type RendererType = 'webgl' | 'css3d' | 'fallback';

/**
 * 渲染器配置接口
 */
export interface RendererConfig {
  /** 渲染器类型 */
  type: RendererType;
  /** 渲染容器元素 */
  container: HTMLElement;
  /** 视频元素 */
  videoElement: HTMLVideoElement;
  /** 初始视角配置 */
  initialView: {
    /** 水平旋转角度（度） */
    yaw: number;
    /** 垂直旋转角度（度） */
    pitch: number;
    /** 视场角（度） */
    fov: number;
  };
}

/**
 * 渲染器接口
 * 所有渲染器实现必须遵循此接口
 */
export interface Renderer {
  /** 初始化渲染器 */
  init(config: RendererConfig): Promise<void>;
  /** 销毁渲染器并清理资源 */
  dispose(): void;
  /** 设置视角 */
  setView(yaw: number, pitch: number): void;
  /** 相对移动视角 */
  panBy(deltaYaw: number, deltaPitch: number): void;
  /** 调整渲染器尺寸 */
  resize(width: number, height: number): void;
  /** 视频准备就绪回调 */
  onVideoReady(video: HTMLVideoElement): void;
}

// ============================================================================
// 浏览器兼容性
// ============================================================================

/**
 * 浏览器能力检测结果
 */
export interface BrowserCapabilities {
  /** 是否支持 WebGL */
  webgl: boolean;
  /** WebGL 版本（1 或 2，不支持则为 null） */
  webglVersion: 1 | 2 | null;
  /** 是否支持 CSS3D 变换 */
  css3d: boolean;
  /** 视频格式支持情况 */
  videoFormats: {
    /** 是否支持 MP4 */
    mp4: boolean;
    /** 是否支持 WebM */
    webm: boolean;
    /** 是否支持 HLS */
    hls: boolean;
  };
  /** 是否允许自动播放 */
  autoplayAllowed: boolean;
  /** 是否支持触摸 */
  touchSupport: boolean;
  /** 设备像素比 */
  devicePixelRatio: number;
  /** 是否为移动设备 */
  isMobile: boolean;
  /** 是否为 iOS 设备 */
  isIOS: boolean;
  /** 是否为 Android 设备 */
  isAndroid: boolean;
  /** 是否为微信浏览器 */
  isWechat: boolean;
  /** 浏览器名称 */
  browserName: string;
  /** 浏览器版本 */
  browserVersion: string;
}

// ============================================================================
// 视频加载
// ============================================================================

/**
 * 视频质量级别
 */
export type VideoQuality = 'low' | 'medium' | 'high';

/**
 * 视频源类型
 */
export type VideoSourceType = 'hls' | 'mp4' | 'webm';

/**
 * 视频源配置
 */
export interface VideoSource {
  /** 视频 URL */
  url: string;
  /** 视频类型 */
  type: VideoSourceType;
  /** 视频质量 */
  quality: VideoQuality;
}

/**
 * 视频加载器配置
 */
export interface VideoLoaderConfig {
  /** 视频源列表（按优先级排序） */
  sources: VideoSource[];
  /** 视频元素 */
  videoElement: HTMLVideoElement;
  /** 是否自动播放 */
  autoplay: boolean;
  /** 是否静音 */
  muted: boolean;
  /** 是否循环播放 */
  loop: boolean;
}

// ============================================================================
// 日志系统
// ============================================================================

/**
 * 日志级别
 */
export type LogLevel = 'info' | 'warn' | 'error';

/**
 * 日志分类
 */
export type LogCategory = 'compatibility' | 'renderer' | 'video' | 'interaction' | 'memory';

/**
 * 日志条目
 */
export interface LogEntry {
  /** 时间戳（毫秒） */
  timestamp: number;
  /** 日志级别 */
  level: LogLevel;
  /** 日志分类 */
  category: LogCategory;
  /** 日志消息 */
  message: string;
  /** 附加数据 */
  data?: any;
}

// ============================================================================
// 播放器状态
// ============================================================================

/**
 * 全景播放器状态
 */
export interface PanoramaPlayerState {
  // 渲染状态
  /** 当前使用的渲染器类型 */
  rendererType: RendererType;
  /** 渲染器是否已准备就绪 */
  isReady: boolean;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 是否需要用户手势才能播放 */
  needsGesture: boolean;

  // 视频状态
  /** 视频是否已加载 */
  videoLoaded: boolean;
  /** 视频是否正在播放 */
  videoPlaying: boolean;
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 视频总时长（秒） */
  duration: number;
  /** 已缓冲的时间范围 */
  buffered: TimeRanges | null;

  // 视角状态
  /** 当前视角 */
  currentView: {
    /** 水平旋转角度（度） */
    yaw: number;
    /** 垂直旋转角度（度） */
    pitch: number;
    /** 视场角（度） */
    fov: number;
  };

  // 兼容性信息
  /** 浏览器能力检测结果 */
  capabilities: BrowserCapabilities | null;

  // 错误状态
  /** 错误信息（无错误时为 null） */
  error: {
    /** 是否有错误 */
    hasError: boolean;
    /** 错误消息 */
    message: string;
    /** 错误代码 */
    code: string;
  } | null;
}
