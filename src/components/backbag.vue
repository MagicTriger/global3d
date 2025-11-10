<template>
  <div class="backbag-overlay" @click="handleOverlayClick">
    <div class="backbag-container" @click.stop>
      <!-- 顶部标题区域 -->
      <div class="header-area">
        <!-- 背包标题 - 八卦图标和文字 -->
        <img 
          src="/images/backbag/组 1(3).png" 
          alt="背包标题" 
          class="backbag-header"
        >
        </img>
        
        <!-- 法物流通按钮 - 叠加在标题右侧 -->
        <div class="trade-button-wrapper">
          <img 
            src="/images/backbag/组 1(2).png" 
            alt="法物流通" 
            class="trade-button"
          />
          <span class="trade-button-text">法物流通></span>
        </div>
      </div>
      
      
      
      <!-- 背包内容区域 -->
      <div class="backbag-content">
        <!-- 背包物品网格 - 4列5行 -->
        <div class="backbag-grid">
          <div v-for="index in 20" :key="index" class="grid-slot">
            <!-- 物品插槽 -->
          </div>
        </div>
      </div>
      
      <!-- 底部对齐容器 - 确保底部装饰和香图标顶部对齐 -->
      <div class="bottom-aligned-container">
        <!-- 底部装饰图片 -->
        <img 
          src="/images/backbag/底.png" 
          alt="底部装饰" 
          class="bottom-decoration"
        />
        
        <!-- 香图标 - 右下角 -->
        <img 
          src="/images/backbag/生成游戏图标 (7).png" 
          alt="香" 
          class="incense-icon"
        />
      </div>
      
      <!-- 底部左侧控制区域 - 图层5副本2 + 返回按钮组 -->
      <div class="bottom-left-controls">
        <!-- 图层5副本2 -->
        <img 
          src="/images/backbag/图层 5 副本 2.png" 
          alt="图层5装饰" 
          class="layer5-decoration"
        />
        
        <!-- 返回按钮组 - 图层2 + 文字 -->
        <div class="back-button-group" @click="$emit('close')">
          <img 
            src="/images/backbag/图层 2.png" 
            alt="返回按钮" 
            class="back-button-icon"
          />
          <span class="back-button-text">返回</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义事件
defineEmits<{
  close: []
}>();

// 点击遮罩层关闭
const handleOverlayClick = () => {
  // 可以选择是否允许点击遮罩层关闭
  // emit('close');
};

</script>

<style scoped>
/* 遮罩层 */
.backbag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 背包容器 */
.backbag-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-image: url('/images/backbag/底图.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 顶部标题区域容器 */
.header-area {
  position: absolute;
  top: 20vh;
  left: 45%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 500px;
  z-index: 6;
  position: relative; /* 为子元素提供定位上下文 */
}

/* 背包标题 - 八卦图标和文字 */
.backbag-header {
    transform: translateY(50%);
  width: 100%;
  height: auto;
  object-fit: contain;
  pointer-events: none;
  display: block;
}

/* 法物流通按钮容器 - 叠加在标题右侧 */
.trade-button-wrapper {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-30%) scale(0.5);
  cursor: pointer;
  transition: opacity 0.3s;
  pointer-events: auto;
  transform-origin: right center;
}

.trade-button-wrapper:hover {
  opacity: 0.8;
}

.trade-button-wrapper:active {
  opacity: 0.6;
}

/* 法物流通按钮图片 */
.trade-button {
  width: auto;
  height: auto;
  display: block;
  position: relative;
}

