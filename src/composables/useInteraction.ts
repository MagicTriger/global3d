/**
 * 交互管理器 Composable
 * 处理用户交互、手势控制和自动播放策略
 */

import { ref, readonly } from 'vue';
import type { Renderer } from '../types/panorama';
import logger from '../utils/logger';

/**
 * 触摸点信息
 */
interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

/**
 * 交互管理器 Composable
 */
export function useInteraction() {
  // 播放按钮状态
  const showPlayButton = ref(false);
  const playButtonClicked = ref(false);

  // 触摸控制状态
  const isTouching = ref(false);
  const touchPoints = ref<TouchPoint[]>([]);
  const lastTouchTime = ref(0);

  // 当前绑定的渲染器
  let currentRenderer: Renderer | null = null;
  let touchStartPoints: TouchPoint[] = [];
  let lastPanPosition = { x: 0, y: 0 };
  let initialPinchDistance = 0;

  /**
   * 显示播放按钮
   */
  function displayPlayButton(): void {
    showPlayButton.value = true;
    logger.info('interaction', '显示播放按钮');
  }

  /**
   * 隐藏播放按钮
   */
  function hidePlayButton(): void {
    showPlayButton.value = false;
    logger.info('interaction', '隐藏播放按钮');
  }

  /**
   * 处理播放按钮点击
   * 返回 Promise，在用户手势处理完成后 resolve
   */
  async function handlePlayButtonClick(videoElement: HTMLVideoElement): Promise<void> {
    playButtonClicked.value = true;
    logger.info('interaction', '播放按钮被点击');

    try {
      // 尝试播放视频
      await videoElement.play();
      logger.info('interaction', '视频播放成功');

      // 播放成功后隐藏按钮
      hidePlayButton();
    } catch (error) {
      logger.error('interaction', '播放按钮点击后视频播放失败', error);
      throw error;
    }
  }

  /**
   * 尝试自动播放视频
   * 如果失败则显示播放按钮
   */
  async function tryAutoplay(videoElement: HTMLVideoElement): Promise<boolean> {
    logger.info('interaction', '尝试自动播放视频');

    try {
      await videoElement.play();
      logger.info('interaction', '自动播放成功');
      return true;
    } catch (error: any) {
      // 捕获 NotAllowedError 异常
      if (error.name === 'NotAllowedError') {
        logger.warn('interaction', '自动播放被阻止，需要用户手势', error);
        displayPlayButton();
        return false;
      } else {
        logger.error('interaction', '自动播放失败（非权限问题）', error);
        throw error;
      }
    }
  }

  /**
   * 计算两个触摸点之间的距离
   */
  function calculateDistance(point1: TouchPoint, point2: TouchPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 处理触摸开始事件
   */
  function handleTouchStart(event: TouchEvent): void {
    const startTime = performance.now();

    // 阻止默认行为（防止双击缩放、滚动等）
    event.preventDefault();

    isTouching.value = true;

    // 记录所有触摸点
    touchStartPoints = [];
    touchPoints.value = [];

    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const point: TouchPoint = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
      };
      touchStartPoints.push(point);
      touchPoints.value.push(point);
    }

    // 记录初始位置（用于单指拖拽）
    if (touchStartPoints.length === 1) {
      lastPanPosition = {
        x: touchStartPoints[0].x,
        y: touchStartPoints[0].y,
      };
    }

    // 记录初始双指距离（用于缩放）
    if (touchStartPoints.length === 2) {
      initialPinchDistance = calculateDistance(touchStartPoints[0], touchStartPoints[1]);
    }

    lastTouchTime.value = startTime;
    logger.info('interaction', `触摸开始: ${touchStartPoints.length} 个触摸点`);
  }

  /**
   * 处理触摸移动事件
   */
  function handleTouchMove(event: TouchEvent): void {
    const moveStartTime = performance.now();

    // 阻止默认行为
    event.preventDefault();

    if (!currentRenderer) {
      return;
    }

    // 更新触摸点
    const currentPoints: TouchPoint[] = [];
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      currentPoints.push({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
      });
    }
    touchPoints.value = currentPoints;

    // 单指拖拽 - 旋转视角
    if (currentPoints.length === 1 && touchStartPoints.length === 1) {
      const deltaX = currentPoints[0].x - lastPanPosition.x;
      const deltaY = currentPoints[0].y - lastPanPosition.y;

      // 转换为角度变化（灵敏度调整）
      const deltaYaw = -deltaX * 0.2; // 水平旋转
      const deltaPitch = -deltaY * 0.2; // 垂直旋转

      // 调用渲染器的 panBy 方法
      currentRenderer.panBy(deltaYaw, deltaPitch);

      // 更新最后位置
      lastPanPosition = {
        x: currentPoints[0].x,
        y: currentPoints[0].y,
      };
    }

    // 双指缩放 - 调整 FOV
    if (currentPoints.length === 2 && touchStartPoints.length === 2) {
      const currentDistance = calculateDistance(currentPoints[0], currentPoints[1]);
      const distanceChange = currentDistance - initialPinchDistance;

      // 缩放逻辑由渲染器内部处理（通过 OrbitControls 或自定义实现）
      // 这里只记录缩放事件
      if (Math.abs(distanceChange) > 10) {
        logger.info('interaction', `双指缩放: 距离变化 ${distanceChange.toFixed(2)}px`);
        initialPinchDistance = currentDistance;
      }
    }

    // 检查响应时间
    const responseTime = performance.now() - moveStartTime;
    if (responseTime > 16) {
      logger.warn('interaction', `触摸响应时间超过 16ms: ${responseTime.toFixed(2)}ms`);
    }
  }

  /**
   * 处理触摸结束事件
   */
  function handleTouchEnd(event: TouchEvent): void {
    // 阻止默认行为
    event.preventDefault();

    // 更新触摸点
    const remainingPoints: TouchPoint[] = [];
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      remainingPoints.push({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
      });
    }
    touchPoints.value = remainingPoints;

    // 如果没有剩余触摸点，标记触摸结束
    if (remainingPoints.length === 0) {
      isTouching.value = false;
      touchStartPoints = [];
      logger.info('interaction', '触摸结束');
    } else {
      // 更新触摸起始点（用于多指手势的连续性）
      touchStartPoints = remainingPoints;

      if (remainingPoints.length === 1) {
        lastPanPosition = {
          x: remainingPoints[0].x,
          y: remainingPoints[0].y,
        };
      } else if (remainingPoints.length === 2) {
        initialPinchDistance = calculateDistance(remainingPoints[0], remainingPoints[1]);
      }
    }
  }

  /**
   * 启用触摸控制
   * 绑定触摸事件到指定容器
   */
  function enableTouchControls(container: HTMLElement, renderer: Renderer): void {
    currentRenderer = renderer;

    // 设置 CSS 属性防止默认触摸行为
    container.style.touchAction = 'none';
    container.style.userSelect = 'none';
    container.style.webkitUserSelect = 'none';

    // 绑定触摸事件
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    logger.info('interaction', '触摸控制已启用');
  }

  /**
   * 禁用触摸控制
   * 移除触摸事件监听器
   */
  function disableTouchControls(container: HTMLElement): void {
    currentRenderer = null;

    // 恢复 CSS 属性
    container.style.touchAction = '';
    container.style.userSelect = '';
    container.style.webkitUserSelect = '';

    // 移除触摸事件
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
    container.removeEventListener('touchcancel', handleTouchEnd);

    logger.info('interaction', '触摸控制已禁用');
  }

  /**
   * 获取播放按钮样式配置
   * 确保符合移动端标准（最小 44x44px 可点击区域）
   */
  function getPlayButtonStyles() {
    return {
      // 最小可点击区域 44x44px（符合移动端触摸标准）
      minWidth: '44px',
      minHeight: '44px',
      // 实际显示尺寸可以更大以提供更好的视觉效果
      width: '80px',
      height: '80px',
      // 居中定位
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      // 清晰的视觉样式
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '50%',
      border: '3px solid rgba(255, 255, 255, 0.9)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // 过渡动画
      transition: 'all 0.3s ease',
      // 确保在最上层
      zIndex: 1000,
      // 防止文本选择
      userSelect: 'none' as const,
      WebkitUserSelect: 'none' as const,
      // 触摸优化
      WebkitTapHighlightColor: 'transparent',
    };
  }

  /**
   * 获取播放按钮图标样式
   */
  function getPlayButtonIconStyles() {
    return {
      width: '0',
      height: '0',
      borderStyle: 'solid',
      borderWidth: '15px 0 15px 25px',
      borderColor: 'transparent transparent transparent rgba(255, 255, 255, 0.9)',
      marginLeft: '5px', // 视觉居中调整
    };
  }

  /**
   * 获取播放按钮悬停/点击样式
   */
  function getPlayButtonActiveStyles() {
    return {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      transform: 'translate(-50%, -50%) scale(1.1)',
      borderColor: 'rgba(255, 255, 255, 1)',
    };
  }

  return {
    // 状态
    showPlayButton: readonly(showPlayButton),
    playButtonClicked: readonly(playButtonClicked),
    isTouching: readonly(isTouching),

    // 方法
    displayPlayButton,
    hidePlayButton,
    handlePlayButtonClick,
    tryAutoplay,
    enableTouchControls,
    disableTouchControls,
    getPlayButtonStyles,
    getPlayButtonIconStyles,
    getPlayButtonActiveStyles,
  };
}
