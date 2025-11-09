<template>
  <div class="panorama-root relative w-full h-full overflow-hidden">
    <!-- 预览层：避免白屏 -->
    <div
      v-if="!ready"
      class="absolute inset-0 bg-black/80 flex items-center justify-center"
    >
      <div class="text-white/80 text-sm">正在准备资源...</div>
    </div>

    <!-- iOS 手势遮罩 -->
    <button
      v-if="needsGesture"
      class="absolute inset-0 z-20 flex items-center justify-center bg-black/60 hover:bg-black/50 transition-colors"
      @click="startPlayback"
    >
      <span class="px-4 py-2 rounded bg-primary text-white">点击播放</span>
    </button>

    <!-- krpano 容器（WebGL） -->
    <div v-show="mode === 'webgl'" :id="krpanoId" class="absolute inset-0"></div>

    <!-- three.js 球面渲染容器（无 krpano 时的真实全景） -->
    <div v-show="mode === 'three'" ref="threeMount" class="absolute inset-0"></div>

    <!-- 视频容器（降级或混合模式） -->
    <video
      v-show="mode === 'video' || mode === 'three'"
      ref="videoRef"
      :class="mode === 'three' ? 'absolute w-px h-px opacity-0 -z-10 pointer-events-none' : 'absolute inset-0 w-full h-full object-contain bg-black'"
      :poster="poster"
      playsinline
      webkit-playsinline
      x5-playsinline
      x5-video-player-type="h5-page"
      x5-video-player-fullscreen="false"
      autoplay
      loop
      preload="metadata"
      muted
    ></video>

    <!-- CSS3D 简易全景占位（WebGL 不可用时） -->
    <div
      v-if="mode === 'css3d'"
      class="absolute inset-0"
      :style="css3dStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import Hls from 'hls.js';
import { isIOS, isWebGLAvailable, isHlsSupported } from '../utils/env';
import { loadKrpano, embedKrpano } from '../utils/krpano';
import * as THREE from 'three';
// @ts-expect-error - examples typings are bundled with three
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Props {
  poster?: string;
  hlsSrc?: string; // HLS m3u8 地址
  lowSrc?: string; // 低清晰度 HLS 地址（可选）
  highSrc?: string; // 高清晰度 HLS 地址（可选）
  krpanoXml?: string; // krpano xml 配置（可选）
  initialYawDeg?: number; // 初始左右视角（度）
  initialPitchDeg?: number; // 初始上下视角（度，向下为正）
  initialFov?: number; // 初始视场（默认 75）
  enableKeyboard?: boolean; // 启用键盘控制（默认开启）
}

const props = defineProps<Props>();

const ready = ref(false);
const needsGesture = ref(false);
const mode = ref<'webgl' | 'three' | 'css3d' | 'video'>('video');
const isPlaying = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const krpanoId = `krpano-${Math.random().toString(36).slice(2)}`;
const threeMount = ref<HTMLDivElement | null>(null);

// three.js 实例
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: any = null;
let animationId = 0;
let videoTexture: THREE.VideoTexture | null = null;
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

const deg2rad = (d: number) => (d * Math.PI) / 180;

// CSS3D 占位交互
const dragging = ref(false);
const startX = ref(0);
const rotate = ref(0);
const css3dStyle = computed(() => ({
  backgroundImage: props.poster ? `url(${props.poster})` : 'none',
  backgroundSize: 'cover',
  transform: `translateZ(0) rotateY(${rotate.value}deg)`,
}));

function onPointerDown(e: PointerEvent) {
  dragging.value = true;
  startX.value = e.clientX;
}
function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return;
  const dx = e.clientX - startX.value;
  rotate.value = Math.max(-45, Math.min(45, dx * 0.1));
}
function onPointerUp() {
  dragging.value = false;
}

