# 实现计划

- [x] 1. 增强兼容性检测模块
  - 扩展 `src/utils/env.ts` 添加完整的浏览器能力检测
  - 实现 WebGL 版本检测（WebGL 1.0 vs 2.0）
  - 实现 CSS3D 支持检测（transform-style: preserve-3d）
  - 实现视频格式检测（MP4, WebM, HLS）
  - 实现自动播放策略检测
  - 实现移动端环境检测（iOS, Android, 微信, UC 等）
  - 实现设备性能评估（内存、GPU 等）
  - _需求: 2.1, 2.2, 2.3, 2.4_

- [x] 2. 创建类型定义和接口
  - 创建 `src/types/panorama.ts` 定义所有接口和类型
  - 定义 `BrowserCapabilities` 接口
  - 定义 `RendererType` 和 `RendererConfig` 类型
  - 定义 `VideoSource` 和 `VideoLoaderConfig` 接口
  - 定义 `PanoramaPlayerState` 状态接口
  - 定义 `LogEntry` 和日志相关接口
  - _需求: 2.1, 5.1_

- [x] 3. 实现日志记录器
  - 创建 `src/utils/logger.ts` 实现日志系统
  - 实现日志级别过滤（info, warn, error）
  - 实现日志分类（compatibility, renderer, video, interaction）
  - 实现开发模式控制台输出
  - 实现生产模式日志缓存
  - 实现日志导出功能
  - 提供日志上报接口
  - _需求: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. 创建兼容性检测 Composable
  - 创建 `src/composables/useCompatibility.ts`
  - 实现 `detectCapabilities()` 函数调用所有检测方法
  - 实现 `selectRenderer()` 函数根据能力选择渲染器
  - 实现检测结果缓存避免重复检测
  - 集成日志记录器记录检测结果
  - 在 500ms 内完成所有检测
  - _需求: 2.1, 2.2, 2.3, 2.4, 5.1_

- [x] 5. 实现 WebGL 渲染器

- [x] 5.1 创建 WebGL 渲染器基础结构
  - 创建 `src/renderers/WebGLRenderer.ts`
  - 实现 `Renderer` 接口的基本方法（init, dispose, setView, panBy, resize）
  - 初始化 Three.js 场景、相机、渲染器
  - 创建内翻球体几何体（SphereGeometry with scale -1, 1, 1）
  - 设置初始材质（占位颜色）
  - 实现渲染循环（requestAnimationFrame）
  - _需求: 2.2, 6.1, 6.2_

- [x] 5.2 实现视频纹理绑定
  - 监听视频 `playing` 事件
  - 在视频播放后创建 `VideoTexture`
  - 设置纹理参数（colorSpace, minFilter, magFilter）
  - 将纹理应用到球体材质
  - 处理视频纹理更新
  - _需求: 1.1, 1.2, 1.3, 1.4_

- [x] 5.3 实现触摸控制
  - 集成 `OrbitControls`
  - 配置控制器参数（rotateSpeed, zoomSpeed, enablePan）
  - 实现单指拖拽旋转视角
  - 实现双指缩放调整 FOV
  - 防止触摸事件触发浏览器默认行为
  - _需求: 6.1, 6.2, 6.5_

- [x] 5.4 处理 WebGL 上下文丢失
  - 监听 `webglcontextlost` 事件
  - 监听 `webglcontextrestored` 事件
  - 实现上下文恢复逻辑
  - 恢复失败时触发降级
  - 记录上下文丢失日志
  - _需求: 1.1, 1.2, 1.3, 1.4, 5.2, 5.3_

- [x] 5.5 实现响应式尺寸调整
  - 监听窗口 `resize` 事件
  - 监听屏幕方向变化
  - 更新渲染器尺寸
  - 更新相机宽高比
  - 处理高 DPI 屏幕
  - 在 500ms 内完成调整
  - _需求: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. 实现 CSS3D 渲染器

- [x] 6.1 创建 CSS3D 渲染器结构
  - 创建 `src/renderers/CSS3DRenderer.ts`
  - 实现 `Renderer` 接口
  - 创建 CSS3D 容器和场景结构
  - 设置 perspective 和 transform-style
  - 创建视频元素作为纹理
  - _需求: 2.3, 6.3_