/* 法物流通文字 - 叠加在按钮图片上 */
.trade-button-text {
  position: absolute;
  left: 67%;
  top: 55%;
  transform: translate(-50%, -50%);
  color: #000;
  font-size: 36px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  letter-spacing: 2px;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.close-btn:active {
  transform: scale(0.95);
}

/* 背包内容 */
.backbag-content {
  padding: 120px 40px 30vh; /* 增加底部padding避免被底部元素遮挡 */
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 背包物品网格 - 4列5行 */
.backbag-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 15px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

/* 网格插槽 */
.grid-slot {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0; /* 去除圆角 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.grid-slot:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

/* 底部对齐容器 - 统一管理底部装饰和香图标，确保顶部对齐 */
.bottom-aligned-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 25vh;
  display: flex;
  align-items: flex-end;
  pointer-events: none;
  z-index: 5;
}

/* 底部装饰图片 - 铺满到底部，响应式适配 */
.bottom-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: bottom;
  pointer-events: none;
}

/* 底部左侧控制区域 - 整体容器 */
.bottom-left-controls {
  position: absolute;
  left: 5.9%;
  bottom: 7.58%;
  width: 150px;
  height: 150px;
  z-index: 6;
  transform: scale(0.5);
  transform-origin: bottom left;
}

/* 图层5装饰图片 - 黑圈背景，也缩小一倍 */
.layer5-decoration {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%) scale(0.9);
  width: 150px;
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

/* 返回按钮组 - 箭头和文字 */
.back-button-group {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  cursor: pointer;
  transition: opacity 0.3s;
  padding-top: 30px;
}

.back-button-group:hover {
  opacity: 0.8;
}

.back-button-group:active {
  opacity: 0.6;
}

/* 箭头图标 - 在黑圈中心，稍微大一点 */
.back-button-icon {
  width: 70px;
  height: 70px;
  object-fit: contain;
  margin-bottom: -15px;
}

/* 返回文字 - 紧贴箭头下方 */
.back-button-text {
  color: #fff;
  font-size: 28px;
  font-weight: 500;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  letter-spacing: 2px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-area {
    top: 1.5vh;
    width: 85%;
    max-width: 400px;
  }
  
  .backbag-content {
    padding: 100px 20px 25vh; /* 增加底部padding避免被遮挡 */
  }
  
  .backbag-grid {
    max-width: 90%;
    gap: 25px;
    padding: 20px;
  }
  
  .grid-slot {
    border-width: 1.5px;
  }
  
  .close-btn {
    top: 15px;
    right: 15px;
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
  
  /* 移动端底部对齐容器 */
  .bottom-aligned-container {
    height: 20vh;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .header-area {
    width: 90%;
    max-width: 350px;
  }
  
  .backbag-content {
    padding: 90px 15px 22vh; /* 增加底部padding避免被遮挡 */
  }
  
  .backbag-grid {
    max-width: 95%;
    gap: 15px;
    padding: 10px;
  }
  
  .grid-slot {
    border-width: 1px;
  }

  .bottom-aligned-container {
    height: 18vh;
  }
}/* 横屏适配 */
@media (orientation: landscape) and (max-height: 600px) {
  .header-area {
    top: 1vh;
    max-width: 450px;
  }
  
  .backbag-content {
    padding: 80px 30px 35vh; /* 增加底部padding避免被遮挡 */
  }
  
  .bottom-aligned-container {
    height: 30vh;
  }
}

/* 大屏幕适配 */
@media (min-width: 1200px) {
  .header-area {
    top: 3vh;
    max-width: 550px;
  }
  
  .backbag-content {
    padding: 140px 50px 25vh; /* 增加底部padding避免被遮挡 */
  }
  
  .backbag-grid {
    max-width: 700px;
    gap: 30px;
    padding: 25px;
  }
  
  .grid-slot {
    border-width: 2.5px;
  }
  
  .bottom-aligned-container {
    height: 22vh;
  }
  
  /* 大屏幕时返回容器位置调整 */
  .bottom-left-controls {
    bottom: 12vh;
  }
}

/* 平板适配 (iPad等) */
@media (min-width: 768px) and (max-width: 1199px) {
  .header-area {
    top: 2.5vh;
    max-width: 480px;
  }
  
  .backbag-content {
    padding: 110px 35px 28vh; /* 增加底部padding避免被遮挡 */
  }
  
  .backbag-grid {
    max-width: 550px;
    gap: 25px;
    padding: 20px;
  }
  
  .grid-slot {
    border-width: 2px;
  }
  
  .bottom-aligned-container {
    height: 25vh;
  }
  
  .bottom-left-controls {
    bottom: 18vh;
  }
}

/* 香图标 - 在容器内，右下角，与底部装饰图片顶部对齐 */
.incense-icon {
  position: absolute;
  right: 7.44%;
  top: 0; /* 从容器顶部开始 */
  bottom: 0; /* 到容器底部 */
  width: auto;
  max-width: 20%;
  object-fit: contain;
  object-position: center; /* 居中对齐，让图片填满整个高度 */
  cursor: pointer;
  transition: opacity 0.3s, transform 0.3s;
  pointer-events: auto;
}

.incense-icon:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.incense-icon:active {
  opacity: 0.6;
  transform: scale(0.95);
}
  
</style>