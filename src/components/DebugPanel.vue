<template>
  <div v-if="visible" class="debug-panel">
    <div class="debug-header">
      <span class="debug-title">🔧 调试信息</span>
      <button class="debug-toggle" @click="toggleExpanded">
        {{ expanded ? '▼' : '▶' }}
      </button>
      <button class="debug-close" @click="emit('close')">✕</button>
    </div>

    <div v-if="expanded" class="debug-content">
      <!-- 基本信息 -->
      <div class="debug-section">
        <div class="debug-section-title">📱 设备信息</div>
        <div class="debug-item">
          <span class="debug-label">浏览器:</span>
          <span class="debug-value">{{ deviceInfo.browser }}</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">版本:</span>
          <span class="debug-value">{{ deviceInfo.version }}</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">设备:</span>
          <span class="debug-value">{{ deviceInfo.device }}</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">屏幕:</span>
          <span class="debug-value">{{ deviceInfo.screen }}</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">像素比:</span>
          <span class="debug-value">{{ deviceInfo.pixelRatio }}</span>
        </div>
      </div>

      <!-- 兼容性信息 -->
      <div class="debug-section">
        <div class="debug-section-title">✅ 兼容性</div>
        <div class="debug-item">
          <span class="debug-label">WebGL:</span>
          <span :class="['debug-badge', compatibility.webgl ? 'badge-success' : 'badge-error']">
            {{ compatibility.webgl ? `v${compatibility.webglVersion}` : '不支持' }}
          </span>
        </div>
        <div class="debug-item">
          <span class="debug-label">CSS3D:</span>
          <span :class="['debug-badge', compatibility.css3d ? 'badge-success' : 'badge-error']">
            {{ compatibility.css3d ? '支持' : '不支持' }}
          </span>
        </div>
        <div class="debug-item">
          <span class="debug-label">自动播放:</span>
          <span
            :class="['debug-badge', compatibility.autoplay ? 'badge-success' : 'badge-warning']"
          >
            {{ compatibility.autoplay ? '允许' : '不允许' }}
          </span>
        </div>
        <div class="debug-item">
          <span class="debug-label">触摸:</span>
          <span :class="['debug-badge', compatibility.touch ? 'badge-success' : 'badge-error']">
            {{ compatibility.touch ? '支持' : '不支持' }}
          </span>
        </div>
        <div class="debug-item">
          <span class="debug-label">视频格式:</span>
          <span class="debug-value">{{ compatibility.videoFormats }}</span>
        </div>
      </div>

      <!-- 性能信息 -->
      <div class="debug-section">
        <div class="debug-section-title">⚡ 性能</div>
        <div class="debug-item">
          <span class="debug-label">渲染器:</span>
          <span class="debug-value">{{ performance.renderer }}</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">设备性能:</span>
          <span :class="['debug-badge', getPerformanceBadgeClass(performance.deviceScore)]">
            {{ performance.deviceScore }}
          </span>
        </div>
        <div class="debug-item">
          <span class="debug-label">内存使用:</span>
          <span class="debug-value">{{ performance.memory }}</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">FPS:</span>
          <span class="debug-value">{{ performance.fps }}</span>
        </div>
      </div>

      <!-- 加载时间 -->
      <div class="debug-section">
        <div class="debug-section-title">⏱️ 加载时间</div>
        <div class="debug-item">
          <span class="debug-label">兼容性检测:</span>
          <span class="debug-value">{{ loadingTimes.compatibility }}ms</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">渲染器初始化:</span>
          <span class="debug-value">{{ loadingTimes.renderer }}ms</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">视频加载:</span>
          <span class="debug-value">{{ loadingTimes.video }}ms</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">总计:</span>
          <span :class="['debug-value', getTotalTimeClass(loadingTimes.total)]">
            {{ loadingTimes.total }}ms
          </span>
        </div>
      </div>

      <!-- 实时日志 -->
      <div class="debug-section">
        <div class="debug-section-title">
          📝 实时日志
          <button class="debug-btn-small" @click="clearLogs">清除</button>
        </div>
        <div class="debug-logs">
          <div
            v-for="(log, index) in realtimeLogs"
            :key="index"
            :class="['debug-log-item', `log-${log.level}`]"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-category">[{{ log.category }}]</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div v-if="realtimeLogs.length === 0" class="debug-log-empty">
            暂无日志
          </div>
        </div>
      </div>

      <!-- 错误日志 -->
      <div v-if="errors.length > 0" class="debug-section">
        <div class="debug-section-title">❌ 错误日志</div>
        <div v-for="(error, index) in errors" :key="index" class="debug-error">
          {{ error }}
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="debug-actions">
        <button class="debug-btn" @click="copyToClipboard">📋 复制信息</button>
        <button class="debug-btn" @click="clearErrors">🗑️ 清除错误</button>
        <button class="debug-btn" @click="refresh">🔄 刷新</button>
      </div>
    </div>
  </div>

  <!-- 浮动按钮（当面板关闭时显示） -->
  <button v-if="!visible" class="debug-fab" @click="visible = true">🔧</button>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import {
  getBrowserName,
  getBrowserVersion,
  isMobile,
  isIOS,
  isAndroid,
  hasTouchSupport,
  assessDevicePerformance,
} from '../utils/env';

