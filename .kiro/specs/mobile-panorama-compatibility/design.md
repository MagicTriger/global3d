# 设计文档

## 概述

本设计文档描述了移动端全景视频兼容性适配方案的完整架构。当前系统在移动端浏览器中出现黑屏问题，主要原因包括：

1. **视频自动播放限制**: iOS Safari 和部分 Android 浏览器禁止未经用户交互的视频自动播放
2. **WebGL 上下文丢失**: 某些移动端浏览器在内存压力下会丢失 WebGL 上下文
3. **视频格式兼容性**: 不同浏览器对视频编码格式的支持不一致
4. **Three.js 初始化失败**: 在低端设备或特定浏览器中 Three.js 可能无法正常初始化
5. **视频纹理绑定时机**: 视频未开始播放时纹理为空导致黑屏

解决方案采用**渐进式降级策略**：WebGL (Three.js) → CSS3D → 静态图片，并增强移动端特定的兼容性处理。

## 架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      PanoramaPlayer                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           CompatibilityDetector                       │  │
│  │  - detectWebGL()                                      │  │
│  │  - detectCSS3D()                                      │  │
│  │  - detectVideoFormats()                               │  │
│  │  - detectAutoplayPolicy()                             │  │
│  │  - selectRenderer()                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           RendererManager                             │  │
│  │  - initWebGLRenderer()                                │  │
│  │  - initCSS3DRenderer()                                │  │
│  │  - initFallbackRenderer()                             │  │
│  │  - switchRenderer()                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│         ↓                ↓                ↓                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐            │
│  │  WebGL   │   │  CSS3D   │   │   Fallback   │            │
│  │ Renderer │   │ Renderer │   │   Renderer   │            │
│  │(Three.js)│   │(CSS3D)   │   │(Static Image)│            │
│  └──────────┘   └──────────┘   └──────────────┘            │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           VideoLoader                                 │  │
│  │  - loadVideo()                                        │  │
│  │  - handleHLS()                                        │  │
│  │  - handleMP4()                                        │  │
│  │  - retryOnError()                                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           InteractionManager                          │  │
│  │  - showPlayButton()                                   │  │
│  │  - handleUserGesture()                                │  │
│  │  - enableTouchControls()                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Logger                                      │  │
│  │  - logCompatibility()                                 │  │
│  │  - logError()                                         │  │
│  │  - reportMetrics()                                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 渲染器选择流程

```
开始
  ↓
检测 WebGL 支持
  ↓
WebGL 可用? ──否──→ 检测 CSS3D 支持
  ↓ 是                    ↓
尝试初始化 Three.js    CSS3D 可用? ──否──→ 使用静态图片降级
  ↓                      ↓ 是
初始化成功? ──否──→ 检测 CSS3D 支持    使用 CSS3D 渲染器
  ↓ 是                    ↓
使用 WebGL 渲染器      记录降级原因
  ↓                      ↓
记录成功信息          完成初始化
  ↓                      ↓
完成初始化 ←───────────┘
```

## 组件和接口

### 1. CompatibilityDetector (兼容性检测器)

**职责**: 检测浏览器能力并决定使用哪种渲染方式

**接口**:

```typescript
interface BrowserCapabilities {
  webgl: boolean;
  webglVersion: 1 | 2 | null;
  css3d: boolean;
  videoFormats: {
    mp4: boolean;
    webm: boolean;
    hls: boolean;
  };
  autoplayAllowed: boolean;
  touchSupport: boolean;
  devicePixelRatio: number;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWechat: boolean;
  browserName: string;
  browserVersion: string;
}

interface CompatibilityDetector {
  detect(): Promise<BrowserCapabilities>;
  selectRenderer(capabilities: BrowserCapabilities): RendererType;
}

type RendererType = 'webgl' | 'css3d' | 'fallback';
```

**实现细节**:

- `detectWebGL()`: 创建临时 canvas 尝试获取 WebGL 上下文，检测 WebGL 1.0 和 2.0 支持
- `detectCSS3D()`: 检测 CSS `transform-style: preserve-3d` 和 `perspective` 支持
- `detectVideoFormats()`: 使用 `HTMLVideoElement.canPlayType()` 检测视频格式支持
- `detectAutoplayPolicy()`: 尝试播放静音视频检测自动播放策略
- `detectMobileEnvironment()`: 通过 User-Agent 和特征检测识别移动端环境

### 2. RendererManager (渲染器管理器)

**职责**: 管理不同渲染器的初始化、切换和销毁

**接口**:

