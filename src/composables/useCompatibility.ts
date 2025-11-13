import { ref, readonly } from 'vue'
import { detectWebGLVersion, detectCSS3DSupport } from '../utils/env'
import type { RendererType } from '../types/panorama'

export function useCompatibility() {
  const selectedRenderer = ref<RendererType | null>(null)
  function selectRenderer(): RendererType {
    const webgl = detectWebGLVersion() !== null
    const css3d = detectCSS3DSupport()
    const type: RendererType = webgl ? 'webgl' : css3d ? 'css3d' : 'fallback'
    selectedRenderer.value = type
    return type
  }
  return { selectedRenderer: readonly(selectedRenderer), selectRenderer }
}
