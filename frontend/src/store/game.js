import { defineStore } from 'pinia';

export const useGameStore = defineStore('game', {
  state: () => ({ day: 1, heroAtVillage: true }),
  actions: {
    nextDay(){ this.day += 1; },
    reset(){ this.day = 1; this.heroAtVillage = true; },
    setHeroAtVillage(v){ this.heroAtVillage = !!v; }
  }
});
