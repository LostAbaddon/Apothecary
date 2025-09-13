<template>
  <div class="row">
    <div class="col">
      <div class="panel">
        <h2>求道者队伍 <small class="stat" style="margin-left:8px;">{{ heroesCount }}/5</small></h2>
        <p class="stat">当前在编的求道者列表。</p>
          <div class="team-list">
          <div v-for="m in heroes.members" :key="m.id" class="member">
            <div class="avatar">{{ m.sevenColor != null ? '🜍' : '🧙' }}</div>
            <div class="info">
              <div class="name">{{ m.name }}</div>
              <div class="attrs">
                <span class="attr">境界：{{ levelName(m.level) }}</span>
                <span class="attr">七曜：{{ m.sevenColor }}</span>
                <span class="attr">体力：{{ m.hp }}</span>
                <span class="attr">真元：{{ m.mp }}</span>
                <span class="attr">攻击：{{ m.atk }}</span>
                <span class="attr">防御：{{ m.def }}</span>
              </div>
            </div>
          </div>
          <div v-if="heroes.members.length === 0" class="empty">暂无成员</div>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="panel">
        <h2>行囊</h2>
        <p class="stat">查看当前行囊中的矿石库存。</p>
        <div class="badges" style="margin:8px 0">
          <span class="badge" v-for="([name, cnt], i) in entries" :key="name + '-' + i">{{ name }} × {{ cnt || 0 }}</span>
        </div>
        <p class="stat">合计：{{ total }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useInventoryStore } from '../store/inventory.js';
import { useHeroesStore } from '../store/heroes.js';
import { levelName } from '../models/realms.js';

const inv = useInventoryStore();
const { inventory } = storeToRefs(inv);
const entries = computed(() => Object.entries(inventory.value));
const total = computed(() => Object.values(inventory.value).reduce((a,b)=> a + (b||0), 0));

const heroes = useHeroesStore();
const heroesCount = computed(()=> heroes.count | 0);
</script>

<style scoped>
.row{ flex-direction: column; }
.col{ flex: none; }
.team-list{ display:flex; flex-direction:column; gap:8px; margin-top:8px; }
.member{ display:flex; align-items:center; gap:10px; background:#23273d; border:1px solid #3a3f62; border-radius:10px; padding:10px; }
.avatar{ width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(124,131,255,.1); font-size:18px; }
.info{ flex:1; }
.name{ font-weight:600; }
.attrs{ display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; }
.attr{ font-size:12px; color:var(--muted); background:#23273d; border:1px solid #3a3f62; padding:2px 6px; border-radius:999px; }
.empty{ color:var(--muted); font-size:14px; padding:8px; text-align:center; }
</style>
