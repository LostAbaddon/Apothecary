<template>
  <div class="panel" style="max-width:900px; margin:24px auto;">
    <h2><span class="section-icon">🏛️</span> 苍宇殿 · 符箓天书</h2>
    <div class="grid">
      <div v-for="s in list" :key="s.id" class="item">
        <div class="info">
          <div class="name">{{ s.name }}</div>
          <div class="meta">条件：七曜总 ≥ {{ s.reqs?.sevenMin ?? 0 }}，境界 ≥ {{ s.reqs?.levelMin ?? 1 }}</div>
          <div class="meta">悟道消耗：<span v-for="c in s.consume || []" :key="c.id" class="badge">{{ oreName(c.id) }} × {{ c.n }}</span></div>
        </div>
        <div class="actions">
          <button class="btn btn-small" @click="choose(s)">悟道</button>
        </div>
      </div>
    </div>

    <div v-if="showPick" class="modal-backdrop" @click.self="cancel">
      <div class="modal panel">
        <h3 style="margin:0 0 8px;">选择驻守弟子</h3>
        <div class="list">
          <div
            v-for="d in candidates"
            :key="d.id"
            class="row"
            @click="select(d)"
            :title="`七曜总:${sevenTotal(d)} 境界:${d.level}`"
          >{{ d.name }}（{{ d.level }}）</div>
        </div>
        <div v-if="selected" style="margin-top:12px; display:flex; gap:8px;">
          <button class="btn" @click="pass">通过</button>
          <button class="btn btn-secondary" @click="fail">失败</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useScrollsStore, SCROLL_KINDS } from '../store/scrolls.js';
import { useInventoryStore } from '../store/inventory.js';
import { useHeroesStore } from '../store/heroes.js';
import { ALL_ORES } from '../models/ore.js';

const scrolls = useScrollsStore();
const inv = useInventoryStore();
const heroes = useHeroesStore();
const list = computed(()=> scrolls.byKind(SCROLL_KINDS.ZHEN));

// 显示材料中文名
const ORE_NAME_MAP = Object.fromEntries(ALL_ORES.map(o => [o.id, o.name]));
const oreName = (id) => ORE_NAME_MAP[id] || id;

const showPick = ref(false);
const selectedScroll = ref(null);
const selected = ref(null);
const candidates = computed(()=> heroes.members.filter(d => d.status === '驻守'));

function sevenTotal(d){
  const s = d?.seven || {}; const v = (x)=> Number(x||0);
  return v(s.metal)+v(s.wood)+v(s.water)+v(s.fire)+v(s.earth)+v(s.wind)+v(s.thunder);
}

function hasEnoughCost(s){ return (s.consume||[]).every(c => (inv.sectInventory[c.id]||0) >= c.n); }
function choose(s){ selectedScroll.value = s; showPick.value = true; selected.value = null; }
function cancel(){ showPick.value = false; selectedScroll.value = null; selected.value = null; }
function select(d){
  const s = selectedScroll.value; if(!s) return;
  if(sevenTotal(d) < (s.reqs?.sevenMin ?? 0)) return alert('七曜属性不足');
  if((d.level|0) < (s.reqs?.levelMin ?? 1)) return alert('境界不足');
  if(!hasEnoughCost(s)) return alert('资源不足');
  selected.value = d;
}
function spendCost(s){ for(const c of (s.consume||[])) inv.sectInventory[c.id] = Math.max(0, (inv.sectInventory[c.id]||0) - c.n); }
function pass(){
  if(!selected.value || !selectedScroll.value) return;
  spendCost(selectedScroll.value);
  selected.value.level = (selected.value.level|0) + 1; // 境界+1
  selected.value.hp += 10; selected.value.mp += 10; selected.value.atk += 2; selected.value.def += 2;
  selected.value.status = '闭关';
  alert('悟道成功，境界提升并进入闭关（占位）');
  cancel();
}
function fail(){
  if(!selected.value || !selectedScroll.value) return;
  spendCost(selectedScroll.value);
  selected.value.level = Math.max(1, (selected.value.level|0) - 1); // 境界-1
  selected.value.hp = Math.max(1, selected.value.hp - 10);
  selected.value.mp = Math.max(1, selected.value.mp - 10);
  selected.value.atk = Math.max(1, selected.value.atk - 2);
  selected.value.def = Math.max(1, selected.value.def - 2);
  selected.value.status = '走火入魔';
  alert('悟道失败，境界下降并走火入魔（占位）');
  cancel();
}
</script>

<style scoped>
.grid{ display:grid; gap:10px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); margin-top:10px; }
.item{ display:flex; align-items:flex-start; gap:10px; background:#23273d; border:1px solid #3a3f62; border-radius:10px; padding:10px; }
.info{ flex:1; }
.name{ font-weight:600; }
.meta{ font-size:12px; color:var(--muted); margin-top:6px; }
.badge{ display:inline-block; background:#303657; border:1px solid #3a3f62; border-radius:999px; padding:2px 8px; margin-right:6px; }
.actions{ display:flex; gap:6px; }
.btn-small{ padding:6px 10px; font-size:12px; }
.modal-backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index: 20; }
.modal{ width:min(560px, 92vw); max-height:72vh; overflow:auto; }
.list{ display:flex; flex-direction:column; gap:6px; }
.row{ background:#23273d; border:1px solid #303657; padding:8px; border-radius:6px; cursor:pointer; }
.row:hover{ border-color: var(--accent); }
</style>
