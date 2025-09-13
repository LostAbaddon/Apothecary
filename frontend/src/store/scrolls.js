import { defineStore } from 'pinia';

// 卷宗种类：丹药配方、法器秘术、玄门功法、符箓天书
export const SCROLL_KINDS = {
  DAN: '丹药配方',
  ART: '法器秘术',
  GONG: '玄门功法',
  ZHEN: '符箓天书',
};

export const useScrollsStore = defineStore('scrolls', {
  state: () => ({
    scrolls: [
      { id: 'rx-001', name: '回春丹谱', sealed: true, kind: SCROLL_KINDS.DAN, cost: { req: [{ id: 'C', n: 10 }], opt: [{ id: 'A', n: 5 }] } },
      { id: 'fa-001', name: '灵犀刃诀', sealed: true, kind: SCROLL_KINDS.ART, cost: { req: [{ id: 'D', n: 12 }], opt: [{ id: 'E', n: 6 }] } },
      { id: 'gf-001', name: '清心诀', sealed: true, kind: SCROLL_KINDS.GONG, reqs: { sevenMin: 2, levelMin: 2, prereq: [] }, durationDays: 3, consume: [{ id: 'A', n: 8 }] },
      // 名称避免与种类重复，显示时会加简写前缀（见 PavilionView）
      { id: 'zj-001', name: '灵篆初篇', sealed: true, kind: SCROLL_KINDS.ZHEN, reqs: { sevenMin: 1, levelMin: 2, prereq: [] }, durationDays: 3, consume: [{ id: 'B', n: 8 }] },
    ],
  }),
  getters: {
    sealedList: (s) => s.scrolls.filter(x => x.sealed),
    unsealedList: (s) => s.scrolls.filter(x => !x.sealed),
    byKind: (s) => (kind) => s.scrolls.filter(x => !x.sealed && x.kind === kind),
    getById: (s) => (id) => s.scrolls.find(x => x.id === id),
  },
  actions: {
    unseal(id){ const it = this.scrolls.find(x => x.id === id); if(it) it.sealed = false; },
    setCost(id, cost){ const it = this.scrolls.find(x => x.id === id); if(it) it.cost = cost; },
    setConsume(id, consume){ const it = this.scrolls.find(x => x.id === id); if(it) it.consume = consume; },
  }
});
