<!--
  背包页面 (Backbag Page)
  
  功能说明：
  - 全屏页面展示玩家背包界面
  - 显示4列5行共20个物品插槽
  - 包含法物流通按钮、香图标和返回按钮
  - 支持响应式布局，适配移动端、平板和桌面端
  
  使用方式：
  通过路由访问 /backbag
-->
<template>
  <!-- 背包主容器：全屏显示 -->
  <div class="backbag-container">
    <!-- 顶部标题区域：包含背包标题和法物流通按钮 -->
    <div class="header-area">
      <!-- 背包标题图片：八卦图标和文字组合 -->
      <img src="/images/backbag/组 1(3).png" alt="背包标题" class="backbag-header" />

      <!-- 法物流通按钮：叠加在标题右侧，点击可进入交易界面 -->
      <div class="trade-button-wrapper">
        <img src="/images/backbag/组 1(2).png" alt="法物流通" class="trade-button" />
        <span class="trade-button-text">法物流通></span>
      </div>
    </div>

    <!-- 背包内容区域：可滚动的物品展示区 -->
    <div class="backbag-content">
      <!-- 背包物品网格：4列5行布局，共20个插槽 -->
      <div class="backbag-grid">
        <!-- 循环生成20个物品插槽 -->
        <div v-for="index in 20" :key="index" class="grid-slot">
          <!-- 物品插槽：用于放置物品图标和信息 -->
        </div>
      </div>
    </div>

    <!-- 底部对齐容器：统一管理底部装饰和标签页 -->
    <div class="bottom-aligned-container">
      <!-- 底部装饰图片：背景装饰，铺满底部 -->
      <img src="/images/backbag/底.png" alt="底部装饰" class="bottom-decoration" />

      <!-- 标签页区域：其他、贡品、香三个分类标签 -->
      <div class="tabs-area">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <!-- 金色选中指示器：仅在选中时显示 -->
          <img
            v-if="activeTab === tab.id"
            src="/images/backbag/生成游戏图标 (7).png"
            alt="选中指示器"
            class="tab-indicator"
          />
          <!-- 标签文字 -->
          <span class="tab-text">{{ tab.label }}</span>
          <span class="tab-text-en">{{ tab.labelEn }}</span>
        </div>
      </div>
    </div>

    <!-- 底部左侧控制区域：包含装饰背景和返回按钮 -->
    <div class="bottom-left-controls">
      <!-- 图层5装饰：黑色圆形背景装饰 -->
      <img src="/images/backbag/图层 5 副本 2.png" alt="图层5装饰" class="layer5-decoration" />

      <!-- 返回按钮组：箭头图标和文字，点击返回上一页 -->
      <div class="back-button-group" @click="handleBack">
        <img src="/images/backbag/图层 2.png" alt="返回按钮" class="back-button-icon" />
        <span class="back-button-text">返回</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

/**
 * 背包页面脚本
 *
 * 功能：
 * - 管理标签页切换状态
 * - 处理返回导航
 */

/**
 * 路由实例
 */
const router = useRouter();

/**
 * 标签页配置
 */
const tabs = [
  { id: 'other', label: '其他', labelEn: 'OTHER ITEMS' },
  { id: 'tribute', label: '贡品', labelEn: 'TRIBUTE' },
  { id: 'incense', label: '香', labelEn: 'INCENSE' },
];

/**
 * 当前激活的标签页
 */
const activeTab = ref<string>('incense');

/**
 * 处理返回按钮点击事件
 * 直接导航到首页，避免重新触发加载流程
 */
const handleBack = () => {
  router.push('/');
};
</script>

<style scoped>

/* ========== 主容器 ========== */

/* 背包主容器：全屏显示，带背景图和滑入动画 */
.backbag-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-image: url('/images/backbag/底图.png'); /* 背景底图 */
  background-size: cover; /* 覆盖整个容器 */
  background-repeat: no-repeat;
  background-position: center;
  animation: slideIn 0.3s ease; /* 滑入动画 */
}

/* 滑入动画：从上方滑入并淡入 */
@keyframes slideIn {
  from {
    transform: translateY(-50px); /* 从上方50px处开始 */
    opacity: 0;
  }
  to {
    transform: translateY(0); /* 滑到正常位置 */
    opacity: 1;
  }
}

/* ========== 顶部标题区域 ========== */

/* 顶部标题区域容器：包含背包标题和法物流通按钮 */
.header-area {
  position: absolute;
  top: 20vh; /* 距离顶部20%视口高度 */
  left: 45%; /* 水平居中偏左 */
  transform: translateX(-50%); /* 精确居中 */
  width: 90%;
  max-width: 500px;
  z-index: 6; /* 确保在内容之上 */
  position: relative; /* 为子元素提供定位上下文 */
}

