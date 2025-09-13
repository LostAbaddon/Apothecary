<template>
  <div class="panel" style="max-width:900px; margin:24px auto;">
    <h2><span class="section-icon">📚</span> 龙吟阁 · 卷宗</h2>
    <p class="stat">未解封的卷宗仅显示卷轴，不显示种类；可在此进行“研习”。</p>
    <div class="grid">
      <div v-for="s in scrolls" :key="s.id" class="item">
        <div class="icon">📜</div>
        <div class="info">
          <div class="name">
            <template v-if="!s.sealed">{{ kindAbbr(s.kind) }} · {{ s.name }}</template>
            <template v-else>{{ s.name }}</template>
          </div>
          <div class="meta">{{ s.sealed ? '未解封' : '' }}</div>
        </div>
        <div class="actions">
          <button class="btn btn-small" @click="study(s)">研习</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useScrollsStore } from '../store/scrolls.js';

const router = useRouter();
const scrollsStore = useScrollsStore();
const scrolls = computed(()=> scrollsStore.scrolls);
function kindAbbr(kind){
  const map = new Map([
    ['丹药配方','仙丹'],
    ['法器秘术','法器'],
    ['玄门功法','功法'],
    ['符箓天书','天书'],
  ]);
  return map.get(kind) || String(kind || '');
}

function study(s){ router.push({ path: '/alchemy', query: { scroll: s.id } }); }
</script>

<style scoped>
.grid{ display:grid; gap:10px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); margin-top:10px; }
.item{ display:flex; align-items:center; gap:10px; background:#23273d; border:1px solid #3a3f62; border-radius:10px; padding:10px; }
.icon{ font-size:28px; }
.info{ flex:1; }
.name{ font-weight:600; }
.meta{ font-size:12px; color:var(--muted); }
.actions{ display:flex; gap:6px; }
.btn-small{ padding:6px 10px; font-size:12px; }
</style>
