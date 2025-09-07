import { createRouter, createWebHashHistory } from 'vue-router';
import MiningView from '../views/MiningView.vue';
import AlchemyView from '../views/AlchemyView.vue';

const routes = [
  { path: '/', redirect: '/mining' },
  { path: '/mining', component: MiningView },
  { path: '/alchemy', component: AlchemyView },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;

