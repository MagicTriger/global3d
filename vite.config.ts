import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // GitHub Pages 项目站点需设置 base 为仓库名
  base: '/global3d/',
  server: {
    host: true,
    port: 5173
  },
  preview: {
    port: 5174
  }
});