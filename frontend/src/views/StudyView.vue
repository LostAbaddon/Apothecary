<template>
  <div class="panel" style="max-width:720px; margin:24px auto;">
    <h2>研习 · {{ scroll?.name || '' }}</h2>
    <p class="stat">点击“成功/失败”模拟研习结果。</p>
    <div class="actions">
      <button class="btn" @click="success">成功</button>
      <button class="btn btn-secondary" @click="fail">失败</button>
      <button class="btn" @click="back">返回</button>
    </div>

    <div v-if="offer" class="offer">
      <h3 style="margin:0 0 6px;">研习成功：选择新的消耗或保留原方案</h3>
      <div class="meta">原方案：必需 <span v-for="r in oldCost.req" :key="'o'+r.id" class="badge">{{ oreName(r.id) }}×{{ r.n }}</span> 可选 <span v-for="r in oldCost.opt" :key="'oo'+r.id" class="badge">{{ oreName(r.id) }}×{{ r.n }}</span></div>
      <div class="meta">新方案：必需 <span v-for="r in newCost.req" :key="'n'+r.id" class="badge">{{ oreName(r.id) }}×{{ r.n }}</span> 可选 <span v-for="r in newCost.opt" :key="'no'+r.id" class="badge">{{ oreName(r.id) }}×{{ r.n }}</span></div>
      <div class="actions">
        <button class="btn btn-small" @click="choose('old')">保留原方案</button>
        <button class="btn btn-small" @click="choose('new')">采用新方案</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useScrollsStore } from '../store/scrolls.js';
import { ALL_ORES } from '../models/ore.js';

const router = useRouter();
const route = useRoute();
const store = useScrollsStore();
const id = computed(()=> route.params.id);
const scroll = computed(()=> store.getById(id.value));

const offer = ref(false);
const oldCost = ref({ req: [], opt: [] });
const newCost = ref({ req: [], opt: [] });

// 显示材料中文名
const ORE_NAME_MAP = Object.fromEntries(ALL_ORES.map(o => [o.id, o.name]));
const oreName = (id) => ORE_NAME_MAP[id] || id;

function success(){
  const s = scroll.value; if(!s) return;
  if(!s.owned){ alert('尚未获得该卷宗，无法研习'); return; }
  if(s.sealed){ store.unseal(s.id); alert('卷宗已解封'); return; }
  // 已解封：生成新的成本供选择
  const base = s.cost || { req: [], opt: [] };
  oldCost.value = JSON.parse(JSON.stringify(base));
  const scale = (n) => Math.max(1, Math.round(n * (0.7 + Math.random()*0.8)));
  newCost.value = {
    req: base.req.map(r => ({ id: r.id, n: scale(r.n) })),
    opt: base.opt.map(r => ({ id: r.id, n: scale(r.n) })),
  };
  offer.value = true;
}
function choose(which){
  if(!scroll.value) return;
  if(which === 'new') store.setCost(scroll.value.id, newCost.value);
  offer.value = false;
  alert('选择完成');
}
function fail(){ alert('研习失败，资源消耗按规则处理（占位）'); }
function back(){ router.push('/sect'); }
</script>

<style scoped>
.actions{ display:flex; gap:8px; margin: 8px 0 12px; }
.meta{ font-size:12px; color:var(--muted); margin:6px 0; }
.badge{ display:inline-block; background:#303657; border:1px solid #3a3f62; border-radius:999px; padding:2px 8px; margin-right:6px; }
.offer{ background:#1f233b; border:1px solid #3a3f62; border-radius:10px; padding:10px; margin-top:10px; }
.btn-small{ padding:6px 10px; font-size:12px; }
</style>
