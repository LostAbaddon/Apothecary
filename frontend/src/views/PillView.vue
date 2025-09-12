<template>
  <div class="panel" style="max-width:900px; margin:24px auto;">
    <h2><span class="section-icon">⚗️</span> 蕴丹堂 · 丹药配方</h2>
    <div class="grid">
      <div v-for="s in list" :key="s.id" class="item">
        <div class="info">
          <div class="name">{{ s.name }}</div>
          <div class="meta">必须材料：
            <span v-for="r in s.cost?.req || []" :key="r.id" class="badge">{{ r.id }} × {{ r.n }}</span>
          </div>
          <div class="meta">可选药引：
            <span v-for="r in s.cost?.opt || []" :key="r.id" class="badge opt">{{ r.id }} × {{ r.n }}</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-small" @click="craft(s)">炼制</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useScrollsStore, SCROLL_KINDS } from '../store/scrolls.js';
import { useInventoryStore } from '../store/inventory.js';

const scrolls = useScrollsStore();
const inv = useInventoryStore();
const list = computed(()=> scrolls.byKind(SCROLL_KINDS.DAN));

function hasEnough(cost){
  return (cost?.req || []).every(r => (inv.sectInventory[r.id] || 0) >= r.n);
}
function craft(s){
  if(!hasEnough(s.cost)) return alert('宗门仓库材料不足');
  for(const r of (s.cost.req || [])) inv.sectInventory[r.id] = (inv.sectInventory[r.id]||0) - r.n;
  // 可选药引：若存在则任选一种扣除
  if((s.cost.opt||[]).length){
    const r = s.cost.opt[0];
    inv.sectInventory[r.id] = Math.max(0, (inv.sectInventory[r.id]||0) - r.n);
  }
  alert('炼制完成（占位），产物已记录在宗门仓库');
}
</script>

<style scoped>
.grid{ display:grid; gap:10px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); margin-top:10px; }
.item{ display:flex; align-items:flex-start; gap:10px; background:#23273d; border:1px solid #3a3f62; border-radius:10px; padding:10px; }
.info{ flex:1; }
.name{ font-weight:600; }
.meta{ font-size:12px; color:var(--muted); margin-top:6px; }
.badge{ display:inline-block; background:#303657; border:1px solid #3a3f62; border-radius:999px; padding:2px 8px; margin-right:6px; }
.opt{ opacity:.8; }
.actions{ display:flex; gap:6px; }
.btn-small{ padding:6px 10px; font-size:12px; }
</style>

