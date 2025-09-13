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
      // 初始：一份已解封的丹药“回春露”（成本：精元果×50、灵脉菇×30；效果：恢复体力20）
      { id: 'dan-001', name: '回春露', sealed: false, owned: true, kind: SCROLL_KINDS.DAN, effect: '恢复体力20', cost: { req: [{ id: 'C', n: 50 }, { id: 'D', n: 30 }], opt: [] } },
      // 初始：一份未解封的丹药“引魂丹”（成本：灵脉菇×100、精元果×50、古蝉壳×30）
      { id: 'dan-002', name: '引魂丹', sealed: true, owned: true, kind: SCROLL_KINDS.DAN, effect: '复活因战斗濒死弟子为1点体力', cost: { req: [{ id: 'D', n: 100 }, { id: 'C', n: 50 }, { id: 'E', n: 30 }], opt: [] } },
      // 其他默认卷宗
      { id: 'art-001', name: '灵犀刃诀', sealed: true, owned: false, kind: SCROLL_KINDS.ART, cost: { req: [{ id: 'D', n: 12 }], opt: [{ id: 'E', n: 6 }] } },
      { id: 'gong-001', name: '清心诀', sealed: true, owned: false, kind: SCROLL_KINDS.GONG, reqs: { sevenMin: 2, levelMin: 2, prereq: [] }, durationDays: 3, consume: [{ id: 'A', n: 8 }] },
      { id: 'zhen-001', name: '灵篆初篇', sealed: true, owned: false, kind: SCROLL_KINDS.ZHEN, reqs: { sevenMin: 1, levelMin: 2, prereq: [] }, durationDays: 3, consume: [{ id: 'B', n: 8 }] },
    ],
  }),
  getters: {
    sealedList: (s) => s.scrolls.filter(x => x.sealed),
    unsealedList: (s) => s.scrolls.filter(x => !x.sealed),
    ownedList: (s) => s.scrolls.filter(x => x.owned),
    byKind: (s) => (kind) => s.scrolls.filter(x => !x.sealed && x.kind === kind),
    getById: (s) => (id) => s.scrolls.find(x => x.id === id),
    getByName: (s) => (name) => s.scrolls.find(x => x.name === name),
  },
  actions: {
    unseal(id){ const it = this.scrolls.find(x => x.id === id); if(it) it.sealed = false; },
    setCost(id, cost){ const it = this.scrolls.find(x => x.id === id); if(it) it.cost = cost; },
    setConsume(id, consume){ const it = this.scrolls.find(x => x.id === id); if(it) it.consume = consume; },
    setOwnedByName(name, owned=true){ const it = this.scrolls.find(x => x.name === name); if(it) it.owned = !!owned; },
    setOwnedById(id, owned=true){ const it = this.scrolls.find(x => x.id === id); if(it) it.owned = !!owned; },
  }
});
