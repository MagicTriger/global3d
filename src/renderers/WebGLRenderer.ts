/**
 * WebGL 渲染器
 * 使用 Three.js 实现高质量 3D 球面全景渲染
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Renderer, RendererConfig } from '../types/panorama';
import logger from '../utils/logger';
import { getOptimalPixelRatio } from '../utils/performance';

export class WebGLRenderer implements Renderer {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private mesh: THREE.Mesh | null = null;
  private videoTexture: THREE.VideoTexture | null = null;
  private container: HTMLElement | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private animationFrameId: number | null = null;
  private isDisposed = false;
  private contextLostHandler: ((event: Event) => void) | null = null;
  private contextRestoredHandler: ((event: Event) => void) | null = null;
  private onContextLostCallback: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private orientationChangeHandler: (() => void) | null = null;
  private resizeTimeout: number | null = null;
  
  // 帧率限制相关
  private lastFrameTime = 0;
  private readonly targetFPS = 60;
  private readonly frameInterval: number;
  private frameCount = 0;
  private fpsStartTime = 0;
  private currentFPS = 0;

  constructor() {
    this.frameInterval = 1000 / this.targetFPS;
  }

  /**
   * 初始化 WebGL 渲染器
   */
  async init(config: RendererConfig): Promise<void> {
    try {
      logger.info('renderer', 'Initializing WebGL renderer');

      this.container = config.container;
      this.videoElement = config.videoElement;

      // 创建场景
      this.scene = new THREE.Scene();

      // 创建相机
      const aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera = new THREE.PerspectiveCamera(config.initialView.fov, aspect, 0.1, 1000);
      this.camera.position.set(0, 0, 0);

      // 创建渲染器
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance', // 优先使用高性能 GPU
      });
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

      // 限制设备像素比以优化性能（最大 2）
      const pixelRatio = getOptimalPixelRatio(2);
      this.renderer.setPixelRatio(pixelRatio);

      logger.info('renderer', `使用像素比: ${pixelRatio} (设备像素比: ${window.devicePixelRatio})`);

      // 将渲染器添加到容器
      this.container.appendChild(this.renderer.domElement);

      // 创建内翻球体几何体（根据设备性能调整分段数）
      // 移动端使用更低的分段数以提升性能
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const segments = isMobileDevice ? 24 : 32; // 移动端24段，桌面32段
      const geometry = new THREE.SphereGeometry(500, segments, segments);
      geometry.scale(-1, 1, 1); // 内翻球体

      logger.info('renderer', `球体分段数: ${segments} (${isMobileDevice ? '移动端' : '桌面端'})`);

      // 创建初始材质（占位颜色 - 深灰色而不是纯黑，避免与黑屏混淆）
      const material = new THREE.MeshBasicMaterial({
        color: 0x1a1a1a, // 深灰色占位，表示正在加载
      });

      // 创建网格
      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);

      logger.info('renderer', '已创建占位材质（深灰色），等待视频纹理');

      // 设置初始视角
      this.setView(config.initialView.yaw, config.initialView.pitch);

      // 初始化触摸控制
      this.initControls();

      // 设置 WebGL 上下文丢失处理
      this.setupContextLossHandling();

      // 设置响应式尺寸调整
      this.setupResponsiveResize();

      // 启动渲染循环
      this.startRenderLoop();

      logger.info('renderer', 'WebGL renderer initialized successfully');
    } catch (error) {
      logger.error('renderer', 'Failed to initialize WebGL renderer', error);
      throw error;
    }
  }

  /**
   * 设置 WebGL 上下文丢失处理
   */
  private setupContextLossHandling(): void {
    if (!this.renderer) return;

    const canvas = this.renderer.domElement;

    // 监听上下文丢失事件
    this.contextLostHandler = (event: Event) => {
      event.preventDefault();
      logger.warn('renderer', 'WebGL context lost');

      // 停止渲染循环
      this.stopRenderLoop();

      // 通知外部需要降级
      if (this.onContextLostCallback) {
        this.onContextLostCallback();
      }
    };

    // 监听上下文恢复事件
    this.contextRestoredHandler = () => {
      logger.info('renderer', 'WebGL context restored, attempting to recover');

      try {
        // 尝试恢复渲染
        if (this.renderer && this.scene && this.camera) {
          // 重新启动渲染循环
          this.startRenderLoop();

          // 如果有视频纹理，尝试重新绑定
          if (this.videoElement && this.videoTexture) {
            this.videoTexture.needsUpdate = true;
          }

          logger.info('renderer', 'WebGL context recovered successfully');
        }
      } catch (error) {
        logger.error('renderer', 'Failed to recover WebGL context', error);

        // 恢复失败，触发降级
        if (this.onContextLostCallback) {
          this.onContextLostCallback();
        }
      }
    };

    canvas.addEventListener('webglcontextlost', this.contextLostHandler);
    canvas.addEventListener('webglcontextrestored', this.contextRestoredHandler);

    logger.info('renderer', 'WebGL context loss handling set up');
  }

  /**
   * 设置上下文丢失回调
   * 当上下文丢失且无法恢复时，调用此回调通知外部进行降级
   */
  setContextLostCallback(callback: () => void): void {
    this.onContextLostCallback = callback;
  }

  /**
   * 设置响应式尺寸调整
   */
  private setupResponsiveResize(): void {
    if (!this.container) return;

    logger.info('renderer', 'Setting up responsive resize');

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
      logger.info('renderer', 'Screen orientation changed');

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

    logger.info('renderer', 'Responsive resize set up');
  }

  /**
   * 初始化触摸控制
   */
  private initControls(): void {
    if (!this.camera || !this.renderer) return;

    logger.info('renderer', 'Initializing touch controls');

    // 创建 OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // 配置控制器参数
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = -0.5; // 负值使旋转方向更自然
    this.controls.zoomSpeed = 1.2;
    this.controls.enablePan = false; // 禁用平移，只允许旋转和缩放
    this.controls.enableZoom = true;

    // 限制垂直旋转角度，防止翻转
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI;

    // 限制缩放范围（通过 FOV）
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 1000;

    // 防止触摸事件触发浏览器默认行为
    const canvas = this.renderer.domElement;
    canvas.style.touchAction = 'none';

    // 阻止双击缩放
    canvas.addEventListener('dblclick', (e: Event) => {
      e.preventDefault();
    });

    // 阻止上下文菜单
    canvas.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault();
    });

    logger.info('renderer', 'Touch controls initialized');
  }

  /**
   * 启动渲染循环（带帧率限制）
   */
  private startRenderLoop(): void {
    this.lastFrameTime = performance.now();
    this.fpsStartTime = this.lastFrameTime;
    this.frameCount = 0;

    const animate = (currentTime: number) => {
      if (this.isDisposed) return;

      this.animationFrameId = requestAnimationFrame(animate);

      // 计算距离上一帧的时间
      const deltaTime = currentTime - this.lastFrameTime;

      // 帧率限制：如果距离上一帧时间小于目标帧间隔，跳过本帧
      if (deltaTime < this.frameInterval) {
        return;
      }

      // 更新上一帧时间（考虑余数以保持精确的帧率）
      this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);

      // 更新控制器
      if (this.controls) {
        this.controls.update();
      }

      // 确保视频纹理更新
      if (this.videoTexture && this.videoElement) {
        // 检查视频是否有新数据需要更新
        if (this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          this.videoTexture.needsUpdate = true;
        }
      }

      // 渲染场景
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      // 计算实际 FPS（每秒更新一次）
      this.frameCount++;
      const fpsElapsed = currentTime - this.fpsStartTime;
      if (fpsElapsed >= 1000) {
        this.currentFPS = Math.round((this.frameCount * 1000) / fpsElapsed);
        logger.info('renderer', `实际 FPS: ${this.currentFPS}`);
        
        // 如果 FPS 异常高，记录警告
        if (this.currentFPS > 100) {
          logger.warn('renderer', `检测到异常高的 FPS: ${this.currentFPS}，帧率限制可能未生效`);
        }
        
        this.frameCount = 0;
        this.fpsStartTime = currentTime;
      }
    };

    animate(this.lastFrameTime);
  }

  /**
   * 停止渲染循环
   */
  private stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 销毁渲染器并清理资源
   */
  dispose(): void {
    logger.info('renderer', 'Disposing WebGL renderer');

    this.isDisposed = true;

    // 停止渲染循环
    this.stopRenderLoop();

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

    // 销毁控制器
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    // 销毁视频纹理
    if (this.videoTexture) {
      this.videoTexture.dispose();
      this.videoTexture = null;
    }

    // 销毁网格和材质
    if (this.mesh) {
      if (this.mesh.geometry) {
        this.mesh.geometry.dispose();
      }
      if (this.mesh.material) {
        if (Array.isArray(this.mesh.material)) {
          this.mesh.material.forEach((material: THREE.Material) => material.dispose());
        } else {
          this.mesh.material.dispose();
        }
      }
      this.mesh = null;
    }

    // 移除上下文丢失事件监听器
    if (this.renderer && this.renderer.domElement) {
      const canvas = this.renderer.domElement;
      if (this.contextLostHandler) {
        canvas.removeEventListener('webglcontextlost', this.contextLostHandler);
        this.contextLostHandler = null;
      }
      if (this.contextRestoredHandler) {
        canvas.removeEventListener('webglcontextrestored', this.contextRestoredHandler);
        this.contextRestoredHandler = null;
      }
    }

    // 销毁渲染器
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    this.onContextLostCallback = null;

    // 清理场景
    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }

    this.camera = null;
    this.container = null;
    this.videoElement = null;

    logger.info('renderer', 'WebGL renderer disposed');
  }

  /**
   * 设置视角
   */
  setView(yaw: number, pitch: number): void {
    if (!this.camera) return;

    // 将角度转换为弧度
    const yawRad = THREE.MathUtils.degToRad(yaw);
    const pitchRad = THREE.MathUtils.degToRad(pitch);

    // 计算相机朝向
    const x = Math.cos(pitchRad) * Math.sin(yawRad);
    const y = Math.sin(pitchRad);
    const z = Math.cos(pitchRad) * Math.cos(yawRad);

    this.camera.lookAt(x, y, z);
  }

  /**
   * 相对移动视角
   */
  panBy(deltaYaw: number, deltaPitch: number): void {
    if (!this.camera) return;

    // 获取当前朝向
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    // 计算当前角度
    const currentYaw = Math.atan2(direction.x, direction.z);
    const currentPitch = Math.asin(direction.y);

    // 应用增量
    const newYaw = currentYaw + THREE.MathUtils.degToRad(deltaYaw);
    const newPitch = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, currentPitch + THREE.MathUtils.degToRad(deltaPitch))
    );

    // 设置新视角
    this.setView(THREE.MathUtils.radToDeg(newYaw), THREE.MathUtils.radToDeg(newPitch));
  }

  /**
   * 调整渲染器尺寸
   */
  resize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return;

    const startTime = performance.now();

    // 更新相机宽高比
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // 更新渲染器尺寸
    this.renderer.setSize(width, height);

    // 处理高 DPI 屏幕（限制最大像素比为 2）
    const pixelRatio = getOptimalPixelRatio(2);
    this.renderer.setPixelRatio(pixelRatio);

    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.info(
      'renderer',
      `WebGL renderer resized to ${width}x${height} (${duration.toFixed(2)}ms)`
    );

    // 确保在 500ms 内完成（记录警告如果超时）
    if (duration > 500) {
      logger.warn('renderer', `Resize took longer than expected: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * 视频准备就绪回调
   * 在视频可以播放时创建视频纹理，增强 readyState 检查
   */
  onVideoReady(video: HTMLVideoElement): void {
    if (!this.mesh || this.videoTexture) return;

    logger.info('renderer', 'Setting up video texture');

    // 超时计时器引用
    let textureTimeoutId: number | null = null;
    let eventListenersAdded = false;

    // 立即创建视频纹理的函数
    const createTexture = () => {
      // 清除超时计时器
      if (textureTimeoutId !== null) {
        clearTimeout(textureTimeoutId);
        textureTimeoutId = null;
      }

      // 移除事件监听器
      if (eventListenersAdded) {
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('playing', onPlaying);
        eventListenersAdded = false;
      }

      if (this.videoTexture || !this.mesh) return;

      // 严格检查 readyState
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        logger.warn(
          'renderer',
          `视频 readyState 不足 (${video.readyState})，延迟创建纹理`
        );
        return;
      }

      try {
        logger.info('renderer', `创建视频纹理 (readyState: ${video.readyState})`);

        // 创建视频纹理
        this.videoTexture = new THREE.VideoTexture(video);

        // 设置纹理参数
        this.videoTexture.colorSpace = THREE.SRGBColorSpace;
        this.videoTexture.minFilter = THREE.LinearFilter;
        this.videoTexture.magFilter = THREE.LinearFilter;
        this.videoTexture.format = THREE.RGBFormat;

        // 将纹理应用到球体材质
        const material = new THREE.MeshBasicMaterial({
          map: this.videoTexture,
        });

        if (this.mesh) {
          // 销毁旧材质
          if (this.mesh.material) {
            if (Array.isArray(this.mesh.material)) {
              this.mesh.material.forEach((mat: THREE.Material) => mat.dispose());
            } else {
              this.mesh.material.dispose();
            }
          }

          // 应用新材质
          this.mesh.material = material;
        }

        logger.info('renderer', '视频纹理创建并应用成功');

        // 触发 panorama:loaded 事件
        window.dispatchEvent(new CustomEvent('panorama:loaded'));
      } catch (error) {
        logger.error('renderer', '创建视频纹理失败', error);
      }
    };

    // loadeddata 事件处理器
    const onLoadedData = () => {
      logger.info('renderer', `loadeddata 事件触发 (readyState: ${video.readyState})`);
      createTexture();
    };

    // canplay 事件处理器
    const onCanPlay = () => {
      logger.info('renderer', `canplay 事件触发 (readyState: ${video.readyState})`);
      createTexture();
    };

    // playing 事件处理器
    const onPlaying = () => {
      logger.info('renderer', `playing 事件触发 (readyState: ${video.readyState})`);
      createTexture();
    };

    // 检查视频当前状态
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      // 视频已经有数据，立即创建纹理
      logger.info('renderer', `视频已有数据 (readyState: ${video.readyState})，立即创建纹理`);
      createTexture();
    } else {
      // 监听多个事件确保视频准备就绪
      logger.info('renderer', `视频数据未准备好 (readyState: ${video.readyState})，等待事件`);
      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('playing', onPlaying);
      eventListenersAdded = true;

      // 设置超时机制：5 秒内未准备好则报错
      textureTimeoutId = window.setTimeout(() => {
        if (!this.videoTexture) {
          logger.error(
            'renderer',
            `视频纹理创建超时 (5秒)，readyState: ${video.readyState}, paused: ${video.paused}, currentTime: ${video.currentTime}`
          );

          // 移除事件监听器
          if (eventListenersAdded) {
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('playing', onPlaying);
            eventListenersAdded = false;
          }

          // 尝试强制创建纹理（即使 readyState 不足）
          if (!this.videoTexture && this.mesh) {
            logger.warn('renderer', '强制创建视频纹理');
            try {
              this.videoTexture = new THREE.VideoTexture(video);
              this.videoTexture.colorSpace = THREE.SRGBColorSpace;
              this.videoTexture.minFilter = THREE.LinearFilter;
              this.videoTexture.magFilter = THREE.LinearFilter;
              this.videoTexture.format = THREE.RGBFormat;

              const material = new THREE.MeshBasicMaterial({
                map: this.videoTexture,
              });

              if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                  this.mesh.material.forEach((mat: THREE.Material) => mat.dispose());
                } else {
                  this.mesh.material.dispose();
                }
              }

              this.mesh.material = material;
              logger.info('renderer', '强制创建视频纹理成功');
            } catch (error) {
              logger.error('renderer', '强制创建视频纹理失败', error);
            }
          }
        }
      }, 5000);
    }
  }
}
