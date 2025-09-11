<template>
  <div class="row">
    <div class="col">
      <div class="panel">
        <h2>祭炼（2048 规则 + 矿石经验）</h2>
        <div style="display:flex; gap:8px; align-items:center; margin:8px 0;">
          <label>配方：</label>
          <select class="select" v-model="recipeId">
            <option v-for="r in recipes" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <button class="btn" @click="resetBoard">重开</button>
          <div class="badges">
            <span class="badge" v-for="r in recipe.reqs" :key="r.type">{{ r.type }} ≥ {{ r.exp }}</span>
          </div>
        </div>
        <!-- 棋盘：背景网格 + 绝对定位层（动画） -->
        <div class="board alchemy-board" ref="boardRef">
          <!-- 背景网格（占位） -->
          <div v-for="n in 16" :key="'slot-' + n" class="slot"></div>
          <!-- 绝对定位的棋子层（带动画） -->
          <div class="pieces-layer">
            <div
              v-for="p in pieces"
              :key="p.tile.id"
              class="piece"
              :class="`c-${p.tile.color}`"
              :style="pieceStyle(p)"
            >
              {{ COLOR_NAMES[p.tile.color] }}
              <small>{{ p.tile.ore }}·XP{{ p.tile.exp }}</small>
            </div>
          </div>
        </div>
        <div class="controls" style="margin-top:15px; align-items:center;">
          <button class="btn" @click="move('up')">↑</button>
          <button class="btn" @click="move('left')">←</button>
          <button class="btn" @click="move('down')">↓</button>
          <button class="btn" @click="move('right')">→</button>
          <span class="stat" v-if="won">已满足配方要求，祭炼成功！</span>
          <span class="stat" v-else>用方向键或按钮移动。</span>
        </div>
      </div>
    </div>
    <div class="col" :style="stacked ? { flex: '1 1 auto', width: '100%' } : { flex: '0 0 auto', width: infoWidth + 'px' }">
      <div class="panel" ref="infoPanelRef">
        <h3>材料损耗</h3>
        <ul>
          <li>同矿合并：无损耗，经验相加（XP 相加）。</li>
          <li>异矿合并：保留经验更高的一块，另一块视为损耗（XP 取较高者）。</li>
          <li>彩虹色升级：仅影响颜色进阶，不改变损耗规则。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, computed, ref, nextTick } from 'vue';
import { useInventoryStore } from '../store/inventory.js';

const COLOR_NAMES = ['赤','橙','黄','绿','青','蓝','紫'];
const SIZE = 4;
const TILE_SIZE = 80;
const TILE_GAP = 8;

const inv = useInventoryStore();
const recipes = computed(()=> inv.recipes);
const recipeId = computed({
  get:()=> inv.selectedRecipeId,
  set:(v)=> inv.setRecipe(v)
});
const recipe = computed(()=> inv.selectedRecipe);

// 右侧信息面板布局与 Map 信息面板一致的宽度/布局策略
const infoPanelRef = ref(null);
const infoWidth = ref(280);
const stacked = ref(false);
function computeLayout(){
  const vw = Math.max(320, window.innerWidth || 0);
  const quarter = vw * 0.25;
  infoWidth.value = Math.min(500, quarter);
  stacked.value = vw < 900;
}

function newTile(ore){
  return { color: 0, ore, exp: 1, id: Math.random().toString(36).slice(2) };
}

const state = reactive({ board: Array.from({length: SIZE}, ()=> Array(SIZE).fill(null)), won:false });
const boardRef = ref(null);

