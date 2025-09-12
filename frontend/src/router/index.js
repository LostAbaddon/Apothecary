import { createRouter, createWebHashHistory } from 'vue-router';
import { createPinia } from 'pinia';
import { useHeroesStore } from '../store/heroes.js';
import MiningView from '../views/MiningView.vue';
import AlchemyView from '../views/AlchemyView.vue';
import InventoryView from '../views/InventoryView.vue';
import MapView from '../views/MapView.vue';
import SectView from '../views/SectView.vue';

const routes = [
  { path: '/', redirect: '/sect' },
  { path: '/mining', component: MiningView },
  { path: '/alchemy', component: AlchemyView },
  { path: '/inventory', component: InventoryView },
  { path: '/map', component: MapView },
  { path: '/sect', component: SectView },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 路由守卫：队伍人数为 0 时禁止进入福地
router.beforeEach((to, from, next) => {
  if (to.path === '/map') {
    try {
      const store = useHeroesStore();
      if ((store.count | 0) === 0) {
        return next('/sect');
      }
    } catch (e) {
      // 若 Pinia 尚未就绪，允许进入（避免初始化阶段报错）
    }
  }
  next();
});

export default router;
