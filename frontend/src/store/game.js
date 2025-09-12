import { defineStore } from 'pinia';

export const useGameStore = defineStore('game', {
  state: () => ({ day: 1 }),
  actions: {
    nextDay(){ this.day += 1; },
    reset(){ this.day = 1; }
  }
});

