import { ref } from 'vue';

// 全局加载层状态（单例）
const visible = ref(true);
const progress = ref(0);
const error = ref('');

const startAt = ref<number>(performance.now());
let minMs = 1200;
let maxMs = 8000;
let maxTimer: number | null = null;
let hideTimer: number | null = null;
let firstFrameTimer: number | null = null;

let listenersAttached = false;

function clampProgress(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function start(opts?: { minMs?: number; maxMs?: number }) {
  if (opts?.minMs !== undefined) minMs = opts.minMs!;
  if (opts?.maxMs !== undefined) maxMs = opts.maxMs!;

  visible.value = true;
  progress.value = 0;
  error.value = '';
  startAt.value = performance.now();

  if (maxTimer) {
    clearTimeout(maxTimer);
    maxTimer = null;
  }
  maxTimer = window.setTimeout(() => {
    if (visible.value) {
      console.warn('[GlobalLoading] 超过最大加载展示时长，兜底隐藏');
      visible.value = false;
    }
  }, maxMs);
}

function finish() {
  const elapsed = performance.now() - startAt.value;
  const delay = Math.max(0, minMs - elapsed);
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  hideTimer = window.setTimeout(() => {
    visible.value = false;
  }, delay);
}

function setProgress(v: number) {
  progress.value = clampProgress(v);
}

function setError(message: string) {
  error.value = message;
}

function clearTimers() {
  if (maxTimer) {
    clearTimeout(maxTimer);
    maxTimer = null;
  }
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function handlePanoramaLoaded() {
  // 严格策略：已加载但等待首帧渲染事件再 finish
  setProgress(100);
  if (firstFrameTimer) {
    clearTimeout(firstFrameTimer);
    firstFrameTimer = null;
  }
  // 若首帧事件迟迟未触发，使用兜底 300ms
  firstFrameTimer = window.setTimeout(() => {
    finish();
  }, 300);
}

function handleFirstFrameRendered() {
  if (firstFrameTimer) {
    clearTimeout(firstFrameTimer);
    firstFrameTimer = null;
  }
  finish();
}

function handlePanoramaLoading(e: Event) {
  const detail = (e as CustomEvent).detail as { progress?: number } | undefined;
  if (detail && typeof detail.progress === 'number') {
    setProgress(detail.progress);
  }
}

function handlePanoramaError(e: Event) {
  const detail = (e as CustomEvent).detail as { message?: string } | undefined;
  if (detail && typeof detail.message === 'string') {
    setError(detail.message);
  }
}

function attach() {
  if (listenersAttached) return;
  window.addEventListener('panorama:loaded', handlePanoramaLoaded);
  window.addEventListener('panorama:loading', handlePanoramaLoading as EventListener);
  window.addEventListener('panorama:error', handlePanoramaError as EventListener);
  window.addEventListener('panorama:first-frame-rendered', handleFirstFrameRendered as EventListener);
  listenersAttached = true;
}

function detach() {
  if (!listenersAttached) return;
  window.removeEventListener('panorama:loaded', handlePanoramaLoaded);
  window.removeEventListener('panorama:loading', handlePanoramaLoading as EventListener);
  window.removeEventListener('panorama:error', handlePanoramaError as EventListener);
  window.removeEventListener('panorama:first-frame-rendered', handleFirstFrameRendered as EventListener);
  listenersAttached = false;
  clearTimers();
}

export function useGlobalLoading() {
  return {
    // 状态
    visible,
    progress,
    error,
    // 方法
    start,
    finish,
    setProgress,
    setError,
    attach,
    detach,
  };
}