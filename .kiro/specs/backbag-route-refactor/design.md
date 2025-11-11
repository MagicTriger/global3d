# Design Document

## Overview

将背包组件从弹窗模式改造为独立路由页面。改造的核心是将组件从 `src/components/backbag.vue` 移动到 `src/pages/Backbag.vue`，移除弹窗相关的遮罩层和事件机制，并在路由配置中添加新的路由定义。主页面将使用路由导航替代原有的状态控制方式。

## Architecture

### 组件层级变化

**改造前:**
```
Home.vue (页面)
  └── Backbag.vue (弹窗组件，通过 v-if 控制显示)
      └── 通过 @close 事件关闭
```

**改造后:**
```
Router
  ├── / → Home.vue (页面)
  └── /backbag → Backbag.vue (页面)
      └── 通过 router.back() 返回
```

### 路由配置

在 `src/router/index.ts` 中添加背包路由：

```typescript
const routes = [
  { path: '/', component: Home },
  { path: '/backbag', component: () => import('../pages/Backbag.vue') }
]
```

## Components and Interfaces

### 1. Backbag.vue 页面组件

**位置变更:**
- 从: `src/components/backbag.vue`
- 到: `src/pages/Backbag.vue`

**样式调整:**
- 移除 `.backbag-overlay` 遮罩层样式和元素
- 将 `.backbag-container` 作为根元素
- 保留所有其他样式不变，确保视觉效果一致

**脚本调整:**
- 移除 `defineEmits<{ close: [] }>()` 事件定义
- 移除 `handleOverlayClick` 函数
- 在返回按钮点击事件中使用 `router.back()` 替代 `$emit('close')`

**模板调整:**
- 移除最外层的 `<div class="backbag-overlay">` 遮罩层
- 将 `<div class="backbag-container">` 作为根元素
- 返回按钮点击事件从 `@click="$emit('close')"` 改为 `@click="handleBack"`

### 2. Home.vue 页面组件

**移除内容:**
- 移除 `import Backbag from '../components/backbag.vue'`
- 移除 `showBackbag` 响应式变量
- 移除 `openBackbag()` 和 `closeBackbag()` 函数
- 移除模板中的 `<Backbag v-if="showBackbag" @close="closeBackbag" />`

**添加内容:**
- 导入 `useRouter` from 'vue-router'
- 创建 `router` 实例
- 修改背包按钮点击事件，使用 `router.push('/backbag')` 导航到背包页面

### 3. Router 配置

**文件:** `src/router/index.ts`

**添加路由:**
```typescript
{
  path: '/backbag',
  name: 'Backbag',
  component: () => import('../pages/Backbag.vue')
}
```

## Data Models

无需新增数据模型。现有组件的数据结构保持不变。

## Error Handling

### 路由导航错误

- 使用 Vue Router 的内置错误处理机制
- 如果导航失败，用户将停留在当前页面
- 浏览器控制台会显示相关错误信息

### 组件加载错误

- 使用懒加载方式导入背包组件
- 如果组件加载失败，Vue Router 会捕获错误
- 可以在未来添加错误边界组件来优雅处理加载失败

## Testing Strategy

### 手动测试清单

1. **路由导航测试**
   - 在主页面点击背包按钮，验证是否正确导航到 `/backbag`
   - 验证 URL 是否正确更新
   - 验证背包页面是否正确渲染

2. **返回功能测试**
   - 在背包页面点击返回按钮，验证是否返回主页面
   - 使用浏览器后退按钮，验证是否正确返回
   - 使用浏览器前进按钮，验证是否正确前进到背包页面

3. **样式一致性测试**
   - 对比改造前后的视觉效果
   - 验证所有响应式断点下的布局
   - 测试移动端、平板和桌面端的显示效果

4. **直接访问测试**
   - 直接在浏览器地址栏输入 `/backbag`
   - 验证是否能正确加载背包页面
   - 刷新页面，验证页面是否能正确重新加载

### 浏览器兼容性测试

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (iOS 和 macOS)
- 移动端浏览器 (Android Chrome, iOS Safari)

## Implementation Notes

### 样式迁移注意事项

1. **遮罩层移除**
   - 原 `.backbag-overlay` 提供了半透明黑色背景和居中布局
   - 移除后，`.backbag-container` 需要直接作为全屏容器
   - 背景图片已经在 `.backbag-container` 中定义，无需额外调整

2. **动画效果**
   - 保留 `slideIn` 动画，在页面加载时提供过渡效果
   - 移除 `fadeIn` 动画（原用于遮罩层）

3. **z-index 层级**
   - 作为独立页面后，不再需要超高的 z-index 值
   - 可以保持现有值，不会产生冲突

### 路由过渡效果（可选）

可以在未来添加路由过渡动画，使页面切换更流畅：

```vue
<router-view v-slot="{ Component }">
  <transition name="fade" mode="out-in">
    <component :is="Component" />
  </transition>
</router-view>
```

### 浏览器历史管理

- 使用 `router.back()` 而不是 `router.push('/')` 可以保持正确的导航历史
- 如果用户直接访问 `/backbag`，`router.back()` 会返回到浏览器历史中的上一页
- 如果没有历史记录，可以添加回退逻辑导航到主页
