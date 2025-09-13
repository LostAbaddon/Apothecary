<template>
  <div class="panel" style="max-width:640px; margin: 24px auto;">
    <h2>遭遇邪修</h2>
    <p class="stat">临时战斗占位界面：选择结果以模拟后续流程。</p>
    <div class="field">
      <div class="side">
        <div class="side-title">邪修</div>
        <div class="unit">👤 邪修甲</div>
        <div class="unit">👤 邪修乙</div>
      </div>
      <div class="side">
        <div class="side-title">求道者</div>
        <div class="unit" v-for="m in heroes.members" :key="m.id">🛡️ {{ m.name }}</div>
      </div>
    </div>
    <div class="actions">
      <button class="btn" @click="win">战斗胜利</button>
      <button class="btn btn-secondary" @click="lose">战斗失败</button>
      <button class="btn" @click="back">返回福地</button>
    </div>
    <div v-if="log.length" class="log">
      <div v-for="(line,i) in log" :key="i" class="log-line">{{ line }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useInventoryStore } from '../store/inventory.js';
import { useScrollsStore, SCROLL_KINDS } from '../store/scrolls.js';
import { useHeroesStore } from '../store/heroes.js';
import { ALL_ORES } from '../models/ore.js';

const router = useRouter();
const inv = useInventoryStore();
const scrolls = useScrollsStore();
const heroes = useHeroesStore();
const log = ref([]);

function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
function pickOre(){ return ALL_ORES[randInt(0, ALL_ORES.length - 1)] || { id: 'A', name: '未知矿石' }; }

function eligibleSealedScrolls(){
  // 不重复：排除已获得（owned=true）以及行囊中已存在的“卷宗·《name》”
  const inBag = new Set(Object.keys(inv.inventory || {}));
  return scrolls.sealedList.filter(s => !s.owned && !inBag.has(`卷宗·《${s.name}》`));
}

function pickWeightedSealedScroll(){
  const list = eligibleSealedScrolls();
  if(!list.length) return null;
  const weightMap = new Map([
    [SCROLL_KINDS.DAN, 3],
    [SCROLL_KINDS.ART, 3],
    [SCROLL_KINDS.GONG, 2],
    [SCROLL_KINDS.ZHEN, 1],
  ]);
  const weights = list.map(s => weightMap.get(s.kind) || 1);
  const total = weights.reduce((a,b)=>a+b, 0) || 0;
  if(total <= 0) return list[0];
  let r = Math.random() * total;
  for(let i=0;i<list.length;i++){
    r -= weights[i];
    if(r <= 0) return list[i];
  }
  return list[list.length - 1];
}

function win(){
  // 胜利奖励：
  // 1) 必定获得矿石（进入行囊；日志不出现“矿石”字样）
  const ore = pickOre();
  const cnt = randInt(5, 20);
  inv.addOre(ore.name, cnt);
  log.value.push(`战胜邪修，获得 ${ore.name} × ${cnt}`);
  // 2) 额外以 60% 概率掉落“未解封”的卷宗（进入行囊，不直接解封），并按 3:3:2:1 权重区分种类
  if (Math.random() < 0.6) {
    const s = pickWeightedSealedScroll();
    if(s){
      const itemName = `卷宗·《${s.name}》`;
      inv.addOre(itemName, 1);
      log.value.push(`同时获得 ${itemName} × 1`);
    }
  }
}

function lose(){
  // 失败惩罚：随机拿走行囊的一部分物品（20%~60%）。
  const ratio = Math.random() * 0.4 + 0.2;
  const removed = [];
  for (const [name, cnt] of Object.entries(inv.inventory)) {
    const n = cnt | 0; if (!n) continue;
    const take = Math.max(0, Math.floor(n * ratio * Math.random()));
    if (take > 0) {
      inv.inventory[name] = Math.max(0, n - take);
      removed.push(`${name} × ${take}`);
    }
  }
  log.value.push(removed.length ? `被邪修抢走：${removed.join('、')}` : '行囊空空，未被抢走任何物品。');
}

function back(){ router.push('/map'); }
</script>

<style scoped>
.actions{ display:flex; gap:8px; margin: 8px 0 12px; }
.field{ display:flex; gap:12px; margin: 8px 0 12px; }
.side{ flex:1; background:#23273d; border:1px solid #3a3f62; border-radius:8px; padding:8px; }
.side-title{ font-weight:600; margin-bottom:6px; }
.unit{ padding:2px 0; }
.log{ background:#23273d; border:1px solid #3a3f62; border-radius:8px; padding:8px; }
.log-line{ font-size:14px; color:var(--text); padding:2px 0; }
</style>
