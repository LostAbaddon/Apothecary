<template>
  <div class="panel" style="max-width:640px; margin: 24px auto;">
    <h2>遭遇邪修</h2>
    <p class="stat">临时战斗占位界面：选择结果以模拟后续流程。</p>
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
import { useScrollsStore } from '../store/scrolls.js';
import { ALL_ORES } from '../models/ore.js';

const router = useRouter();
const inv = useInventoryStore();
const scrolls = useScrollsStore();
const log = ref([]);

function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
function pickOreId(){ return (ALL_ORES[randInt(0, ALL_ORES.length - 1)] || {}).id || 'A'; }

function win(){
  // 胜利奖励：随机一种（矿石或随机卷宗解封）
  if(Math.random() < 0.5 && scrolls.sealedList.length){
    const s = scrolls.sealedList[randInt(0, scrolls.sealedList.length - 1)];
    scrolls.unseal(s.id);
    log.value.push(`战胜邪修，获得卷宗线索，解封《${s.name}》`);
  } else {
    const oreId = pickOreId();
    const cnt = randInt(5, 20);
    inv.addSectOreById(oreId, cnt);
    log.value.push(`战胜邪修，获得矿石 ${oreId} × ${cnt}`);
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
.log{ background:#23273d; border:1px solid #3a3f62; border-radius:8px; padding:8px; }
.log-line{ font-size:14px; color:var(--text); padding:2px 0; }
</style>
