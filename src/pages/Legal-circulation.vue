<template>
  <div 
    class="legal-circulation-container"
    @keydown="handleKeyDown"
  >
    <!-- Background Image Layer -->
    <img 
      src="/images/fawu/mobile/组 1.png" 
      alt=""
      class="background-image"
      aria-hidden="true"
    />
    <!-- Back Button -->
    <div class="back-button-container">
      <button 
        class="back-button"
        @click="handleBack"
        aria-label="返回背包页面"
      >
        <img 
          src="/images/fawu/mobile/图层 4.png" 
          alt="" 
          aria-hidden="true"
          draggable="false"
        />
      </button>
      <span class="back-text">返回</span>
    </div>
    <!-- Header Area -->
    <div class="header-area">
      <div class="title-container">
        <h1 class="page-title">法物流通</h1>
      </div>
      <img 
        src="/images/fawu/mobile/太极.png" 
        alt=""
        class="taiji-icon"
        aria-hidden="true"
        draggable="false"
      />
            <div class="tabs-container">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 0 }"
          @click="handleTabClick(0)"
        >
          <img 
            src="/images/fawu/mobile/price-bg.png" 
            alt=""
            class="tab-bg"
            aria-hidden="true"
          />
          <span class="tab-text-cn">香</span>
          <span class="tab-text-en">INCENSE</span>
          <img 
            src="/images/fawu/mobile/矩形 2.png" 
            alt=""
            class="tab-indicator"
            aria-hidden="true"
          />
        </div>
        <div 
          class="tab-item"
          :class="{ active: activeTab === 1 }"
          @click="handleTabClick(1)"
        >
          <img 
            src="/images/fawu/mobile/price-bg.png" 
            alt=""
            class="tab-bg"
            aria-hidden="true"
          />
          <span class="tab-text-cn">贡品</span>
          <span class="tab-text-en">TRIBUTE</span>
          <img 
            src="/images/fawu/mobile/矩形 2.png" 
            alt=""
            class="tab-indicator"
            aria-hidden="true"
          />
        </div>
        <div 
          class="tab-item"
          :class="{ active: activeTab === 2 }"
          @click="handleTabClick(2)"
        >
          <img 
            src="/images/fawu/mobile/price-bg.png" 
            alt=""
            class="tab-bg"
            aria-hidden="true"
          />
          <span class="tab-text-cn">其它</span>
          <span class="tab-text-en">OTHER ITEMS</span>
          <img 
            src="/images/fawu/mobile/矩形 2.png" 
            alt=""
            class="tab-indicator"
            aria-hidden="true"
          />
        </div>
      </div>
      <img 
        src="/images/fawu/mobile/椭圆 1 拷贝 3.png" 
        alt=""
        class="divider-line"
        aria-hidden="true"
        draggable="false"
      />

    </div>

    <!-- Content Scroll Area -->
    <div class="content-area">
      <div class="items-grid">
        <!-- Item Card 1 -->
        <div class="item-card">
          <img 
            src="/images/fawu/mobile/incense-1.png" 
            alt="平安香"
            class="card-image"
            draggable="false"
          />
          <div class="item-tooltip">平安香</div>
          <div class="price-box">
            <img 
              src="/images/fawu/mobile/incense-4.png" 
              alt=""
              class="price-box-bg"
              draggable="false"
              aria-hidden="true"
            />
            <span class="price-text">¥ 30</span>
          </div>
        </div>

        <!-- Item Card 2 -->
        <div class="item-card">
          <img 
            src="/images/fawu/mobile/incense-2.png" 
            alt="求财香"
            class="card-image"
            draggable="false"
          />
          <div class="item-tooltip">求财香</div>
          <div class="price-box">
            <img 
              src="/images/fawu/mobile/incense-4.png" 
              alt=""
              class="price-box-bg"
              draggable="false"
              aria-hidden="true"
            />
            <span class="price-text">¥ 30</span>
          </div>
        </div>

        <!-- Item Card 3 -->
        <div class="item-card">
          <img 
            src="/images/fawu/mobile/incense-3.png" 
            alt="富贵香"
            class="card-image"
            draggable="false"
          />
          <div class="item-tooltip">富贵香</div>
          <div class="price-box">
            <img 
              src="/images/fawu/mobile/incense-4.png" 
              alt=""
              class="price-box-bg"
              draggable="false"
              aria-hidden="true"
            />
            <span class="price-text">¥ 30</span>
          </div>
        </div>

        <!-- Item Card 4 -->
        <div class="item-card">
          <img 
            src="/images/fawu/mobile/incense-5.png" 
            alt="长生香"
            class="card-image"
            draggable="false"
          />
          <div class="item-tooltip">长生香</div>
          <div class="price-box">
            <img 
              src="/images/fawu/mobile/incense-4.png" 
              alt=""
              class="price-box-bg"
              draggable="false"
              aria-hidden="true"
            />
            <span class="price-text">¥ 30</span>
          </div>
        </div>

        <!-- Item Card 5 -->
        <div class="item-card">
          <img 
            src="/images/fawu/mobile/incense-6.png" 
            alt="姻缘香"
            class="card-image"
            draggable="false"
          />
          <div class="item-tooltip">姻缘香</div>
          <div class="price-box">
            <img 
              src="/images/fawu/mobile/incense-4.png" 
              alt=""
              class="price-box-bg"
              draggable="false"
              aria-hidden="true"
            />
            <span class="price-text">¥ 30</span>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, defineOptions } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Active tab state
