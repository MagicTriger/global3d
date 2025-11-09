/**
 * 性能优化工具函数
 */

/**
 * requestIdleCallback 的 polyfill
 * 在空闲时执行回调，如果浏览器不支持则使用 setTimeout 降级
 */
export function requestIdleCallback(callback: () => void, options?: { timeout?: number }): number {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(callback, options);
  } else {
    // 降级到 setTimeout
    return window.setTimeout(callback, 1) as unknown as number;
  }
}

/**
 * cancelIdleCallback 的 polyfill
 */
export function cancelIdleCallback(id: number): void {
  if (typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
}

/**
 * 延迟执行非关键任务
 * 使用 requestIdleCallback 在浏览器空闲时执行
 */
export function deferNonCriticalTask(task: () => void, timeout = 2000): number {
  return requestIdleCallback(task, { timeout });
}

/**
 * 批量延迟执行非关键任务
 */
export function deferNonCriticalTasks(tasks: Array<() => void>, timeout = 2000): number[] {
  return tasks.map((task) => deferNonCriticalTask(task, timeout));
}

/**
 * 节流函数
 * 限制函数执行频率
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = window.setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * 防抖函数
 * 延迟执行函数，如果在延迟期间再次调用则重新计时
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = window.setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * 测量函数执行时间
 */
export async function measurePerformance<T>(name: string, func: () => T | Promise<T>): Promise<T> {
  const startTime = performance.now();
  const result = await func();
  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

  return result;
}

/**
 * 限制设备像素比
 * 在高 DPI 设备上限制像素比以优化性能
 */
export function getOptimalPixelRatio(maxRatio = 2): number {
  return Math.min(window.devicePixelRatio || 1, maxRatio);
}