/* 背包标题图片：八卦图标和文字组合 */
.backbag-header {
  transform: translateY(50%); /* 向下偏移50% */
  width: 100%;
  height: auto;
  object-fit: contain; /* 保持图片比例 */
  pointer-events: none; /* 不响应鼠标事件 */
  display: block;
}

/* 法物流通按钮容器：叠加在标题右侧 */
.trade-button-wrapper {
  position: absolute;
  right: 0; /* 靠右对齐 */
  top: 50%; /* 垂直居中 */
  transform: translateY(-30%) scale(0.5); /* 向上偏移并缩小到50% */
  cursor: pointer; /* 鼠标悬停显示手型 */
  transition: opacity 0.3s; /* 透明度过渡动画 */
  pointer-events: auto; /* 响应鼠标事件 */
  transform-origin: right center; /* 缩放原点在右侧中心 */
}

/* 法物流通按钮悬停效果 */
.trade-button-wrapper:hover {
  opacity: 0.8; /* 悬停时降低透明度 */
}

/* 法物流通按钮点击效果 */
.trade-button-wrapper:active {
  opacity: 0.6; /* 点击时进一步降低透明度 */
}

/* 法物流通按钮图片 */
.trade-button {
  width: auto;
  height: auto;
  display: block;
  position: relative;
}

/* 法物流通文字：叠加在按钮图片上 */
.trade-button-text {
  position: absolute;
  left: 67%; /* 水平位置 */
  top: 55%; /* 垂直位置 */
  transform: translate(-50%, -50%); /* 精确居中 */
  color: #000; /* 黑色文字 */
  font-size: 36px;
  font-weight: 500;
  white-space: nowrap; /* 不换行 */
  pointer-events: none; /* 不响应鼠标事件，点击穿透到父元素 */
  letter-spacing: 2px; /* 字间距 */
}

/* ========== 标签页区域 ========== */

/* 标签页容器：水平排列三个标签，位于紫色背景区域内 */
.tabs-area {
  position: absolute;
  top: 0; /* 顶部对齐紫色背景 */
  left: 50%;
  transform: translateX(calc(-50% + 50px)); /* 向右偏移40px */
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 顶部对齐 */
  z-index: 7; /* 在底部装饰之上 */
  pointer-events: auto; /* 允许点击 */
  padding-top: 0; /* 无顶部内边距 */
}

/* 单个标签项 */
.tab-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.3s;
  padding: 30px 20px 10px; /* 增加顶部padding使文字在指示器内合适位置 */
}

/* 标签悬停效果 */
.tab-item:hover {
  opacity: 0.8;
}

/* 金色选中指示器：显示在标签后方作为背景，顶部对齐 */
.tab-indicator {
  position: absolute;
  top: 0; /* 顶部对齐 */
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  height: auto;
  object-fit: contain;
  pointer-events: none;
  z-index: 0;
}

/* 标签中文文字 */
.tab-text {
  color: rgba(255, 255, 255, 0.6); /* 未选中时半透明 */
  font-size: 18px; /* 缩小字体 */
  font-weight: 500;
  letter-spacing: 1px; /* 减少字间距 */
  transition: color 0.3s;
  position: relative;
  z-index: 2;
}

/* 标签英文文字 */
.tab-text-en {
  color: rgba(255, 255, 255, 0.4); /* 英文更透明 */
  font-size: 11px; /* 缩小字体 */
  font-weight: 400;
  letter-spacing: 0.5px; /* 减少字间距 */
  margin-top: 2px; /* 减少上边距 */
  transition: color 0.3s;
  position: relative;
  z-index: 2;
  white-space: nowrap; /* 不换行 */
}

/* 选中状态的标签文字 */
.tab-item.active .tab-text {
  color: #fff; /* 选中时完全不透明 */
}

.tab-item.active .tab-text-en {
  color: rgba(255, 255, 255, 0.7); /* 选中时英文也更亮 */
}

/* ========== 背包内容区域 ========== */

/* 背包内容容器：可滚动的物品展示区 */
.backbag-content {
  padding: 180px 40px 30vh; /* 增加顶部padding为标签页留出空间 */
  height: 100%; /* 占满父容器高度 */
  overflow-y: auto; /* 垂直方向可滚动 */
  overflow-x: hidden; /* 水平方向隐藏溢出 */
}