- [x] 6.2 实现 CSS3D 视角控制
  - 实现 `setView()` 方法使用 CSS transform
  - 实现 `panBy()` 方法
  - 实现触摸拖拽旋转
  - 使用 `will-change` 和 `translateZ(0)` 优化性能
  - _需求: 6.3_

- [x] 6.3 实现 CSS3D 响应式调整
  - 监听窗口尺寸变化
  - 调整容器尺寸
  - 调整 perspective 值
  - _需求: 7.1, 7.2, 7.3, 7.4_

- [x] 7. 实现降级渲染器
  - 创建 `src/renderers/FallbackRenderer.ts`
  - 实现 `Renderer` 接口
  - 不使用静态全景图片（poster 或视频首帧）只能视频
  - 使用 CSS background-size: cover
  - 实现简单的拖拽查看（background-position）
  - 显示浏览器不支持提示信息
  - _需求: 2.5_

- [x] 8. 实现视频加载器 Composable

- [x] 8.1 创建视频加载器基础结构
  - 创建 `src/composables/useVideoLoader.ts`
  - 实现 `loadVideo()` 函数
  - 设置视频元素属性（playsinline, webkit-playsinline, x5-playsinline 等）
  - 实现视频源选择逻辑
  - _需求: 4.1, 4.2_

- [x] 8.2 实现 HLS 支持
  - 检测 HLS 支持（hls.js 或原生）
  - 使用 hls.js 加载 m3u8 流（非 iOS）
  - 使用原生 HLS 支持（iOS）
  - 配置 HLS 参数（maxBufferLength, startPosition）
  - 实现自适应码率切换
  - _需求: 4.1, 4.4_

- [x] 8.3 实现视频格式降级
  - 尝试 HLS 格式
  - HLS 失败时降级到 MP4
  - MP4 失败时降级到 WebM
  - 所有格式失败时显示错误
  - _需求: 1.1, 1.2, 1.3, 1.4_

- [x] 8.4 实现错误重试机制
  - 监听视频 `error` 事件
  - 实现最多 3 次重试
  - 使用递增延迟（1s, 2s, 4s）
  - 记录重试日志
  - 3 次失败后显示错误信息
  - _需求: 4.5, 5.3_

- [x] 8.5 实现视频质量切换
  - 实现 `switchQuality()` 函数
  - 根据网络速度自动选择质量
  - 支持手动切换质量
  - 切换时保持播放位置
  - _需求: 4.1, 4.4_

- [x] 8.6 实现视频循环播放
  - 设置 `loop` 属性
  - 监听 `ended` 事件作为兜底
  - 在 ended 时重置 currentTime 并重新播放
  - 处理 iOS 等环境的循环播放问题
  - _需求: 1.1, 1.2, 1.3, 1.4_

- [x] 9. 实现交互管理器 Composable

- [x] 9.1 创建交互管理器基础结构
  - 创建 `src/composables/useInteraction.ts`
  - 实现播放按钮显示/隐藏逻辑
  - 实现用户手势处理
  - _需求: 3.1, 3.2, 3.3_

- [x] 9.2 实现自动播放检测和处理
  - 尝试自动播放视频
  - 捕获 `NotAllowedError` 异常
  - 自动播放失败时显示播放按钮
  - 播放按钮点击后启动播放
  - 播放成功后隐藏按钮
  - _需求: 3.1, 3.2, 3.3_

- [x] 9.3 实现触摸控制
  - 监听 touch 事件（touchstart, touchmove, touchend）
  - 实现单指拖拽逻辑
  - 实现双指缩放逻辑
  - 使用 `touch-action: none` 防止默认行为
  - 使用 `preventDefault()` 阻止双击缩放
  - 确保触摸响应时间 < 16ms
  - _需求: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9.4 确保播放按钮符合移动端标准
  - 设置最小可点击区域 44x44px
  - 使用清晰的视觉样式
  - 添加点击反馈动画
  - _需求: 3.4_

- [x] 10. 实现渲染器管理器 Composable

- [x] 10.1 创建渲染器管理器基础结构
  - 创建 `src/composables/useRenderer.ts`
  - 实现渲染器实例管理
  - 实现 `initRenderer()` 函数
  - 实现 `dispose()` 函数
  - _需求: 2.2, 2.3, 2.4, 2.5_

- [x] 10.2 实现渲染器初始化逻辑
  - 根据 `RendererType` 创建对应渲染器实例
  - 调用渲染器的 `init()` 方法
  - 处理初始化失败情况
  - 初始化失败时触发降级
  - 记录初始化日志
  - _需求: 2.2, 2.3, 2.4, 2.5, 5.2_

