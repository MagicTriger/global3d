import type { Renderer, RendererConfig } from '../types/panorama'

export class CSS3DRenderer implements Renderer {
  private container: HTMLElement | null = null
  private videoElement: HTMLVideoElement | null = null
  private sceneEl: HTMLDivElement | null = null
  private wrapperEl: HTMLDivElement | null = null
  private isDisposed = false
  private currentYaw = 0
  private currentPitch = 0
  private resizeObserver: ResizeObserver | null = null

  async init(config: RendererConfig): Promise<void> {
    this.container = config.container
    this.videoElement = config.videoElement
    this.currentYaw = config.initialView.yaw
    this.currentPitch = config.initialView.pitch
    this.createScene()
    this.updateView()
    this.setupResize()
  }

  private createScene(): void {
    if (!this.container || !this.videoElement) return
    this.container.innerHTML = ''
    const scene = document.createElement('div')
    const wrapper = document.createElement('div')
    scene.style.position = 'absolute'
    scene.style.width = '100%'
    scene.style.height = '100%'
    scene.style.transformStyle = 'preserve-3d'
    scene.style.perspective = '800px'
    wrapper.style.position = 'absolute'
    wrapper.style.width = '300%'
    wrapper.style.height = '300%'
    wrapper.style.left = '-100%'
    wrapper.style.top = '-100%'
    wrapper.style.transformStyle = 'preserve-3d'
    this.videoElement.style.width = '100%'
    this.videoElement.style.height = '100%'
    this.videoElement.style.objectFit = 'cover'
    wrapper.appendChild(this.videoElement)
    scene.appendChild(wrapper)
    this.container.appendChild(scene)
    this.sceneEl = scene
    this.wrapperEl = wrapper
  }

  private updateView(): void {
    if (!this.wrapperEl) return
    const t = `translateZ(0) rotateX(${-this.currentPitch}deg) rotateY(${-this.currentYaw}deg)`
    this.wrapperEl.style.transform = t
  }

  private setupResize(): void {
    if (!this.container) return
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      const w = entry.contentRect.width
      const h = entry.contentRect.height
      this.resize(w, h)
    })
    this.resizeObserver.observe(this.container)
  }

  dispose(): void {
    this.isDisposed = true
    if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null }
    if (this.sceneEl && this.sceneEl.parentNode) this.sceneEl.parentNode.removeChild(this.sceneEl)
    this.sceneEl = null
    this.wrapperEl = null
    this.container = null
    this.videoElement = null
  }

  setView(yaw: number, pitch: number): void {
    this.currentYaw = yaw
    this.currentPitch = Math.max(-90, Math.min(90, pitch))
    this.updateView()
  }

  panBy(deltaYaw: number, deltaPitch: number): void {
    this.currentYaw += deltaYaw
    this.currentPitch = Math.max(-90, Math.min(90, this.currentPitch + deltaPitch))
    this.updateView()
  }

  resize(_width: number, _height: number): void {
    if (!this.sceneEl) return
    const fov = 75
    const h = this.sceneEl.clientHeight || _height
    const p = h / (2 * Math.tan((fov * Math.PI / 180) / 2))
    this.sceneEl.style.perspective = `${Math.max(500, Math.min(2000, p))}px`
  }

  onVideoReady(_video: HTMLVideoElement): void {}
}
