/**
 * 渲染器管理器 Composable
 * 管理不同渲染器的初始化、切换和销毁
 */

import { ref } from 'vue';
import type { Renderer, RendererType, RendererConfig } from '../types/panorama';
import { WebGLRenderer } from '../renderers/WebGLRenderer';
import { CSS3DRenderer } from '../renderers/CSS3DRenderer';
import { FallbackRenderer } from '../renderers/FallbackRenderer';
import logger from '../utils/logger';

/**
 * 渲染器管理器 Composable
 */
export function useRenderer() {
  // 状态
  const currentRenderer = ref<Renderer | null>(null);
  const currentType = ref<RendererType | null>(null);
  const isInitializing = ref(false);
  const initError = ref<Error | null>(null);

  // 保存的视角状态（用于渲染器切换时保持视角）
  let savedView = {
    yaw: 0,
    pitch: 0,
  };

  /**
   * 创建渲染器实例
   */
  const createRendererInstance = (type: RendererType): Renderer => {
    if (type === 'webgl') return new WebGLRenderer();
    if (type === 'css3d') return new CSS3DRenderer();
    return new FallbackRenderer();
  };

  /**
   * 获取降级渲染器类型
   */
  const getFallbackRenderer = (failedType: RendererType): RendererType | null => {
    if (failedType === 'webgl') return 'css3d'
    if (failedType === 'css3d') return 'fallback'
    return null
  };

  /**
   * 初始化渲染器（带自动降级）
   */
  const initRenderer = async (config: RendererConfig): Promise<boolean> => {
    // 防止重复初始化
    if (isInitializing.value) {
      logger.warn('renderer', 'Renderer initialization already in progress');
      return false;
    }

    isInitializing.value = true;
    initError.value = null;

    let currentConfig = { ...config };
    const attemptedTypes: RendererType[] = [];

    try {
      // 尝试初始化渲染器，失败时自动降级
      while (currentConfig.type) {
        attemptedTypes.push(currentConfig.type);

        try {
          logger.info('renderer', 'Attempting to initialize renderer: webgl');

          // 创建渲染器实例
          const renderer = createRendererInstance(currentConfig.type);

          // 初始化渲染器
          await renderer.init(currentConfig);

          // 保存渲染器实例和类型
          currentRenderer.value = renderer;
          currentType.value = currentConfig.type;

          // 保存初始视角
          savedView = {
            yaw: currentConfig.initialView.yaw,
            pitch: currentConfig.initialView.pitch,
          };

          // 如果使用了降级方案，记录日志
          logger.info('renderer', 'Renderer initialized successfully: webgl');

          return true;
        } catch (error) {
          const err = error as Error;
          logger.error('renderer', `Failed to initialize renderer: ${currentConfig.type}`, {
            error: err.message,
            stack: err.stack,
          });

          throw new Error(`Renderer initialization failed: webgl`);
        }
      }

      // 理论上不应该到达这里
      throw new Error('Renderer initialization failed: no renderer type available');
    } catch (error) {
      const err = error as Error;
      initError.value = err;
      logger.error('renderer', 'Renderer initialization failed completely', {
        error: err.message,
        attemptedTypes,
      });

      return false;
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * 获取当前视角
   */
  const getCurrentView = (): { yaw: number; pitch: number } => {
    return { ...savedView };
  };

  /**
   * 更新保存的视角
   */
  const updateSavedView = (yaw: number, pitch: number): void => {
    savedView = { yaw, pitch };
  };

  /**
   * 切换渲染器
   */
  const switchRenderer = async (
    _newType: RendererType,
    config: Omit<RendererConfig, 'type' | 'initialView'>,
    reason: string
  ): Promise<boolean> => {
    const oldType = currentType.value;

    try {
      if (currentRenderer.value) {
        try {
          currentRenderer.value.dispose();
        } catch (error) {
          logger.error('renderer', 'Error disposing renderer during switch', error);
        }
        currentRenderer.value = null;
        currentType.value = null;
      }

      const newConfig: RendererConfig = {
        ...config,
        type: 'webgl',
        initialView: {
          yaw: savedView.yaw,
          pitch: savedView.pitch,
          fov: 75,
        },
      };

      const success = await initRenderer(newConfig);

      if (success) {
        logger.logRendererSwitch(oldType || 'none', 'webgl', reason);
      }

      return success;
    } catch (error) {
      const err = error as Error;
      logger.error('renderer', 'Error during renderer switch', {
        error: err.message,
        reason,
      });
      return false;
    }
  };

  /**
   * 销毁当前渲染器
   */
  const dispose = (): void => {
    if (currentRenderer.value) {
      logger.info('renderer', `Disposing renderer: ${currentType.value}`);

      try {
        currentRenderer.value.dispose();
      } catch (error) {
        logger.error('renderer', 'Error disposing renderer', error);
      }

      currentRenderer.value = null;
      currentType.value = null;
    }
  };

  return {
    // 状态
    currentRenderer,
    currentType,
    isInitializing,
    initError,

    // 方法
    initRenderer,
    switchRenderer,
    dispose,
    getCurrentView,
    updateSavedView,
  };
}
