import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/tailwind.css';

const app = createApp(App);

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  // 可接入上报系统，这里先打印
  console.error('[GlobalError]', err, info);
};

app.use(createPinia());
app.use(router);
app.mount('#app');
