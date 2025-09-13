import { defineStore } from 'pinia';
import { ALL_ORES, ensureOres } from '../models/ore.js';
import { useScrollsStore } from './scrolls.js';

export const INITIAL_SECT_INVENTORY = {
  "A": 100,
  "B": 100,
  "C": 100,
  "D": 100,
  "E": 100,
};

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    // 行囊：使用“名称”聚合库存
    inventory: {},
    // 宗门仓库：集中存放从洞天获得的材料
    sectInventory: { ...INITIAL_SECT_INVENTORY },
  }),
  getters: {},
  actions: {
    // 根据矿种ID入宗门仓库聚合（宗门仓库对矿石一律用ID作键）
    addSectOreById(id, count = 1) {
      const key = String(id);
      if (!this.sectInventory[key]) this.sectInventory[key] = 0;
      this.sectInventory[key] += count;
    },
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
    // 从行囊将“洞天材料”转移至宗门仓库；并将“未解封卷宗”收录为可研习；保留行囊中其他物品
    transferBackpackMaterialsToSect() {
      const ores = ensureOres(ALL_ORES);
      const oreNames = new Set(ores.map(o => o.name));
      const nameToId = Object.fromEntries(ores.map(o => [o.name, o.id]));
      const scrolls = useScrollsStore();

      // 迁移前：将宗门仓库中历史以“名称”为键的矿石条目合并到以“ID”为键的条目中，消除重复
      for (const [key, val] of Object.entries(this.sectInventory)) {
        if (oreNames.has(key)) { // 旧的名称键
          const id = nameToId[key];
          if (id) {
            this.addSectOreById(id, val | 0);
            delete this.sectInventory[key];
          }
        }
      }

      // 转移行囊矿石：名称 -> ID 聚合到宗门仓库；收录卷宗
      for (const [name, cnt] of Object.entries(this.inventory)) {
        const n = cnt | 0;
        if (!n) continue;
        if (oreNames.has(name)) { // 矿石：用ID聚合
          const id = nameToId[name];
          if (id) this.addSectOreById(id, n);
          this.inventory[name] = 0;
          continue;
        }
        // 卷宗物品命名约定：卷宗·《{name}》（未解封）
        const m = /^卷宗·《(.+?)》\（未解封\）$/.exec(name);
        if (m && m[1]) {
          const title = m[1];
          scrolls.setOwnedByName(title, true);
          this.inventory[name] = Math.max(0, n - 1); // 收录一份
        }
      }
    },
  }
});