function emptyCells(){
  const res=[];
  for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++) if(!state.board[y][x]) res.push([x,y]);
  return res;
}
function spawn(count=1){
  for(let i=0;i<count;i++){
    const empties = emptyCells();
    if(empties.length===0) return;
    const [x,y] = empties[Math.floor(Math.random()*empties.length)];
    const pool = recipe.value.pool;
    const ore = pool[Math.floor(Math.random()*pool.length)];
    const t = newTile(ore);
    t.newborn = true; // 生成动画
    state.board[y][x] = t;
  }
  // 下一帧清除 newborn 标记，使其由 scale(0.6)->scale(1) 动画
  nextTick(()=>{
    for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++){
      const t = state.board[y][x];
      if(t && t.newborn) t.newborn = false;
    }
  });
}

function cycleColor(c){ return (c+1) % 7; }

function lineAt(dir, index){
  const row = [];
  for(let i=0;i<SIZE;i++){
    if(dir==='left' || dir==='right') row.push(state.board[index][i]);
    else row.push(state.board[i][index]);
  }
  return (dir==='right' || dir==='down') ? row.reverse() : row;
}
function setLine(dir, index, items){
  const row = (dir==='right' || dir==='down') ? items.slice().reverse() : items;
  for(let i=0;i<SIZE;i++){
    if(dir==='left' || dir==='right') state.board[index][i] = row[i] || null;
    else state.board[i][index] = row[i] || null;
  }
}

function compressAndMerge(items){
  const filtered = items.filter(Boolean);
  const res=[];
  for(let i=0;i<filtered.length;i++){
    const a = filtered[i];
    const b = filtered[i+1];
    if(b && a.color === b.color){
      // merge into next color
      const sameOre = a.ore === b.ore;
      const ore = sameOre ? a.ore : (a.exp >= b.exp ? a.ore : b.ore);
      const exp = sameOre ? (a.exp + b.exp) : Math.max(a.exp, b.exp);
      const merged = { color: cycleColor(a.color), ore, exp, id: Math.random().toString(36).slice(2) };
      merged.pulse = true; // 合并后脉冲动画
      res.push(merged);
      i++; // skip next
    } else {
      res.push(a);
    }
  }
  while(res.length < SIZE) res.push(null);
  return res;
}

function move(dir){
  let moved = false;
  for(let i=0;i<SIZE;i++){
    const line = lineAt(dir, i);
    const merged = compressAndMerge(line);
    if(JSON.stringify(line) !== JSON.stringify(merged)) moved = true;
    setLine(dir, i, merged);
  }
  if(moved){
    spawn(1);
    checkWin();
    // 清理合并脉冲标记，触发 scale 回落动画
    nextTick(()=>{
      for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++){
        const t = state.board[y][x];
        if(t && t.pulse) t.pulse = false;
      }
    });
  }
}

function resetBoard(){
  state.board = Array.from({length: SIZE}, ()=> Array(SIZE).fill(null));
  state.won = false;
  spawn(2);
}

function checkWin(){
  const reqs = recipe.value.reqs;
  state.won = reqs.every(r => {
    let ok=false;
    for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++){
      const t = state.board[y][x];
      if(t && t.ore === r.type && t.exp >= r.exp){ ok = true; break; }
    }
    return ok;
  });
}

function onKey(e){
  const map={ ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
  const d = map[e.key];
  if(d){ e.preventDefault(); move(d); }
}

onMounted(()=>{
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', computeLayout);
  computeLayout();
  resetBoard();
});
onBeforeUnmount(()=> {
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('resize', computeLayout);
});

// 以 tile-id 渲染绝对定位棋子，附带位置坐标（用于动画）
const pieces = computed(()=>{
  const res=[];
  for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++){
    const t = state.board[y][x];
    if(t) res.push({ tile: t, x, y });
  }
  return res;
});

function pieceStyle(p){
  const x = p.x * (TILE_SIZE + TILE_GAP);
  const y = p.y * (TILE_SIZE + TILE_GAP);
  let scale = 1;
  if(p.tile.newborn) scale = 0.6;
  else if(p.tile.pulse) scale = 1.15;
  return { transform: `translate(${x}px, ${y}px) scale(${scale})`, width: TILE_SIZE + 'px', height: TILE_SIZE + 'px' };
}

</script>