- [x] 10.3 实现渲染器切换逻辑
  - 实现 `switchRenderer()` 函数
  - 销毁当前渲染器
  - 初始化新渲染器
  - 保持视角状态
  - 记录切换原因
  - _需求: 2.2, 2.3, 2.4, 2.5, 5.2_

- [x] 11. 重构 PanoramaPlayer 组件

- [x] 11.1 集成所有 Composables
  - 在 `src/components/PanoramaPlayer.vue` 中引入所有 composables
  - 使用 `useCompatibility` 进行能力检测
  - 使用 `useRenderer` 管理渲染器
  - 使用 `useVideoLoader` 加载视频
  - 使用 `useInteraction` 处理交互
  - _需求: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 11.2 实现组件初始化流程
  - 在 `onMounted` 中执行兼容性检测
  - 根据检测结果选择渲染器
  - 初始化选定的渲染器
  - 加载视频资源
  - 处理自动播放策略
  - 显示加载状态
  - _需求: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 4.2_

- [x] 11.3 实现组件清理逻辑
  - 在 `onBeforeUnmount` 中销毁渲染器
  - 清理视频资源
  - 移除事件监听器
  - 清理定时器和动画帧
  - _需求: 1.1, 1.2, 1.3, 1.4_

- [x] 11.4 优化组件模板结构
  - 简化模板结构
  - 移除 krpano 相关代码
  - 为不同渲染器提供独立容器
  - 优化播放按钮样式
  - 添加加载和错误状态显示
  - _需求: 3.1, 3.2, 3.3, 3.4, 4.2, 4.3_

- [x] 11.5 实现错误处理和用户提示
  - 显示加载进度
  - 显示缓冲状态
  - 显示错误信息
  - 提供重试按钮
  - 显示降级提示（当使用 CSS3D 或 Fallback 时）
  - _需求: 1.5, 4.2, 4.3, 4.5, 5.3_

- [x] 12. 移动端特定优化

- [x] 12.1 优化 iOS 兼容性
  - 确保所有视频元素设置 `playsinline` 属性
  - 确保自动播放视频设置 `muted` 属性
  - 处理 iOS Safari 的自动播放限制
  - 测试 iOS 14+ 的兼容性
  - _需求: 1.1, 3.1, 3.2_

- [x] 12.2 优化 Android 兼容性
  - 设置 X5 内核特定属性
  - 处理微信浏览器的特殊限制
  - 测试 Android Chrome 90+ 的兼容性
  - 测试 UC 浏览器的降级方案
  - _需求: 1.2, 1.3, 2.3_

- [x] 12.3 优化性能
  - 降低 Three.js 球体分段数（64 → 32）
  - 使用 `LinearFilter` 减少纹理采样开销
  - 使用 `requestIdleCallback` 延迟非关键初始化
  - 优化视频预加载策略
  - 限制设备像素比（最大 2）
  - _需求: 4.1, 4.2, 6.4, 7.5_

- [x] 12.4 优化内存使用
  - 及时释放不用的纹理和几何体
  - 限制视频缓冲区大小
  - 监控内存使用情况
  - 内存不足时降级到低质量视频
  - _需求: 4.1, 4.4_

- [x] 13. 更新 Home 页面
  - 更新 `src/pages/Home.vue` 使用新的 PanoramaPlayer API
  - 移除 krpano 相关配置
  - 提供多质量视频源配置
  - 优化加载屏幕集成
  - 测试页面在不同设备上的表现
  - _需求: 1.1, 1.2, 1.3, 1.4, 4.1_

- [ ] 14. 添加开发调试工具
  - 创建调试面板组件显示当前状态
  - 显示检测到的浏览器能力
  - 显示当前使用的渲染器类型
  - 显示视频加载和播放状态
  - 提供手动切换渲染器的按钮
  - 提供导出日志的按钮
  - 仅在开发模式下显示
  - _需求: 5.1, 5.2, 5.3, 5.4_

- [ ]\* 15. 编写文档
  - 更新 README.md 说明兼容性支持情况
  - 添加浏览器兼容性矩阵
  - 添加故障排查指南
  - 添加 API 文档
  - 添加部署注意事项
  - _需求: 1.1, 1.2, 1.3, 1.4, 2.1_