async function setupKrpanoOrFallback() {
  if (props.krpanoXml && isWebGLAvailable()) {
    try {
      await loadKrpano();
      await embedKrpano({ target: `#${krpanoId}`, xml: props.krpanoXml });
      mode.value = 'webgl';
      ready.value = true;
      // krpano 场景就绪，通知加载完成
      window.dispatchEvent(new CustomEvent('panorama:loaded', { detail: { mode: 'webgl' } }));
      return;
    } catch (e) {
      console.warn('krpano 加载失败，使用视频模式作为降级', e);
    }
  }
  // 无 krpano：若 WebGL 可用则使用 three.js 实现真实球面渲染，否则使用 CSS3D 或视频
  if (isWebGLAvailable()) {
    mode.value = 'three';
    // three 模式下也需要视频源作为纹理
    await setupVideo();
    await setupThree();
    // three 模式在视频真正开始播放后再标记 ready，避免黑屏
  } else {
    // WebGL 不可用：优先 CSS3D 占位，否则视频保底
    mode.value = 'css3d';
    ready.value = true;
  }
}

function tryAutoplay(v: HTMLVideoElement) {
  return v.play().catch(() => {
    needsGesture.value = isIOS();
  });
}

async function setupVideo() {
  const v = videoRef.value!;
  if (!v) return;
  // 确保循环播放
  v.loop = true;
  // 移动端内联播放与跨域纹理
  v.muted = true;
  v.setAttribute('muted', '');
  v.playsInline = true as any;
  v.setAttribute('playsinline', '');
  try { (v as any).webkitPlaysInline = true; } catch {}
  v.crossOrigin = 'anonymous';

  const source = props.hlsSrc || props.lowSrc || props.highSrc || '';
  if (!source) return;

  const isM3u8 = /\.m3u8($|\?)/i.test(source) || source.includes('m3u8');

  if (isM3u8 && isHlsSupported()) {
    const hls = new Hls({ maxBufferLength: 10, startPosition: -1 });
    hls.loadSource(source);
    hls.attachMedia(v);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      tryAutoplay(v);
    });
    // 渐进式：若有高码率源，稳定后切换
    if (props.highSrc && props.lowSrc && props.hlsSrc === undefined) {
      setTimeout(() => {
        hls.loadSource(props.highSrc!);
      }, 5000);
    }
  } else if (isM3u8 && v.canPlayType('application/vnd.apple.mpegurl')) {
    v.src = source;
    v.addEventListener('loadedmetadata', () => tryAutoplay(v));
  } else {
    // 普通视频源（如 mp4）
    v.src = source;
    v.addEventListener('loadedmetadata', () => tryAutoplay(v));
  }

  // 播放开始后，如果是 three 模式则初始化视频纹理
  v.addEventListener('playing', () => {
    isPlaying.value = true;
    if (mode.value === 'three' && renderer && scene && camera) {
      if (!videoTexture) {
        videoTexture = new THREE.VideoTexture(v);
        videoTexture.colorSpace = THREE.SRGBColorSpace;
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
      }
    }
    // 视频开始播放（three/video），通知加载完成
    ready.value = true;
    window.dispatchEvent(new CustomEvent('panorama:loaded', { detail: { mode: mode.value } }));
  });

  // 兜底：某些环境下 loop 可能不生效，ended 时手动重启
  v.addEventListener('ended', () => {
    v.currentTime = 0;
    v.play().catch(() => {
      // iOS 等环境可能需要手势重新触发
      needsGesture.value = isIOS();
    });
  });

  // 自动播放失败兜底：短暂等待后仍未开始播放则提示手势
  setTimeout(() => {
    if (!isPlaying.value) {
      needsGesture.value = true;
    }
  }, 1500);

  // 视频错误降级：切换到 CSS3D 占位，避免黑屏
  v.addEventListener('error', () => {
    if (mode.value !== 'css3d') {
      mode.value = 'css3d';
      ready.value = true;
      window.dispatchEvent(new CustomEvent('panorama:loaded', { detail: { mode: 'css3d' } }));
    }
  });
}

function startPlayback() {
  const v = videoRef.value;
  if (!v) return;
  v.play().finally(() => (needsGesture.value = false));
}

