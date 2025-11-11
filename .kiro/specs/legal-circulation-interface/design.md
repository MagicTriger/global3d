# 法务流通界面设计文档

## 概述

法务流通界面是一个全屏展示页面，用于展示和管理游戏中的法物交易功能。该界面采用与背包页面一致的设计风格，使用特定的背景图片和装饰元素，提供流畅的用户体验和响应式布局。

## 架构

### 组件层次结构

```
LegalCirculation.vue (法务流通页面)
├── 主容器 (legal-circulation-container)
│   ├── 背景图片层 (background-image)
│   ├── 顶部标题区域 (header-area)
│   │   └── 标题文字 (page-title)
│   ├── 内容滚动区域 (content-area)
│   │   └── 商品列表 (items-list)
│   │       └── 商品卡片 (item-card) × N
│   │           ├── 顶部装饰 (incense-1.png)
│   │           ├── 中部内容区 (incense-2.png)
│   │           │   ├── 商品图标
│   │           │   ├── 商品名称
│   │           │   └── 价格框 (incense-4.png)
│   │           │       └── 价格文字
│   │           └── 底部装饰 (incense-3.png)
│   └── 返回按钮 (back-button)
│       └── 返回图标 (图层 4.png)
```

### 技术栈

- **框架**: Vue 3 (Composition API)
- **路由**: Vue Router
- **样式**: Scoped CSS with responsive design
- **TypeScript**: 类型安全的组件开发

## 组件和接口

### 主组件：LegalCirculation.vue

#### Props
无（页面级组件，不接收 props）

#### 响应式状态

```typescript
interface ItemData {
  id: string;           // 商品唯一标识
  name: string;         // 商品名称
  price: number;        // 商品价格
  icon: string;         // 商品图标路径
  description?: string; // 商品描述（可选）
}

// 组件内部状态
const items = ref<ItemData[]>([]);  // 商品列表
const loading = ref<boolean>(true); // 加载状态
const error = ref<string>('');      // 错误信息
```

#### 方法

```typescript
/**
 * 处理返回按钮点击
 * 导航回背包页面
 */
const handleBack = (): void => {
  router.push('/backbag');
};

/**
 * 加载商品数据
 * 从 API 或本地数据源获取商品列表
 */
const loadItems = async (): Promise<void> => {
  // 实现数据加载逻辑
};

/**
 * 处理商品卡片点击
 * @param item - 被点击的商品数据
 */
const handleItemClick = (item: ItemData): void => {
  // 实现商品详情或购买逻辑
};
```

## 数据模型

### ItemData 接口

```typescript
/**
 * 法物商品数据模型
 */
interface ItemData {
  /** 商品唯一标识符 */
  id: string;
  
  /** 商品名称 */
  name: string;
  
  /** 商品价格（游戏货币） */
  price: number;
  
  /** 商品图标路径 */
  icon: string;
  
  /** 商品描述（可选） */
  description?: string;
  
  /** 商品类型（如：香、贡品等） */
  type?: string;
  
  /** 是否可购买 */
  available?: boolean;
}
```

## 视觉设计

### 布局结构

#### 1. 主容器
- **定位**: `position: fixed`
- **尺寸**: `100vw × 100vh`（全屏）
- **背景**: `/images/fawu/mobile/组 1.png`
  - `background-size: cover`
  - `background-position: center`
  - `background-repeat: no-repeat`
- **动画**: 300ms 滑入动画（从上方 50px 滑入，透明度 0 → 1）

#### 2. 顶部标题区域
- **定位**: 绝对定位，距顶部 8vh
- **标题文字**: "法务流通"
  - 字体: SimSun（宋体）
  - 字号: 32px（移动端）/ 40px（桌面端）
  - 颜色: 线性渐变 `linear-gradient(180deg, #FBE3C9FF 0%, #FFFFFF 100%)`
  - 字重: 700（粗体）
  - 字间距: 4px
  - 文字阴影: `0 2px 8px rgba(0, 0, 0, 0.3)`
- **对齐**: 水平居中

#### 3. 内容滚动区域
- **定位**: 绝对定位
- **尺寸**: 
  - 顶部: 15vh（为标题留空间）
  - 底部: 12vh（为返回按钮留空间）
  - 左右: 20px 内边距
- **滚动**: 
  - `overflow-y: auto`（垂直滚动）
  - `overflow-x: hidden`（隐藏水平滚动）
  - `touch-action: pan-y`（仅允许垂直触摸滚动）
  - `-webkit-overflow-scrolling: touch`（iOS 平滑滚动）

#### 4. 商品卡片
商品卡片由多个图片元素组合而成，形成完整的视觉整体：