const emit = defineEmits(['close']);

const visible = ref(true);
const expanded = ref(true);

const deviceInfo = reactive({
  browser: '',
  version: '',
  device: '',
  screen: '',
  pixelRatio: 0,
});

const compatibility = reactive({
  webgl: false,
  webglVersion: 0,
  css3d: false,
  autoplay: false,
  touch: false,
  videoFormats: '',
});

const performance = reactive({
  renderer: '未知',
  deviceScore: 'unknown',
  memory: '0 MB',
  fps: 0,
});

const loadingTimes = reactive({
  compatibility: 0,
  renderer: 0,
  video: 0,
  total: 0,
});

const errors = ref<string[]>([]);
const realtimeLogs = ref<Array<{
  time: string;
  level: string;
  category: string;
  message: string;
}>>([]);

let fpsCounter = 0;
let lastTime = window.performance.now();
let fpsInterval: number | null = null;

// 最多保留50条日志
const MAX_LOGS = 50;

const toggleExpanded = () => {
  expanded.value = !expanded.value;
};

const getPerformanceBadgeClass = (score: string) => {
  if (score === 'high') return 'badge-success';
  if (score === 'medium') return 'badge-warning';
  return 'badge-error';
};

const getTotalTimeClass = (time: number) => {
  if (time < 1000) return 'text-success';
  if (time < 3000) return 'text-warning';
  return 'text-error';
};

const copyToClipboard = async () => {
  const info = `
=== 调试信息 ===
浏览器: ${deviceInfo.browser} ${deviceInfo.version}
设备: ${deviceInfo.device}
屏幕: ${deviceInfo.screen}
像素比: ${deviceInfo.pixelRatio}

WebGL: ${compatibility.webgl ? `v${compatibility.webglVersion}` : '不支持'}
CSS3D: ${compatibility.css3d ? '支持' : '不支持'}
自动播放: ${compatibility.autoplay ? '允许' : '不允许'}
触摸: ${compatibility.touch ? '支持' : '不支持'}
视频格式: ${compatibility.videoFormats}

渲染器: ${performance.renderer}
设备性能: ${performance.deviceScore}
内存: ${performance.memory}
FPS: ${performance.fps}

兼容性检测: ${loadingTimes.compatibility}ms
渲染器初始化: ${loadingTimes.renderer}ms
视频加载: ${loadingTimes.video}ms
总计: ${loadingTimes.total}ms

错误: ${errors.value.length > 0 ? errors.value.join('\n') : '无'}
  `.trim();

  try {
    await navigator.clipboard.writeText(info);
    alert('调试信息已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制控制台输出');
    console.log(info);
  }
};

const clearErrors = () => {
  errors.value = [];
};

const clearLogs = () => {
  realtimeLogs.value = [];
};

const refresh = () => {
  window.location.reload();
};

// 添加日志到实时日志列表
const addLog = (level: string, category: string, message: string) => {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  realtimeLogs.value.push({
    time,
    level,
    category,
    message
  });
  
  // 限制日志数量
  if (realtimeLogs.value.length > MAX_LOGS) {
    realtimeLogs.value.shift();
  }
};

