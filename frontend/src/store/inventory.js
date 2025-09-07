import { defineStore } from 'pinia';

export const ORE_TYPES = ['A', 'B', 'C', 'D', 'E'];

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    inventory: { A: 0, B: 0, C: 0, D: 0, E: 0 },
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
    addOre(type, count = 1) {
      if (!this.inventory[type]) this.inventory[type] = 0;
      this.inventory[type] += count;
    },
    addRound(roundMap) {
      Object.entries(roundMap).forEach(([t, c]) => this.addOre(t, c));
    },
    setRecipe(id) { this.selectedRecipeId = id; },
  }
});

