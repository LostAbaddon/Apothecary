import { defineStore } from 'pinia';
import { ALL_ORES, ensureOres } from '../models/ore.js';

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    // 行囊：使用“名称”聚合库存
    inventory: {},
    // 宗门仓库：集中存放从洞天获得的材料
    sectInventory: {},
    // Simple recipe presets
    recipes: [
      { id: 'apprentice', name: '学徒配方 (A≥10, B≥20)', reqs: [{ type: 'A', exp: 10 }, { type: 'B', exp: 20 }], pool: ['A', 'B'] },
      { id: 'rainbow', name: '彩虹配方 (C≥12, D≥12, E≥12)', reqs: [{ type: 'C', exp: 12 }, { type: 'D', exp: 12 }, { type: 'E', exp: 12 }], pool: ['C', 'D', 'E'] }
    ],
    selectedRecipeId: 'apprentice',
  }),
  getters: {
    selectedRecipe(state) {
      return state.recipes.find(r => r.id === state.selectedRecipeId) || state.recipes[0];
    },
  },
  actions: {
    // 以名称入行囊聚合
    addOre(name, count = 1) {
      const key = String(name);
      if (!this.inventory[key]) this.inventory[key] = 0;
      this.inventory[key] += count;
    },
    // 以名称入宗门仓库聚合
    addSectOre(name, count = 1) {
      const key = String(name);
      if (!this.sectInventory[key]) this.sectInventory[key] = 0;
      this.sectInventory[key] += count;
    },
    addRound(roundMap) {
      // roundMap: { [name: string]: number }
      Object.entries(roundMap).forEach(([name, c]) => this.addOre(name, c));
    },
    // 从行囊将“洞天材料”转移至宗门仓库；保留行囊中非洞天物品
    transferBackpackMaterialsToSect() {
      const oreNames = new Set(ensureOres(ALL_ORES).map(o => o.name));
      for (const [name, cnt] of Object.entries(this.inventory)) {
        const n = cnt | 0;
        if (!n) continue;
        if (oreNames.has(name)) {
          this.addSectOre(name, n);
          this.inventory[name] = 0;
        }
      }
    },
    setRecipe(id) { this.selectedRecipeId = id; },
  }
});
