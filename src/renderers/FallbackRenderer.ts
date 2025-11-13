import type { Renderer, RendererConfig } from '../types/panorama'

export class FallbackRenderer implements Renderer {
  private container: HTMLElement | null = null
  private videoElement: HTMLVideoElement | null = null
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
    this.create()
    this.updateView()
    this.setupResize()
  }

  private create(): void {
    if (!this.container || !this.videoElement) return
    this.container.innerHTML = ''
    const wrapper = document.createElement('div')
    wrapper.style.position = 'absolute'
    wrapper.style.width = '100%'
    wrapper.style.height = '100%'
    wrapper.style.overflow = 'hidden'
    wrapper.style.background = '#000'
    this.videoElement.style.position = 'absolute'
    this.videoElement.style.width = '200%'
    this.videoElement.style.height = '200%'
    this.videoElement.style.objectFit = 'cover'
    wrapper.appendChild(this.videoElement)
    this.container.appendChild(wrapper)
    this.wrapperEl = wrapper
  }

  private updateView(): void {
    if (!this.videoElement) return
    const x = Math.max(-50, Math.min(50, (this.currentYaw / 180) * 50))
    const y = Math.max(-25, Math.min(25, (this.currentPitch / 90) * 25))
    this.videoElement.style.transform = `translate(${-x}%, ${-y}%)`
  }

  private setupResize(): void {
    if (!this.container) return
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      this.resize(entry.contentRect.width, entry.contentRect.height)
    })
    this.resizeObserver.observe(this.container)
  }

  dispose(): void {
    this.isDisposed = true
    if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null }
    if (this.wrapperEl && this.wrapperEl.parentNode) this.wrapperEl.parentNode.removeChild(this.wrapperEl)
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
    while (this.currentYaw > 180) this.currentYaw -= 360
    while (this.currentYaw < -180) this.currentYaw += 360
    this.updateView()
  }

  resize(_width: number, _height: number): void {}

  onVideoReady(_video: HTMLVideoElement): void {}
}
