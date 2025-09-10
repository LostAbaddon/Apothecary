import { defineStore } from 'pinia';

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    // 仓库使用“名称”聚合库存：不同名字不能混合
    inventory: {},
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
    // 以名称入库聚合
    addOre(name, count = 1) {
      const key = String(name);
      if (!this.inventory[key]) this.inventory[key] = 0;
      this.inventory[key] += count;
    },
    addRound(roundMap) {
      // roundMap: { [name: string]: number }
      Object.entries(roundMap).forEach(([name, c]) => this.addOre(name, c));
    },
    setRecipe(id) { this.selectedRecipeId = id; },
  }
});