```typescript
interface RendererConfig {
  type: RendererType;
  container: HTMLElement;
  videoElement: HTMLVideoElement;
  initialView: { yaw: number; pitch: number; fov: number };
}

interface Renderer {
  init(config: RendererConfig): Promise<void>;
  dispose(): void;
  setView(yaw: number, pitch: number): void;
  panBy(deltaYaw: number, deltaPitch: number): void;
  resize(width: number, height: number): void;
  onVideoReady(video: HTMLVideoElement): void;
}

interface RendererManager {
  currentRenderer: Renderer | null;
  initRenderer(config: RendererConfig): Promise<void>;
  switchRenderer(newType: RendererType): Promise<void>;
  dispose(): void;
}
```

### 3. WebGLRenderer (WebGL 渲染器)

**职责**: 使用 Three.js 实现高质量 3D 球面全景渲染

**实现细节**:

- 使用 `THREE.SphereGeometry` 创建内翻球体（scale -1, 1, 1）
- 使用 `THREE.VideoTexture` 将视频作为纹理映射到球面
- 使用 `OrbitControls` 实现触摸手势控制
- 监听 `webglcontextlost` 事件处理上下文丢失
- 在视频 `playing` 事件后才绑定视频纹理，避免黑屏
- 使用 `requestAnimationFrame` 实现流畅渲染循环

**关键修复**:

```typescript
// 问题：视频纹理在视频未播放时为黑色
// 解决：延迟纹理绑定直到视频开始播放
video.addEventListener('playing', () => {
  if (!videoTexture) {
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    mesh.material.map = videoTexture;
    mesh.material.needsUpdate = true;
  }
});
```

### 4. CSS3DRenderer (CSS3D 渲染器)

**职责**: 使用 CSS3D 变换实现简化的全景效果

**实现细节**:

- 创建 6 个面的立方体或圆柱体结构
- 使用 CSS `transform: rotateY()` 和 `rotateX()` 实现视角旋转
- 使用 `<video>` 元素作为纹理源
- 监听触摸事件实现拖拽旋转
- 性能优化：使用 `will-change: transform` 和 `transform: translateZ(0)` 启用硬件加速

**HTML 结构**:

```html
<div class="css3d-container" style="perspective: 1000px;">
  <div class="css3d-scene" style="transform-style: preserve-3d;">
    <div class="css3d-face front">
      <video src="panorama.mp4"></video>
    </div>
    <!-- 其他面 -->
  </div>
</div>
```

### 5. FallbackRenderer (降级渲染器)

**职责**: 当 WebGL 和 CSS3D 都不可用时显示静态全景图片

**实现细节**:

- 显示全景视频的首帧或预设的 poster 图片
- 使用 CSS `background-size: cover` 填充容器
- 支持简单的拖拽查看（通过 CSS `background-position` 实现）
- 显示提示信息告知用户浏览器不支持全景视频

### 6. VideoLoader (视频加载器)

**职责**: 处理视频资源加载、格式适配和错误重试

**接口**:

```typescript
interface VideoSource {
  url: string;
  type: 'hls' | 'mp4' | 'webm';
  quality: 'low' | 'medium' | 'high';
}

interface VideoLoaderConfig {
  sources: VideoSource[];
  videoElement: HTMLVideoElement;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
}

interface VideoLoader {
  load(config: VideoLoaderConfig): Promise<void>;
  retry(maxRetries: number): Promise<void>;
  switchQuality(quality: 'low' | 'medium' | 'high'): Promise<void>;
  dispose(): void;
}
```

**实现细节**:

- **HLS 支持**: 使用 `hls.js` 处理 m3u8 流，iOS 使用原生 HLS 支持
- **格式降级**: MP4 → WebM → 静态图片
- **自适应码率**: 根据网络速度自动切换视频质量
- **错误重试**: 加载失败时最多重试 3 次，每次延迟递增（1s, 2s, 4s）
- **预加载策略**: 使用 `preload="metadata"` 减少初始加载时间

**移动端优化**:

```typescript
// 移动端视频属性设置
video.setAttribute('playsinline', '');
video.setAttribute('webkit-playsinline', '');
video.setAttribute('x5-playsinline', '');
video.setAttribute('x5-video-player-type', 'h5-page');
video.setAttribute('x5-video-player-fullscreen', 'false');
```

### 7. InteractionManager (交互管理器)

**职责**: 处理用户交互、手势控制和自动播放策略

**接口**:

```typescript
interface InteractionManager {
  showPlayButton(): void;
  hidePlayButton(): void;
  handleUserGesture(): Promise<void>;
  enableTouchControls(renderer: Renderer): void;
  disableTouchControls(): void;
}
```

**实现细节**:

- **播放按钮**: 在需要用户手势的环境中显示大尺寸播放按钮（最小 44x44px）
- **触摸手势**:
  - 单指拖拽：旋转视角
  - 双指缩放：调整 FOV
  - 防止默认滚动：`touch-action: none`
- **自动播放处理**:
  ```typescript
  async function tryAutoplay(video: HTMLVideoElement) {
    try {
      await video.play();
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        showPlayButton();
      }
    }
  }
  ```

### 8. Logger (日志记录器)

**职责**: 记录兼容性信息、错误和性能指标

**接口**:

```typescript
interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  category: 'compatibility' | 'renderer' | 'video' | 'interaction';
  message: string;
  data?: any;
}

interface Logger {
  logCompatibility(capabilities: BrowserCapabilities): void;
  logRendererSwitch(from: RendererType, to: RendererType, reason: string): void;
  logError(error: Error, context: string): void;
  logPerformance(metric: string, value: number): void;
  getLogs(): LogEntry[];
  exportLogs(): string;
}
```

**实现细节**:

- 开发模式：输出到 `console`
- 生产模式：缓存日志并提供上报接口
- 记录关键信息：
  - 浏览器能力检测结果
  - 渲染器选择和切换
  - 视频加载和播放事件
  - 错误堆栈和环境信息

## 数据模型

### PanoramaPlayerState

```typescript
interface PanoramaPlayerState {
  // 渲染状态
  rendererType: RendererType;
  isReady: boolean;
  isPlaying: boolean;
  needsGesture: boolean;

  // 视频状态
  videoLoaded: boolean;
  videoPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: TimeRanges;

  // 视角状态
  currentView: {
    yaw: number;
    pitch: number;
    fov: number;
  };

  // 兼容性信息
  capabilities: BrowserCapabilities;

  // 错误状态
  error: {
    hasError: boolean;
    message: string;
    code: string;
  } | null;
}
```

## 错误处理

### 错误类型和处理策略

| 错误类型         | 检测方式                       | 处理策略                  | 用户提示                   |
| ---------------- | ------------------------------ | ------------------------- | -------------------------- |
| WebGL 初始化失败 | Three.js 抛出异常              | 降级到 CSS3D              | 无（自动降级）             |
| WebGL 上下文丢失 | `webglcontextlost` 事件        | 尝试恢复，失败则降级      | "正在恢复渲染..."          |
| 视频加载失败     | `error` 事件                   | 重试 3 次，失败则显示错误 | "视频加载失败，请刷新页面" |
| 视频格式不支持   | `canPlayType` 返回空           | 尝试其他格式              | 无（自动切换）             |
| 自动播放被阻止   | `play()` 返回 rejected Promise | 显示播放按钮              | "点击播放"                 |
| 网络超时         | 加载超过 30 秒                 | 显示错误并提供重试        | "加载超时，点击重试"       |

### 错误恢复流程

```
错误发生
  ↓
记录错误日志
  ↓
判断错误类型
  ↓
可恢复? ──是──→ 尝试恢复
  ↓ 否              ↓
可降级? ──是──→ 切换到降级方案
  ↓ 否              ↓
显示错误信息    恢复成功? ──否──→ 显示错误信息
  ↓                ↓ 是
提供重试按钮    继续运行
```

## 测试策略

### 单元测试

- **CompatibilityDetector**: 模拟不同浏览器环境测试检测逻辑
- **VideoLoader**: 测试 HLS/MP4 加载、重试机制、质量切换
- **Logger**: 测试日志记录和导出功能

### 集成测试

- **渲染器切换**: 测试 WebGL → CSS3D → Fallback 降级流程
- **视频播放**: 测试自动播放、手势触发、循环播放
- **触摸交互**: 测试拖拽、缩放手势

### 兼容性测试

**测试矩阵**:

| 平台     | 浏览器  | 版本 | 预期渲染器     | 测试重点                      |
| -------- | ------- | ---- | -------------- | ----------------------------- |
| iOS      | Safari  | 14+  | WebGL          | 自动播放限制、视频纹理        |
| iOS      | Chrome  | 最新 | WebGL          | 同 Safari（使用 WebKit 内核） |
| iOS      | 微信    | 最新 | WebGL          | 微信特定限制                  |
| Android  | Chrome  | 90+  | WebGL          | WebGL 稳定性                  |
| Android  | Firefox | 最新 | WebGL          | 视频格式支持                  |
| Android  | 微信    | 最新 | WebGL          | X5 内核兼容性                 |
| Android  | UC      | 最新 | CSS3D          | WebGL 支持较差                |
| 低端设备 | 任意    | -    | CSS3D/Fallback | 性能和内存限制                |