async function setupThree() {
  if (!threeMount.value) return;
  const mount = threeMount.value;

  // 初始化 renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);

  // 场景与相机
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1100);
  camera.position.set(0, 0, 0.1);

  // 使用视频纹理包裹内表面
  const geometry = new THREE.SphereGeometry(500, 64, 64);
  geometry.scale(-1, 1, 1); // 翻转法线，观察球内侧

  // 先用占位材质，视频播放后替换纹理
  const material = new THREE.MeshBasicMaterial({ color: 0x101010 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.rotateSpeed = 0.3;
  controls.zoomSpeed = 0.5;
  controls.minDistance = 0.1;
  controls.maxDistance = 2;

  // 初始视角与视场
  const yaw = deg2rad(props.initialYawDeg ?? 0);
  const pitch = deg2rad(props.initialPitchDeg ?? 0);
  setAngles(getAngles().yaw + yaw, getAngles().polar + pitch);
  if (props.initialFov && camera) {
    camera.fov = props.initialFov;
    camera.updateProjectionMatrix();
  }

  // 当视频纹理就绪时，替换材质
  const tryBindTexture = () => {
    if (videoTexture) {
      const texMat = new THREE.MeshBasicMaterial({ map: videoTexture });
      mesh.material = texMat;
    }
  };

  const animate = () => {
    animationId = requestAnimationFrame(animate);
    controls.update();
    tryBindTexture();
    renderer!.render(scene!, camera!);
  };
  animate();

  // 响应尺寸变化
  const onResize = () => {
    if (!renderer || !camera) return;
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  // 键盘控制（箭头调整视角，+/- 调整视场）
  if (props.enableKeyboard !== false) {
    keydownHandler = (e: KeyboardEvent) => {
      const step = 0.03; // 约 1.7°
      const { yaw, polar } = getAngles();
      if (e.key === 'ArrowLeft') setAngles(yaw + step, polar);
      else if (e.key === 'ArrowRight') setAngles(yaw - step, polar);
      else if (e.key === 'ArrowUp') setAngles(yaw, polar + step);
      else if (e.key === 'ArrowDown') setAngles(yaw, polar - step);
      else if (e.key === '+' || e.key === '=') {
        camera.fov = Math.max(30, camera.fov - 2);
        camera.updateProjectionMatrix();
      } else if (e.key === '-' || e.key === '_') {
        camera.fov = Math.min(100, camera.fov + 2);
        camera.updateProjectionMatrix();
      }
    };
    window.addEventListener('keydown', keydownHandler);
  }

  // 清理函数
  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
    if (keydownHandler) window.removeEventListener('keydown', keydownHandler);
    if (animationId) cancelAnimationFrame(animationId);
    controls && controls.dispose && controls.dispose();
    renderer && renderer.dispose();
    videoTexture && videoTexture.dispose();
    renderer = null;
    scene = null;
    camera = null;
    controls = null;
    videoTexture = null;
  });
}

// 对外暴露视角控制 API
function getAngles() {
  if (controls?.getAzimuthalAngle && controls?.getPolarAngle) {
    return { yaw: controls.getAzimuthalAngle(), polar: controls.getPolarAngle() };
  }
  // 计算当前相机相对于目标的方位角与极角
  const target = controls?.target ?? new THREE.Vector3(0, 0, 0);
  const offset = new THREE.Vector3().copy(camera!.position).sub(target);
  const yaw = Math.atan2(offset.x, offset.z);
  const polar = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);
  return { yaw, polar };
}

function setAngles(yaw: number, polar: number) {
  if (!camera || !controls) return;
  const target = controls.target ?? new THREE.Vector3(0, 0, 0);
  const r = camera.position.distanceTo(target);
  const x = r * Math.sin(polar) * Math.sin(yaw);
  const y = r * Math.cos(polar);
  const z = r * Math.sin(polar) * Math.cos(yaw);
  camera.position.set(x, y, z);
  camera.lookAt(target);
  controls.update();
}

function setView(yawDeg: number, pitchDeg: number) {
  const targetYaw = deg2rad(yawDeg);
  const targetPolar = deg2rad(90 - pitchDeg); // pitch: 0=水平，+向下
  setAngles(targetYaw, targetPolar);
}

function panBy(deltaYawDeg: number, deltaPitchDeg: number) {
  const { yaw, polar } = getAngles();
  setAngles(yaw + deg2rad(deltaYawDeg), polar + deg2rad(deltaPitchDeg));
}

defineExpose({ setView, panBy });

onMounted(async () => {
  await setupKrpanoOrFallback();
  if (mode.value === 'video') {
    await setupVideo();
  }
});
</script>

<style scoped>
.panorama-root {
  touch-action: none;
  -ms-touch-action: none;
  overscroll-behavior: contain;
}
.panorama-root canvas,
.panorama-root div {
  user-select: none;
}
</style>