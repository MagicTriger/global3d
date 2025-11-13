export function getOptimalPixelRatio(maxRatio = 2): number {
  return Math.min(window.devicePixelRatio || 1, maxRatio)
}

export function throttle<T extends (...args: any[]) => any>(fn: T, wait: number) {
  let t: number | null = null
  let last = 0
  return function(this: any, ...args: any[]) {
    const now = Date.now()
    const remaining = wait - (now - last)
    if (remaining <= 0 || remaining > wait) {
      if (t) { clearTimeout(t); t = null }
      last = now
      fn.apply(this, args)
    } else if (!t) {
      t = window.setTimeout(() => {
        last = Date.now()
        t = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}

export function requestIdleCallback(callback: () => void, options?: { timeout?: number }): number {
  if (typeof (window as any).requestIdleCallback === 'function') {
    return (window as any).requestIdleCallback(callback, options)
  } else {
    return window.setTimeout(callback, options?.timeout ?? 1) as unknown as number
  }
}

export function deferNonCriticalTask(task: () => void, timeout = 2000): number {
  return requestIdleCallback(task, { timeout })
}