**测试工具**:

- BrowserStack: 真实设备测试
- Chrome DevTools: 移动端模拟和性能分析
- Lighthouse: 性能和最佳实践审计

### 性能测试

**关键指标**:

- 首次渲染时间 (FCP): < 1.5s
- 视频开始播放时间: < 3s
- 帧率: 保持 60fps（WebGL）或 30fps（CSS3D）
- 内存占用: < 150MB（移动端）
- 兼容性检测时间: < 500ms

**性能优化**:

- 使用 `requestIdleCallback` 延迟非关键初始化
- 视频预加载策略：`preload="metadata"`
- Three.js 优化：降低球体分段数（64 → 32）、使用 `LinearFilter`
- CSS3D 优化：使用 `will-change` 和 `transform: translateZ(0)`

## 实现注意事项

### 移动端特定问题

1. **iOS 自动播放限制**
   - 必须在用户手势事件处理函数中调用 `video.play()`
   - 视频必须设置 `muted` 属性才能自动播放
   - 使用 `playsinline` 防止全屏播放

2. **Android 微信浏览器**
   - 使用 X5 内核特定属性：`x5-video-player-type="h5-page"`
   - 某些版本需要用户手势才能播放

3. **WebGL 上下文丢失**
   - 监听 `webglcontextlost` 和 `webglcontextrestored` 事件
   - 在上下文恢复后重新初始化渲染器

4. **视频纹理黑屏**
   - 确保视频开始播放后才创建 `VideoTexture`
   - 使用 `video.readyState >= 2` 检查视频是否有数据

5. **触摸事件冲突**
   - 使用 `touch-action: none` 防止浏览器默认滚动
   - 使用 `preventDefault()` 阻止双击缩放

### 代码组织

```
src/
├── components/
│   └── PanoramaPlayer.vue          # 主组件
├── composables/
│   ├── useCompatibility.ts         # 兼容性检测 hook
│   ├── useRenderer.ts              # 渲染器管理 hook
│   ├── useVideoLoader.ts           # 视频加载 hook
│   └── useInteraction.ts           # 交互管理 hook
├── renderers/
│   ├── WebGLRenderer.ts            # WebGL 渲染器
│   ├── CSS3DRenderer.ts            # CSS3D 渲染器
│   └── FallbackRenderer.ts         # 降级渲染器
├── utils/
│   ├── compatibility.ts            # 兼容性检测工具
│   ├── logger.ts                   # 日志工具
│   └── env.ts                      # 环境检测工具（已存在）
└── types/
    └── panorama.ts                 # 类型定义
```

## 设计决策

### 为什么移除 Flash 降级方案？

原需求提到 Flash 作为最终降级方案，但基于以下原因，设计中采用静态图片替代：

1. **Flash 已被淘汰**: Adobe 于 2020 年停止支持 Flash，现代浏览器已完全移除 Flash 支持
2. **移动端不支持**: iOS 从未支持 Flash，Android 也在多年前移除支持
3. **安全风险**: Flash 存在大量安全漏洞
4. **更好的替代方案**: CSS3D 和静态图片提供更好的兼容性和安全性

### 为什么移除 krpano？

当前代码中使用了 krpano，但设计中建议移除：

1. **依赖外部库**: krpano 是商业软件，需要单独部署脚本文件
2. **Three.js 足够**: Three.js 提供完整的 WebGL 全景渲染能力
3. **简化架构**: 减少一层抽象，降低复杂度
4. **更好的控制**: 直接使用 Three.js 可以更灵活地处理移动端问题

如果项目需要保留 krpano，可以将其作为 WebGL 渲染器的一个实现选项。

### 渲染器选择优先级

1. **WebGL (Three.js)**: 最佳体验，支持流畅的 3D 交互
2. **CSS3D**: 中等体验，适用于 WebGL 不可用但支持 CSS3D 的环境
3. **静态图片**: 保底方案，确保所有环境都能显示内容

### 视频加载策略

- **优先使用 HLS**: 支持自适应码率，适合不同网络环境
- **降级到 MP4**: HLS 不支持时使用 MP4
- **多质量源**: 提供低、中、高三种质量，根据网络自动切换