**结构组成**:
```
┌─────────────────────────┐
│   incense-1.png (顶部)   │ ← 顶部装饰
├─────────────────────────┤
│                         │
│   incense-2.png (中部)   │ ← 内容区域背景
│                         │   - 商品图标
│   ┌─────────────────┐   │   - 商品名称
│   │ incense-4.png   │   │   - 价格框（居中）
│   │   (价格框)      │   │
│   └─────────────────┘   │
│                         │
├─────────────────────────┤
│   incense-3.png (底部)   │ ← 底部装饰
└─────────────────────────┘
```

**尺寸和间距**:
- 卡片宽度: 90%（移动端）/ 400px（桌面端）
- 卡片间距: 30px（垂直方向）
- 内边距: 20px
- 最大宽度: 500px

**图片层叠**:
1. **incense-2.png** (z-index: 1): 作为基础背景层
2. **incense-1.png** (z-index: 2): 定位在顶部，`position: absolute; top: 0`
3. **incense-3.png** (z-index: 2): 定位在底部，`position: absolute; bottom: 0`
4. **incense-4.png** (z-index: 3): 价格框，定位在中部，`position: absolute; top: 50%; transform: translateY(-50%)`

**内容布局**:
- 商品图标: 居中显示，尺寸 80px × 80px
- 商品名称: 图标下方，字号 18px，颜色 #FFFFFF
- 价格文字: 在价格框内居中，字号 20px，颜色 #FFD700（金色）

**交互效果**:
- 悬停: `opacity: 0.9`，`transform: scale(1.02)`
- 点击: `opacity: 0.8`
- 过渡: `transition: all 0.3s ease`

#### 5. 返回按钮
- **定位**: 绝对定位，左下角
  - `left: 30px`
  - `bottom: 30px`
- **图标**: `/images/fawu/mobile/图层 4.png`
  - 尺寸: 60px × 60px（移动端）/ 80px × 80px（桌面端）
- **交互效果**:
  - 悬停: `opacity: 0.8`
  - 点击: `opacity: 0.6`，`transform: scale(0.95)`
  - 过渡: `transition: all 0.3s ease`
- **z-index**: 10（确保在所有内容之上）

### 颜色方案

```css
/* 主要颜色 */
--title-gradient-start: #FBE3C9FF;  /* 标题渐变起始色 */
--title-gradient-end: #FFFFFF;      /* 标题渐变结束色 */
--price-color: #FFD700;             /* 价格金色 */
--text-primary: #FFFFFF;            /* 主要文字颜色 */
--text-secondary: rgba(255, 255, 255, 0.8); /* 次要文字颜色 */

/* 阴影 */
--shadow-text: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-card: 0 4px 12px rgba(0, 0, 0, 0.2);
```

### 字体规范

```css
/* 标题字体 */
font-family: 'SimSun', '宋体', serif;

/* 内容字体 */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 
             'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
```

## 响应式设计

### 断点定义

```css
/* 移动端 */
@media (max-width: 768px) { }

/* 平板 */
@media (min-width: 768px) and (max-width: 1199px) { }

/* 桌面端 */
@media (min-width: 1200px) { }

/* 横屏模式 */
@media (orientation: landscape) and (max-height: 600px) { }
```

### 移动端适配（≤ 768px）

```css
.header-area {
  top: 6vh;
}

.page-title {
  font-size: 28px;
  letter-spacing: 3px;
}

.content-area {
  top: 12vh;
  bottom: 10vh;
  padding: 0 15px;
}

.item-card {
  width: 95%;
  margin: 20px auto;
}

.back-button {
  left: 20px;
  bottom: 20px;
  width: 50px;
  height: 50px;
}
```

### 平板适配（768px - 1199px）

```css
.header-area {
  top: 8vh;
}

.page-title {
  font-size: 36px;
  letter-spacing: 4px;
}

.content-area {
  top: 14vh;
  bottom: 12vh;
  padding: 0 30px;
}

.item-card {
  width: 80%;
  max-width: 450px;
  margin: 25px auto;
}

.back-button {
  left: 25px;
  bottom: 25px;
  width: 70px;
  height: 70px;
}
```

### 桌面端适配（≥ 1200px）

```css
.header-area {
  top: 10vh;
}

.page-title {
  font-size: 40px;
  letter-spacing: 5px;
}

.content-area {
  top: 16vh;
  bottom: 12vh;
  padding: 0 40px;
}

.item-card {
  width: 400px;
  margin: 30px auto;
}

.back-button {
  left: 30px;
  bottom: 30px;
  width: 80px;
  height: 80px;
}
```