/* 背包物品网格：4列5行布局 */
.backbag-grid {
  display: grid; /* 使用网格布局 */
  grid-template-columns: repeat(4, 1fr); /* 4列，每列等宽 */
  grid-template-rows: repeat(5, 1fr); /* 5行，每行等高 */
  gap: 15px; /* 网格间距15px */
  width: 100%;
  max-width: 600px; /* 最大宽度600px */
  margin: 0 auto; /* 水平居中 */
  padding: 20px;
}

/* 网格插槽：单个物品格子 */
.grid-slot {
  aspect-ratio: 1; /* 保持1:1宽高比，形成正方形 */
  background: rgba(255, 255, 255, 0.1); /* 半透明白色背景 */
  border: 2px solid rgba(255, 255, 255, 0.3); /* 半透明白色边框 */
  border-radius: 0; /* 无圆角，保持方形 */
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  cursor: pointer; /* 鼠标悬停显示手型 */
  transition: all 0.3s; /* 所有属性变化都有0.3s过渡动画 */
  position: relative; /* 为子元素提供定位上下文 */
}

/* 网格插槽悬停效果：高亮显示 */
.grid-slot:hover {
  background: rgba(255, 255, 255, 0.15); /* 背景变亮 */
  border-color: rgba(255, 255, 255, 0.5); /* 边框变亮 */
  transform: scale(1.05); /* 放大5% */
}

/* ========== 底部区域 ========== */

/* 底部对齐容器：统一管理底部装饰和香图标 */
.bottom-aligned-container {
  position: absolute;
  bottom: 0; /* 贴底对齐 */
  left: 0;
  width: 100%; /* 占满宽度 */
  height: 25vh; /* 高度为视口高度的25% */
  display: flex;
  align-items: flex-end; /* 子元素底部对齐 */
  pointer-events: none; /* 容器本身不响应鼠标事件 */
  z-index: 5; /* 在内容之上 */
}

/* 底部装饰图片：背景装饰，铺满底部 */
.bottom-decoration {
  position: absolute;
  bottom: 0; /* 贴底对齐 */
  left: 0;
  width: 100%; /* 占满宽度 */
  height: 100%; /* 占满容器高度 */
  object-fit: cover; /* 覆盖整个区域，可能裁剪 */
  object-position: bottom; /* 从底部开始显示 */
  pointer-events: none; /* 不响应鼠标事件 */
}

/* 底部左侧控制区域：包含装饰背景和返回按钮 */
.bottom-left-controls {
  position: absolute;
  left: 5.9%; /* 距离左侧5.9% */
  bottom: 7.58%; /* 距离底部7.58% */
  width: 150px;
  height: 150px;
  z-index: 6; /* 在底部装饰之上 */
  transform: scale(0.5); /* 缩小到50% */
  transform-origin: bottom left; /* 缩放原点在左下角 */
}

/* 图层5装饰图片：黑色圆形背景 */
.layer5-decoration {
  position: absolute;
  left: 50%; /* 水平居中 */
  top: 0;
  transform: translateX(-50%) scale(0.9); /* 居中并缩小到90% */
  width: 150px;
  height: auto;
  object-fit: contain; /* 保持图片比例 */
  pointer-events: none; /* 不响应鼠标事件 */
}

/* 返回按钮组：箭头图标和文字的组合 */
.back-button-group {
  position: absolute;
  left: 50%; /* 水平居中 */
  top: 0;
  transform: translateX(-50%); /* 精确居中 */
  display: flex;
  flex-direction: column; /* 垂直排列 */
  align-items: center; /* 子元素水平居中 */
  gap: 0; /* 无间距 */
  cursor: pointer; /* 鼠标悬停显示手型 */
  transition: opacity 0.3s; /* 透明度过渡动画 */
  padding-top: 30px; /* 顶部内边距 */
}

/* 返回按钮悬停效果 */
.back-button-group:hover {
  opacity: 0.8; /* 悬停时降低透明度 */
}

/* 返回按钮点击效果 */
.back-button-group:active {
  opacity: 0.6; /* 点击时进一步降低透明度 */
}

/* 返回按钮箭头图标：在黑圈中心 */
.back-button-icon {
  width: 70px;
  height: 70px;
  object-fit: contain; /* 保持图片比例 */
  margin-bottom: -15px; /* 负边距，使文字更靠近箭头 */
}

/* 返回按钮文字：紧贴箭头下方 */
.back-button-text {
  color: #fff; /* 白色文字 */
  font-size: 28px;
  font-weight: 500;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5); /* 文字阴影，增强可读性 */
  white-space: nowrap; /* 不换行 */
  letter-spacing: 2px; /* 字间距 */
}

