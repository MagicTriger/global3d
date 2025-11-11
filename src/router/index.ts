import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('../pages/Home.vue');
const Backbag = () => import('../pages/Backbag.vue');
const LegalCirculation = () => import('../pages/Legal-circulation.vue');

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Home },
    { path: '/backbag', name: 'Backbag', component: Backbag },
    { path: '/legal-circulation', name: 'LegalCirculation', component: LegalCirculation }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;