const activeTab = ref<number>(0);

/**
 * Handle tab click
 * @param index - Tab index (0: 香, 1: 贡品, 2: 其它)
 */
const handleTabClick = (index: number): void => {
  activeTab.value = index;
};

/**
 * Handle back button click
 * Navigate back to backbag page
 */
const handleBack = (): void => {
  router.push('/backbag');
};

/**
 * Handle keyboard events
 */
const handleKeyDown = (event: KeyboardEvent): void => {
  // ESC key returns to backbag
  if (event.key === 'Escape') {
    handleBack();
  }
};
</script>

<style scoped>
/* Main Container - Full Screen Layout */
.legal-circulation-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  
  /* User Interaction Protection */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  touch-action: pan-y;
  
  /* Page Enter Animation */
  animation: slideIn 0.3s ease;
}

/* Background Image */
.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  z-index: 1;
  pointer-events: none;
}

/* Fallback background color if image fails to load */
.background-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #1a1a2e;
  z-index: -1;
}

/* Header Area */
.header-area {
  position: absolute;
  top: 8vh;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 10;
}

/* Title Container */
.title-container {
  display: inline-block;
  text-align: center;
  position: relative;
  z-index: 15;
}

/* Page Title */
.page-title {
  font-family: 'SimSun', '宋体', serif;
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 2px;
  background: linear-gradient(180deg, #FBE3C9FF 0%, #FFFFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 5px 0;
  padding: 0;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

/* Taiji Icon */
.taiji-icon {
  display: block;
  width: 500px !important;
  height: auto !important;
  margin: 0 auto;
  position: relative;
  top: -45px;
  pointer-events: none;
  object-fit: contain;
}

/* Divider Line */
.divider-line {
  display: block;
  width: 90%;
  max-width: 600px;
  height: auto;
  margin: 10px auto 0 !important;
  pointer-events: none;
  object-fit: contain;
}

/* Tabs Container */
.tabs-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 60px;
  margin-left: 25px;
  position: relative;
}

/* Tab Item */
.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: opacity 0.3s ease;
}

.tab-item:hover {
  opacity: 0.8;
}

/* Tab Chinese Text */
.tab-text-cn {
  font-family: 'SimSun', serif;
  font-size: 18px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: -5px;
  transition: color 0.3s ease;
  position: relative;
  z-index: 2;
}

/* Tab English Text */
.tab-text-en {
  font-family: Arial, sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
  transition: color 0.3s ease;
  position: relative;
  z-index: 2;
}

/* Tab Background */
.tab-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 180px;
  height: 60px;
  object-fit: cover;
  opacity: 0 !important;
  transition: opacity 0.5s ease;
  pointer-events: none;
  z-index: 1;
  border: none;
  outline: none;
  filter: blur(6px);
}

