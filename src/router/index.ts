import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('../pages/Home.vue');
const Backbag = () => import('../pages/Backbag.vue');

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Home },
    { path: '/backbag', name: 'Backbag', component: Backbag }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;