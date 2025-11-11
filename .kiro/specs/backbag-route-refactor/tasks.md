# Implementation Plan

- [x] 1. 创建背包页面组件并移除弹窗相关代码





  - 将 `src/components/backbag.vue` 复制到 `src/pages/Backbag.vue`
  - 移除模板中的 `.backbag-overlay` 遮罩层元素，将 `.backbag-container` 作为根元素
  - 移除 `defineEmits` 事件定义
  - 移除 `handleOverlayClick` 函数
  - 添加 `useRouter` 导入和 `router` 实例
  - 创建 `handleBack` 函数，使用 `router.back()` 实现返回功能
  - 修改返回按钮的点击事件从 `@click="$emit('close')"` 改为 `@click="handleBack"`
  - _Requirements: 1.1, 1.3, 2.3_

- [x] 2. 调整背包页面样式





  - 移除 `.backbag-overlay` 相关的 CSS 样式（包括 `fadeIn` 动画）
  - 确保 `.backbag-container` 样式保持全屏显示效果
  - 保留所有其他样式不变，包括响应式媒体查询
  - 验证 `slideIn` 动画仍然正常工作
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 3. 更新路由配置





  - 在 `src/router/index.ts` 中添加背包路由定义
  - 使用懒加载方式导入背包页面组件
  - 设置路由路径为 `/backbag`，名称为 `Backbag`
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [x] 4. 修改主页面的背包打开逻辑





  - 在 `src/pages/Home.vue` 中移除 `Backbag` 组件的导入
  - 移除 `showBackbag` 响应式变量
  - 移除 `openBackbag()` 和 `closeBackbag()` 函数
  - 移除模板中的 `<Backbag v-if="showBackbag" @close="closeBackbag" />` 元素
  - 导入 `useRouter` from 'vue-router'
  - 创建 `router` 实例
  - 修改背包按钮的点击事件，使用 `router.push('/backbag')` 导航到背包页面
  - _Requirements: 3.1, 3.2, 3.3_
-

- [x] 5. 删除原组件文件




  - 删除 `src/components/backbag.vue` 文件
  - 确认没有其他文件引用该组件
  - _Requirements: 1.2_
