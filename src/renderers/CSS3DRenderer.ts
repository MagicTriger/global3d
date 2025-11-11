/**
 * CSS3D 渲染器
 * 使用 CSS3D 变换实现简化的全景效果
 * 作为 WebGL 不可用时的降级方案
 */

import type { Renderer, RendererConfig } from '../types/panorama';
import logger from '../utils/logger';

export class CSS3DRenderer implements Renderer {
  private container: HTMLElement | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private sceneElement: HTMLDivElement | null = null;
  private videoWrapper: HTMLDivElement | null = null;
  private isDisposed = false;

  // 视角状态
  private currentYaw = 0;
  private currentPitch = 0;
  private currentFov = 75;

  // 触摸控制状态
  private isDragging = false;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private touchStartHandler: ((e: TouchEvent) => void) | null = null;
  private touchMoveHandler: ((e: TouchEvent) => void) | null = null;
  private touchEndHandler: ((e: TouchEvent) => void) | null = null;
  private mouseDownHandler: ((e: MouseEvent) => void) | null = null;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseUpHandler: ((e: MouseEvent) => void) | null = null;

  // 响应式调整
  private resizeObserver: ResizeObserver | null = null;
  private orientationChangeHandler: (() => void) | null = null;
  private resizeTimeout: number | null = null;

  /**
   * 初始化 CSS3D 渲染器
   */
  async init(config: RendererConfig): Promise<void> {
    try {
      logger.info('renderer', 'Initializing CSS3D renderer');

      this.container = config.container;
      this.videoElement = config.videoElement;
      this.currentYaw = config.initialView.yaw;
      this.currentPitch = config.initialView.pitch;
      this.currentFov = config.initialView.fov;

      // 创建 CSS3D 场景结构
      this.createSceneStructure();

      // 设置初始视角
      this.updateView();

      // 初始化触摸控制
      this.initTouchControls();

      // 设置响应式调整
      this.setupResponsiveResize();

      logger.info('renderer', 'CSS3D renderer initialized successfully');
    } catch (error) {
      logger.error('renderer', 'Failed to initialize CSS3D renderer', error);
      throw error;
    }
  }

  /**
   * 创建 CSS3D 场景结构
   */
  private createSceneStructure(): void {
    if (!this.container || !this.videoElement) return;

    logger.info('renderer', 'Creating CSS3D scene structure');

    // 清空容器
    this.container.innerHTML = '';

    // 创建场景容器
    this.sceneElement = document.createElement('div');
    this.sceneElement.className = 'css3d-scene';
    this.sceneElement.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      perspective: ${this.calculatePerspective()}px;
      overflow: hidden;
      will-change: transform;
    `;

    // 创建视频包装器
    this.videoWrapper = document.createElement('div');
    this.videoWrapper.className = 'css3d-video-wrapper';
    this.videoWrapper.style.cssText = `
      position: absolute;
      width: 300%;
      height: 300%;
      left: -100%;
      top: -100%;
      transform-style: preserve-3d;
      will-change: transform;
      transform: translateZ(0);
    `;

    // 配置视频元素样式（覆盖组件默认的隐藏样式，确保 poster 可见）
    this.videoElement.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      opacity: 1 !important;
      z-index: 1;
      pointer-events: auto;
    `;

    // 设置视频属性以确保移动端兼容性
    this.videoElement.setAttribute('playsinline', '');
    this.videoElement.setAttribute('webkit-playsinline', '');
    this.videoElement.setAttribute('x5-playsinline', '');

    // 组装场景结构
    this.videoWrapper.appendChild(this.videoElement);
    this.sceneElement.appendChild(this.videoWrapper);
    this.container.appendChild(this.sceneElement);

    logger.info('renderer', 'CSS3D scene structure created');
  }

  /**
   * 计算 perspective 值
   * 基于 FOV 和容器尺寸计算合适的透视距离
   */
  private calculatePerspective(): number {
    if (!this.container) return 1000;

    const height = this.container.clientHeight;
    const fovRad = (this.currentFov * Math.PI) / 180;
    const perspective = height / (2 * Math.tan(fovRad / 2));

    return Math.max(500, Math.min(2000, perspective));
  }

