import { createRouter, createWebHashHistory } from 'vue-router';
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

export default router;
