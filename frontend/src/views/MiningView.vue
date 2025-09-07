<template>
  <div class="row">
    <div class="col">
      <div class="panel">
        <h2>采矿</h2>
        <p class="stat">规则：
          - 左键点击空地：免费翻开（会连锁展开）。
          - 左键点击矿石：矿石碎裂，消耗一次机会。
          - 右键点击矿石：成功采集矿石，消耗一次机会。
          - 右键点击空地：消耗一次机会并翻开区域。
        </p>
        <div class="badges" style="margin:8px 0">
          <span class="badge">剩余机会：{{ chances }}</span>
          <span class="badge inline-tip" v-if="currentTip">{{ currentTip }}</span>
        </div>
        <div class="grid" :style="{ gridTemplateColumns: `repeat(${size}, 32px)` }" @contextmenu.prevent>
          <div
            v-for="cell in cells"
            :key="cell.id"
            class="cell"
            :class="{ revealed: cell.revealed }"
            @click="onLeft(cell)"
            @contextmenu.prevent="onRight(cell)"
            :title="cell.revealed && !cell.hasOre ? `周围矿石：${cell.adj}` : ''"
          >
            <span v-if="cell.revealed">
              <template v-if="cell.hasOre">
                {{ cell.collected ? '✓' : cell.broken ? '✕' : '?' }}
              </template>
              <template v-else>
                {{ cell.adj || '' }}
              </template>
            </span>
          </div>
        </div>
        <div style="margin-top:10px; display:flex; gap:8px;">
          <button class="btn" @click="resetRound()">重置本回合</button>
          <button class="btn" @click="endRound()">结束回合并入仓</button>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="panel">
        <h3>说明与提示</h3>
        <ul>
          <li>五种矿石随机分布：A/B/C/D/E。</li>
          <li>当剩余机会为 0 时，自动结束回合并入仓库。</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- 回合结算弹窗 -->
  <div v-if="settlementOpen" class="modal-backdrop">
    <div class="modal">
      <h3>本回合结算</h3>
      <p class="stat">以下为本回合最终收获，已入仓库。</p>
      <div class="badges" style="margin:8px 0">
        <span class="badge" v-for="t in ORE_TYPES" :key="t">
          {{ t }} × {{ lastRoundSummary[t] || 0 }}
        </span>
      </div>
      <p style="margin:6px 0; color:#9aa0b4;">合计：{{ lastRoundTotal }}</p>
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:10px;">
        <button class="btn" @click="closeSettlement()">继续下一回合</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { useInventoryStore, ORE_TYPES } from '../store/inventory.js';
import { showToast } from '../composables/toast.js';
import { toasts } from '../composables/toast.js';

const inv = useInventoryStore();

const size = 10;
const ORE_PROB = 0.18;
const CHANCES_PER_ROUND = 15;

const state = reactive({
  grid: [],
  chances: CHANCES_PER_ROUND,
  roundCollected: { A:0,B:0,C:0,D:0,E:0 },
  settlementOpen: false,
  lastRoundSummary: { A:0,B:0,C:0,D:0,E:0 },
});

function idx(x, y){ return y * size + x; }
function neighbors(x,y){
  const res=[];
  for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++){
    if(dx===0 && dy===0) continue;
    const nx=x+dx, ny=y+dy;
    if(nx>=0 && nx<size && ny>=0 && ny<size) res.push([nx,ny]);
  }
  return res;
}

function genField(){
  const g=[];
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const hasOre = Math.random() < ORE_PROB;
      const oreType = hasOre ? ORE_TYPES[Math.floor(Math.random()*ORE_TYPES.length)] : null;
      g.push({ id: `${x}-${y}`, x, y, hasOre, oreType, revealed:false, broken:false, collected:false, adj:0 });
    }
  }
  // compute adj
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const c = g[idx(x,y)];
      c.adj = neighbors(x,y).reduce((n,[nx,ny]) => n + (g[idx(nx,ny)].hasOre?1:0), 0);
    }
  }
  state.grid = g;
}

function resetRound(){
  state.chances = CHANCES_PER_ROUND;
  state.roundCollected = { A:0,B:0,C:0,D:0,E:0 };
  genField();
}

function endRound(){
  // 记录结算
  state.lastRoundSummary = { ...state.roundCollected };
  inv.addRound(state.roundCollected);
  // 开启结算弹窗并准备下一回合
  state.settlementOpen = true;
  resetRound();
}

function revealEmpty(x,y){
  const queue=[[x,y]];
  while(queue.length){
    const [cx,cy]=queue.shift();
    const c = state.grid[idx(cx,cy)];
    if(!c || c.revealed) continue;
    c.revealed = true;
    if(!c.hasOre && c.adj===0){
      for(const [nx,ny] of neighbors(cx,cy)){
        const n = state.grid[idx(nx,ny)];
        if(n && !n.revealed && !n.hasOre) queue.push([nx,ny]);
      }
    }
  }
}

function consumeChance(){
  if(state.chances>0) state.chances--;
  if(state.chances===0) endRound();
}

function onLeft(cell){
  if(cell.revealed) return;
  if(cell.hasOre){
    cell.revealed = true;
    cell.broken = true; // 矿石碎裂
    showToast('一枚矿石被破坏', { type: 'warn' });
    consumeChance();
  } else {
    revealEmpty(cell.x, cell.y); // 免费
  }
}

function onRight(cell){
  if(cell.revealed) return;
  if(cell.hasOre){
    cell.revealed = true;
    cell.collected = true;
    state.roundCollected[cell.oreType]++;
    showToast(`找到 ${cell.oreType} 矿石！`, { type: 'success' });
    consumeChance();
  } else {
    revealEmpty(cell.x, cell.y);
    consumeChance();
  }
}

const cells = computed(()=> state.grid);
const chances = computed(()=> state.chances);
const roundCollected = computed(()=> state.roundCollected);
const settlementOpen = computed(()=> state.settlementOpen);
const lastRoundSummary = computed(()=> state.lastRoundSummary);
const lastRoundTotal = computed(()=> Object.values(state.lastRoundSummary).reduce((a,b)=> a + (b||0), 0));

function closeSettlement(){
  state.settlementOpen = false;
}

resetRound();

// 内联提示：仅显示最新一条 toast 内容
const currentTip = computed(() => {
  const list = toasts.value;
  return list.length ? list[list.length - 1].message : '';
});
</script>

<style scoped>
.modal-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 16px;
  z-index: 50;
}
.modal{
  width: 100%;
  max-width: 480px;
  background: var(--panel);
  border: 1px solid #303657;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}

.inline-tip{
  background: #23273d;
  border-color: #7c83ff;
}
</style>
