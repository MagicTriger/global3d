export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) &&
      window.WebGLRenderingContext
    );
  } catch {
    return false;
  }
}

export function isHlsSupported(): boolean {
  return (window as any).MediaSource != null && typeof (window as any).MediaSource.isTypeSupported === 'function';
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}