/* ========== 响应式适配 ========== */

/* 移动端适配：屏幕宽度 ≤ 768px */
@media (max-width: 768px) {
  .header-area {
    top: 1.5vh; /* 标题位置更靠上 */
    width: 85%;
    max-width: 400px;
  }

  .tabs-area {
    gap: 10px; /* 移动端减少标签间距 */
  }

  .tab-text {
    font-size: 16px; /* 移动端文字稍小 */
  }

  .tab-text-en {
    font-size: 12px;
  }

  .tab-indicator {
    width: 120px; /* 移动端指示器稍小 */
  }

  .backbag-content {
    padding: 140px 20px 25vh; /* 为标签页留出空间 */
  }

  .backbag-grid {
    max-width: 90%; /* 网格占更多宽度 */
    gap: 25px; /* 增加间距以便触摸操作 */
    padding: 20px;
  }

  .grid-slot {
    border-width: 1.5px; /* 更细的边框 */
  }

  .bottom-aligned-container {
    height: 20vh; /* 底部区域高度调整 */
  }
}

/* 超小屏幕适配：屏幕宽度 ≤ 480px */
@media (max-width: 480px) {
  .header-area {
    width: 90%; /* 标题占更多宽度 */
    max-width: 350px;
  }

  .tabs-area {
    gap: 1px; /* 超小屏进一步减少间距 */
  }

  .tab-text {
    font-size: 18px;
  }

  .tab-text-en {
    font-size: 11px;
  }

  .tab-indicator {
    width: 100px;
  }

  .backbag-content {
    padding: 130px 15px 22vh; /* 为标签页留出空间 */
  }

  .backbag-grid {
    max-width: 95%; /* 网格几乎占满宽度 */
    gap: 15px; /* 减少间距以显示更多内容 */
    padding: 10px;
  }

  .grid-slot {
    border-width: 1px; /* 最细的边框 */
  }

  .bottom-aligned-container {
    height: 18vh; /* 底部区域高度进一步调整 */
  }
}

/* 横屏适配：横屏且高度 ≤ 600px */
@media (orientation: landscape) and (max-height: 600px) {
  .header-area {
    top: 1vh; /* 标题位置更靠上以节省垂直空间 */
    max-width: 450px;
  }

  .backbag-content {
    padding: 120px 30px 35vh; /* 调整内边距以适应横屏 */
  }

  .bottom-aligned-container {
    height: 30vh; /* 横屏时底部区域占更多高度 */
  }
}

/* 大屏幕适配：屏幕宽度 ≥ 1200px */
@media (min-width: 1200px) {
  .header-area {
    top: 3vh; /* 标题位置更靠下 */
    max-width: 550px;
  }

  .tabs-area {
    gap: 40px; /* 大屏幕增加间距 */
  }

  .tab-text {
    font-size: 26px;
  }

  .tab-text-en {
    font-size: 15px;
  }

  .tab-indicator {
    width: 160px;
  }

  .backbag-content {
    padding: 200px 50px 25vh; /* 增加内边距以利用大屏空间 */
  }

  .backbag-grid {
    max-width: 700px; /* 网格最大宽度增加 */
    gap: 30px; /* 增加间距 */
    padding: 25px;
  }

  .grid-slot {
    border-width: 2.5px; /* 更粗的边框 */
  }

  .bottom-aligned-container {
    height: 22vh; /* 底部区域高度调整 */
  }

  .bottom-left-controls {
    bottom: 12vh; /* 返回按钮位置调整 */
  }
}

/* 平板适配：屏幕宽度 768px - 1199px (iPad等) */
@media (min-width: 768px) and (max-width: 1199px) {
  .header-area {
    top: 2.5vh; /* 标题位置适中 */
    max-width: 480px;
  }

  .tabs-area {
    gap: 30px; /* 平板适中间距 */
  }

  .tab-text {
    font-size: 22px;
  }

  .tab-text-en {
    font-size: 13px;
  }

  .tab-indicator {
    width: 140px;
  }

  .backbag-content {
    padding: 160px 35px 28vh; /* 适中的内边距 */
  }

  .backbag-grid {
    max-width: 550px;
    gap: 25px;
    padding: 20px;
  }

  .grid-slot {
    border-width: 2px; /* 标准边框宽度 */
  }

  .bottom-aligned-container {
    height: 25vh; /* 底部区域高度适中 */
  }

  .bottom-left-controls {
    bottom: 18vh; /* 返回按钮位置调整 */
  }
}
</style>
