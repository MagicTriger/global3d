/**
 * 兼容性检测 Composable
 * 提供浏览器能力检测和渲染器选择功能
 */

import { ref, readonly } from 'vue';
import type { BrowserCapabilities, RendererType } from '../types/panorama';
import {
  detectWebGLVersion,
  detectCSS3DSupport,
  detectVideoFormats,
  detectAutoplayPolicy,
  isMobile,
  isIOS,
  isAndroid,
  isWechat,
  getBrowserName,
  getBrowserVersion,
  hasTouchSupport,
  assessDevicePerformance,
} from '../utils/env';
import logger from '../utils/logger';

/**
 * 缓存的检测结果
 */
let cachedCapabilities: BrowserCapabilities | null = null;

/**
 * 检测开始时间（用于性能监控）
 */
let detectionStartTime = 0;

/**
 * 兼容性检测 Composable
 */
export function useCompatibility() {
  const capabilities = ref<BrowserCapabilities | null>(null);
  const isDetecting = ref(false);
  const selectedRenderer = ref<RendererType | null>(null);

  /**
   * 检测浏览器能力
   * 如果已有缓存结果，直接返回缓存
   */
  async function detectCapabilities(): Promise<BrowserCapabilities> {
    // 如果有缓存，直接返回
    if (cachedCapabilities) {
      logger.info('compatibility', '使用缓存的兼容性检测结果');
      capabilities.value = cachedCapabilities;
      return cachedCapabilities;
    }

    // 标记开始检测
    isDetecting.value = true;
    detectionStartTime = performance.now();

    logger.info('compatibility', '开始浏览器能力检测');

    try {
      // 并行执行所有检测（除了异步的自动播放检测）
      const [webglVersion, css3d, videoFormats, devicePerf] = await Promise.all([
        Promise.resolve(detectWebGLVersion()),
        Promise.resolve(detectCSS3DSupport()),
        Promise.resolve(detectVideoFormats()),
        Promise.resolve(assessDevicePerformance()),
      ]);

      // 异步检测自动播放策略（有超时保护）
      let autoplayAllowed = false;
      try {
        const autoplayPromise = detectAutoplayPolicy();
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), 100); // 缩短超时到 100ms
        });
        autoplayAllowed = await Promise.race([autoplayPromise, timeoutPromise]);
      } catch (error) {
        logger.warn('compatibility', '自动播放检测失败，假设不允许', error);
        autoplayAllowed = false;
      }

      // 组装检测结果
      const result: BrowserCapabilities = {
        webgl: webglVersion !== null,
        webglVersion,
        css3d,
        videoFormats,
        autoplayAllowed,
        touchSupport: hasTouchSupport(),
        devicePixelRatio: devicePerf.devicePixelRatio,
        isMobile: isMobile(),
        isIOS: isIOS(),
        isAndroid: isAndroid(),
        isWechat: isWechat(),
        browserName: getBrowserName(),
        browserVersion: getBrowserVersion(),
      };

      // 缓存结果
      cachedCapabilities = result;
      capabilities.value = result;

      // 记录检测完成
      const detectionTime = performance.now() - detectionStartTime;
      logger.logPerformance('兼容性检测耗时', detectionTime);
      logger.logCompatibility(result);

      // 检查是否在 500ms 内完成
      if (detectionTime > 500) {
        logger.warn('compatibility', `兼容性检测耗时超过 500ms: ${detectionTime.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      logger.error('compatibility', '兼容性检测失败', error);
      throw error;
    } finally {
      isDetecting.value = false;
    }
  }

  /**
   * 根据浏览器能力选择最佳渲染器
   * 优先级: WebGL > CSS3D > Fallback
   */
  function selectRenderer(caps?: BrowserCapabilities): RendererType {
    const targetCaps = caps || capabilities.value;

    if (!targetCaps) {
      logger.warn('compatibility', '未进行能力检测，默认使用降级渲染器');
      selectedRenderer.value = 'fallback';
      return 'fallback';
    }

    let renderer: RendererType;

    // 1. 优先选择 WebGL（如果支持且性能良好）
    if (targetCaps.webgl) {
      // 检查设备性能
      const devicePerf = assessDevicePerformance();

      // 低性能设备可能不适合 WebGL
      if (devicePerf.performanceScore === 'low') {
        logger.info('compatibility', '设备性能较低，尝试使用 CSS3D 渲染器', devicePerf);

        if (targetCaps.css3d) {
          renderer = 'css3d';
        } else {
          // 即使性能低，如果没有 CSS3D 支持，仍然尝试 WebGL
          logger.warn('compatibility', 'CSS3D 不支持，仍使用 WebGL 渲染器');
          renderer = 'webgl';
        }
      } else {
        renderer = 'webgl';
      }
    }
    // 2. 降级到 CSS3D
    else if (targetCaps.css3d) {
      renderer = 'css3d';
      logger.info('compatibility', 'WebGL 不可用，使用 CSS3D 渲染器');
    }
    // 3. 最终降级到静态图片
    else {
      renderer = 'fallback';
      logger.warn('compatibility', 'WebGL 和 CSS3D 都不可用，使用降级渲染器');
    }

    selectedRenderer.value = renderer;

    logger.info('compatibility', `选择渲染器: ${renderer}`, {
      webgl: targetCaps.webgl,
      webglVersion: targetCaps.webglVersion,
      css3d: targetCaps.css3d,
      browserName: targetCaps.browserName,
      browserVersion: targetCaps.browserVersion,
      isMobile: targetCaps.isMobile,
    });

    return renderer;
  }

  /**
   * 清除缓存的检测结果
   * 用于强制重新检测（例如在测试或调试时）
   */
  function clearCache(): void {
    cachedCapabilities = null;
    capabilities.value = null;
    selectedRenderer.value = null;
    logger.info('compatibility', '已清除兼容性检测缓存');
  }

  /**
   * 获取缓存的检测结果（如果存在）
   */
  function getCachedCapabilities(): BrowserCapabilities | null {
    return cachedCapabilities;
  }

  return {
    // 状态
    capabilities: readonly(capabilities),
    isDetecting: readonly(isDetecting),
    selectedRenderer: readonly(selectedRenderer),

    // 方法
    detectCapabilities,
    selectRenderer,
    clearCache,
    getCachedCapabilities,
  };
}