/* Tab Indicator */
.tab-indicator {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: auto;
  opacity: 0 !important;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 3;
}

/* Active Tab */
.tab-item.active .tab-bg {
  opacity: 1 !important;
}

.tab-item.active .tab-indicator {
  opacity: 0.5 !important;
  filter: blur(3px);
}

.tab-item.active .tab-text-cn {
  color: rgba(255, 255, 255, 1);
}

.tab-item.active .tab-text-en {
  color: rgba(255, 255, 255, 1);
}

/* Content Scroll Area */
.content-area {
  position: absolute;
  top: 30vh !important;
  bottom: 12vh;
  left: 0;
  right: 0;
  padding: 0 10px;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  z-index: 5;
}

/* Items Grid Container */
.items-grid {
  display: grid;
  grid-template-columns: repeat(3, 110px);
  gap: 15px;
  justify-content: center;
  justify-items: center;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Item Card */
.item-card {
  position: relative;
  width: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
  transition: transform 0.3s ease;
}

.item-card:hover {
  transform: translateY(-5px);
}

/* Card Main Image */
.card-image {
  width: 110px;
  height: 110px;
  object-fit: contain;
  display: block;
  pointer-events: none;
  margin-bottom: 0;
}

/* Item Tooltip */
.item-tooltip {
  position: absolute;
  top: 75px;
  left: 0;
  width: 110px;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  padding: 3px 0;
  text-align: center;
  font-size: 14px;
  font-family: 'SimSun', serif;
  pointer-events: none;
  z-index: 10;
}

/* Price Box Container */
.price-box {
  position: relative;
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -3px;
}

/* Price Box Background (incense-4.png) */
.price-box-bg {
  position: absolute;
  width: 100%;
  height: auto;
  max-width: 110px;
  max-height: none;
  object-fit: none;
  pointer-events: none;
  z-index: 1;
  border-radius: 0 0 8px 8px;
}

/* Price Text */
.price-text {
  position: relative;
  z-index: 2;
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #3d2817;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
  padding: 5px 0;
}

/* Back Button Container */
.back-button-container {
  position: absolute;
  left: 30px;
  top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 20;
}

/* Back Button */
.back-button {
  width: 60px;
  height: 60px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-drag: none;
  -webkit-user-drag: none;
}

.back-button:hover {
  opacity: 0.8;
}

.back-button:active {
  opacity: 0.6;
  transform: scale(0.95);
}

/* Back Text */
.back-text {
  font-family: 'SimSun', '宋体', serif;
  font-size: 28px;
  color: rgba(255, 255, 255, 0.9);
  margin-top: -10px;
  text-align: center;
  pointer-events: none;
}

/* Page Enter Animation */
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

/* Responsive Design - iPhone 12/13/14 (390px width) */
@media (max-width: 430px) {
  .header-area {
    top: 6vh;
  }

  .page-title {
    font-size: 28px;
    letter-spacing: -2.5px;
  }

  .taiji-icon {
    width: 80px;
    height: 80px;
    margin: -5px auto 0;
  }

  .divider-line {
    margin: 10px auto 0 !important;
  }

  .tabs-container {
    margin-top: -35px !important;
  }

  .tab-indicator {
    bottom: -8px !important;
  }

  .content-area {
    top: 22vh !important;
    bottom: 10vh;
    padding: 0 15px;
  }

  .items-grid {
    grid-template-columns: repeat(3, 110px);
    gap: 10px;
    padding: 10px;
  }

  .item-card {
    width: 110px;
  }

  .card-image {
    width: 110px;
    height: 110px;
    margin-bottom: 0;
  }

  .price-box {
    width: 110px;
    margin-top: -3px;
  }

  .price-text {
    font-size: 12px;
    padding: 5px 0;
  }

  .back-button-container {
    left: 20px;
    top: 20px;
  }

  .back-button {
    width: 50px;
    height: 50px;
  }

  .back-text {
    font-size: 24px;
  }
}

/* Responsive Design - Mobile (≤ 768px) */
@media (max-width: 768px) {
  .header-area {
    top: 6vh;
  }

  .page-title {
    font-size: 28px;
    letter-spacing: -2.5px;
  }

  .taiji-icon {
    width: 80px;
    height: 80px;
    margin: -5px auto 0;
  }

  .divider-line {
    margin: 5px auto 0 !important;
  }

  .tabs-container {
    margin-bottom: 1px !important;
  }

  .tab-indicator {
    bottom: -8px !important;
  }

  .content-area {
    top: 22vh !important;
    bottom: 10vh;
    padding: 0 15px;
  }

  .items-grid {
    grid-template-columns: repeat(3, 110px);
    gap: 10px;
    padding: 10px;
  }

  .item-card {
    width: 110px;
  }

  .card-image {
    width: 110px;
    height: 110px;
    margin-bottom: 0;
  }

  .price-box {
    width: 110px;
    margin-top: -3px;
  }

  .price-text {
    font-size: 12px;
    padding: 5px 0;
  }

  .back-button-container {
    left: 20px;
    top: 20px;
  }

  .back-button {
    width: 50px;
    height: 50px;
  }

  .back-text {
    font-size: 24px;
  }
}

/* Responsive Design - Tablet (768px - 1199px) */
@media (min-width: 768px) and (max-width: 1199px) {
  .header-area {
    top: 8vh;
  }

  .page-title {
    font-size: 30px;
    letter-spacing: -2px;
  }

  .taiji-icon {
    width: 100px;
    height: 100px;
    margin: -8px auto 0;
  }

  .divider-line {
    margin: 30px auto 0;
  }

  .tabs-container {
    margin-top: -20px;
  }

  .tab-indicator {
    bottom: -18px;
  }

  .content-area {
    top: 26vh;
    bottom: 12vh;
    padding: 0 30px;
  }

  .items-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    padding: 18px;
  }

  .item-card {
    width: 110px;
  }

  .card-image {
    width: 110px;
    height: 110px;
    margin-bottom: 0;
  }

  .price-box {
    width: 110px;
    margin-top: -3px;
  }

  .price-text {
    font-size: 12px;
    padding: 5px 0;
  }

  .back-button-container {
    left: 25px;
    top: 25px;
  }

  .back-button {
    width: 70px;
    height: 70px;
  }

  .back-text {
    font-size: 26px;
  }
}

