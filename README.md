# 3D 全景视频播放系统（720 度道观）

面向“720 度道观”场景的全景视频项目骨架，基于 Vite、Vue3、TypeScript、TailwindCSS、Vue Router 与 Pinia。播放器在无 krpano 的情况下，内置 three.js 球面视频渲染，实现真实 360×180 全景（营销常称 720 度）。

## 快速开始

1. 安装依赖：

```bash
npm install
```

2. 启动开发：

```bash
npm run dev
```

3. 在 `src/pages/Home.vue` 中替换视频源：

```ts
const poster = '/public/vite.svg';
const hlsSrc = 'https://example.com/stream.m3u8';
const lowSrc = 'https://example.com/low.m3u8';
const highSrc = 'https://example.com/high.m3u8';
const krpanoXml = '/krpano/example.xml';
```

> 注意：krpano 为商业软件，请将 `krpano.js` 放置到 `public/krpano/krpano.js` 或修改 `src/utils/krpano.ts` 中的加载路径。若暂未集成 krpano，three.js 路径将自动启用以提供真实全景播放。

## 功能点对应规范

- 渲染引擎优先级：WebGL（krpano）优先；无 krpano 时使用 three.js 球面渲染；不可用时 CSS3D 占位；视频模式保底。
- 降级策略：自动检测环境并切换模式，保证无白屏。
- 视频加载优化：HLS 分片、首屏小缓冲、渐进式高码率切换。
- iOS 设备：自动播放失败时展示交互遮罩按钮。
- Vue 组件结构：`PanoramaPlayer` 作为核心播放器组件，路由提供 `Home` / `Debug` 页面。
- 错误处理：全局 `errorHandler` 打印并可扩展上报。
- 代码质量：附带 ESLint + Prettier 基本配置。

## 资源准备建议（道观场景）

- 视频素材：建议 equirectangular（等距矩形）全景视频，分辨率如 `4096x2048` 或更高；提供 `m3u8` HLS 切片以及低/高码率两档以便渐进切换。
- 海报图：在 `public/` 下放置一张加载占位图（如 `/poster.jpg`）。
- krpano（可选）：如需热点/多场景/自定义交互，准备对应 `xml` 与资源并放到 `public/krpano/`。

## 交互控制（three 模式）

- 拖拽旋转视角，滚轮缩放；限制平移，保证沉浸式观看。
- 初次播放可能需要点击“点击播放”以满足 iOS 自动播放策略。