const updateFPS = () => {
  const now = window.performance.now();
  fpsCounter++;

  if (now >= lastTime + 1000) {
    performance.fps = Math.round((fpsCounter * 1000) / (now - lastTime));
    fpsCounter = 0;
    lastTime = now;
  }

  requestAnimationFrame(updateFPS);
};

const updateMemory = () => {
  if ('memory' in window.performance) {
    const mem = (window.performance as any).memory;
    const used = (mem.usedJSHeapSize / 1024 / 1024).toFixed(1);
    const total = (mem.totalJSHeapSize / 1024 / 1024).toFixed(1);
    performance.memory = `${used} / ${total} MB`;
  } else {
    performance.memory = '不可用';
  }
};

const collectDeviceInfo = () => {
  deviceInfo.browser = getBrowserName();
  deviceInfo.version = getBrowserVersion();

  if (isIOS()) {
    deviceInfo.device = 'iOS';
  } else if (isAndroid()) {
    deviceInfo.device = 'Android';
  } else if (isMobile()) {
    deviceInfo.device = '移动设备';
  } else {
    deviceInfo.device = '桌面设备';
  }

  deviceInfo.screen = `${window.innerWidth}x${window.innerHeight}`;
  deviceInfo.pixelRatio = window.devicePixelRatio;
};

const collectCompatibilityInfo = () => {
  // WebGL 检测
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  compatibility.webgl = !!gl;
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      compatibility.webglVersion = gl instanceof WebGL2RenderingContext ? 2 : 1;
    }
  }

  // CSS3D 检测
  compatibility.css3d =
    'transform' in document.body.style || 'webkitTransform' in document.body.style;

  // 触摸支持
  compatibility.touch = hasTouchSupport();

  // 视频格式
  const video = document.createElement('video');
  const formats = [];
  if (video.canPlayType('video/mp4')) formats.push('MP4');
  if (video.canPlayType('video/webm')) formats.push('WebM');
  if (video.canPlayType('application/x-mpegURL')) formats.push('HLS');
  compatibility.videoFormats = formats.join(', ') || '无';
};

const collectPerformanceInfo = () => {
  const devicePerf = assessDevicePerformance();
  performance.deviceScore = devicePerf.performanceScore;
  updateMemory();
};

// 监听日志事件
const handleLogEvent = (event: CustomEvent) => {
  const { category, message, data } = event.detail;

  if (category === 'compatibility' && message.includes('检测耗时')) {
    loadingTimes.compatibility = data?.value || 0;
  } else if (category === 'renderer' && message.includes('initialized successfully')) {
    loadingTimes.renderer = Date.now() - startTime;
  } else if (category === 'video' && message.includes('视频加载成功')) {
    loadingTimes.video = Date.now() - startTime;
    loadingTimes.total = Date.now() - startTime;
  } else if (category === 'renderer' && message.includes('选择的渲染器')) {
    performance.renderer = data || '未知';
  }
};

const handleErrorEvent = (event: CustomEvent) => {
  const { category, message } = event.detail;
  errors.value.push(`[${category}] ${message}`);
  if (errors.value.length > 10) {
    errors.value.shift();
  }
};

const handlePanoramaLoaded = (event: CustomEvent) => {
  const { rendererType } = event.detail;
  performance.renderer = rendererType;
};

let startTime = 0;