  /**
   * 更新视角显示
   */
  private updateView(): void {
    if (!this.videoWrapper) return;

    // 使用 CSS transform 实现视角旋转
    // rotateY 控制水平旋转（yaw）
    // rotateX 控制垂直旋转（pitch）
    const transform = `
      translateZ(0)
      rotateX(${-this.currentPitch}deg)
      rotateY(${-this.currentYaw}deg)
    `;

    this.videoWrapper.style.transform = transform;
  }

  /**
   * 初始化触摸控制
   */
  private initTouchControls(): void {
    if (!this.container) return;

    logger.info('renderer', 'Initializing CSS3D touch controls');

    // 设置触摸样式
    this.container.style.touchAction = 'none';
    this.container.style.cursor = 'grab';

    // 触摸开始
    this.touchStartHandler = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        this.isDragging = true;
        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;

        if (this.container) {
          this.container.style.cursor = 'grabbing';
        }
      }
    };

    // 触摸移动
    this.touchMoveHandler = (e: TouchEvent) => {
      if (!this.isDragging || e.touches.length !== 1) return;

      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - this.lastTouchX;
      const deltaY = touch.clientY - this.lastTouchY;

      // 根据移动距离计算旋转角度
      // 移动速度系数可以调整灵敏度
      const sensitivity = 0.3;
      const deltaYaw = deltaX * sensitivity;
      const deltaPitch = deltaY * sensitivity;

      this.panBy(deltaYaw, deltaPitch);

      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
    };

    // 触摸结束
    this.touchEndHandler = () => {
      this.isDragging = false;
      if (this.container) {
        this.container.style.cursor = 'grab';
      }
    };

    // 鼠标事件（桌面端支持）
    this.mouseDownHandler = (e: MouseEvent) => {
      e.preventDefault();
      this.isDragging = true;
      this.lastTouchX = e.clientX;
      this.lastTouchY = e.clientY;

      if (this.container) {
        this.container.style.cursor = 'grabbing';
      }
    };

    this.mouseMoveHandler = (e: MouseEvent) => {
      if (!this.isDragging) return;

      e.preventDefault();

      const deltaX = e.clientX - this.lastTouchX;
      const deltaY = e.clientY - this.lastTouchY;

      const sensitivity = 0.3;
      const deltaYaw = deltaX * sensitivity;
      const deltaPitch = deltaY * sensitivity;

      this.panBy(deltaYaw, deltaPitch);

      this.lastTouchX = e.clientX;
      this.lastTouchY = e.clientY;
    };

    this.mouseUpHandler = () => {
      this.isDragging = false;
      if (this.container) {
        this.container.style.cursor = 'grab';
      }
    };

    // 添加事件监听器
    this.container.addEventListener('touchstart', this.touchStartHandler, { passive: false });
    this.container.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    this.container.addEventListener('touchend', this.touchEndHandler);
    this.container.addEventListener('touchcancel', this.touchEndHandler);

    this.container.addEventListener('mousedown', this.mouseDownHandler);
    document.addEventListener('mousemove', this.mouseMoveHandler);
    document.addEventListener('mouseup', this.mouseUpHandler);

    // 阻止上下文菜单
    this.container.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault();
    });

    logger.info('renderer', 'CSS3D touch controls initialized');
  }

  /**
   * 设置响应式尺寸调整
   */
  private setupResponsiveResize(): void {
    if (!this.container) return;

    logger.info('renderer', 'Setting up CSS3D responsive resize');

    // 使用 ResizeObserver 监听容器尺寸变化
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // 使用防抖避免频繁调整
        if (this.resizeTimeout !== null) {
          clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = window.setTimeout(() => {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.resize(width, height);
          }
        }, 100); // 100ms 防抖
      }
    });

    this.resizeObserver.observe(this.container);

    // 监听屏幕方向变化
    this.orientationChangeHandler = () => {
      logger.info('renderer', 'Screen orientation changed (CSS3D)');

      // 延迟调整以等待布局完成
      setTimeout(() => {
        if (this.container) {
          this.resize(this.container.clientWidth, this.container.clientHeight);
        }
      }, 300);
    };

    // 监听 orientationchange 事件（移动端）
    window.addEventListener('orientationchange', this.orientationChangeHandler);

    // 也监听 resize 事件作为后备
    window.addEventListener('resize', this.orientationChangeHandler);

    logger.info('renderer', 'CSS3D responsive resize set up');
  }

  /**
   * 销毁渲染器并清理资源
   */
  dispose(): void {
    logger.info('renderer', 'Disposing CSS3D renderer');

    this.isDisposed = true;

    // 清理 resize 相关资源
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.resizeTimeout !== null) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    if (this.orientationChangeHandler) {
      window.removeEventListener('orientationchange', this.orientationChangeHandler);
      window.removeEventListener('resize', this.orientationChangeHandler);
      this.orientationChangeHandler = null;
    }

    // 移除触摸事件监听器
    if (this.container) {
      if (this.touchStartHandler) {
        this.container.removeEventListener('touchstart', this.touchStartHandler);
        this.touchStartHandler = null;
      }
      if (this.touchMoveHandler) {
        this.container.removeEventListener('touchmove', this.touchMoveHandler);
        this.touchMoveHandler = null;
      }
      if (this.touchEndHandler) {
        this.container.removeEventListener('touchend', this.touchEndHandler);
        this.container.removeEventListener('touchcancel', this.touchEndHandler);
        this.touchEndHandler = null;
      }
      if (this.mouseDownHandler) {
        this.container.removeEventListener('mousedown', this.mouseDownHandler);
        this.mouseDownHandler = null;
      }
    }

    if (this.mouseMoveHandler) {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }

    if (this.mouseUpHandler) {
      document.removeEventListener('mouseup', this.mouseUpHandler);
      this.mouseUpHandler = null;
    }

    // 清理 DOM 元素
    if (this.sceneElement && this.sceneElement.parentNode) {
      this.sceneElement.parentNode.removeChild(this.sceneElement);
    }

    this.sceneElement = null;
    this.videoWrapper = null;
    this.container = null;
    this.videoElement = null;

    logger.info('renderer', 'CSS3D renderer disposed');
  }

  /**
   * 设置视角
   */
  setView(yaw: number, pitch: number): void {
    this.currentYaw = yaw;
    // 限制 pitch 角度范围，防止翻转
    this.currentPitch = Math.max(-90, Math.min(90, pitch));
    this.updateView();
  }

  /**
   * 相对移动视角
   */
  panBy(deltaYaw: number, deltaPitch: number): void {
    this.currentYaw += deltaYaw;
    this.currentPitch += deltaPitch;

    // 限制 pitch 角度范围
    this.currentPitch = Math.max(-90, Math.min(90, this.currentPitch));

    // 标准化 yaw 角度到 0-360 范围
    this.currentYaw = ((this.currentYaw % 360) + 360) % 360;

    this.updateView();
  }

  /**
   * 调整渲染器尺寸
   */
  resize(width: number, height: number): void {
    if (!this.sceneElement) return;

    const startTime = performance.now();

    // 更新 perspective 值
    const newPerspective = this.calculatePerspective();
    this.sceneElement.style.perspective = `${newPerspective}px`;

    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.info(
      'renderer',
      `CSS3D renderer resized to ${width}x${height} (${duration.toFixed(2)}ms)`
    );

    // 确保在 500ms 内完成（记录警告如果超时）
    if (duration > 500) {
      logger.warn('renderer', `Resize took longer than expected: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * 视频准备就绪回调
   * CSS3D 渲染器直接使用视频元素，无需特殊处理
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onVideoReady(video: HTMLVideoElement): void {
    logger.info('renderer', 'CSS3D renderer: video ready');
    // CSS3D 渲染器直接使用视频元素，视频播放后会自动显示
    // 无需额外处理
  }
}
