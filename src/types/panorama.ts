export type RenderMode = 'webgl' | 'css3d' | 'video';

export interface PanoramaSource {
  poster?: string;
  hlsSrc?: string;
  lowSrc?: string;
  highSrc?: string;
  krpanoXml?: string;
}