onMounted(() => {
  startTime = Date.now();

  collectDeviceInfo();
  collectCompatibilityInfo();
  collectPerformanceInfo();

  // 启动 FPS 计数
  updateFPS();

  // 定期更新内存信息
  fpsInterval = window.setInterval(updateMemory, 2000);

  // 监听日志事件
  window.addEventListener('log:info' as any, handleLogEvent);
  window.addEventListener('log:error' as any, handleErrorEvent);
  window.addEventListener('panorama:loaded' as any, handlePanoramaLoaded);

  // iOS 兼容性：使用 try-catch 包裹 console 拦截，避免崩溃
  try {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args: any[]) => {
      try {
        originalLog.apply(console, args);
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        const categoryMatch = message.match(/^\[([^\]]+)\]/);
        const category = categoryMatch ? categoryMatch[1] : 'log';
        const cleanMessage = categoryMatch ? message.replace(/^\[[^\]]+\]\s*/, '') : message;
        
        addLog('info', category, cleanMessage);
      } catch (e) {
        // 静默失败，不影响主应用
        originalLog.apply(console, args);
      }
    };
    
    console.error = (...args: any[]) => {
      try {
        originalError.apply(console, args);
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        const categoryMatch = message.match(/^\[([^\]]+)\]/);
        const category = categoryMatch ? categoryMatch[1] : 'error';
        const cleanMessage = categoryMatch ? message.replace(/^\[[^\]]+\]\s*/, '') : message;
        
        addLog('error', category, cleanMessage);
        errors.value.push(cleanMessage);
        if (errors.value.length > 10) {
          errors.value.shift();
        }
      } catch (e) {
        originalError.apply(console, args);
      }
    };
    
    console.warn = (...args: any[]) => {
      try {
        originalWarn.apply(console, args);
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        const categoryMatch = message.match(/^\[([^\]]+)\]/);
        const category = categoryMatch ? categoryMatch[1] : 'warn';
        const cleanMessage = categoryMatch ? message.replace(/^\[[^\]]+\]\s*/, '') : message;
        
        addLog('warn', category, cleanMessage);
      } catch (e) {
        originalWarn.apply(console, args);
      }
    };

    addLog('info', 'DebugPanel', '调试面板已启动');
  } catch (error) {
    // console 拦截失败，不影响主应用
    console.error('DebugPanel console 拦截失败:', error);
  }
});

onUnmounted(() => {
  if (fpsInterval) {
    clearInterval(fpsInterval);
  }
  window.removeEventListener('log:info' as any, handleLogEvent);
  window.removeEventListener('log:error' as any, handleErrorEvent);
  window.removeEventListener('panorama:loaded' as any, handlePanoramaLoaded);
});
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 60px;
  right: 10px;
  width: 320px;
  max-width: calc(100vw - 20px);
  max-height: calc(100vh - 80px);
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  z-index: 10000;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.debug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.debug-title {
  font-weight: 600;
  font-size: 13px;
}

.debug-toggle,
.debug-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  opacity: 0.8;
}

.debug-toggle:hover,
.debug-close:hover {
  opacity: 1;
}

.debug-content {
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  padding: 8px;
}

.debug-section {
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.debug-section-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #60a5fa;
  font-size: 13px;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.debug-item:last-child {
  border-bottom: none;
}

.debug-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
}

.debug-value {
  color: #fff;
  font-weight: 500;
  text-align: right;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.debug-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
}

.badge-success {
  background: #22c55e;
  color: #000;
}

.badge-warning {
  background: #f59e0b;
  color: #000;
}

.badge-error {
  background: #ef4444;
  color: #fff;
}

.text-success {
  color: #22c55e;
}

.text-warning {
  color: #f59e0b;
}

.text-error {
  color: #ef4444;
}

.debug-error {
  padding: 6px;
  margin: 4px 0;
  background: rgba(239, 68, 68, 0.2);
  border-left: 3px solid #ef4444;
  border-radius: 2px;
  font-size: 10px;
  word-break: break-word;
}

.debug-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.debug-btn {
  flex: 1;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.debug-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.debug-btn-small {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  margin-left: 8px;
}

.debug-btn-small:hover {
  background: rgba(255, 255, 255, 0.2);
}

.debug-logs {
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  padding: 8px;
  font-family: 'Courier New', monospace;
}

.debug-log-item {
  padding: 4px 0;
  font-size: 10px;
  line-height: 1.4;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  word-break: break-word;
}

.debug-log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #888;
  margin-right: 6px;
}

.log-category {
  color: #60a5fa;
  margin-right: 6px;
  font-weight: 600;
}

.log-message {
  color: #fff;
}

.log-info .log-message {
  color: #fff;
}

.log-warn .log-message {
  color: #f59e0b;
}

.log-error .log-message {
  color: #ef4444;
}

.debug-log-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 20px;
  font-size: 11px;
}

.debug-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(96, 165, 250, 0.9);
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  transition: all 0.3s;
}

.debug-fab:hover {
  transform: scale(1.1);
  background: rgba(96, 165, 250, 1);
}

/* 移动端优化 */
@media (max-width: 640px) {
  .debug-panel {
    width: calc(100vw - 20px);
    right: 10px;
  }

  .debug-fab {
    width: 44px;
    height: 44px;
    font-size: 20px;
    bottom: 15px;
    right: 15px;
  }
}
</style>
