export function detectWebGLVersion(): 1 | 2 | null {
  try {
    const canvas = document.createElement('canvas')
    if (canvas.getContext('webgl2')) return 2
    if (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) return 1
    return null
  } catch {
    return null
  }
}

export function detectCSS3DSupport(): boolean {
  try {
    const el = document.createElement('div')
    el.style.transformStyle = 'preserve-3d'
    el.style.perspective = '1000px'
    return el.style.transformStyle === 'preserve-3d' && el.style.perspective === '1000px'
  } catch {
    return false
  }
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent)
}

export function isWechat(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent)
}

export function isHlsSupported(): boolean {
  const video = document.createElement('video')
  if (isIOS() && video.canPlayType('application/vnd.apple.mpegurl') !== '') return true
  return typeof MediaSource !== 'undefined' && typeof (MediaSource as any).isTypeSupported === 'function'
}

export const DEFAULT_PANORAMA_VIDEO = ((import.meta.env as any).VITE_DEFAULT_PANORAMA_VIDEO as string) || 'videos/大殿全景.mp4'

export function resolveAssetPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return base + normalized
}

export function getDefaultPanoramaVideoUrl(): string {
  return resolveAssetPath(DEFAULT_PANORAMA_VIDEO)
}
