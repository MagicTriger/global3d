import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('../pages/Home.vue');

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/', component: Home }],
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;