/* Responsive Design - Desktop (≥ 1200px) */
@media (min-width: 1200px) {
  .header-area {
    top: 10vh;
  }

  .page-title {
    font-size: 36px;
    letter-spacing: -2px;
  }

  .divider-line {
    margin: 30px auto 0;
  }

  .tabs-container {
    margin-top: -30px;
  }

  .tab-indicator {
    bottom: -18px;
  }

  .content-area {
    top: 36vh;
    bottom: 12vh;
    padding: 0 40px;
  }

  .items-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 20px;
  }

  .back-button-container {
    left: 30px;
    top: 30px;
  }

  .back-button {
    width: 80px;
    height: 80px;
  }

  .back-text {
    font-size: 28px;
  }
}

/* Responsive Design - Landscape Mode (height ≤ 600px) */
@media (orientation: landscape) and (max-height: 600px) {
  .header-area {
    top: 5vh;
  }

  .page-title {
    font-size: 36px;
    letter-spacing: -2px;
  }

  .taiji-icon {
    width: 60px;
    height: 60px;
    margin: -5px auto 0;
  }

  .divider-line {
    margin: 30px auto 0;
  }

  .tabs-container {
    margin-top: -10px;
  }

  .tab-indicator {
    bottom: -28px;
  }

  .content-area {
    top: 26vh;
    bottom: 15vh;
  }

  .items-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 12px;
  }

  .item-card {
    width: 110px;
  }

  .card-image {
    width: 110px;
    height: 110px;
    margin-bottom: 0;
  }

  .price-box {
    width: 110px;
    margin-top: -3px;
  }

  .price-text {
    font-size: 12px;
    padding: 5px 0;
  }
}
</style>
// 显式命名组件以支持 KeepAlive 精确缓存
defineOptions({ name: 'LegalCirculation' });
