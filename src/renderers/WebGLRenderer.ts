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
  private resizeObserver: ResizeObserver | null = null;
  private orientationChangeHandler: (() => void) | null = null;
  private resizeTimeout: number | null = null;

  constructor() {}

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
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const pixelRatio = getOptimalPixelRatio(isMobile ? 1.5 : 2);
      this.renderer.setPixelRatio(pixelRatio);

      // 将渲染器添加到容器
      this.container.appendChild(this.renderer.domElement);

      // 创建内翻球体几何体
      const segments = isMobile ? 24 : 32;
      const geometry = new THREE.SphereGeometry(500, segments, segments);
      geometry.scale(-1, 1, 1); // 内翻球体

      logger.info('renderer', `球体分段数: ${segments}`);

      // 创建初始材质：优先使用 poster 作为占位纹理，提升首屏可见性
      let material: THREE.MeshBasicMaterial;
      const posterUrl = this.videoElement?.poster || '';

      if (posterUrl) {
        try {
          const texture = await new Promise<THREE.Texture>((resolve, reject) => {
            new THREE.TextureLoader().load(posterUrl, resolve, undefined, reject);
          });

          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;

          material = new THREE.MeshBasicMaterial({ map: texture });
          logger.info('renderer', '使用 poster 纹理作为占位材质');
        } catch (e) {
          logger.warn('renderer', 'poster 加载失败，回退到深灰占位', e);
          material = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        }
      } else {
        // 无 poster 时使用深灰占位，避免纯黑
        material = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
      }

      // 创建网格
      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);

      logger.info('renderer', '已创建占位材质（深灰色），等待视频纹理');

      // 设置初始视角
      this.setView(config.initialView.yaw, config.initialView.pitch);

      // 初始化触摸控制
      this.initControls();

      // 尺寸监听（容器与窗口/方向）
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
  private setupContextLossHandling(): void {}

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
    const container = this.container;
    // ResizeObserver 监听容器尺寸变化
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (this.resizeTimeout !== null) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = window.setTimeout(() => {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.resize(width, height);
          }
        }, 100);
      }
    });
    this.resizeObserver.observe(container);

    // 方向变化与窗口 resize 后备
    this.orientationChangeHandler = () => {
      setTimeout(() => {
        if (this.container) {
          this.resize(this.container.clientWidth, this.container.clientHeight);
        }
      }, 300);
    };
    window.addEventListener('orientationchange', this.orientationChangeHandler);
    window.addEventListener('resize', this.orientationChangeHandler);

    // 若初始为 0 大小，等待下一帧再尝试一次
    requestAnimationFrame(() => {
      if (this.container && this.renderer && this.camera) {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w > 0 && h > 0) this.resize(w, h);
      }
    });
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
    const animate = () => {
      if (this.isDisposed) return;
      this.animationFrameId = requestAnimationFrame(animate);

      if (this.controls) {
        this.controls.update();
      }

      if (this.videoTexture && this.videoElement) {
        this.videoTexture.needsUpdate = true;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
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

    // 清理视频帧同步（无）

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

    // 移除上下文丢失事件监听器（无）

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

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    this.renderer.setPixelRatio(getOptimalPixelRatio(isMobile ? 1.5 : 2));

    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.info(
      'renderer',
      `WebGL renderer resized to ${width}x${height} (${duration.toFixed(2)}ms)`
    );
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
        logger.warn('renderer', `视频 readyState 不足 (${video.readyState})，延迟创建纹理`);
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
        // 视频纹理不需要 mipmaps，禁用以减少 GPU 负载
        this.videoTexture.generateMipmaps = false;
        // RGBFormat 在新版本中已移除，不再需要设置

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

        this.setupVideoFrameSync(video);

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
    }
  }

  /**
   * 设置视频帧同步机制
   * - 优先使用 requestVideoFrameCallback（iOS 15+/现代浏览器）
   * - 回退到固定间隔（30fps）触发纹理更新
   */
  private setupVideoFrameSync(video: HTMLVideoElement): void {
    const vAny = video as any;
    if (typeof vAny.requestVideoFrameCallback === 'function') {
      const update = () => {
        if (this.videoTexture) this.videoTexture.needsUpdate = true;
        try {
          vAny.requestVideoFrameCallback(update);
        } catch {
          this.setupVideoFrameSyncFallback();
        }
      };
      try {
        vAny.requestVideoFrameCallback(update);
      } catch {
        this.setupVideoFrameSyncFallback();
      }
    } else {
      this.setupVideoFrameSyncFallback();
    }
  }

  /**
   * 视频帧同步回退：使用固定间隔触发 needsUpdate（默认 30fps）
   */
  private setupVideoFrameSyncFallback(): void {
    const id = window.setInterval(() => {
      if (
        this.videoTexture &&
        this.videoElement &&
        this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        this.videoTexture.needsUpdate = true;
      }
    }, 33);
    window.setTimeout(() => {
      clearInterval(id);
    }, 0);
  }
}
