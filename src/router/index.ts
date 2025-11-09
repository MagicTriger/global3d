import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('../pages/Home.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;