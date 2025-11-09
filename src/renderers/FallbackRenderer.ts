/**
 * 降级渲染器
 * 当 WebGL 和 CSS3D 都不可用时使用的最终降级方案
 * 只显示视频，不使用静态图片
 */

import type { Renderer, RendererConfig } from '../types/panorama';
import logger from '../utils/logger';

export class FallbackRenderer implements Renderer {
  private container: HTMLElement | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private wrapperElement: HTMLDivElement | null = null;
  private messageElement: HTMLDivElement | null = null;
  private isDisposed = false;

  // 视角状态（用于简单的拖拽查看）
  private currentYaw = 0;
  private currentPitch = 0;

  // 拖拽控制状态
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private mouseDownHandler: ((e: MouseEvent) => void) | null = null;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseUpHandler: ((e: MouseEvent) => void) | null = null;
  private touchStartHandler: ((e: TouchEvent) => void) | null = null;
  private touchMoveHandler: ((e: TouchEvent) => void) | null = null;
  private touchEndHandler: ((e: TouchEvent) => void) | null = null;

  // 响应式调整
  private resizeObserver: ResizeObserver | null = null;
  private orientationChangeHandler: (() => void) | null = null;

  /**
   * 初始化降级渲染器
   */
  async init(config: RendererConfig): Promise<void> {
    try {
      logger.info('renderer', 'Initializing Fallback renderer');

      this.container = config.container;
      this.videoElement = config.videoElement;
      this.currentYaw = config.initialView.yaw;
      this.currentPitch = config.initialView.pitch;

      // 创建降级渲染结构
      this.createFallbackStructure();

      // 初始化拖拽控制
      this.initDragControls();

      // 设置响应式调整
      this.setupResponsiveResize();

      // 更新视角
      this.updateView();

      logger.info('renderer', 'Fallback renderer initialized successfully');
      logger.warn('renderer', 'Using fallback renderer - limited panorama functionality available');
    } catch (error) {
      logger.error('renderer', 'Failed to initialize Fallback renderer', error);
      throw error;
    }
  }