### 横屏适配（高度 ≤ 600px）

```css
.header-area {
  top: 5vh;
}

.page-title {
  font-size: 24px;
}

.content-area {
  top: 15vh;
  bottom: 15vh;
}

.item-card {
  margin: 15px auto;
}
```

## 动画和过渡

### 页面进入动画

```css
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

.legal-circulation-container {
  animation: slideIn 0.3s ease;
}
```

### 商品卡片加载动画

```css
@keyframes fadeInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.item-card {
  animation: fadeInUp 0.4s ease;
  animation-fill-mode: both;
}

/* 为每个卡片添加延迟，创建瀑布流效果 */
.item-card:nth-child(1) { animation-delay: 0.1s; }
.item-card:nth-child(2) { animation-delay: 0.2s; }
.item-card:nth-child(3) { animation-delay: 0.3s; }
/* ... 以此类推 */
```

### 交互过渡

```css
/* 通用过渡 */
.transition-all {
  transition: all 0.3s ease;
}

/* 按钮悬停 */
.back-button:hover {
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

/* 卡片悬停 */
.item-card:hover {
  opacity: 0.9;
  transform: scale(1.02);
  transition: all 0.3s ease;
}
```

## 错误处理

### 错误场景

1. **背景图片加载失败**
   - 降级方案: 显示纯色背景 `#1a1a2e`
   - 用户提示: 无（静默处理）

2. **商品数据加载失败**
   - 显示错误提示: "加载失败，请稍后重试"
   - 提供重试按钮
   - 错误样式: 红色文字，居中显示

3. **商品图片加载失败**
   - 降级方案: 显示占位图标
   - 保持卡片结构完整

4. **路由导航失败**
   - 捕获错误并记录日志
   - 显示用户友好的错误提示

### 错误处理实现

```typescript
/**
 * 错误处理函数
 */
const handleError = (error: Error, context: string): void => {
  console.error(`[LegalCirculation] ${context}:`, error);
  
  // 设置错误状态
  errorMessage.value = getErrorMessage(context);
  loading.value = false;
};

/**
 * 获取用户友好的错误消息
 */
const getErrorMessage = (context: string): string => {
  const messages: Record<string, string> = {
    'load-items': '加载商品数据失败，请稍后重试',
    'navigation': '页面跳转失败，请重试',
    'image-load': '图片加载失败',
  };
  
  return messages[context] || '发生未知错误';
};

/**
 * 重试加载
 */
const retryLoad = (): void => {
  error.value = '';
  loading.value = true;
  loadItems();
};
```

### 空状态处理

```typescript
/**
 * 空状态组件
 */
const EmptyState = {
  message: '暂无可交易的法物',
  icon: '🏮',
  style: {
    textAlign: 'center',
    padding: '60px 20px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '18px',
  }
};
```

## 测试策略

### 单元测试

1. **组件渲染测试**
   - 验证组件正确渲染
   - 验证标题文字显示
   - 验证返回按钮存在

2. **数据加载测试**
   - 模拟成功加载数据
   - 模拟加载失败
   - 验证加载状态更新

3. **用户交互测试**
   - 测试返回按钮点击
   - 测试商品卡片点击
   - 测试滚动行为

### 集成测试

1. **路由导航测试**
   - 从背包页面导航到法务流通页面
   - 从法务流通页面返回背包页面
   - 验证路由参数传递

2. **响应式布局测试**
   - 测试移动端布局
   - 测试平板布局
   - 测试桌面端布局
   - 测试横屏模式

### 端到端测试

1. **完整用户流程**
   - 用户从首页进入背包
   - 点击法物流通按钮
   - 浏览商品列表
   - 点击返回按钮

2. **性能测试**
   - 页面加载时间 < 1s
   - 动画流畅度 ≥ 60fps
   - 滚动性能测试

3. **兼容性测试**
   - iOS Safari
   - Android Chrome
   - 桌面端 Chrome/Firefox/Edge

## 性能优化

### 图片优化

1. **懒加载**
   ```typescript
   // 使用 Intersection Observer 实现图片懒加载
   const lazyLoadImages = (): void => {
     const imageObserver = new IntersectionObserver((entries) => {
       entries.forEach(entry => {
         if (entry.isIntersecting) {
           const img = entry.target as HTMLImageElement;
           img.src = img.dataset.src || '';
           imageObserver.unobserve(img);
         }
       });
     });
     
     document.querySelectorAll('img[data-src]').forEach(img => {
       imageObserver.observe(img);
     });
   };
   ```

