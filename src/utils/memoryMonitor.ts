/**
 * 内存监控工具
 * 监控内存使用情况并在内存不足时触发降级
 */

import logger from './logger';

/**
 * 内存信息接口
 */
export interface MemoryInfo {
  /** 已使用的 JS 堆大小（字节） */
  usedJSHeapSize: number;
  /** JS 堆大小限制（字节） */
  jsHeapSizeLimit: number;
  /** 总 JS 堆大小（字节） */
  totalJSHeapSize: number;
  /** 内存使用百分比 */
  usagePercentage: number;
  /** 是否接近内存限制 */
  isNearLimit: boolean;
}

/**
 * 内存监控器类
 */
export class MemoryMonitor {
  private monitoringInterval: number | null = null;
  private onLowMemoryCallback: (() => void) | null = null;
  private lowMemoryThreshold = 0.85; // 85% 内存使用率触发警告
  private criticalMemoryThreshold = 0.95; // 95% 内存使用率触发降级

  /**
   * 获取当前内存信息
   */
  getMemoryInfo(): MemoryInfo | null {
    // 检查是否支持 performance.memory API
    const performance = window.performance as any;
    if (!performance || !performance.memory) {
      logger.warn('memory', '浏览器不支持 performance.memory API');
      return null;
    }

    const memory = performance.memory;
    const usedJSHeapSize = memory.usedJSHeapSize;
    const jsHeapSizeLimit = memory.jsHeapSizeLimit;
    const totalJSHeapSize = memory.totalJSHeapSize;
    const usagePercentage = (usedJSHeapSize / jsHeapSizeLimit) * 100;
    const isNearLimit = usagePercentage >= this.lowMemoryThreshold * 100;

    return {
      usedJSHeapSize,
      jsHeapSizeLimit,
      totalJSHeapSize,
      usagePercentage,
      isNearLimit,
    };
  }

  /**
   * 格式化字节数为可读字符串
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 记录内存信息
   */
  logMemoryInfo(): void {
    const memoryInfo = this.getMemoryInfo();
    if (!memoryInfo) return;

    logger.info('memory', '内存使用情况', {
      used: this.formatBytes(memoryInfo.usedJSHeapSize),
      limit: this.formatBytes(memoryInfo.jsHeapSizeLimit),
      total: this.formatBytes(memoryInfo.totalJSHeapSize),
      percentage: `${memoryInfo.usagePercentage.toFixed(2)}%`,
      isNearLimit: memoryInfo.isNearLimit,
    });

    // 如果接近内存限制，记录警告
    if (memoryInfo.usagePercentage >= this.lowMemoryThreshold * 100) {
      logger.warn('memory', `内存使用率较高: ${memoryInfo.usagePercentage.toFixed(2)}%`);
    }

    // 如果达到临界值，触发降级
    if (
      memoryInfo.usagePercentage >= this.criticalMemoryThreshold * 100 &&
      this.onLowMemoryCallback
    ) {
      logger.error('memory', `内存使用率达到临界值: ${memoryInfo.usagePercentage.toFixed(2)}%`);
      this.onLowMemoryCallback();
    }
  }

  /**
   * 开始监控内存
   * @param interval 监控间隔（毫秒），默认 5000ms
   */
  startMonitoring(interval = 5000): void {
    if (this.monitoringInterval !== null) {
      logger.warn('memory', '内存监控已在运行');
      return;
    }

    logger.info('memory', `开始内存监控，间隔: ${interval}ms`);

    // 立即记录一次
    this.logMemoryInfo();

    // 定期监控
    this.monitoringInterval = window.setInterval(() => {
      this.logMemoryInfo();
    }, interval);
  }

  /**
   * 停止监控内存
   */
  stopMonitoring(): void {
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('memory', '内存监控已停止');
    }
  }

  /**
   * 设置低内存回调
   * 当内存使用率达到临界值时调用
   */
  setLowMemoryCallback(callback: () => void): void {
    this.onLowMemoryCallback = callback;
  }

  /**
   * 设置低内存阈值
   * @param threshold 阈值（0-1），默认 0.85
   */
  setLowMemoryThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      logger.warn('memory', '低内存阈值必须在 0-1 之间');
      return;
    }
    this.lowMemoryThreshold = threshold;
    logger.info('memory', `低内存阈值设置为: ${threshold * 100}%`);
  }

  /**
   * 设置临界内存阈值
   * @param threshold 阈值（0-1），默认 0.95
   */
  setCriticalMemoryThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      logger.warn('memory', '临界内存阈值必须在 0-1 之间');
      return;
    }
    this.criticalMemoryThreshold = threshold;
    logger.info('memory', `临界内存阈值设置为: ${threshold * 100}%`);
  }

  /**
   * 检查是否应该降级到低质量
   */
  shouldDowngradeQuality(): boolean {
    const memoryInfo = this.getMemoryInfo();
    if (!memoryInfo) return false;

    return memoryInfo.usagePercentage >= this.lowMemoryThreshold * 100;
  }

  /**
   * 强制垃圾回收（仅在支持的浏览器中）
   * 注意：这是一个实验性 API，仅在某些浏览器的开发模式下可用
   */
  forceGarbageCollection(): void {
    if ((window as any).gc) {
      logger.info('memory', '触发垃圾回收');
      (window as any).gc();
    } else {
      logger.warn('memory', '浏览器不支持手动垃圾回收');
    }
  }
}

// 导出单例实例
export const memoryMonitor = new MemoryMonitor();

// 默认导出
export default memoryMonitor;