  /**
   * 创建降级渲染结构
   */
  private createFallbackStructure(): void {
    if (!this.container || !this.videoElement) return;

    logger.info('renderer', 'Creating fallback structure');

    // 清空容器
    this.container.innerHTML = '';

    // 创建包装器
    this.wrapperElement = document.createElement('div');
    this.wrapperElement.className = 'fallback-wrapper';
    this.wrapperElement.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
      cursor: grab;
    `;

    // 配置视频元素样式
    this.videoElement.style.cssText = `
      position: absolute;
      width: 200%;
      height: 200%;
      object-fit: cover;
      display: block;
      transition: transform 0.1s ease-out;
    `;

    // 设置视频属性以确保移动端兼容性
    this.videoElement.setAttribute('playsinline', '');
    this.videoElement.setAttribute('webkit-playsinline', '');
    this.videoElement.setAttribute('x5-playsinline', '');

    // 创建提示信息元素
    this.messageElement = document.createElement('div');
    this.messageElement.className = 'fallback-message';
    this.messageElement.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      text-align: center;
      z-index: 10;
      max-width: 90%;
      box-sizing: border-box;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    this.messageElement.innerHTML = `
      <div style="margin-bottom: 4px; font-weight: 600;">⚠️ 有限的全景支持</div>
      <div style="font-size: 12px; opacity: 0.9;">您的浏览器不支持完整的全景功能，拖拽可查看不同角度</div>
    `;

    // 组装结构
    this.wrapperElement.appendChild(this.videoElement);
    this.wrapperElement.appendChild(this.messageElement);
    this.container.appendChild(this.wrapperElement);

    logger.info('renderer', 'Fallback structure created');
  }

  /**
   * 初始化拖拽控制
   */
  private initDragControls(): void {
    if (!this.wrapperElement) return;

    logger.info('renderer', 'Initializing fallback drag controls');

    // 鼠标事件
    this.mouseDownHandler = (e: MouseEvent) => {
      e.preventDefault();
      this.isDragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;

      if (this.wrapperElement) {
        this.wrapperElement.style.cursor = 'grabbing';
      }
    };

    this.mouseMoveHandler = (e: MouseEvent) => {
      if (!this.isDragging) return;

      e.preventDefault();

      const deltaX = e.clientX - this.lastX;
      const deltaY = e.clientY - this.lastY;

      // 根据移动距离调整视角
      const sensitivity = 0.2;
      this.panBy(deltaX * sensitivity, deltaY * sensitivity);

      this.lastX = e.clientX;
      this.lastY = e.clientY;
    };

    this.mouseUpHandler = () => {
      this.isDragging = false;
      if (this.wrapperElement) {
        this.wrapperElement.style.cursor = 'grab';
      }
    };

    // 触摸事件
    this.touchStartHandler = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        this.isDragging = true;
        this.lastX = e.touches[0].clientX;
        this.lastY = e.touches[0].clientY;

        if (this.wrapperElement) {
          this.wrapperElement.style.cursor = 'grabbing';
        }
      }
    };

    this.touchMoveHandler = (e: TouchEvent) => {
      if (!this.isDragging || e.touches.length !== 1) return;

      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - this.lastX;
      const deltaY = touch.clientY - this.lastY;

      const sensitivity = 0.2;
      this.panBy(deltaX * sensitivity, deltaY * sensitivity);

      this.lastX = touch.clientX;
      this.lastY = touch.clientY;
    };

    this.touchEndHandler = () => {
      this.isDragging = false;
      if (this.wrapperElement) {
        this.wrapperElement.style.cursor = 'grab';
      }
    };

    // 添加事件监听器
    this.wrapperElement.addEventListener('mousedown', this.mouseDownHandler);
    document.addEventListener('mousemove', this.mouseMoveHandler);
    document.addEventListener('mouseup', this.mouseUpHandler);

    this.wrapperElement.addEventListener('touchstart', this.touchStartHandler, {
      passive: false,
    });
    this.wrapperElement.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    this.wrapperElement.addEventListener('touchend', this.touchEndHandler);
    this.wrapperElement.addEventListener('touchcancel', this.touchEndHandler);

    // 阻止上下文菜单
    this.wrapperElement.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault();
    });

    // 设置触摸样式
    this.wrapperElement.style.touchAction = 'none';

    logger.info('renderer', 'Fallback drag controls initialized');
  }

  /**
   * 更新视角显示
   * 使用 CSS transform 移动视频位置模拟全景查看
   */
  private updateView(): void {
    if (!this.videoElement) return;

    // 将角度转换为百分比位置
    // yaw: -180 到 180 度映射到 -50% 到 50%
    // pitch: -90 到 90 度映射到 -25% 到 25%
    const xPercent = (this.currentYaw / 180) * 50;
    const yPercent = (this.currentPitch / 90) * 25;

    // 限制范围
    const clampedX = Math.max(-50, Math.min(50, xPercent));
    const clampedY = Math.max(-25, Math.min(25, yPercent));

    // 应用 transform
    this.videoElement.style.transform = `translate(${-clampedX}%, ${-clampedY}%)`;
  }

  /**
   * 设置响应式尺寸调整
   */
  private setupResponsiveResize(): void {
    if (!this.container) return;

    logger.info('renderer', 'Setting up fallback responsive resize');

    // 使用 ResizeObserver 监听容器尺寸变化
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.resize(width, height);
        }
      }
    });

    this.resizeObserver.observe(this.container);

    // 监听屏幕方向变化
    this.orientationChangeHandler = () => {
      logger.info('renderer', 'Screen orientation changed (Fallback)');

      // 延迟调整以等待布局完成
      setTimeout(() => {
        if (this.container) {
          this.resize(this.container.clientWidth, this.container.clientHeight);
        }
      }, 300);
    };

    window.addEventListener('orientationchange', this.orientationChangeHandler);
    window.addEventListener('resize', this.orientationChangeHandler);

    logger.info('renderer', 'Fallback responsive resize set up');
  }

  /**
   * 销毁渲染器并清理资源
   */
  dispose(): void {
    logger.info('renderer', 'Disposing Fallback renderer');

    this.isDisposed = true;

    // 清理 resize 相关资源
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.orientationChangeHandler) {
      window.removeEventListener('orientationchange', this.orientationChangeHandler);
      window.removeEventListener('resize', this.orientationChangeHandler);
      this.orientationChangeHandler = null;
    }

    // 移除拖拽事件监听器
    if (this.wrapperElement) {
      if (this.mouseDownHandler) {
        this.wrapperElement.removeEventListener('mousedown', this.mouseDownHandler);
        this.mouseDownHandler = null;
      }
      if (this.touchStartHandler) {
        this.wrapperElement.removeEventListener('touchstart', this.touchStartHandler);
        this.touchStartHandler = null;
      }
      if (this.touchMoveHandler) {
        this.wrapperElement.removeEventListener('touchmove', this.touchMoveHandler);
        this.touchMoveHandler = null;
      }
      if (this.touchEndHandler) {
        this.wrapperElement.removeEventListener('touchend', this.touchEndHandler);
        this.wrapperElement.removeEventListener('touchcancel', this.touchEndHandler);
        this.touchEndHandler = null;
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
    if (this.wrapperElement && this.wrapperElement.parentNode) {
      this.wrapperElement.parentNode.removeChild(this.wrapperElement);
    }

    this.wrapperElement = null;
    this.messageElement = null;
    this.container = null;
    this.videoElement = null;

    logger.info('renderer', 'Fallback renderer disposed');
  }

  /**
   * 设置视角
   */
  setView(yaw: number, pitch: number): void {
    this.currentYaw = yaw;
    // 限制 pitch 角度范围
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

    // 标准化 yaw 角度到 -180 到 180 范围
    while (this.currentYaw > 180) this.currentYaw -= 360;
    while (this.currentYaw < -180) this.currentYaw += 360;

    this.updateView();
  }

  /**
   * 调整渲染器尺寸
   */
  resize(width: number, height: number): void {
    const startTime = performance.now();

    // 降级渲染器主要依赖 CSS，尺寸调整由浏览器自动处理
    // 这里只需要记录日志

    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.info(
      'renderer',
      `Fallback renderer resized to ${width}x${height} (${duration.toFixed(2)}ms)`
    );
  }

  /**
   * 视频准备就绪回调
   * 降级渲染器直接使用视频元素，无需特殊处理
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onVideoReady(video: HTMLVideoElement): void {
    logger.info('renderer', 'Fallback renderer: video ready');
    // 降级渲染器直接使用视频元素，视频播放后会自动显示
    // 无需额外处理
  }
}