2. **图片预加载**
   ```typescript
   // 预加载关键图片资源
   const preloadImages = (): void => {
     const images = [
       '/images/fawu/mobile/组 1.png',
       '/images/fawu/mobile/图层 4.png',
       '/images/fawu/mobile/incense-1.png',
       '/images/fawu/mobile/incense-2.png',
       '/images/fawu/mobile/incense-3.png',
       '/images/fawu/mobile/incense-4.png',
     ];
     
     images.forEach(src => {
       const img = new Image();
       img.src = src;
     });
   };
   ```

### 渲染优化

1. **虚拟滚动**（如果商品数量很多）
   - 使用 `vue-virtual-scroller` 或自定义实现
   - 只渲染可见区域的商品卡片

2. **防抖和节流**
   ```typescript
   import { debounce } from 'lodash-es';
   
   // 滚动事件防抖
   const handleScroll = debounce(() => {
     // 处理滚动逻辑
   }, 100);
   ```

### CSS 优化

1. **使用 CSS Transform 代替 position 变化**
   - 利用 GPU 加速
   - 避免触发重排

2. **减少重绘**
   - 使用 `will-change` 提示浏览器
   - 合理使用 `transform` 和 `opacity`

```css
.item-card {
  will-change: transform, opacity;
}
```

## 可访问性

### ARIA 标签

```html
<div class="legal-circulation-container" role="main" aria-label="法务流通页面">
  <h1 class="page-title" aria-level="1">法务流通</h1>
  
  <div class="content-area" role="region" aria-label="商品列表">
    <div class="item-card" 
         role="button" 
         tabindex="0"
         aria-label="商品名称，价格：100金币">
      <!-- 商品内容 -->
    </div>
  </div>
  
  <button class="back-button" 
          aria-label="返回背包页面"
          @click="handleBack">
    <img src="/images/fawu/mobile/图层 4.png" alt="" aria-hidden="true" />
  </button>
</div>
```

### 键盘导航

```typescript
/**
 * 处理键盘事件
 */
const handleKeyDown = (event: KeyboardEvent): void => {
  // ESC 键返回
  if (event.key === 'Escape') {
    handleBack();
  }
  
  // Enter 或 Space 键激活焦点元素
  if (event.key === 'Enter' || event.key === ' ') {
    const target = event.target as HTMLElement;
    if (target.classList.contains('item-card')) {
      handleItemClick(/* item data */);
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
```

### 焦点管理

```typescript
/**
 * 页面加载时设置焦点
 */
onMounted(() => {
  // 将焦点设置到主标题
  const title = document.querySelector('.page-title') as HTMLElement;
  title?.focus();
});
```

## 安全考虑

1. **XSS 防护**
   - 使用 Vue 的自动转义
   - 避免使用 `v-html`
   - 验证和清理用户输入

2. **CSRF 防护**
   - 使用 CSRF token（如果涉及交易操作）
   - 验证请求来源

3. **数据验证**
   - 验证商品数据格式
   - 验证价格数据类型
   - 防止注入攻击

## 设计决策

### 为什么使用固定定位？
- 确保全屏显示，不受父容器影响
- 防止页面滚动时出现布局问题
- 提供沉浸式的用户体验

### 为什么使用图片组合而不是单张图片？
- 灵活性：可以独立调整各部分的位置和大小
- 可维护性：更容易更新单个部分的视觉效果
- 性能：可以针对不同部分进行优化（如懒加载）

### 为什么使用 SimSun 字体？
- 符合游戏的中国传统文化主题
- 宋体在标题中具有良好的辨识度
- 与背包页面保持一致的视觉风格

### 为什么使用渐变色标题？
- 增强视觉层次感
- 与游戏的整体美术风格一致
- 提高标题的吸引力和可读性

## 未来扩展

### 可能的功能扩展

1. **商品筛选和排序**
   - 按价格排序
   - 按类型筛选
   - 搜索功能

2. **商品详情弹窗**
   - 显示详细描述
   - 显示商品属性
   - 购买确认

3. **购物车功能**
   - 批量购买
   - 购物车图标和数量显示

4. **交易历史**
   - 查看购买记录
   - 交易统计

5. **动画增强**
   - 商品卡片翻转效果
   - 粒子特效
   - 过渡动画优化

### 技术债务

1. **数据管理**
   - 考虑使用 Pinia 进行状态管理
   - 实现数据缓存机制

2. **代码复用**
   - 提取可复用的商品卡片组件
   - 创建通用的返回按钮组件

3. **测试覆盖**
   - 增加单元测试覆盖率
   - 添加 E2E 测试

4. **性能监控**
   - 添加性能监控工具
   - 收集用户体验指标
